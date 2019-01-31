import { TableObject } from "./models/TableObject";
import { Notification } from "./models/Notification";
import * as DataManager from "./providers/DataManager";

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

   constructor(public production: boolean,
					public appId: number, 
               public tableIds: Array<number>,
               public parallelTableIds: Array<number>,
               public callbacks: { 
                  UpdateAllOfTable: Function, 
                  UpdateTableObject: Function, 
                  DeleteTableObject: Function,
                  ReceiveNotification: Function
               }){

      if(production){
         this.apiBaseUrl = "https://dav-backend.herokuapp.com/v1/";
         this.websiteUrl = "https://dav-apps.tech/";
      }
   }
}

export var globals = new Globals(false, -1, [], [], {UpdateAllOfTable: (tableId: number) => {}, 
                                                UpdateTableObject: (tableObject: TableObject) => {}, 
                                                DeleteTableObject: (tableObject: TableObject) => {},
                                                ReceiveNotification: (notification: object) => {}
                                             });

export function Initialize(production: boolean, 
                           appId: number, 
                           tableIds: Array<number>, 
                           parallelTableIds: Array<number>,
                           callbacks: { 
                              UpdateAllOfTable: Function, 
                              UpdateTableObject: Function, 
                              DeleteTableObject: Function,
                              ReceiveNotification: Function
                           }){
   globals = new Globals(production, appId, tableIds, parallelTableIds, callbacks);
}

export function startWebSocketConnection(channelName = "TableObjectUpdateChannel"){
	if(!globals.jwt || !globals.appId || !globals.apiBaseUrl) return;

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
         }
      }
     
      // Notify the app of the changes
      if(json["message"]){
         var uuid = json["message"]["uuid"]
         var change = json["message"]["change"]

         if(uuid != null && change != null){
            if(change == 0 || change == 1){
            	DataManager.UpdateLocalTableObject(uuid);
            }else if(change == 2){
               DataManager.DeleteLocalTableObject(uuid);
            }
         }
      }
   }
}

export function startPushNotificationSubscription(){
	if('serviceWorker' in navigator && globals.production){
      navigator.serviceWorker.ready.then((registration) => {
         // Initialize the service worker
         let baseUrl = `${window.location.protocol}//${window.location.host}`;
         navigator.serviceWorker.controller.postMessage({
            baseUrl,
            icon: "/assets/icons/icon-192x192.png",
            badge: "/favicon.png"
         });
      });
	}
}