import * as axios from 'axios';
import * as platform from 'platform';
import { Dav, startWebSocketConnection, webPushPublicKey } from '../Dav';
import { TableObject, TableObjectUploadStatus, generateUUID } from '../models/TableObject';
import { Notification } from '../models/Notification';
import * as DatabaseOperations from './DatabaseOperations';
import { DavEnvironment } from '../models/DavUser';
import { CreateEventLog } from './AnalyticsController';

var isSyncing = false;
var syncAgain = true;

var isSyncingNotifications = false;
var syncNotificationsAgain = false;

const maxFileDownloads = 2;								// The max count of files being downloaded simultaneously
var fileDownloads: Array<{ tableObject: TableObject, etag: string }> = [];			// This stores the tableObjects to download and the corresponding new etag
export var downloadingFiles: Array<string> = [];	// Contains the uuids of the TableObjects whose files are currently downloading
var fileDownloadsIntervalId: NodeJS.Timer;

//#region Data methods
export async function Sync() {
	if (isSyncing) return;

	if (!Dav.jwt) return;
	isSyncing = true;

	// Holds the table ids, e.g. 1, 2, 3, 4
	var tableIds = Dav.tableIds;
	// Holds the parallel table ids, e.g. 2, 3
	var parallelTableIds = Dav.parallelTableIds;
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

	if (!tableIds || !parallelTableIds) return;

	// Populate removedTableObjectUuids
	for (let tableId of tableIds) {
		removedTableObjectUuids.set(tableId, []);

		for (let tableObject of await DatabaseOperations.GetAllTableObjects(tableId, true)) {
			removedTableObjectUuids.get(tableId).push(tableObject.Uuid);
		}
	}

	// Get the first page of each table and generate the sorted tableIds list
	for (let tableId of tableIds) {
		// Get the first page of the table
		let tableGetResult = await HttpGet(`/apps/table/${tableId}?page=1`);

		tableGetResultsOkay.set(tableId, tableGetResult.ok);
		if (!tableGetResult.ok) continue;

		// Save the result
		let table = tableGetResult.message;
		tableResults.set(tableId, table);
		tablePages.set(tableId, tableResults.get(tableId)["pages"]);
		currentTablePages.set(tableId, 1);
	}

	sortedTableIds = SortTableIds(tableIds, parallelTableIds, tablePages);

	// Process the table results
	for (let tableId of sortedTableIds) {
		let tableObjects = tableResults.get(tableId)["table_objects"] as Array<object>;
		let tableChanged = false;

		if (!tableGetResultsOkay.get(tableId)) continue;

		// Get the objects of the table
		for (let obj of tableObjects) {
			// Remove the object from removedTableObjectUuids
			let index = removedTableObjectUuids.get(tableId).findIndex(uuid => uuid == obj["uuid"]);
			if (index !== -1) {
				removedTableObjectUuids.get(tableId).splice(index, 1);
			}

			// Is obj in the database?
			var currentTableObject = await DatabaseOperations.GetTableObject(obj["uuid"]);
			if (currentTableObject) {
				// Is the etag correct?
				if (obj["etag"] == currentTableObject.Etag) {
					// Is it a file?
					if (currentTableObject.IsFile) {
						// Was the file downloaded?
						if (!currentTableObject.File) {
							// Download the file
							fileDownloads.push({ tableObject: currentTableObject, etag: currentTableObject.Etag });
						}
					}
				} else {
					// GET the table object
					let tableObject = await GetTableObjectFromServer(currentTableObject.Uuid);
					if (!tableObject) continue;

					await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate);

					// Is it a file?
					if (tableObject.IsFile) {
						// Download the file and save the new etag
						fileDownloads.push({ tableObject: tableObject, etag: obj["etag"] });
					} else {
						Dav.callbacks.UpdateTableObject(tableObject);
						tableChanged = true;
					}
				}
			} else {
				// GET the table object
				let tableObject = await GetTableObjectFromServer(obj["uuid"]);
				if (!tableObject) continue;

				await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate);

				// Is it a file?
				if (tableObject.IsFile) {
					// Download the file and save the new etag
					fileDownloads.push({ tableObject: tableObject, etag: obj["etag"] });

					Dav.callbacks.UpdateTableObject(tableObject);
					tableChanged = true;
				} else {
					// Save the table object
					Dav.callbacks.UpdateTableObject(tableObject);
					tableChanged = true;
				}
			}
		}

		Dav.callbacks.UpdateAllOfTable(tableId, tableChanged);

		// Check if there is a next page
		currentTablePages[tableId]++;
		if (currentTablePages.get(tableId) > tablePages.get(tableId)) {
			continue;
		}

		// Get the data of the next page
		let tableGetResult = await HttpGet(`/apps/table/${tableId}?page=${currentTablePages.get(tableId)}`);
		if (!tableGetResult.ok) {
			tableGetResultsOkay.set(tableId, false);
			continue;
		}

		tableResults.set(tableId, tableGetResult.message);
	}

	// RemovedTableObjects now includes all objects that were deleted on the server but not locally
	// Delete those objects locally
	for (let tableId of tableIds) {
		if (!tableGetResultsOkay.get(tableId)) continue;
		let removedTableObjects = removedTableObjectUuids.get(tableId);
		let tableChanged = false;

		for (let objUuid of removedTableObjects) {
			let obj = await DatabaseOperations.GetTableObject(objUuid);
			if (!obj) continue;

			if (obj.UploadStatus == TableObjectUploadStatus.New && obj.IsFile) {
				continue;
			} else if (obj.UploadStatus == TableObjectUploadStatus.New
				|| obj.UploadStatus == TableObjectUploadStatus.NoUpload
				|| obj.UploadStatus == TableObjectUploadStatus.Deleted) {
				continue;
			}

			await obj.DeleteImmediately();
			Dav.callbacks.DeleteTableObject(obj);
			tableChanged = true;
		}

		Dav.callbacks.UpdateAllOfTable(tableId, tableChanged);
	}

	isSyncing = false;

	// Push changes
	await SyncPush();
	StartFileDownloads();

	// Check if all tables were synced
	let allTableGetResultsOkay = true;
	for (let value in tableGetResultsOkay.values()) {
		if (!value) {
			allTableGetResultsOkay = false;
			break;
		}
	}

	if (allTableGetResultsOkay) {
		Dav.callbacks.SyncFinished();
		startWebSocketConnection();
	}
}

