import { TableObject } from "./models/TableObject";

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
}