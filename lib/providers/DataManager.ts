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

	var jwt = Dav.globals.jwt;
	if(!jwt) return;
	isSyncing = true;

	// Holds the table ids, e.g. 1, 2, 3, 4
	var tableIds = Dav.globals.tableIds;
	// Holds the parallel table ids, e.g. 2, 3
	var parallelTableIds = Dav.globals.parallelTableIds;
	// Holds the order of the table ids, sorted by the pages and the parallel table ids, e.g. 1, 2, 3, 2, 3, 4
	var sortedTableIds: Array<number> = [];
	// Holds the pages of the table; in the format <tableId, pages>
	var tablePages: Map<number, number> = new Map<number, number>();
	// Holds the last downloaded page; in the format <tableId, pages>
	var currentTablePages: Map<number, number> = new Map<number, number>();
	// Holds the latest table result; in the format <tableId, tableData>
	var tableResults: Map<number, object> = new Map<number, object>();
	// Holds the uuids of the table objects that were removed on the server but not locally; in the format <tableId, Array<string>>
	var removedTableObjectUuids: Map<number, Array<string>> = new Map<number, Array<string>>();
	// Is true if all http calls of the specified table are successful; in the format <tableId, Boolean>
	var tableGetResultsOkay: Map<number, boolean> = new Map<number, boolean>();

	if(!tableIds || !parallelTableIds) return;

	// Populate removedTableObjectUuids
	for(let tableId of tableIds){
		removedTableObjectUuids.set(tableId, []);

		for(let tableObject of await DatabaseOperations.GetAllTableObjects(tableId, true)){
			removedTableObjectUuids.get(tableId).push(tableObject.Uuid);
		}
	}

	// Get the first page of each table and generate the sorted tableIds list
	for(let tableId of tableIds){
		// Get the first page of the table
		let tableGetResult = await HttpGet(`apps/table/${tableId}?page=1`);

		tableGetResultsOkay.set(tableId, tableGetResult.ok);
		if(!tableGetResult.ok) continue;

		// Save the result
		let table = tableGetResult.message;
		tableResults.set(tableId, table);
		tablePages.set(tableId, tableResults.get(tableId)["pages"]);
		currentTablePages.set(tableId, 1);
	}

	sortedTableIds = SortTableIds(tableIds, parallelTableIds, tablePages);

	// Process the table results
	for(let tableId of sortedTableIds){
		let tableObjects = tableResults.get(tableId)["table_objects"] as Array<object>;
		let tableChanged = false;

		if(!tableGetResultsOkay.get(tableId)) continue;

		// Get the objects of the table
		for(let obj of tableObjects){
			// Remove the object from removedTableObjectUuids
			let index = removedTableObjectUuids.get(tableId).findIndex(uuid => uuid == obj["uuid"]);
			if(index !== -1){
				removedTableObjectUuids.get(tableId).splice(index);
			}

			// Is obj in the database?
			var currentTableObject = await DatabaseOperations.GetTableObject(obj["uuid"]);
			if(currentTableObject){
				// Is the etag correct?
				if(obj["etag"] == currentTableObject.Etag){
					// Is it a file?
					if(currentTableObject.IsFile){
						// Was the file downloaded?
						// TODO
					}
				}else{
					// GET the table object
					let tableObject = await GetTableObjectFromServer(currentTableObject.Uuid);
					if(!tableObject) continue;

					await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate);

					// Is it a file?
					if(tableObject.IsFile){
						// Remove all properties except ext
						for(let [key, value] of tableObject.Properties){
							if(key != Dav.extPropertyName){
								// Remove the property
								await tableObject.RemoveProperty(key);
							}
						}

						// Download the file
						// TODO
					}else{
						Dav.globals.callbacks.UpdateTableObject(tableObject);
						tableChanged = true;
					}
				}
			}else{
				// GET the table object
				let tableObject = await GetTableObjectFromServer(obj["uuid"]);
				if(!tableObject) continue;

				// Is it a file?
				if(tableObject.IsFile){
					let etag = tableObject.Etag;

					// Remove all properties except ext
					for(let [key, value] of tableObject.Properties){
						if(key != Dav.extPropertyName){
							// Remove the property
							await tableObject.RemoveProperty(key);
						}
					}

					// Save the table object without properties and etag (the etag will be saved later when the file was downloaded)
					tableObject.Etag = "";
					await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate);

					// Download the file
					// TODO

					Dav.globals.callbacks.UpdateTableObject(tableObject);
					tableChanged = true;
				}else{
					// Save the table object
					await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate);
					Dav.globals.callbacks.UpdateTableObject(tableObject);
					tableChanged = true;
				}
			}
		}

		if(tableChanged){
			Dav.globals.callbacks.UpdateAllOfTable(tableId);
		}

		// Check if there is a next page
		currentTablePages[tableId]++;
		if(currentTablePages.get(tableId) > tablePages.get(tableId)){
			continue;
		}

		// Get the data of the next page
		let tableGetResult = await HttpGet(`apps/table/${tableId}?page=${currentTablePages.get(tableId)}`);
		if(!tableGetResult.ok){
			tableGetResultsOkay.set(tableId, false);
			continue;
		}

		tableResults.set(tableId, tableGetResult.message);
	}

	// RemovedTableObjects now includes all objects that were deleted on the server but not locally
	// Delete those objects locally
	for(let tableId of tableIds){
		if(!tableGetResultsOkay.get(tableId)) continue;
		let removedTableObjects = removedTableObjectUuids.get(tableId);
		let tableChanged = false;

		for(let objUuid of removedTableObjects){
			let obj = await DatabaseOperations.GetTableObject(objUuid);
			if(!obj) continue;

			if(obj.UploadStatus == TableObjectUploadStatus.New && obj.IsFile){
				// TODO
			}else if(obj.UploadStatus == TableObjectUploadStatus.New
						|| obj.UploadStatus == TableObjectUploadStatus.NoUpload
						|| obj.UploadStatus == TableObjectUploadStatus.Deleted){
				continue;
			}

			await obj.DeleteImmediately();
			Dav.globals.callbacks.DeleteTableObject(obj);
			tableChanged = true;
		}

		if(tableChanged){
			Dav.globals.callbacks.UpdateAllOfTable(tableId);
		}
	}

	isSyncing = false;

	// Push changes
	await SyncPush();
	// TODO Start downloading files
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

		// Check if the table object is already saved in the database
		if(await DatabaseOperations.TableObjectExists(tableObject.Uuid)){
			await DatabaseOperations.UpdateTableObject(tableObject);
		}else{
			await DatabaseOperations.CreateTableObject(tableObject);
		}

		Dav.globals.callbacks.UpdateTableObject(tableObject);
	}
}