export async function DownloadTableObject(uuid: string) {
	// Check if the table object is already in the database
	let obj = await DatabaseOperations.GetTableObject(uuid);
	if (obj) return;

	let tableObject = await GetTableObjectFromServer(uuid);
	if (!tableObject) return;

	await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate);

	if (tableObject.IsFile) {
		// Download the file
		if (await tableObject.DownloadFile()) {
			// Notify the app of the change
			Dav.callbacks.UpdateTableObject(tableObject, true);
		}
	} else {
		Dav.callbacks.UpdateTableObject(tableObject);
	}
}

function StartFileDownloads() {
	// Do not download more files than maxFileDownloads at the same time
	fileDownloadsIntervalId = setInterval(() => {
		DownloadNextFile();
	}, 5000);
}

async function DownloadNextFile() {
	// Check if fileDownloadsList length is greater than maxFileDownloads
	if (downloadingFiles.length < maxFileDownloads && fileDownloads.length > 0) {
		// Download the first file of the files to download
		let tableObject = fileDownloads[0].tableObject;
		let etag = fileDownloads[0].etag;

		// Remove the download from the fileDownloads
		fileDownloads.splice(0, 1);

		if (!tableObject.File) {
			if (await tableObject.DownloadFile()) {
				// Update the table object with the new etag
				await tableObject.SetEtag(etag);

				// Notify the app of the change
				Dav.callbacks.UpdateTableObject(tableObject, true);
			}
		}
	} else if (fileDownloads.length == 0) {
		// Stop the timer
		clearInterval(fileDownloadsIntervalId);
	}
}

