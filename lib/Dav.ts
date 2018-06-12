export const userKey = "user";
export const tableObjectsKey = "tableObjects";
export const appIdKey = "appId";
export var globals;

class Globals{
   public apiBaseUrl: string = "http://localhost:3111/v1/";

   constructor(public production: boolean, 
               public appId: number){

      if(production){
         this.apiBaseUrl = "dav-backend.herokuapp.com/v1/";
      }
   }
}

export function Initialize(production: boolean, appId: number){
   globals = new Globals(production, appId);
}