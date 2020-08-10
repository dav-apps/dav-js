import * as localforage from 'localforage';
import { extendPrototype } from 'localforage-startswith';
import {
	Dav,
	userKey,
	notificationsKey,
	subscriptionKey,
	tableObjectsKey,
	getTableObjectKey
} from '../Dav';
import {
	TableObject,
	DatabaseTableObject,
	TableObjectUploadStatus,
	generateUUID,
	TableObjectProperties
} from '../models/TableObject';
import { Notification } from '../models/Notification';
import { UploadStatus } from './DataManager';

extendPrototype(localforage);

//#region User functions
export async function SetUser(user: object) {
	await localforage.setItem(userKey, user);
}

export async function GetUser(): Promise<object> {
	return await localforage.getItem(userKey) as object;
}

export async function RemoveUser() {
	await localforage.removeItem(userKey);
}
//#endregion

//#region Notification functions
async function SetNotificationsArray(notifications: Array<Notification>) {
	// Convert the notifications to objects
	let notificationObjects: Array<{ uuid: string, time: number, interval: number, properties: object, status: number }> = [];
	for (let notification of notifications) {
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

export async function GetAllNotifications(): Promise<Array<Notification>> {
	let notificationObjects = await localforage.getItem(notificationsKey) as Array<{ uuid: string, time: number, interval: number, properties: object, status: number }>;
	if (!notificationObjects) return [];

	// Convert the objects to Notifications
	let notifications: Array<Notification> = [];
	for (let obj of notificationObjects) {
		notifications.push(new Notification(obj.time, obj.interval, obj.properties, obj.uuid, obj.status));
	}

	return notifications;
}

export async function GetNotification(uuid: string): Promise<Notification> {
	let notifications = await GetAllNotifications();

	let index = notifications.findIndex(n => n.Uuid == uuid);
	if (index !== -1) {
		return notifications[index];
	} else {
		return null;
	}
}

export async function SaveNotification(notification: Notification) {
	let notifications = await GetAllNotifications();

	// Check if the notification already exists
	let index = notifications.findIndex(n => n.Uuid == notification.Uuid);
	if (index !== -1) {
		// Replace the old notification
		notifications[index] = notification;
	} else {
		// Add the new notification
		notifications.push(notification);
	}

	await SetNotificationsArray(notifications);
}

export async function DeleteNotification(uuid: string) {
	let notifications = await GetAllNotifications();

	let index = notifications.findIndex(n => n.Uuid == uuid);
	if (index !== -1) {
		// Remove the notification
		notifications.splice(index, 1);
		await SetNotificationsArray(notifications);
	}
}

export async function RemoveAllNotifications() {
	await localforage.removeItem(notificationsKey);
}
//#endregion

//#region Subscription functions
export async function SetSubscription(subscription: { uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus }) {
	await localforage.setItem(subscriptionKey, {
		uuid: subscription.uuid,
		endpoint: subscription.endpoint,
		p256dh: subscription.p256dh,
		auth: subscription.auth,
		status: subscription.status
	});
}

export async function GetSubscription(): Promise<{ uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus }> {
	return await localforage.getItem(subscriptionKey) as { uuid: string, endpoint: string, p256dh: string, auth: string, status: UploadStatus };
}

export async function RemoveSubscription() {
	await localforage.removeItem(subscriptionKey);
}
//#endregion

//#region TableObject functions
export async function SetTableObject(tableObject: TableObject, overwrite: boolean = true): Promise<string> {
	await ConvertDatabaseFormat()

	try {
		if (!tableObject.Uuid) tableObject.Uuid = generateUUID()
		else if (!overwrite) {
			// Check if the table object already exists
			let existingTableObject = await localforage.getItem(getTableObjectKey(tableObject.TableId, tableObject.Uuid)) as DatabaseTableObject

			if (existingTableObject) {
				// Add all local properties from the existing table object
				for (let key of Object.keys(existingTableObject.Properties)) {
					if (tableObject.Properties[key]) continue
					if (typeof (existingTableObject.Properties[key]) == "string") continue
					if (!(existingTableObject.Properties as TableObjectProperties)[key].local) continue

					// Add the property to the new table object
					tableObject.Properties[key] = (existingTableObject.Properties as TableObjectProperties)[key]
				}
			}
		}

		await localforage.setItem(getTableObjectKey(tableObject.TableId, tableObject.Uuid), tableObject)
		return tableObject.Uuid
	} catch (error) {
		console.log(error)
		return null
	}
}

export async function SetTableObjects(tableObjects: TableObject[], overwrite: boolean = true): Promise<string[]> {
	let uuids: string[] = []

	for (let tableObject of tableObjects) {
		uuids.push(await SetTableObject(tableObject, overwrite))
	}

	return uuids
}

export async function GetAllTableObjects(tableId: number = -1, deleted: boolean = false): Promise<TableObject[]> {
	await ConvertDatabaseFormat()

	// Get all table objects from separateKeyStorage
	return await GetAllTableObjectsFromSeparateKeyStorage(tableId, deleted)
}

export async function GetTableObject(uuid: string, tableId?: number): Promise<TableObject> {
	await ConvertDatabaseFormat()

	// Database -> DatabaseTableObject -(ConvertObjectToTableObject)> TableObject
	// Try to get the table object from separateKeyStorage
	return await GetTableObjectFromSeparateKeyStorage(uuid, tableId)
}

export async function TableObjectExists(uuid: string, tableId?: number): Promise<boolean> {
	return await GetTableObject(uuid, tableId) != null
}

export async function RemoveTableObject(uuid: string, tableId?: number) {
	await ConvertDatabaseFormat()

	// Try to remove the table object from separateKeyStorage
	try {
		if (tableId) {
			// Remove the table object directly
			await localforage.removeItem(getTableObjectKey(tableId, uuid))
		} else {
			// Find the table object with each table id and remove it
			for (let id of Dav.tableIds) {
				let key = getTableObjectKey(id, uuid)
				let item = await localforage.getItem(key)
				if (item) {
					await localforage.removeItem(key)
					return
				}
			}
		}
	} catch (error) {
		console.log(error)
	}
}

//#region Private separateKeyStorage functions
async function GetTableObjectFromSeparateKeyStorage(uuid: string, tableId?: number): Promise<TableObject> {
	try {
		if (tableId) {
			// Get the table object directly
			return ConvertDatabaseTableObjectToTableObject(
				await localforage.getItem(
					getTableObjectKey(tableId, uuid)
				) as DatabaseTableObject
			)
		} else {
			// Try to get the table objects with the uuid but with each table id
			for (let id of Dav.tableIds) {
				let obj = await localforage.getItem(getTableObjectKey(id, uuid)) as DatabaseTableObject
				if (obj) return ConvertDatabaseTableObjectToTableObject(obj)
			}
		}
	} catch (error) {
		console.log(error)
	}

	return null
}

async function GetAllTableObjectsFromSeparateKeyStorage(tableId: number = -1, deleted: boolean = false): Promise<TableObject[]> {
	let key = getTableObjectKey(tableId)

	try {
		var tableObjectsObject = await localforage.startsWith(key) as { [key: string]: DatabaseTableObject }
		if (!tableObjectsObject) return []
	} catch (error) {
		console.log(error)
		return []
	}

	let tableObjects: DatabaseTableObject[] = Object.values(tableObjectsObject)

	let selectedDatabaseTableObjects = deleted ?
		tableObjects
		: tableObjects.filter(obj => (
			obj.UploadStatus != TableObjectUploadStatus.Deleted
			&& obj.UploadStatus != TableObjectUploadStatus.Removed
		))

	let selectedTableObjects = []
	for (let obj of selectedDatabaseTableObjects) {
		selectedTableObjects.push(ConvertDatabaseTableObjectToTableObject(obj))
	}

	return selectedTableObjects
}
//#endregion

export async function ConvertDatabaseFormat() {
	// Get the table objects array
	try {
		var tableObjects = await localforage.getItem(tableObjectsKey) as DatabaseTableObject[]
		if(!tableObjects) return
	} catch (error) {
		console.log(error)
		return
	}

	// Save each table object as separateKeyStorage
	for (let tableObject of tableObjects) {
		try {
			// Check if the table object is already saved as separateKeyStorage
			let key = getTableObjectKey(tableObject.TableId, tableObject.Uuid)
			
			let existingItem = await localforage.getItem(key)
			if(existingItem) continue

			await localforage.setItem(key, tableObject)
		} catch (error) {
			console.log(error)
		}
	}

	// Remove the tableObjectsArray
	try {
		await localforage.removeItem(tableObjectsKey)
	} catch (error) {
		console.log(error)
	}
}

export function ConvertDatabaseTableObjectToTableObject(obj: DatabaseTableObject): TableObject {
	if (obj == null) return null

	let tableObject = new TableObject()
	tableObject.Uuid = obj.Uuid
	tableObject.TableId = obj.TableId
	tableObject.IsFile = obj.IsFile
	tableObject.File = obj.File
	tableObject.UploadStatus = obj.UploadStatus
	tableObject.Etag = obj.Etag

	for (let key of Object.keys(obj.Properties)) {
		let value = obj.Properties[key]

		if (typeof value == "string") {
			// value is of type OldTableObjectProperties
			tableObject.Properties[key] = { value }
		} else {
			// value is of type TableObjectProperties
			tableObject.Properties[key] = value
		}
	}

	return tableObject
}
//#endregion