export async function SyncPush() {
	if (!Dav.jwt) return;
	if (isSyncing) {
		syncAgain = true;
		return;
	}
	isSyncing = true;

	// Get all table objects
	var tableObjects: TableObject[] = await DatabaseOperations.GetAllTableObjects(-1, true);
	var sortedTableObjects = tableObjects.filter(obj =>
		obj.UploadStatus != TableObjectUploadStatus.UpToDate && obj.UploadStatus != TableObjectUploadStatus.NoUpload
	).reverse();

	for (let tableObject of sortedTableObjects) {
		switch (tableObject.UploadStatus) {
			case TableObjectUploadStatus.New:
				// Check if the TableObject is a file and if it can be uploaded
				if (tableObject.IsFile && tableObject.File) {
					let user = await DatabaseOperations.GetUser();

					if (user) {
						let usedStorage = user["usedStorage"];
						let totalStorage = user["totalStorage"];
						let fileSize = tableObject.File.size;

						if (usedStorage + fileSize > totalStorage && totalStorage != 0) {
							continue;
						}
					}
				}

				// Upload the table object
				var result = await CreateTableObjectOnServer(tableObject);

				if (result.ok) {
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
					tableObject.Etag = result.message.etag;
					await DatabaseOperations.SetTableObject(tableObject);
				} else if (result.message) {
					// Check error codes
					var messageString = JSON.stringify(result.message);

					if (messageString.includes("2704")) {		// Field already taken: uuid
						// Set the upload status to UpToDate
						tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
						await DatabaseOperations.SetTableObject(tableObject);
					} else {
						console.log(result.message);
					}
				}
				break;
			case TableObjectUploadStatus.Updated:
				// Update the table object
				var result = await UpdateTableObjectOnServer(tableObject);

				if (result.ok) {
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
					tableObject.Etag = result.message.etag;
					await DatabaseOperations.SetTableObject(tableObject, false);
				} else if (result.message) {
					// Check error codes
					var messageString = JSON.stringify(result.message);

					if (messageString.includes("2805")) {		// Resource does not exist: TableObject
						await DatabaseOperations.RemoveTableObject(tableObject.Uuid);
					} else {
						console.log(result.message);
					}
				}
				break;
			case TableObjectUploadStatus.Deleted:
				var result = await DeleteTableObjectOnServer(tableObject);

				if (result.ok) {
					// Delete the table object
					await DatabaseOperations.RemoveTableObject(tableObject.Uuid);
				} else if (result.message) {
					// Check error codes
					var messageString = JSON.stringify(result.message);

					if (
						messageString.includes("2805") ||	// Resource does not exist: TableObject
						messageString.includes("1102")		// Action not allowed
					) {
						await DatabaseOperations.RemoveTableObject(tableObject.Uuid);
					} else {
						console.log(result.message);
					}
				}
				break;
			case TableObjectUploadStatus.Removed:
				var result = await RemoveTableObjectOnServer(tableObject);

				if (result.ok) {
					// Delete the table object
					await DatabaseOperations.RemoveTableObject(tableObject.Uuid);
				} else if (result.message) {
					// Check error codes
					var messageString = JSON.stringify(result.message);

					if (
						messageString.includes("2805") ||	// Resource does not exist: TableObject
						messageString.includes("2819") ||	// Resource does not exist: TableObjectUserAccess
						messageString.includes("1102")		// Action not allowed
					) {
						await DatabaseOperations.RemoveTableObject(tableObject.Uuid);
					} else {
						console.log(result.message);
					}
				}
				break;
		}
	}

	isSyncing = false;

	if (syncAgain) {
		syncAgain = false;
		await SyncPush();
	}
}

// Call this when the app receives a websocket notification of a created or updated table object
export async function UpdateLocalTableObject(uuid: string) {
	// Get the table object from the server and update it locally
	var tableObject = await GetTableObjectFromServer(uuid);

	if (tableObject) {
		tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;

		await DatabaseOperations.SetTableObject(tableObject, false)

		Dav.callbacks.UpdateTableObject(tableObject);
	}
}

// Call this when the app receives a websocket notification of a deleted table object
export async function DeleteLocalTableObject(uuid: string) {
	// Remove the table object locally
	var tableObject = await DatabaseOperations.GetTableObject(uuid);
	if (tableObject) {
		await tableObject.DeleteImmediately();
		Dav.callbacks.DeleteTableObject(tableObject)
	}
}

