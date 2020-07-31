import * as localforage from "localforage";
import { extendPrototype } from 'localforage-startswith';
import { Dav, userKey, notificationsKey, subscriptionKey, tableObjectsKey, getTableObjectsKey } from '../Dav';
import { TableObject, TableObjectUploadStatus, ConvertObjectToTableObject, generateUUID } from '../models/TableObject';
import { Notification } from '../models/Notification';
import { UploadStatus } from './DataManager';

extendPrototype(localforage);

//#region User methods
export async function SetUser(user: object){
   await localforage.setItem(userKey, user);
}

export async function GetUser() : Promise<object>{
   return await localforage.getItem(userKey) as object;
}

export async function RemoveUser(){
	await localforage.removeItem(userKey);
}
//#endregion

//#region Notification methods
async function SetNotificationsArray(notifications: Array<Notification>){
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

	await localforage.setItem(notificationsKey, notificationObjects);
}

export async function GetAllNotifications() : Promise<Array<Notification>>{
	let notificationObjects = await localforage.getItem(notificationsKey) as Array<{uuid: string, time: number, interval: number, properties: object, status: number}>;
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
	await localforage.removeItem(notificationsKey);
}
//#endregion

//#region Subscription methods
export async function SetSubscription(subscription: {uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus}){
	await localforage.setItem(subscriptionKey, {
		uuid: subscription.uuid,
		endpoint: subscription.endpoint,
		p256dh: subscription.p256dh,
		auth: subscription.auth,
		status: subscription.status
	});
}

export async function GetSubscription() : Promise<{uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus}>{
	return await localforage.getItem(subscriptionKey) as {uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus};
}

export async function RemoveSubscription(){
	await localforage.removeItem(subscriptionKey);
}
//#endregion

//#region TableObject methods
async function SetTableObjectsArray(tableObjects: Array<TableObject>){
	try{
		// Convert the table objects into objects
		var objects: object[] = [];
		tableObjects.forEach(tableObject => {
			objects.push({
				TableId: tableObject.TableId,
            IsFile: tableObject.IsFile,
            File: tableObject.File,
				Uuid: tableObject.Uuid,
				UploadStatus: tableObject.UploadStatus,
				Etag: tableObject.Etag,
				Properties: tableObject.Properties
			});
		});

		await localforage.setItem(tableObjectsKey, objects);
	}catch(error){
		console.log(error);
	}
}

async function GetTableObjectsArray(): Promise<TableObject[]>{
	try{
		var objArray = await localforage.getItem(tableObjectsKey) as object[];
      if(!objArray) return [];

		var tableObjectsArray: TableObject[] = [];

		objArray.forEach(obj => {
			var tableObject = new TableObject();
			tableObject.TableId = obj["TableId"];
			tableObject.UploadStatus = obj["UploadStatus"];
         tableObject.IsFile = obj["IsFile"];
         tableObject.File = obj["File"];
			tableObject.Etag = obj["Etag"];
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
	if(Dav.separateKeyStorage){
		if(!tableObject.Uuid) tableObject.Uuid = generateUUID();

		await localforage.setItem(getTableObjectsKey(tableObject.TableId, tableObject.Uuid), tableObject);
		return tableObject.Uuid;
	}else{
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
}

export async function CreateTableObjects(tableObjects: TableObject[]): Promise<string[]>{
	if(Dav.separateKeyStorage){
		let uuids: string[] = [];

		for(let tableObject of tableObjects){
			if(!tableObject.Uuid) tableObject.Uuid = generateUUID();

			await localforage.setItem(getTableObjectsKey(tableObject.TableId, tableObject.Uuid), tableObject);
			uuids.push(tableObject.Uuid);
		}

		return uuids;
	}else{
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
}

export async function GetTableObject(uuid: string, tableId?: number): Promise<TableObject>{
	if(Dav.separateKeyStorage){
		if(tableId){
			// Get the table object directly
			let obj = await localforage.getItem(getTableObjectsKey(tableId, uuid)) as TableObject;
         if(obj) return ConvertObjectToTableObject(obj);
         else return null;
		}else{
			for(let id of Dav.tableIds){
				let tableObject = await localforage.getItem(getTableObjectsKey(id, uuid)) as TableObject;
				if(tableObject) return ConvertObjectToTableObject(tableObject);
			}
			return null;
		}
	}else{
		var tableObjects = await GetTableObjectsArray();
		var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

		return index !== -1 ? tableObjects[index] : null;
	}
}

export async function GetAllTableObjects(tableId: number = -1, deleted: boolean): Promise<TableObject[]>{
	if(Dav.separateKeyStorage){
		let key = tableId == -1 ? getTableObjectsKey() : getTableObjectsKey(tableId);
      let tableObjects = (await localforage.startsWith(key) as TableObject[])
		let tableObjectsArray: TableObject[] = Object.keys(tableObjects).map(key => ConvertObjectToTableObject(tableObjects[key]));

		return deleted ? tableObjectsArray : tableObjectsArray.filter(obj => obj.UploadStatus != TableObjectUploadStatus.Deleted);
	}else{
		var tableObjects = await GetTableObjectsArray();
		if(!tableObjects) return [];

		var sortedTableObjects = tableObjects.filter(obj => (obj.UploadStatus != TableObjectUploadStatus.Deleted || deleted) && 
																	(obj.TableId == tableId || tableId == -1));
		return sortedTableObjects;
	}
}

export async function TableObjectExists(uuid: string, tableId?: number){
	if(Dav.separateKeyStorage){
		if(tableId){
			// Try to get the table object directly
			return (await localforage.getItem(getTableObjectsKey(tableId, uuid))) != null;
		}else{
			// Try to get the table object with each table id
			for(let id of Dav.tableIds){
				let item = await localforage.getItem(getTableObjectsKey(id, uuid));
				if(item) return true;
			}
			return false;
		}
	}else{
		var tableObjects = await GetTableObjectsArray();
		return tableObjects.findIndex(obj => obj.Uuid == uuid) !== -1;
	}
}

export async function UpdateTableObject(tableObject: TableObject){
	if(Dav.separateKeyStorage){
		await localforage.setItem(getTableObjectsKey(tableObject.TableId, tableObject.Uuid), tableObject);
	}else{
		var tableObjects = await GetTableObjectsArray();
		var index = tableObjects.findIndex(obj => obj.Uuid == tableObject.Uuid);

		if(index !== -1){
			tableObjects[index] = tableObject;
			await SetTableObjectsArray(tableObjects);
		}
	}
}

export async function DeleteTableObjectImmediately(uuid: string, tableId?: number){
	if(Dav.separateKeyStorage){
		if(tableId){
			// Remove the table object directly
			await localforage.removeItem(getTableObjectsKey(tableId, uuid));
		}else{
			// Find the table object with each table id and remove it
			for(let id of Dav.tableIds){
				let key = getTableObjectsKey(id, uuid);
				let item = await localforage.getItem(key);
				if (item) {
					await localforage.removeItem(key);
					break;
				}
			}
		}
	}else{
		var tableObjects = await GetTableObjectsArray();
		var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

		if(index !== -1){
			tableObjects.splice(index, 1);
			await SetTableObjectsArray(tableObjects);
		}
	}
}
//#endregion