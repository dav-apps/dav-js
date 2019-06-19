import { TableObject } from "./models/TableObject";
import * as DataManager from "./providers/DataManager";
import { DavEnvironment } from "./models/DavUser";

export const userKey = "user";
export const tableObjectsKey = "tableObjects";
export const notificationsKey = "notifications";
export const subscriptionKey = "subscription";
export const extPropertyName = "ext";
export const webPushPublicKey = "BD6vc4i0AcrsRMGK_WWhhx5IhvHVmeNsnFeYp2qwNhkubn0IIvhUpaNoMmK9SDhBKKaYSAWLtlXa2NJNjto-rnQ";

class Globals{
   public apiBaseUrl: string = "http://localhost:3111/v1/";
	public websiteUrl: string = "http://localhost:3000/";
	public jwt: string = null;

   constructor(public environment: DavEnvironment,
					public appId: number, 
               public tableIds: Array<number>,
               public parallelTableIds: Array<number>,
               public notificationOptions: {icon: string, badge: string},
               public callbacks: { 
                  UpdateAllOfTable: Function, 
                  UpdateTableObject: Function, 
                  DeleteTableObject: Function,
                  SyncFinished: Function
               }){

      if(environment == DavEnvironment.Production){
         this.apiBaseUrl = "https://dav-backend.herokuapp.com/v1/";
         this.websiteUrl = "https://dav-apps.tech/";
      }
   }
}

export var globals = new Globals(DavEnvironment.Development, -1, [], [], {icon: "", badge: ""}, {
                                                UpdateAllOfTable: (tableId: number) => {}, 
                                                UpdateTableObject: (tableObject: TableObject, fileDownloaded: boolean = false) => {}, 
                                                DeleteTableObject: (tableObject: TableObject) => {},
                                                SyncFinished: () => {}
                                             });

export function Initialize(environment: DavEnvironment, 
                           appId: number, 
                           tableIds: Array<number>, 
                           parallelTableIds: Array<number>,
                           notificationOptions: {icon: string, badge: string},
                           callbacks: { 
                              UpdateAllOfTable: Function, 
                              UpdateTableObject: Function, 
                              DeleteTableObject: Function,
                              SyncFinished: Function
                           }){
   globals = new Globals(environment, appId, tableIds, parallelTableIds, notificationOptions, callbacks);
}

export function startWebSocketConnection(channelName = "TableObjectUpdateChannel"){
   if(!globals.jwt || !globals.appId || !globals.apiBaseUrl || globals.environment == DavEnvironment.Test) return;

	let baseUrl = globals.apiBaseUrl.replace("http", "ws");
	var webSocket = new WebSocket(baseUrl + "cable?app_id=" + globals.appId + "&jwt=" + globals.jwt);

	webSocket.onopen = function (e) {
		var json = JSON.stringify({
			command: "subscribe",
			identifier: '{"channel": "' + channelName + '"}'
		});
		webSocket.send(json)
	}

	webSocket.onmessage = function(e){
      var json = JSON.parse(e.data);
      if(json["type"]){
         if(json["type"] == "reject_subscription"){
            webSocket.close();
         }else if(json["type"] == "ping"){
				return;
			}
      }
      
      // Notify the app of the changes
      if(json["message"]){
         var uuid = json["message"]["uuid"]
			var change = json["message"]["change"]
			var sessionId = json["message"]["session_id"]

			if(!uuid || !change || !sessionId) return;

			// Don't notify the app if the session is the current session or 0
			if(sessionId == 0) return;

			let currentSessionId = globals.jwt.split('.')[3];
			if(currentSessionId && currentSessionId == sessionId) return;
			
			if(change == 0 || change == 1){
				DataManager.UpdateLocalTableObject(uuid);
			}else if(change == 2){
				DataManager.DeleteLocalTableObject(uuid);
			}
      }
   }
}

export function startPushNotificationSubscription(){
	if('serviceWorker' in navigator && globals.environment == DavEnvironment.Production){
      // Wait for availability of the service worker
      const p = new Promise(r => {
         if (navigator.serviceWorker.controller) return r();
         navigator.serviceWorker.addEventListener('controllerchange', e => r());
      });
      p.then(() => {
         // Initialize the service worker
         navigator.serviceWorker.controller.postMessage({
            icon: globals.notificationOptions.icon,
            badge: globals.notificationOptions.badge
         });
      });
   }
}