export async function SubscribePushNotifications(): Promise<Boolean> {
	if (Dav.environment == DavEnvironment.Production && 'serviceWorker' in navigator && ('PushManager' in window)) {
		// Check if the user is logged in
		if (!Dav.jwt) return false;

		// Check if the user is already subscribed
		let oldSubscription = await DatabaseOperations.GetSubscription();
		if (oldSubscription) {
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
	} else {
		return false;
	}
}

export async function UnsubscribePushNotifications() {
	if (!Dav.jwt) return;

	// Get the uuid from the database
	let subscription = await DatabaseOperations.GetSubscription();
	if (!subscription) return;

	// Change the status to Deleted and save it in the database
	subscription.status = UploadStatus.Deleted;
	await DatabaseOperations.SetSubscription(subscription);
	await UpdateSubscriptionOnServer();
}

export async function CreateNotification(time: number, interval: number, properties: object): Promise<string> {
	if (!Dav.jwt) return;

	// Save the new notification in the database
	let notification = new Notification(time, interval, properties, null, UploadStatus.New);
	await notification.Save();

	// Update the notifications on the server
	Dav.environment == DavEnvironment.Test ? await SyncPushNotifications() : SyncPushNotifications();

	return notification.Uuid;
}

export async function GetNotification(uuid: string): Promise<{ time: number, interval: number, properties: object }> {
	if (!Dav.jwt) return null;

	let notification = await DatabaseOperations.GetNotification(uuid);
	if (notification) {
		return {
			time: notification.Time,
			interval: notification.Interval,
			properties: notification.Properties
		}
	} else {
		return null;
	}
}

export async function UpdateNotification(uuid: string, time: number, interval: number, properties: object) {
	if (!Dav.jwt) return;

	let notification = await DatabaseOperations.GetNotification(uuid);
	if (notification.Status == UploadStatus.UpToDate) {
		notification.Status = UploadStatus.Updated;
	}

	if (time) {
		notification.Time = time;
	}
	if (interval) {
		notification.Interval = interval;
	}
	if (properties) {
		notification.Properties = properties;
	}

	// Save the notification
	await notification.Save();
	Dav.environment == DavEnvironment.Test ? await SyncPushNotifications() : SyncPushNotifications();
}

export async function DeleteNotification(uuid: string) {
	if (!Dav.jwt) return;

	// Set the upload status of the notification to Deleted
	let notification = await DatabaseOperations.GetNotification(uuid);
	if (notification) {
		notification.Status = UploadStatus.Deleted;
		await notification.Save();
	}

	Dav.environment == DavEnvironment.Test ? await SyncPushNotifications() : SyncPushNotifications();
}

export async function DeleteNotificationImmediately(uuid: string) {
	// Delete the notification directly from the database
	await DatabaseOperations.DeleteNotification(uuid);
}

export async function SyncNotifications() {
	if (isSyncingNotifications) return;
	if (!Dav.jwt) return;
	isSyncingNotifications = true;

	// Get all notifications from the database
	let removedNotifications = await DatabaseOperations.GetAllNotifications();

	// Get all notifications from the database
	let responseData: Array<{
		id: number,
		app_id: number,
		user_id: number,
		time: number,
		interval: number,
		uuid: string,
		properties: object
	}>;
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/notifications?app_id=${Dav.appId}`,
			headers: { "Authorization": Dav.jwt }
		});
		responseData = response.data["notifications"];
	} catch (error) {
		return;
	}

	for (let notification of responseData) {
		let uuid = notification.uuid;
		let time = notification.time;
		let interval = notification.interval;
		let properties = notification.properties;

		let n = await DatabaseOperations.GetNotification(uuid);

		if (!n) {
			// Create a new notification
			n = new Notification(time, interval, properties, uuid);
			await n.Save();
		} else {
			// Update the old notification
			n.Time = time;
			n.Interval = interval;
			n.Properties = properties;
			n.Status = UploadStatus.UpToDate;
			await n.Save();

			// Remove the notification from the removedNotifications array
			let index = removedNotifications.findIndex(n => n.Uuid == uuid);
			if (index !== -1) {
				removedNotifications.splice(index, 1);
			}
		}
	}

	// Delete the notifications in removedNotifications
	for (let notification of removedNotifications) {
		if (notification.Status == UploadStatus.UpToDate) {
			await DatabaseOperations.DeleteNotification(notification.Uuid);
		}
	}

	isSyncingNotifications = false;
	await SyncPushNotifications();
}

export async function SyncPushNotifications() {
	if (!Dav.jwt) return;
	if (isSyncingNotifications) {
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
				try {
					await axios.default({
						method: 'post',
						url: `${Dav.apiBaseUrl}/apps/notification`,
						params: {
							app_id: Dav.appId,
							uuid: notification.Uuid,
							time: notification.Time,
							interval: notification.Interval
						},
						headers: {
							'Authorization': Dav.jwt,
							'Content-Type': 'application/json'
						},
						data: notification.Properties
					});

					notification.Status = UploadStatus.UpToDate;
					await notification.Save();
				} catch (error) { }
				break;
			case UploadStatus.Updated:
				// Update the notification on the server
				try {
					await axios.default({
						method: 'put',
						url: `${Dav.apiBaseUrl}/apps/notification/${notification.Uuid}`,
						params: {
							time: notification.Time,
							interval: notification.Interval
						},
						headers: {
							'Authorization': Dav.jwt,
							'Content-Type': 'application/json'
						},
						data: notification.Properties
					});

					notification.Status = UploadStatus.UpToDate;
					await notification.Save();
				} catch (error) {
					if (error.response.data.errors[0][0] == "2812") {		// Resource does not exist: Notification
						// Delete the notification locally
						await DatabaseOperations.DeleteNotification(notification.Uuid);
					} else {
						console.log(error.response.data)
					}
				}
				break;
			case UploadStatus.Deleted:
				// Delete the notification on the server
				try {
					await axios.default({
						method: 'delete',
						url: `${Dav.apiBaseUrl}/apps/notification/${notification.Uuid}`,
						headers: { 'Authorization': Dav.jwt }
					});

					// Remove the notification from the database
					await DatabaseOperations.DeleteNotification(notification.Uuid);
				} catch (error) {
					if (error.response.data.errors[0][0] == "2812") {		// Resource does not exist: Notification
						// Delete the notification locally
						await DatabaseOperations.DeleteNotification(notification.Uuid);
					} else {
						console.log(error.response.data)
					}
				}
				break;
		}
	}

	isSyncingNotifications = false;
	if (syncNotificationsAgain) {
		syncNotificationsAgain = false;
		await SyncPushNotifications();
	}
}
//#endregion

//#region Api methods
export async function DownloadUserInformation(jwt: string): Promise<{ success: boolean, logout: boolean, data: any }> {
	var url = `${Dav.apiBaseUrl}/auth/user`;

	try {
		let response = await axios.default({
			method: 'get',
			url,
			headers: {
				"Authorization": jwt
			}
		});

		if (response.status == 200) {
			return {
				success: true,
				logout: false,
				data: {
					id: response.data.id,
					email: response.data.email,
					username: response.data.username,
					totalStorage: response.data.total_storage,
					usedStorage: response.data.used_storage,
					plan: response.data.plan,
					avatar: response.data.avatar,
					avatarEtag: response.data.avatar_etag,
					confirmed: response.data.confirmed,
					subscriptionStatus: response.data.subscription_status,
					periodEnd: response.data.period_end,
					stripeCustomerId: response.data.stripe_customer_id,
					dev: response.data.dev,
					provider: response.data.provider,
					apps: response.data.apps,
					jwt: jwt
				}
			}
		} else {
			return {
				success: false,
				logout: false,
				data: null
			}
		}
	} catch (error) {
		return {
			success: false,
			logout: error.response.status == 404 && error.response.data.errors[0][0] == 2814,	// Session does not exist
			data: null
		}
	}
}

export async function GetTableObjectFromServer(uuid: string): Promise<TableObject> {
	if (!Dav.jwt) return null;

	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/object/${uuid}`,
			headers: {
				Authorization: Dav.jwt
			}
		});

		var tableObject = new TableObject();
		tableObject.TableId = response.data.table_id;
		tableObject.IsFile = response.data.file;
		tableObject.Etag = response.data.etag;
		tableObject.Uuid = response.data.uuid;

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return tableObject;
	} catch (error) {
		return null;
	}
}

