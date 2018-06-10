export const apiBaseUrl = "http://localhost:3111/v1/";
export const userKey = "user";
export const tableObjectsKey = "tableObjects";
export const appIdKey = "appId";
export var globals;

class Globals{
   constructor(public production: boolean, public appId: number){}
}

export function Initialize(production: boolean, appId: number){
   globals = new Globals(production, appId);
}