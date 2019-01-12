import * as Dav from '../Dav';
var axios = require('axios');
import { TableObject, TableObjectUploadStatus, ConvertIntToVisibility, ConvertObjectToMap, ConvertMapToObject, generateUUID } from '../models/TableObject';
import * as DatabaseOperations from './DatabaseOperations';
import * as platform from 'platform';

var syncing = false;
var syncAgain = true;
var syncPull = false;

//#region Data methods
export async function Sync(){
	if(syncPull) return;
	if(!Dav.globals.jwt) return;

	syncPull = true;

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

	syncPull = false;
	await SyncPush();
}

export async function SyncPush(){
	const okKey = "ok";
	const messageKey = "message";

	if(!Dav.globals.jwt) return;
	if(syncing){
		syncAgain = true;
		return;
	}
	syncing = true;
	
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

	syncing = false;

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
      console.log(error);
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

export async function SubscribePushNotifications(webPushPublicKey: string) : Promise<Boolean>{
	if('serviceWorker' in navigator && Dav.globals.production){
		// Check if the user is logged in
		if(!Dav.globals.jwt) return false;

		// Check if the user is already subscribed
		let oldSubscription = await DatabaseOperations.GetSubscription();
		if(oldSubscription){
			switch (oldSubscription.status) {
				case DatabaseOperations.SubscriptionStatus.New:
					await UpdateSubscriptionOnServer();
					return true;
				case DatabaseOperations.SubscriptionStatus.Deleted:
					// Set the subscription to upToDate
					oldSubscription.status = DatabaseOperations.SubscriptionStatus.UpToDate;
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
			status: DatabaseOperations.SubscriptionStatus.New
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
	subscription.status = DatabaseOperations.SubscriptionStatus.Deleted;
	await DatabaseOperations.SetSubscription(subscription);
	await UpdateSubscriptionOnServer();
}

export async function UpdateSubscriptionOnServer(){
	// Get the subscription and update it on the server
	let subscription = await DatabaseOperations.GetSubscription();
	if(!subscription) return;

	switch (subscription.status) {
		case DatabaseOperations.SubscriptionStatus.New:
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
				subscription.status = DatabaseOperations.SubscriptionStatus.UpToDate;
				await DatabaseOperations.SetSubscription(subscription);
				return true;
			}catch(error){
				console.log(error.response.data)
				return false;
			}
		case DatabaseOperations.SubscriptionStatus.Deleted:
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
//#endregion

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