async function CreateTableObjectOnServer(tableObject: TableObject): Promise<{ ok: boolean, message: any }> {		// Return {ok: boolean, message: string}
	if (!Dav.jwt) return { ok: false, message: null };
	if (tableObject.IsFile && tableObject.File == null) return { ok: false, message: null };

	try {
		let response;
		if (tableObject.IsFile) {
			let ext = tableObject.GetPropertyValue('ext');

			// Get the binary data from the file
			let readFilePromise: Promise<ProgressEvent> = new Promise((resolve, reject) => {
				let fileReader = new FileReader();
				fileReader.onloadend = resolve;
				fileReader.readAsArrayBuffer(tableObject.File);
			});
			var result: ProgressEvent = await readFilePromise;

			response = await axios.default({
				method: 'post',
				url: `${Dav.apiBaseUrl}/apps/object`,
				params: {
					table_id: tableObject.TableId,
					app_id: Dav.appId,
					uuid: tableObject.Uuid,
					ext: ext
				},
				headers: {
					Authorization: Dav.jwt,
					'Content-Type': tableObject.File.type
				},
				data: result.currentTarget["result"]
			});
		} else {
			let properties = {}
			for (let key of Object.keys(tableObject.Properties)) {
				let property = tableObject.Properties[key]
				if (property.local) continue

				properties[key] = property.value
			}

			response = await axios.default({
				method: 'post',
				url: `${Dav.apiBaseUrl}/apps/object`,
				params: {
					table_id: tableObject.TableId,
					app_id: Dav.appId,
					uuid: tableObject.Uuid
				},
				headers: {
					Authorization: Dav.jwt,
					'Content-Type': 'application/json'
				},
				data: JSON.stringify(properties)
			});
		}

		return { ok: true, message: response.data };
	} catch (error) {
		return { ok: false, message: error.response.data };
	}
}

