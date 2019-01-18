import * as Dav from '../Dav';
var axios = require('axios');
import { TableObject, TableObjectUploadStatus, ConvertIntToVisibility, ConvertObjectToMap, ConvertMapToObject, generateUUID } from '../models/TableObject';
import { Notification } from '../models/Notification';
import * as DatabaseOperations from './DatabaseOperations';
import * as platform from 'platform';

var isSyncing = false;
var syncAgain = true;

var isSyncingNotifications = false;
var syncNotificationsAgain = false;

//#region Data methods
export async function Sync(){
	if(isSyncing) return;
	if(!Dav.globals.jwt) return;
	isSyncing = true;

	for(let tableId of Dav.globals.tableIds){
		var removedTableObjectUuids: string[] = [];
		for(let tableObject of await DatabaseOperations.GetAllTableObjects(tableId, true)){
			removedTableObjectUuids.push(tableObject.Uuid);
		}

		var response = await axios.get(Dav.globals.apiBaseUrl + "apps/table/" + tableId, {
			headers: {'Authorization': Dav.globals.jwt}
		});
		
		var newTableObjects: TableObject[] = [];

		for(let obj of response.data.table_objects){
			var removeUuidIndex = removedTableObjectUuids.findIndex(uuid => uuid === obj.uuid);
			if(removeUuidIndex !== -1){
				removedTableObjectUuids.splice(removeUuidIndex, 1);
			}

			// Does the table object already exist?
			var tableObject = await DatabaseOperations.GetTableObject(obj["uuid"]);
			var getTableObject = false;

			if(tableObject){
				// Has the etag changed?
				if(tableObject.Etag != obj.etag){
					// the etag has changed, download the table object and save it in the database
					getTableObject = true;
				}
			}else{
				// Save the new table object
				getTableObject = true;
			}

			if(getTableObject){
				// Download the table object
				var newTableObject = await GetTableObjectFromServer(obj.uuid);

				if(newTableObject){
					newTableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
				
					if(tableObject){
						await DatabaseOperations.UpdateTableObject(newTableObject);
						Dav.globals.callbacks.UpdateTableObject(newTableObject);
					}else{
						newTableObjects.push(newTableObject);
					}
				}
			}
		}
		
		if(newTableObjects.length > 0){
			await DatabaseOperations.CreateTableObjects(newTableObjects);
			Dav.globals.callbacks.UpdateAllOfTable(tableId);
		}

		// Delete the tableObjects that are not on the server
		for(let uuid of removedTableObjectUuids){
			var tableObject = await DatabaseOperations.GetTableObject(uuid);

			if(tableObject.UploadStatus == TableObjectUploadStatus.New || 
				tableObject.UploadStatus == TableObjectUploadStatus.NoUpload ||
				tableObject.UploadStatus == TableObjectUploadStatus.Deleted){
				continue;
			}

			await DatabaseOperations.DeleteTableObjectImmediately(uuid);
			Dav.globals.callbacks.DeleteTableObject(tableObject);
		}
	}

	isSyncing = false;
	await SyncPush();
}

export async function SyncPush(){
	const okKey = "ok";
	const messageKey = "message";

	if(!Dav.globals.jwt) return;
	if(isSyncing){
		syncAgain = true;
		return;
	}
	isSyncing = true;
	
	// Get all table objects
	var tableObjects: TableObject[] = await DatabaseOperations.GetAllTableObjects(-1, true);
	var sortedTableObjects = tableObjects.filter(obj => obj.UploadStatus != TableObjectUploadStatus.UpToDate && 
													obj.UploadStatus != TableObjectUploadStatus.NoUpload).reverse();
	
	for(let tableObject of sortedTableObjects){
		switch (tableObject.UploadStatus) {
			case TableObjectUploadStatus.New:
				// Upload the table object
				var result = await CreateTableObjectOnServer(tableObject);

				if(result[okKey]){
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
					tableObject.Etag = result[messageKey].etag;
					await DatabaseOperations.UpdateTableObject(tableObject);
				}else if(result[messageKey]){
					// Check error codes
					var messageString = JSON.stringify(result[messageKey]);

					if(messageString.includes("2704")){		// Field already taken: uuid
						// Set the upload status to UpToDate
						tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
						await DatabaseOperations.UpdateTableObject(tableObject);
					}else{
						console.log(result[messageKey]);
					}
				}
				break;
			case TableObjectUploadStatus.Updated:
				// Update the table object
				var result = await UpdateTableObjectOnServer(tableObject);

				if(result[okKey]){
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
					tableObject.Etag = result[messageKey].etag;
					await DatabaseOperations.UpdateTableObject(tableObject);
				}else if(result[messageKey]){
					// Check error codes
					var messageString = JSON.stringify(result[messageKey]);

					if(messageString.includes("2805")){		// Resource does not exist: TableObject
						// Delete the table object locally
						await DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);
					}else{
						console.log(result[messageKey]);
					}
				}
				break;
			case TableObjectUploadStatus.Deleted:
				var result = await DeleteTableObjectOnServer(tableObject);

				if(result[okKey]){
					// Delete the table object
					await DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);
				}else if(result[messageKey]){
					// Check error codes
					var messageString = JSON.stringify(result[messageKey]);

					if(messageString.includes("2805")){		// Resource does not exist: TableObject
						await DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);
					}else if(messageString.includes("1102")){		// Action not allowed
						await DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);
					}else{
						console.log(result[messageKey]);
					}
				}
				break;
		}
	}

	isSyncing = false;

	if(syncAgain){
		syncAgain = false;
		await SyncPush();
	}
}

