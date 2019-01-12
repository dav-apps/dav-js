import { TableObject } from "./models/TableObject";
import * as DataManager from "./providers/DataManager";

export const userKey = "user";
export const tableObjectsKey = "tableObjects";
export const subscriptionKey = "subscription";

class Globals{
   public apiBaseUrl: string = "http://localhost:3111/v1/";
	public websiteUrl: string = "http://localhost:3000/";
	public jwt: string = null;

   constructor(public production: boolean,
					public appId: number, 
               public tableIds: number[],
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

export var globals = new Globals(false, -1, [], {UpdateAllOfTable: (tableId: number) => {}, 
                                                UpdateTableObject: (tableObject: TableObject) => {}, 
                                                DeleteTableObject: (tableObject: TableObject) => {},
                                                ReceiveNotification: (notification: object) => {}
                                             });

export function Initialize(production: boolean, 
                           appId: number, 
                           tableIds: number[], 
                           callbacks: { 
                              UpdateAllOfTable: Function, 
                              UpdateTableObject: Function, 
                              DeleteTableObject: Function,
                              ReceiveNotification: Function
                           }){
   globals = new Globals(production, appId, tableIds, callbacks);
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
					globals.callbacks.ReceiveNotification(event.data.data);
				}
			}
      });
	}
}