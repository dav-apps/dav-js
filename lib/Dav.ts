import { TableObject } from "./models/TableObject";
import * as DataManager from "./providers/DataManager";

export const userKey = "user";
export const tableObjectsKey = "tableObjects";

class Globals{
   public apiBaseUrl: string = "http://localhost:3111/v1/";
   public websiteUrl: string = "http://localhost:3000/";
	public jwt: string = null;

   constructor(public production: boolean,
					public appId: number, 
               public tableIds: number[],
               public callbacks: { UpdateAllOfTable: Function, UpdateTableObject: Function, DeleteTableObject: Function }){

      if(production){
         this.apiBaseUrl = "https://dav-backend.herokuapp.com/v1/";
         this.websiteUrl = "https://dav-apps.tech/";
      }
   }
}

export var globals = new Globals(false, -1, [], {UpdateAllOfTable: (tableId: number) => {}, 
                                                UpdateTableObject: (tableObject: TableObject) => {}, 
                                                DeleteTableObject: (tableObject: TableObject) => {}});

export function Initialize(production: boolean, 
                           appId: number, 
                           tableIds: number[], 
                           callbacks: { UpdateAllOfTable: Function, UpdateTableObject: Function, DeleteTableObject: Function }){
   globals = new Globals(production, appId, tableIds, callbacks);

   // Start the web worker and update the UI when the worker receives a message
   if(Worker){
      var worker = new Worker('dav/worker.js');
      worker.postMessage(appId);

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