// Call this when the app receives a websocket notification of a created or updated table object
export async function UpdateLocalTableObject(uuid: string){
	// Get the table object from the server and update it locally
	var tableObject = await GetTableObjectFromServer(uuid);
	
	if(tableObject){
		tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
		await DatabaseOperations.UpdateTableObject(tableObject);
		Dav.globals.callbacks.UpdateTableObject(tableObject);
	}
}

// Call this when the app receives a websocket notification of a deleted table object
export async function DeleteLocalTableObject(uuid: string){
	// Remove the table object locally
	var tableObject = await DatabaseOperations.GetTableObject(uuid);
	if(tableObject){
		tableObject.DeleteImmediately();
		Dav.globals.callbacks.DeleteTableObject(tableObject)
	}
}

export async function SubscribePushNotifications(webPushPublicKey: string) : Promise<Boolean>{
	if('serviceWorker' in navigator && Dav.globals.production){
		// Check if the user is logged in
		if(!Dav.globals.jwt) return false;

		// Check if the user is already subscribed
		let oldSubscription = await DatabaseOperations.GetSubscription();
		if(oldSubscription){
			switch (oldSubscription.status) {
				case UploadStatus.New:
					await UpdateSubscriptionOnServer();
					return true;
				case UploadStatus.Deleted:
					// Set the subscription to upToDate
					oldSubscription.status = UploadStatus.UpToDate;
					await DatabaseOperations.SetSubscription(oldSubscription);
					return true;
				default:
					return true;
			}
		}

		let registration = await navigator.serviceWorker.getRegistration();
		let subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(webPushPublicKey)
		});

		let subscriptionJson = subscription.toJSON();
		let endpoint = subscription.endpoint;
		let p256dh = subscriptionJson.keys["p256dh"];
		let auth = subscriptionJson.keys["auth"];

		// Save the subscription in the database
		await DatabaseOperations.SetSubscription({
			uuid: generateUUID(),
			endpoint,
			p256dh,
			auth,
			status: UploadStatus.New
		});
		await UpdateSubscriptionOnServer();
		return true;
	}else{
		return false;
	}
}

export async function UnsubscribePushNotifications(){
	if(!Dav.globals.jwt) return;

	// Get the uuid from the database
	let subscription = await DatabaseOperations.GetSubscription();
	if(!subscription) return;

	// Change the status to Deleted and save it in the database
	subscription.status = UploadStatus.Deleted;
	await DatabaseOperations.SetSubscription(subscription);
	await UpdateSubscriptionOnServer();
}

export function CreateNotification(time: number, interval: number, properties: object) : string{
	// Save the new notification in the database
	let notification = new Notification(time, interval, properties, null, UploadStatus.New);
	notification.Save().then(() => {
		// Update the notifications on the server
		SyncPushNotifications();
	});

	return notification.Uuid;
}

export async function DeleteNotification(uuid: string){
	// Set the upload status of the notification to Deleted
	let notification = await DatabaseOperations.GetNotification(uuid);
	notification.Status = UploadStatus.Deleted;
	await notification.Save();

	SyncPushNotifications();
}

