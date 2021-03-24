import * as localforage from 'localforage'
import { extendPrototype } from 'localforage-startswith'
import {
	SessionUploadStatus,
	TableObjectUploadStatus,
	TableObjectProperties,
	DatabaseTableObject,
	DatabaseSession,
	DatabaseUser,
	DatabaseNotification
} from '../types'
import {
	sessionKey,
	userKey,
	oldUserKey,
	webPushSubscriptionKey,
	tableObjectsKey
} from '../constants'
import {
	generateUuid,
	getTableObjectKey,
	getNotificationKey
} from '../utils'
import { Dav } from '../Dav'
import { TableObject } from '../models/TableObject'
import { Notification } from '../models/Notification'
import { WebPushSubscription } from '../models/WebPushSubscription'
import { ConvertObjectArrayToApps } from '../models/App'

extendPrototype(localforage)

//#region Session functions
export async function SetSession(session: DatabaseSession) {
	await localforage.setItem(sessionKey, session)
}

export async function GetSession(): Promise<DatabaseSession> {
	// Check if there is already an old session from the previous version
	let oldUser = await localforage.getItem(oldUserKey) as object

	if (oldUser != null) {
		let user: DatabaseUser = {
			Id: oldUser["id"],
			Email: oldUser["email"],
			FirstName: oldUser["username"],
			Confirmed: oldUser["confirmed"],
			TotalStorage: oldUser["totalStorage"],
			UsedStorage: oldUser["usedStorage"],
			StripeCustomerId: oldUser["stripeCustomerId"],
			Plan: oldUser["plan"],
			SubscriptionStatus: oldUser["subscriptionStatus"],
			PeriodEnd: oldUser["periodEnd"],
			Dev: oldUser["dev"],
			Provider: oldUser["provider"],
			ProfileImage: null,
			ProfileImageEtag: null,
			Apps: ConvertObjectArrayToApps(oldUser["apps"])
		}

		// Save the new user
		await SetUser(user)

		// Save the new session with the jwt as access token
		let session: DatabaseSession = {
			AccessToken: oldUser["jwt"],
			UploadStatus: SessionUploadStatus.UpToDate
		}
		await SetSession(session)

		// Remove the old user from the database
		await localforage.removeItem(oldUserKey)
		
		return session
	} else {
		return await localforage.getItem(sessionKey) as DatabaseSession
	}
}

export async function RemoveSession() {
	await localforage.removeItem(sessionKey)
}
//#endregion

//#region User functions
export async function SetUser(user: DatabaseUser) {
	await localforage.setItem(userKey, user)
}

export async function GetUser(): Promise<DatabaseUser> {
	return await localforage.getItem(userKey) as DatabaseUser
}

export async function RemoveUser() {
	await localforage.removeItem(userKey)
}
//#endregion

//#region Notification functions
export async function SetNotification(notification: Notification) {
	await localforage.setItem(getNotificationKey(notification.Uuid), notification)
}

export async function GetAllNotifications(): Promise<Notification[]> {
	let key = getNotificationKey()

	try {
		var notificationsObject = await localforage.startsWith(key) as { [key: string]: DatabaseNotification }
	} catch (error) {
		console.log(error)
		return []
	}

	return Object.values(notificationsObject).map(notification => ConvertDatabaseNotificationToNotification(notification))
}

export async function GetNotification(uuid: string): Promise<Notification> {
	return ConvertDatabaseNotificationToNotification(
		await localforage.getItem(getNotificationKey(uuid)) as DatabaseNotification
	)
}

export async function NotificationExists(uuid: string): Promise<boolean>{
	return await GetNotification(uuid) != null
}

export async function RemoveNotification(uuid: string) {
	await localforage.removeItem(getNotificationKey(uuid))
}

export async function RemoveAllNotifications() {
	const keys = await localforage.keysStartingWith(getNotificationKey())

	for (let key of keys) {
		await localforage.removeItem(key)
	}
}
//#endregion

//#region WebPushSubscription functions
export async function SetWebPushSubscription(subscription: WebPushSubscription) {
	await localforage.setItem(webPushSubscriptionKey, subscription)
}

export async function GetWebPushSubscription(): Promise<WebPushSubscription>{
	return await localforage.getItem(webPushSubscriptionKey) as WebPushSubscription
}

export async function RemoveWebPushSubscription() {
	await localforage.removeItem(webPushSubscriptionKey)
}
//#endregion

//#region TableObject functions
export async function SetTableObject(tableObject: TableObject, overwrite: boolean = true): Promise<string> {
	await ConvertDatabaseFormat()

	try {
		if (!tableObject.Uuid) tableObject.Uuid = generateUuid()
		else if (!overwrite) {
			// Check if the table object already exists
			let existingTableObject = await localforage.getItem(getTableObjectKey(tableObject.TableId, tableObject.Uuid)) as DatabaseTableObject

			if (existingTableObject) {
				// Add all local properties from the existing table object
				for (let key of Object.keys(existingTableObject.Properties)) {
					if (tableObject.Properties[key]) continue
					if (typeof (existingTableObject.Properties[key]) != "object") continue
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

		if (typeof value == "object") {
			// value is of type TableObjectProperties
			tableObject.Properties[key] = value
		} else {
			// value is of type OldTableObjectProperties
			tableObject.Properties[key] = { value }
		}
	}

	return tableObject
}

export function ConvertDatabaseNotificationToNotification(notification: DatabaseNotification) {
	if (notification == null) return null

	return new Notification({
		Uuid: notification.Uuid,
		Time: notification.Time,
		Interval: notification.Interval,
		Title: notification.Title,
		Body: notification.Body,
		UploadStatus: notification.UploadStatus
	})
}
//#endregion