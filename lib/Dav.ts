export const userKey = "user";
export const tableObjectsKey = "tableObjects";
export var globals;

class Globals{
   public apiBaseUrl: string = "http://localhost:3111/v1/";
   public websiteUrl: string = "http://localhost:3000/";
	public jwt: string = null;

	constructor(public production: boolean,
					public appId: number, 
               public tableIds: number[],
               public callbacks: object){

      if(production){
         this.apiBaseUrl = "https://dav-backend.herokuapp.com/v1/";
         this.websiteUrl = "https://dav-apps.tech/";
      }
   }
}

export function Initialize(production: boolean, 
                           appId: number, 
                           tableIds: number[], 
                           callbacks: { UpdateAll: Function, UpdateAllOfTable: Function, UpdateTableObject: Function }){
   globals = new Globals(production, appId, tableIds, callbacks);
}