async function UpdateTableObjectOnServer(tableObject: TableObject): Promise<{ ok: boolean, message: any }> {
	if (!Dav.jwt) return { ok: false, message: null };
	if (tableObject.IsFile && tableObject.File == null) return { ok: false, message: null };

	try {
		let response;
		if (tableObject.IsFile) {
			let ext = tableObject.GetPropertyValue('ext');

			// Get the binary data from the file
			let readFilePromise: Promise<ProgressEvent> = new Promise((resolve, reject) => {
				let fileReader = new FileReader();
				fileReader.onloadend = resolve;
				fileReader.readAsArrayBuffer(tableObject.File);
			});
			var result: ProgressEvent = await readFilePromise;

			response = await axios.default({
				method: 'put',
				url: `${Dav.apiBaseUrl}/apps/object/${tableObject.Uuid}`,
				params: {
					ext: ext
				},
				headers: {
					Authorization: Dav.jwt,
					'Content-Type': tableObject.File.type
				},
				data: result.currentTarget["result"]
			});
		} else {
			let properties = {}
			for (let key of Object.keys(tableObject.Properties)) {
				let property = tableObject.Properties[key]
				if (property.local) continue

				properties[key] = property.value
			}

			response = await axios.default({
				method: 'put',
				url: `${Dav.apiBaseUrl}/apps/object/${tableObject.Uuid}`,
				headers: {
					Authorization: Dav.jwt,
					'Content-Type': 'application/json'
				},
				data: JSON.stringify(properties)
			});
		}

		return { ok: true, message: response.data };
	} catch (error) {
		return { ok: false, message: error.response.data };
	}
}

async function DeleteTableObjectOnServer(tableObject: TableObject): Promise<{ ok: boolean, message: any }> {
	if (!Dav.jwt) return { ok: false, message: null };

	try {
		var response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/apps/object/${tableObject.Uuid}`,
			headers: {
				Authorization: Dav.jwt
			}
		});

		return { ok: true, message: response.data };
	} catch (error) {
		return { ok: false, message: error.response.data };
	}
}

async function RemoveTableObjectOnServer(tableObject: TableObject): Promise<{ ok: boolean, message: any }> {
	if (!Dav.jwt) return { ok: false, message: null };

	try {
		var response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/apps/object/${tableObject.Uuid}/access`,
			headers: {
				Authorization: Dav.jwt
			}
		});

		return { ok: true, message: response.data };
	} catch (error) {
		return { ok: false, message: error.response.data };
	}
}

