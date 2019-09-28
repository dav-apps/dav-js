import * as axios from 'axios';
import { TableObject } from "./models/TableObject";
import * as DataManager from "./providers/DataManager";
import { DavEnvironment } from "./models/DavUser";

export const apiBaseUrlDevelopment = "http://localhost:3111/v1";
export const apiBaseUrlProduction = "https://dav-backend.herokuapp.com/v1";
export const websiteUrlDevelopment = "http://localhost:3000";
export const websiteUrlProduction = "https://dav-apps.tech";
export const userKey = "user";
export const tableObjectsKey = "tableObjects";
export const notificationsKey = "notifications";
export const subscriptionKey = "subscription";
export const extPropertyName = "ext";
export const webPushPublicKey = "BD6vc4i0AcrsRMGK_WWhhx5IhvHVmeNsnFeYp2qwNhkubn0IIvhUpaNoMmK9SDhBKKaYSAWLtlXa2NJNjto-rnQ";

export interface ApiResponse<T>{
	status: number;
	data: T;
}

export interface ApiErrorResponse{
	status: number;
	errors: ApiError[];
}

export interface ApiError{
	code: number,
	message: string
}

export class Dav{
	static apiBaseUrl: string = apiBaseUrlDevelopment;
	static websiteUrl: string = websiteUrlDevelopment;
	static jwt: string = null;
	static environment: DavEnvironment = DavEnvironment.Development;
	static appId: number = -1;
	static tableIds: number[] = [];
	static parallelTableIds: number[] = [];
	static separateKeyStorage: boolean = false;
	static notificationOptions: {icon: string, badge: string} = {icon: "", badge: ""};
	static callbacks: {
		UpdateAllOfTable: Function, 
		UpdateTableObject: Function, 
		DeleteTableObject: Function,
		SyncFinished: Function
	} = {
		UpdateAllOfTable: (tableId: number, changed: boolean) => {},
		UpdateTableObject: (tableObject: TableObject, fileDownloaded: boolean = false) => {},
		DeleteTableObject: (tableObject: TableObject) => {},
		SyncFinished: () => {}
	}
}

export function Init(
	environment: DavEnvironment, 
	appId: number, 
	tableIds: Array<number>, 
	parallelTableIds: Array<number>, 
	separateKeyStorage: boolean, 
	notificationOptions: {icon: string, badge: string}, 
	callbacks: { 
		UpdateAllOfTable: Function, 
		UpdateTableObject: Function, 
		DeleteTableObject: Function, 
		SyncFinished: Function 
	}
){
	Dav.environment = environment;
	Dav.appId = appId;
	Dav.tableIds = tableIds;
	Dav.parallelTableIds = parallelTableIds;
	Dav.separateKeyStorage = separateKeyStorage;
	Dav.notificationOptions = notificationOptions;
	Dav.callbacks = callbacks;

	// Set the urls
	Dav.apiBaseUrl = environment == DavEnvironment.Production ? apiBaseUrlProduction : apiBaseUrlDevelopment;
	Dav.websiteUrl = environment == DavEnvironment.Production ? websiteUrlProduction : websiteUrlDevelopment;
}

export function InitStatic(environment: DavEnvironment){
	Dav.environment = environment;
}

export function getTableObjectsKey(tableId?: number, uuid?: string){
	if(!tableId && !uuid){
		return "tableObjects:";
	}else if(tableId && !uuid){
		return `tableObjects:${tableId}/`;
	}else if(tableId && uuid){
		return `tableObjects:${tableId}/${uuid}`;
	}else{
		return null;
	}
}

export function startWebSocketConnection(channelName = "TableObjectUpdateChannel"){
   if(!Dav.jwt || !Dav.appId || !Dav.apiBaseUrl || Dav.environment == DavEnvironment.Test) return;

	let baseUrl = Dav.apiBaseUrl.replace("http", "ws");
	var webSocket = new WebSocket(baseUrl + "cable?app_id=" + Dav.appId + "&jwt=" + Dav.jwt);

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

			let currentSessionId = Dav.jwt.split('.')[3];
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
	if('serviceWorker' in navigator && Dav.environment == DavEnvironment.Production){
      // Wait for availability of the service worker
      const p = new Promise(r => {
         if (navigator.serviceWorker.controller) return r();
         navigator.serviceWorker.addEventListener('controllerchange', e => r());
      });
      p.then(() => {
         // Initialize the service worker
         navigator.serviceWorker.controller.postMessage({
            icon: Dav.notificationOptions.icon,
            badge: Dav.notificationOptions.badge
         });
      });
   }
}

export function ConvertHttpResponseToErrorResponse(response: axios.AxiosResponse) : ApiErrorResponse{
	let status = response.status;
	let responseErrors: any[] = response.data.errors;
	let errors: ApiError[] = [];

	for(let i = 0; i < responseErrors.length; i++){
		errors.push({
			code: responseErrors[i][0],
			message: responseErrors[i][1]
		});
	}

	return {
		status,
		errors
	}
}