// Call this when the app receives a websocket notification of a deleted table object
export async function DeleteLocalTableObject(uuid: string){
	// Remove the table object locally
	var tableObject = await DatabaseOperations.GetTableObject(uuid);
	if(tableObject){
		await tableObject.DeleteImmediately();
		Dav.globals.callbacks.DeleteTableObject(tableObject)
	}
}

export async function SubscribePushNotifications() : Promise<Boolean>{
	if(Dav.globals.production && 'serviceWorker' in navigator && ('PushManager' in window)){
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
			applicationServerKey: urlBase64ToUint8Array(Dav.webPushPublicKey)
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

export async function CreateNotification(time: number, interval: number, properties: object) : Promise<string>{
	if(!Dav.globals.jwt) return;

	// Save the new notification in the database
	let notification = new Notification(time, interval, properties, null, UploadStatus.New);
	await notification.Save();

	// Update the notifications on the server
	await SyncPushNotifications();

	return notification.Uuid;
}

export async function GetNotification(uuid: string) : Promise<{time: number, interval: number, properties: object}>{
	if(!Dav.globals.jwt) return null;

	let notification = await DatabaseOperations.GetNotification(uuid);
	if(notification){
		return {
			time: notification.Time,
			interval: notification.Interval,
			properties: notification.Properties
		}
	}else{
		return null;
	}
}

export async function UpdateNotification(uuid: string, time: number, interval: number, properties: object){
	if(!Dav.globals.jwt) return;

	let notification = await DatabaseOperations.GetNotification(uuid);
	if(notification.Status == UploadStatus.UpToDate){
		notification.Status = UploadStatus.Updated;
	}

	if(time){
		notification.Time = time;
	}
	if(interval){
		notification.Interval = interval;
	}
	if(properties){
		notification.Properties = properties;
	}

	// Save the notification
	await notification.Save();
	await SyncPushNotifications();
}

export async function DeleteNotification(uuid: string){
	if(!Dav.globals.jwt) return;

	// Set the upload status of the notification to Deleted
	let notification = await DatabaseOperations.GetNotification(uuid);
	notification.Status = UploadStatus.Deleted;
	await notification.Save();

	await SyncPushNotifications();
}

export async function DeleteNotificationImmediately(uuid: string){
	// Delete the notification directly from the database
	await DatabaseOperations.DeleteNotification(uuid);
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
									+ "&uuid=" + notification.Uuid
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
			case UploadStatus.Updated:
				// Update the notification on the server
				try{
					await axios({
						method: 'put',
						url: `${Dav.globals.apiBaseUrl}apps/notification/${notification.Uuid}?time=${notification.Time}&interval=${notification.Interval}`,
						headers: {
							'Authorization': Dav.globals.jwt,
							'Content-Type': 'application/json'
						},
						data: notification.Properties
					});

					notification.Status = UploadStatus.UpToDate;
					await notification.Save();
				}catch(error){
					if(error.response.data.errors[0][0] == "2812"){		// Resource does not exist: Notification
						// Delete the notification locally
						await DatabaseOperations.DeleteNotification(notification.Uuid);
					}else{
						console.log(error.response.data)
					}
				}
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
						// Delete the notification locally
						await DatabaseOperations.DeleteNotification(notification.Uuid);
					}else{
						console.log(error.response.data)
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

export function SortTableIds(tableIds: Array<number>, parallelTableIds: Array<number>, tableIdPages: Map<number, number>) : Array<number>{
	var preparedTableIds: Array<number> = [];

	// Remove all table ids in parallelTableIds that do not occur in tableIds
	let removeParallelTableIds: Array<number> = [];
	for(let i = 0; i < parallelTableIds.length; i++){
		let value = parallelTableIds[i];
		if(tableIds.indexOf(value) == -1){
			removeParallelTableIds.push(value);
		}
	}
	
	for(let tableId of removeParallelTableIds){
		let index = parallelTableIds.indexOf(tableId);
		if(index !== -1){
			parallelTableIds.splice(index, 1);
		}
	}
	
	// Prepare pagesOfParallelTable
	var pagesOfParallelTable: Map<number, number> = new Map<number, number>();
	for(let [key, value] of tableIdPages){
		if(parallelTableIds.indexOf(key) !== -1){
			pagesOfParallelTable.set(key, value);
		}
	}
	
	// Count the pages
	let pagesSum = 0;
	for(let [key, value] of tableIdPages){
		pagesSum += value;

		if(parallelTableIds.indexOf(key) !== -1){
			pagesOfParallelTable.set(key, value - 1);
		}
	}
	
	let index = 0;
	let currentTableIdIndex = 0;
	let parallelTableIdsInserted = false;

	while (index < pagesSum) {
		let currentTableId = tableIds[currentTableIdIndex];
		let currentTablePages = tableIdPages.get(currentTableId);

		if(parallelTableIds.indexOf(currentTableId) !== -1){
			// Add the table id once as it belongs to parallel table ids
			preparedTableIds.push(currentTableId);
			index++;
		}else{
			// Add it for all pages
			for(let j = 0; j < currentTablePages; j++){
				preparedTableIds.push(currentTableId);
				index++;
			}
		}

		// Check if all parallel table ids are in prepared table ids
		let hasAll = true;
		for(let tableId of parallelTableIds){
			if(preparedTableIds.indexOf(tableId) == -1){
				hasAll = false;
			}
		}

		if(hasAll && !parallelTableIdsInserted){
			parallelTableIdsInserted = true;
			let pagesOfParallelTableSum = 0;

			// Update pagesOfParallelTableSum
			for(let [key, value] of pagesOfParallelTable){
				pagesOfParallelTableSum += value;
			}

			// Append the parallel table ids in the right order
			while(pagesOfParallelTableSum > 0){
				for(let parallelTableId of parallelTableIds){
					if(pagesOfParallelTable.get(parallelTableId) > 0){
						preparedTableIds.push(parallelTableId);
						pagesOfParallelTableSum--;
						
						let oldPages = pagesOfParallelTable.get(parallelTableId);
						pagesOfParallelTable.set(parallelTableId, oldPages - 1);

						index++;
					}
				}
			}
		}

		currentTableIdIndex++;
	}

	return preparedTableIds;
}

export enum UploadStatus {
	// The object was created on the server
	UpToDate = 0,
	// The object was created, but it's still not saved on the server
	New = 1,
	// The object was created on the server, but some values changed
	Updated = 2,
	// The object in on the server, but it was deleted locally and has to be deleted on the server
	Deleted = 3
}

//#region Helper methods
async function HttpGet(url: string) : Promise<{ ok: boolean, message: object }>{
	try{
		let response = await axios({
			method: 'get',
			url: Dav.globals.apiBaseUrl + url,
			headers: {
				'Authorization': Dav.globals.jwt
			}
		});

		return { ok: true, message: response.data };
	}catch(error){
		return { ok: false, message: error.response.data };
	}
}

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