export async function SyncNotifications(){
	if(isSyncingNotifications) return;
	if(!Dav.globals.jwt) return;
	isSyncingNotifications = true;

	// Get all notifications from the database
	let removedNotifications = await DatabaseOperations.GetAllNotifications();

	// Get all notifications from the database
	let responseData: Array<{id: number,
									app_id: number,
									user_id: number,
									time: number,
									interval: number,
									uuid: string,
									properties: object }>;
	try{
		let response = await axios({
			method: 'get',
			url: Dav.globals.apiBaseUrl + "apps/notifications" + "?app_id=" + Dav.globals.appId,
			headers: { "Authorization": Dav.globals.jwt }
		});
		responseData = response.data["notifications"];
	}catch(error){
		return;
	}

	for(let notification of responseData){
		let uuid = notification.uuid;
		let time = notification.time;
		let interval = notification.interval;
		let properties = notification.properties;

		let n = await DatabaseOperations.GetNotification(uuid);

		if(!n){
			// Create a new notification
			n = new Notification(time, interval, properties, uuid);
			await n.Save();
		}else{
			// Update the old notification
			n.Time = time;
			n.Interval = interval;
			n.Properties = properties;
			n.Status = UploadStatus.UpToDate;
			await n.Save();

			// Remove the notification from the removedNotifications array
			let index = removedNotifications.findIndex(n => n.Uuid == uuid);
			if(index !== -1){
				removedNotifications.splice(index, 1);
			}
		}
	}

	// Delete the notifications in removedNotifications
	for(let notification of removedNotifications){
		if(notification.Status == UploadStatus.UpToDate){
			await DatabaseOperations.DeleteNotification(notification.Uuid);
		}
	}

	isSyncingNotifications = false;
	await SyncPushNotifications();
}

export async function SyncPushNotifications(){
	if(!Dav.globals.jwt) return;
	if(isSyncingNotifications){
		syncNotificationsAgain = true;
		return;
	}
	isSyncingNotifications = true;

	// Go through each notification and post or delete to the server if necessary
	let notifications = await DatabaseOperations.GetAllNotifications();

	for (let notification of notifications) {
		switch (notification.Status) {
			case UploadStatus.New:
				// Create the notification on the server
				try{
					await axios({
						method: 'post',
						url: Dav.globals.apiBaseUrl + "apps/notification"
									+ "?app_id=" + Dav.globals.appId
									+ "&time=" + notification.Time
									+ "&interval=" + notification.Interval,
						headers: {
							'Authorization': Dav.globals.jwt,
							'Content-Type': 'application/json'
						},
						data: notification.Properties
					});

					notification.Status = UploadStatus.UpToDate;
					await notification.Save();
				}catch(error){}
				break;
			case UploadStatus.Deleted:
				// Delete the notification on the server
				try{
					await axios({
						method: 'delete',
						url: Dav.globals.apiBaseUrl + "apps/notification/" + notification.Uuid,
						headers: { 'Authorization': Dav.globals.jwt }
					});

					// Remove the notification from the database
					await DatabaseOperations.DeleteNotification(notification.Uuid);
				}catch(error){
					if(error.response.data.errors[0][0] == "2812"){		// Resource does not exist: Notification
						// Delete the subscription locally
						await DatabaseOperations.RemoveSubscription();
					}
				}
				break;
		}
	}

	isSyncingNotifications = false;
	if(syncNotificationsAgain){
		syncNotificationsAgain = false;
		await SyncPushNotifications();
	}
}
//#endregion

//#region Api methods
export async function DownloadUserInformation(jwt: string){
	var url = Dav.globals.apiBaseUrl + "auth/user";

   var options = {
      headers: {
         "Authorization": jwt
      }
   }

   try{
      var response = await axios.get(url, options);
      if(response.status == 200){
         return {
            email: response.data.email,
            username: response.data.username,
            totalStorage: response.data.total_storage,
            usedStorage: response.data.used_storage,
            plan: response.data.plan,
            avatar: response.data.avatar,
            avatarEtag: response.data.avatar_etag,
            jwt: jwt
         }
      }else{
         return null;
      }
   }catch(error){
      return null;
   }
}

async function GetTableObjectFromServer(uuid: string): Promise<TableObject>{
	if(!Dav.globals.jwt) return null;

	try{
		var response = await axios.get(Dav.globals.apiBaseUrl + "apps/object/" + uuid, {
			headers: {'Authorization': Dav.globals.jwt}
		});

		var tableObject = new TableObject();
		tableObject.TableId = response.data.table_id;
		tableObject.IsFile = response.data.file;
		tableObject.Etag = response.data.etag;
		tableObject.Uuid = response.data.uuid;
		tableObject.Visibility = ConvertIntToVisibility(response.data.visibility);
		tableObject.Properties = ConvertObjectToMap(response.data.properties);

		return tableObject;
	}catch(error){
		console.log(error);
		return null;
	}
}

