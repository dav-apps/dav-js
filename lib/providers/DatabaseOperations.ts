import * as localforage from "localforage";
import { extendPrototype } from 'localforage-startswith';
import * as Dav from '../Dav';
import { TableObject, TableObjectUploadStatus, ConvertObjectToTableObject, generateUUID } from '../models/TableObject';
import { Notification } from '../models/Notification';
import { UploadStatus } from './DataManager';

extendPrototype(localforage);

//#region User methods
export async function SetUser(user: object){
   await localforage.setItem(Dav.userKey, user);
}

export async function GetUser() : Promise<object>{
   return await localforage.getItem(Dav.userKey) as object;
}

export async function RemoveUser(){
	await localforage.removeItem(Dav.userKey);
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

	await localforage.setItem(Dav.notificationsKey, notificationObjects);
}

export async function GetAllNotifications() : Promise<Array<Notification>>{
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
	await localforage.removeItem(Dav.notificationsKey);
}
//#endregion

//#region Subscription methods
export async function SetSubscription(subscription: {uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus}){
	await localforage.setItem(Dav.subscriptionKey, {
		uuid: subscription.uuid,
		endpoint: subscription.endpoint,
		p256dh: subscription.p256dh,
		auth: subscription.auth,
		status: subscription.status
	});
}

export async function GetSubscription() : Promise<{uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus}>{
	return await localforage.getItem(Dav.subscriptionKey) as {uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus};
}

export async function RemoveSubscription(){
	await localforage.removeItem(Dav.subscriptionKey);
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
	if(Dav.globals.separateKeyStorage){
		if(!tableObject.Uuid) tableObject.Uuid = generateUUID();

		await localforage.setItem(Dav.getTableObjectsKey(tableObject.TableId, tableObject.Uuid), tableObject);
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
	if(Dav.globals.separateKeyStorage){
		let uuids: string[] = [];

		for(let tableObject of tableObjects){
			if(!tableObject.Uuid) tableObject.Uuid = generateUUID();

			await localforage.setItem(Dav.getTableObjectsKey(tableObject.TableId, tableObject.Uuid), tableObject);
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
	if(Dav.globals.separateKeyStorage){
		if(tableId){
			// Get the table object directly
			let obj = await localforage.getItem(Dav.getTableObjectsKey(tableId, uuid)) as TableObject;
         if(obj) return ConvertObjectToTableObject(obj);
         else return null;
		}else{
			for(let id of Dav.globals.tableIds){
				let tableObject = await localforage.getItem(Dav.getTableObjectsKey(id, uuid)) as TableObject;
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
	if(Dav.globals.separateKeyStorage){
		let key = tableId == -1 ? Dav.getTableObjectsKey() : Dav.getTableObjectsKey(tableId);
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
	if(Dav.globals.separateKeyStorage){
		if(tableId){
			// Try to get the table object directly
			return (await localforage.getItem(Dav.getTableObjectsKey(tableId, uuid))) != null;
		}else{
			// Try to get the table object with each table id
			for(let id of Dav.globals.tableIds){
				let item = await localforage.getItem(Dav.getTableObjectsKey(id, uuid));
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
	if(Dav.globals.separateKeyStorage){
		await localforage.setItem(Dav.getTableObjectsKey(tableObject.TableId, tableObject.Uuid), tableObject);
	}else{
		var tableObjects = await GetTableObjectsArray();
		var index = tableObjects.findIndex(obj => obj.Uuid == tableObject.Uuid);

		if(index !== -1){
			tableObjects[index] = tableObject;
			await SetTableObjectsArray(tableObjects);
		}
	}
}

export async function DeleteTableObject(uuid: string, tableId?: number){
	if(Dav.globals.separateKeyStorage){
		if(tableId){
			// Update the table object directly
			let key = Dav.getTableObjectsKey(tableId, uuid);
			let tableObject = await localforage.getItem(key) as TableObject;
			if(!tableObject) return;

			tableObject = ConvertObjectToTableObject(tableObject);
			tableObject.UploadStatus = TableObjectUploadStatus.Deleted;
			await localforage.setItem(key, tableObject);
		}else{
			// Find the table object with each table id and update it
			for(let id of Dav.globals.tableIds){
				let key = Dav.getTableObjectsKey(id, uuid);
				let tableObject = await localforage.getItem(key) as TableObject;

				if(tableObject){
					tableObject = ConvertObjectToTableObject(tableObject);
					tableObject.UploadStatus = TableObjectUploadStatus.Deleted;
					await localforage.setItem(key, tableObject);
					return;
				}
			}
		}
	}else{
		var tableObjects = await GetTableObjectsArray();
		var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

		if(index !== -1){
			tableObjects[index].UploadStatus = TableObjectUploadStatus.Deleted;
			await SetTableObjectsArray(tableObjects);
		}
	}
}

export async function DeleteTableObjectImmediately(uuid: string, tableId?: number){
	if(Dav.globals.separateKeyStorage){
		if(tableId){
			// Remove the table object directly
			await localforage.removeItem(Dav.getTableObjectsKey(tableId, uuid));
		}else{
			// Find the table object with each table id and remove it
			for(let id of Dav.globals.tableIds){
				let key = Dav.getTableObjectsKey(id, uuid);
				let item = await localforage.getItem(key);
				if(item){
					await localforage.removeItem(key);
					return;
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