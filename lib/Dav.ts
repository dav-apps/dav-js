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

export function startWebWorker(channelName = "TableObjectUpdateChannel"){
   // Start the web worker and update the UI when the worker receives a message
   if(Worker){
      var worker = new Worker('worker.js');
      worker.postMessage({
         appId: globals.appId,
         jwt: globals.jwt,
         channelName,
         baseUrl: globals.apiBaseUrl
      });

      worker.onmessage = function(e){
         var uuid = e.data.uuid
         var change = e.data.change

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
			navigator.serviceWorker.onmessage = (event) => {
				if(event.data.type == "PUSH"){
					let notificationObject = event.data.data;
					if(!notificationObject.uuid) return;

					if(notificationObject.delete){
						// Delete the notification
						DataManager.DeleteNotification(notificationObject.uuid);
					}else{
						// Update the notification in the database
						let notification = new Notification(notificationObject.time, 
						notificationObject.interval, 
						notificationObject.properties, 
						notificationObject.uuid,
						DataManager.UploadStatus.UpToDate);
						notification.Save();
					}

					if(notificationObject.properties){
						globals.callbacks.ReceiveNotification(notificationObject.properties);
					}
				}
			}
      });
	}
}