async function CreateTableObjectOnServer(tableObject: TableObject): Promise<object>{		// Return {ok: boolean, message: string}
	if(!Dav.globals.jwt) return {ok: false, message: null};

	try{
		var response = await axios({
			method: 'post',
			url: Dav.globals.apiBaseUrl + "apps/object",
			params: {
				table_id: tableObject.TableId,
				app_id: Dav.globals.appId,
				uuid: tableObject.Uuid
			},
			headers: {
				'Authorization': Dav.globals.jwt,
				'Content-Type': 'application/json'
			},
			data: JSON.stringify(ConvertMapToObject(tableObject.Properties))
		});

		return {ok: true, message: response.data};
	}catch(error){
		return {ok: false, message: error.response.data};
	}
}

async function UpdateTableObjectOnServer(tableObject: TableObject): Promise<object>{
	if(!Dav.globals.jwt) return {ok: false, message: null};

	try{
		var response = await axios({
			method: 'put',
			url: Dav.globals.apiBaseUrl + "apps/object/" + tableObject.Uuid,
			headers: {
				'Authorization': Dav.globals.jwt,
				'Content-Type': 'application/json'
			},
			data: JSON.stringify(ConvertMapToObject(tableObject.Properties))
		});

		return {ok: true, message: response.data};
	}catch(error){
		return {ok: false, message: error.response.data};
	}
}

async function DeleteTableObjectOnServer(tableObject: TableObject): Promise<object>{
	if(!Dav.globals.jwt) return {ok: false, message: null};

	try{
		var response = await axios({
			method: 'delete',
			url: Dav.globals.apiBaseUrl + "apps/object/" + tableObject.Uuid,
			headers: { 'Authorization': Dav.globals.jwt }
		});

		return {ok: true, message: response.data};
	}catch(error){
		return {ok: false, message: error.response.data};
	}
}

export async function UpdateSubscriptionOnServer(){
	// Get the subscription and update it on the server
	let subscription = await DatabaseOperations.GetSubscription();
	if(!subscription) return;

	switch (subscription.status) {
		case UploadStatus.New:
			// Create the subscription on the server
			try{
				await axios({
					method: 'post',
					url: Dav.globals.apiBaseUrl + "apps/subscription?uuid=" + subscription.uuid,
					headers: { 
						'Authorization': Dav.globals.jwt,
						'Content-Type': "application/json"
					},
					data: {
						endpoint: subscription.endpoint,
						p256dh: subscription.p256dh,
						auth: subscription.auth
					}
				});

				// Save the uuid of the subscription in database
				subscription.status = UploadStatus.UpToDate;
				await DatabaseOperations.SetSubscription(subscription);
				return true;
			}catch(error){
				console.log(error.response.data)
				return false;
			}
		case UploadStatus.Deleted:
			// Delete the subscription on the server
			try{
				await axios({
					method: 'delete',
					url: Dav.globals.apiBaseUrl + "apps/subscription/" + subscription.uuid,
					headers: { 'Authorization': Dav.globals.jwt }
				});

				// Remove the uuid from the database
				await DatabaseOperations.RemoveSubscription();
				return true;
			}catch(error){
				if(error.response.data.errors[0][0] == "2813"){		// Resource does not exist: WebPushSubscription
					// Delete the subscription locally
					await DatabaseOperations.RemoveSubscription();
				}
				return false;
			}
	}
}

export async function Log(apiKey: string, name: string){
	if(/bot|crawler|spider|crawling/i.test(navigator.userAgent)) return;

	var properties = {
		browser_name: platform.name,
		browser_version: platform.version,
		os_name: platform.os.family,
		os_version: platform.os.version
	}

	try{
		// Make request to backend
		await axios({
			method: 'post',
			url: Dav.globals.apiBaseUrl + "analytics/event",
			params: {
				api_key: apiKey,
				name: name,
				app_id: Dav.globals.appId,
				save_country: true
			},
			headers: {
				"Content-Type": "application/json"
			},
			data: JSON.stringify(properties)
		});
	}catch(error){
		console.log(error)
	}
}
//#endregion

export enum UploadStatus {
	// The object was created on the server
	UpToDate = 0,
	// The object was created, but it's still not saved on the server
	New = 1,
	// The object in on the server, but it was deleted locally and has to be deleted on the server
	Deleted = 2
}

//#region Helper methods
function urlBase64ToUint8Array(base64String) {
   const padding = '='.repeat((4 - base64String.length % 4) % 4);
   const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

   const rawData = window.atob(base64);
   const outputArray = new Uint8Array(rawData.length);

   for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
   }
   return outputArray;
}
//#endregion