export async function UpdateSubscriptionOnServer() {
	// Get the subscription and update it on the server
	let subscription = await DatabaseOperations.GetSubscription();
	if (!subscription) return;

	switch (subscription.status) {
		case UploadStatus.New:
			// Create the subscription on the server
			try {
				await axios.default({
					method: 'post',
					url: `${Dav.apiBaseUrl}/apps/subscription`,
					params: {
						uuid: subscription.uuid
					},
					headers: {
						'Authorization': Dav.jwt,
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
			} catch (error) {
				console.log(error.response.data)
				return false;
			}
		case UploadStatus.Deleted:
			// Delete the subscription on the server
			try {
				await axios.default({
					method: 'delete',
					url: `${Dav.apiBaseUrl}/apps/subscription/${subscription.uuid}`,
					headers: { 'Authorization': Dav.jwt }
				});

				// Remove the uuid from the database
				await DatabaseOperations.RemoveSubscription();
				return true;
			} catch (error) {
				if (error.response.data.errors[0][0] == "2813") {		// Resource does not exist: WebPushSubscription
					// Delete the subscription locally
					await DatabaseOperations.RemoveSubscription();
				}
				return false;
			}
	}
}

export async function Log(apiKey: string, name: string) {
	if (/bot|crawler|spider|crawling/i.test(navigator.userAgent)) return;

	// Create event log on the server
	await CreateEventLog(
		apiKey,
		Dav.appId,
		name,
		platform.os.family,
		platform.os.version,
		platform.name,
		platform.version
	)
}

export async function DeleteSessionOnServer(jwt: string) {
	// Return if the jwt is a normal jwt
	if (!jwt || !jwt.split('.')[3]) return;

	try {
		await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/auth/session`,
			headers: { 'Authorization': jwt }
		});
	} catch (error) { }
}
//#endregion

export function SortTableIds(tableIds: Array<number>, parallelTableIds: Array<number>, tableIdPages: Map<number, number>): Array<number> {
	var preparedTableIds: Array<number> = [];

	// Remove all table ids in parallelTableIds that do not occur in tableIds
	let removeParallelTableIds: Array<number> = [];
	for (let i = 0; i < parallelTableIds.length; i++) {
		let value = parallelTableIds[i];
		if (tableIds.indexOf(value) == -1) {
			removeParallelTableIds.push(value);
		}
	}

	for (let tableId of removeParallelTableIds) {
		let index = parallelTableIds.indexOf(tableId);
		if (index !== -1) {
			parallelTableIds.splice(index, 1);
		}
	}

	// Prepare pagesOfParallelTable
	var pagesOfParallelTable: Map<number, number> = new Map<number, number>();
	for (let [key, value] of tableIdPages) {
		if (parallelTableIds.indexOf(key) !== -1) {
			pagesOfParallelTable.set(key, value);
		}
	}

	// Count the pages
	let pagesSum = 0;
	for (let [key, value] of tableIdPages) {
		pagesSum += value;

		if (parallelTableIds.indexOf(key) !== -1) {
			pagesOfParallelTable.set(key, value - 1);
		}
	}

	let index = 0;
	let currentTableIdIndex = 0;
	let parallelTableIdsInserted = false;

	while (index < pagesSum) {
		let currentTableId = tableIds[currentTableIdIndex];
		let currentTablePages = tableIdPages.get(currentTableId);

		if (parallelTableIds.indexOf(currentTableId) !== -1) {
			// Add the table id once as it belongs to parallel table ids
			preparedTableIds.push(currentTableId);
			index++;
		} else {
			// Add it for all pages
			for (let j = 0; j < currentTablePages; j++) {
				preparedTableIds.push(currentTableId);
				index++;
			}
		}

		// Check if all parallel table ids are in prepared table ids
		let hasAll = true;
		for (let tableId of parallelTableIds) {
			if (preparedTableIds.indexOf(tableId) == -1) {
				hasAll = false;
			}
		}

		if (hasAll && !parallelTableIdsInserted) {
			parallelTableIdsInserted = true;
			let pagesOfParallelTableSum = 0;

			// Update pagesOfParallelTableSum
			for (let [key, value] of pagesOfParallelTable) {
				pagesOfParallelTableSum += value;
			}

			// Append the parallel table ids in the right order
			while (pagesOfParallelTableSum > 0) {
				for (let parallelTableId of parallelTableIds) {
					if (pagesOfParallelTable.get(parallelTableId) > 0) {
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
async function HttpGet(url: string): Promise<{ ok: boolean, message: object }> {
	try {
		let response = await axios.default({
			method: 'get',
			url: Dav.apiBaseUrl + url,
			headers: {
				'Authorization': Dav.jwt
			}
		});

		return { ok: true, message: response.data };
	} catch (error) {
		return { ok: false, message: error.response ? error.response.data : "" };
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