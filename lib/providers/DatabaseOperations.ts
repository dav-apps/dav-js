import * as localforage from "localforage";
var bowser = require('bowser');
import * as Dav from '../Dav';
import { TableObject, TableObjectUploadStatus, generateUUID } from '../models/TableObject';
import { Notification } from '../models/Notification';
import { UploadStatus } from './DataManager';

function InitLocalforage(){
   if(bowser.firefox){
      // Use localstorage as driver
      localforage.setDriver(localforage.LOCALSTORAGE);
   }
}

//#region User methods
export async function SetUser(user: object){
   InitLocalforage();
   await localforage.setItem(Dav.userKey, user);
}

export async function GetUser() : Promise<object>{
   InitLocalforage();
   return await localforage.getItem(Dav.userKey) as object;
}

export async function RemoveUser(){
	InitLocalforage();
	await localforage.removeItem(Dav.userKey);
}
//#endregion

//#region Notification methods
async function SetNotificationsArray(notifications: Array<Notification>){
	InitLocalforage();

	// Convert the notifications to objects
	let notificationObjects: Array<{uuid: string, time: number, interval: number, properties: object, status: number}> = [];
	for(let notification of notifications){
		notificationObjects.push({
			uuid: notification.Uuid,
			time: notification.Time, 
			interval: notification.Interval,
			properties: notification.Properties,
			status: notification.Status
		});
	}

	await localforage.setItem(Dav.notificationsKey, notificationObjects);
}

export async function GetAllNotifications() : Promise<Array<Notification>>{
	InitLocalforage();
	let notificationObjects = await localforage.getItem(Dav.notificationsKey) as Array<{uuid: string, time: number, interval: number, properties: object, status: number}>;
	if(!notificationObjects) return [];

	// Convert the objects to Notifications
	let notifications: Array<Notification> = [];
	for(let obj of notificationObjects){
		notifications.push(new Notification(obj.time, obj.interval, obj.properties, obj.uuid, obj.status));
	}

	return notifications;
}

export async function GetNotification(uuid: string) : Promise<Notification>{
	let notifications = await GetAllNotifications();

	let index = notifications.findIndex(n => n.Uuid == uuid);
	if(index !== -1){
		return notifications[index];
	}else{
		return null;
	}
}

export async function SaveNotification(notification: Notification){
	let notifications = await GetAllNotifications();

	// Check if the notification already exists
	let index = notifications.findIndex(n => n.Uuid == notification.Uuid);
	if(index !== -1){
		// Replace the old notification
		notifications[index] = notification;
	}else{
		// Add the new notification
		notifications.push(notification);
	}
	
	await SetNotificationsArray(notifications);
}

export async function DeleteNotification(uuid: string){
	let notifications = await GetAllNotifications();

	let index = notifications.findIndex(n => n.Uuid == uuid);
	if(index !== -1){
		// Remove the notification
		notifications.splice(index, 1);
		await SetNotificationsArray(notifications);
	}
}

export async function RemoveAllNotifications(){
	InitLocalforage();
	await localforage.removeItem(Dav.notificationsKey);
}
//#endregion

//#region Subscription methods
export async function SetSubscription(subscription: {uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus}){
	InitLocalforage();
	await localforage.setItem(Dav.subscriptionKey, {
		uuid: subscription.uuid,
		endpoint: subscription.endpoint,
		p256dh: subscription.p256dh,
		auth: subscription.auth,
		status: subscription.status
	});
}

export async function GetSubscription() : Promise<{uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus}>{
	InitLocalforage();
	return await localforage.getItem(Dav.subscriptionKey) as {uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus};
}

export async function RemoveSubscription(){
	InitLocalforage();
	await localforage.removeItem(Dav.subscriptionKey);
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
            File: tableObject.File,
				Uuid: tableObject.Uuid,
				Visibility: tableObject.Visibility,
				UploadStatus: tableObject.UploadStatus,
				Etag: tableObject.Etag,
				Properties: tableObject.Properties
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
         tableObject.File = obj["File"];
			tableObject.Etag = obj["Etag"];
			tableObject.Visibility = obj["Visibility"];
			tableObject.Uuid = obj["Uuid"];
			tableObject.Properties = obj["Properties"];
			
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