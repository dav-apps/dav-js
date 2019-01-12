import * as localforage from "localforage";
var bowser = require('bowser');
import * as Dav from '../Dav';
import { TableObject, TableObjectUploadStatus, generateUUID, ConvertObjectToMap, ConvertMapToObject } from '../models/TableObject';

function InitLocalforage(){
   if(bowser.firefox){
      // Use localstorage as driver
      localforage.setDriver(localforage.LOCALSTORAGE);
   }
}

//#region User methods
export function SetUser(user: object){
   InitLocalforage();
   localforage.setItem(Dav.userKey, user);
}

export async function GetUser() : Promise<object>{
   InitLocalforage();
   return await localforage.getItem(Dav.userKey) as object;
}

export async function RemoveUser(){
	InitLocalforage();
	localforage.removeItem(Dav.userKey);
}
//#endregion

//#region Subscription methods
export async function SetSubscription(subscription: {uuid: string, endpoint: string, p256dh: string, auth: string, status: SubscriptionStatus}){
	InitLocalforage();
	localforage.setItem(Dav.subscriptionKey, {
		uuid: subscription.uuid,
		endpoint: subscription.endpoint,
		p256dh: subscription.p256dh,
		auth: subscription.auth,
		status: subscription.status
	});
}

export async function GetSubscription() : Promise<{uuid: string, endpoint: string, p256dh: string, auth: string, status: SubscriptionStatus}>{
	InitLocalforage();
	return await localforage.getItem(Dav.subscriptionKey) as {uuid: string, endpoint: string, p256dh: string, auth: string, status: SubscriptionStatus};
}

export async function RemoveSubscription(){
	InitLocalforage();
	localforage.removeItem(Dav.subscriptionKey);
}

export enum SubscriptionStatus {
	// The subscription was created on the server and works
	UpToDate = 0,
	// The subscription was created, but it's still not saved on the server
	New = 1,
	// The subscription in on the server, but it was deleted locally and has to be deleted on the server
	Deleted = 2
}
//#endregion

//#region TableObject methods
async function SetTableObjectsArray(tableObjects: Array<TableObject>){
	InitLocalforage();
	try{
		// Convert the table objects into objects
		var objects: object[] = [];
		tableObjects.forEach(tableObject => {
			objects.push({
				TableId: tableObject.TableId,
				IsFile: tableObject.IsFile,
				Uuid: tableObject.Uuid,
				Visibility: tableObject.Visibility,
				UploadStatus: tableObject.UploadStatus,
				Etag: tableObject.Etag,
				Properties: ConvertMapToObject(tableObject.Properties)
			});
		});

		await localforage.setItem(Dav.tableObjectsKey, objects);
	}catch(error){
		console.log(error);
	}
}

async function GetTableObjectsArray(): Promise<TableObject[]>{
	InitLocalforage();

	try{
		var objArray = await localforage.getItem(Dav.tableObjectsKey) as object[];
		if(!objArray) return [];

		var tableObjectsArray: TableObject[] = [];

		objArray.forEach(obj => {
			var tableObject = new TableObject();
			tableObject.TableId = obj["TableId"];
			tableObject.UploadStatus = obj["UploadStatus"];
			tableObject.IsFile = obj["IsFile"];
			tableObject.Etag = obj["Etag"];
			tableObject.Visibility = obj["Visibility"];
			tableObject.Uuid = obj["Uuid"];
			if(obj["Properties"]){
				tableObject.Properties = ConvertObjectToMap(obj["Properties"])
			}
			
			tableObjectsArray.push(tableObject);
		});

		return tableObjectsArray;
	}catch(error){
		console.log(error);
		return [];
	}
}

export async function CreateTableObject(tableObject: TableObject): Promise<string>{
	var tableObjects = await GetTableObjectsArray();
	var uuid = tableObject.Uuid;
	
	// Check if the uuid already exists
	while(tableObjects.findIndex(obj => obj.Uuid == uuid) !== -1){
		uuid = generateUUID();
	}
	
	tableObject.Uuid = uuid;
	tableObjects.push(tableObject);
	await SetTableObjectsArray(tableObjects);
	
	return uuid;
}

export async function CreateTableObjects(tableObjects: TableObject[]): Promise<string[]>{
	var savedTableObjects = await GetTableObjectsArray();
	var uuids: string[] = [];

	tableObjects.forEach(tableObject => {
		while(savedTableObjects.findIndex(obj => obj.Uuid == tableObject.Uuid) !== -1){
			tableObject.Uuid = generateUUID();
		}
		uuids.push(tableObject.Uuid);
		
		savedTableObjects.push(tableObject);
	});

	await SetTableObjectsArray(savedTableObjects);
	return uuids;
}

export async function GetTableObject(uuid: string): Promise<TableObject>{
	var tableObjects = await GetTableObjectsArray();
	var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

	if(index !== -1){
		return tableObjects[index];
	}else{
		return null;
	}
}

export async function GetAllTableObjects(tableId: number = -1, deleted: boolean): Promise<TableObject[]>{
	var tableObjects = await GetTableObjectsArray();

	if(tableObjects){
		var sortedTableObjects = tableObjects.filter(obj => (obj.UploadStatus != TableObjectUploadStatus.Deleted || deleted) && 
																				(obj.TableId == tableId || tableId == -1));
		return sortedTableObjects;
	}

	return [];
}

export async function TableObjectExists(uuid: string){
	var tableObjects = await GetTableObjectsArray();
	return tableObjects.findIndex(obj => obj.Uuid == uuid) !== -1;
}

export async function UpdateTableObject(tableObject: TableObject){
	var tableObjects = await GetTableObjectsArray();
	var index = tableObjects.findIndex(obj => obj.Uuid == tableObject.Uuid);

	if(index !== -1){
		tableObjects[index] = tableObject;
		await SetTableObjectsArray(tableObjects);
	}
}

export async function DeleteTableObject(uuid: string){
	var tableObjects = await GetTableObjectsArray();
	var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

	if(index !== -1){
		tableObjects[index].UploadStatus = TableObjectUploadStatus.Deleted;
		await SetTableObjectsArray(tableObjects);
	}
}

export async function DeleteTableObjectImmediately(uuid: string){
	var tableObjects = await GetTableObjectsArray();
	var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

	if(index !== -1){
		tableObjects.splice(index, 1);
		await SetTableObjectsArray(tableObjects);
	}
}
//#endregion