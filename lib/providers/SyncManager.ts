import CryptoJS from "crypto-js"
import { Dav } from "../Dav.js"
import {
	ApiErrorResponse,
	ApiResponse,
	Environment,
	DatabaseUser,
	SessionUploadStatus,
	TableObjectUploadStatus
} from "../types.js"
import {
	SortTableIds,
	BlobToBase64,
	GetBlobData,
	isSuccessStatusCode
} from "../utils.js"
import {
	defaultProfileImageUrl,
	profileImageBaseUrl,
	extPropertyName,
	tableObjectUpdateChannelName,
	maxPropertiesUploadCount
} from "../constants.js"
import * as ErrorCodes from "../errorCodes.js"
import { TableObject } from "../models/TableObject.js"
import * as DatabaseOperations from "./DatabaseOperations.js"
import {
	retrieveUser,
	GetProfileImageOfUser
} from "../controllers/UsersController.js"
import {
	GetTable,
	GetTableResponseData
} from "../controllers/TablesController.js"
import {
	CreateTableObject,
	GetTableObject,
	UpdateTableObject,
	DeleteTableObject,
	SetTableObjectFile,
	RemoveTableObject,
	TableObjectResponseData
} from "../controllers/TableObjectsController.js"
import {
	CreateWebsocketConnection,
	WebsocketConnectionResponseData
} from "../controllers/WebsocketConnectionsController.js"
import * as SessionsController from "../controllers/SessionsController.js"

var isSyncing = false
var syncAgain = false
var syncCompleted = false
var webSocket: WebSocket
var websocketConnectionEstablished = false

// Stores the table objects to download with the new etag
var fileDownloads: Array<{ uuid: string; etag?: string }> = []
var downloadingFiles: boolean = false
export var downloadingFileUuid: string

export async function InitServiceWorker() {
	if (
		!("serviceWorker" in navigator) ||
		Dav.environment != Environment.Production
	) {
		return
	}

	await navigator.serviceWorker.ready
	if (navigator.serviceWorker.controller == null) return

	navigator.serviceWorker.controller.postMessage(Dav.notificationOptions)
}

export async function SessionSyncPush() {
	let session = await DatabaseOperations.GetSession()

	if (
		session == null ||
		session.AccessToken == null ||
		session.UploadStatus == SessionUploadStatus.UpToDate
	) {
		return
	}

	// Delete the session on the server
	await SessionsController.deleteSession(`accessToken`, {
		accessToken: session.AccessToken
	})

	// Remove the session
	await DatabaseOperations.RemoveSession()

	// Remove the web push subscription
	await DatabaseOperations.RemoveWebPushSubscription()

	// Remove the notifications
	await DatabaseOperations.RemoveAllNotifications()
}

export async function LoadUser() {
	let user = await DatabaseOperations.GetUser()
	if (user == null) {
		if (Dav.callbacks.UserLoaded) Dav.callbacks.UserLoaded()
		return
	}

	Dav.user = {
		Id: user.Id,
		Email: user.Email,
		FirstName: user.FirstName,
		Confirmed: user.Confirmed,
		TotalStorage: user.TotalStorage,
		UsedStorage: user.UsedStorage,
		StripeCustomerId: user.StripeCustomerId,
		Plan: user.Plan,
		SubscriptionStatus: user.SubscriptionStatus,
		PeriodEnd: user.PeriodEnd,
		Dev: user.Dev,
		Provider: user.Provider,
		ProfileImage:
			(await BlobToBase64(user.ProfileImage, defaultProfileImageUrl)) ||
			`${profileImageBaseUrl}/${user.Id}`,
		Apps: user.Apps
	}

	// Call userLoaded callback
	if (Dav.callbacks.UserLoaded) Dav.callbacks.UserLoaded()
}

export async function UserSync(): Promise<boolean> {
	if (Dav.accessToken == null) {
		if (Dav.callbacks.UserDownloaded) Dav.callbacks.UserDownloaded()
		return false
	}

	// Get the user
	let retrieveUserResponse = await retrieveUser(
		`
			id
			email
			firstName
			confirmed
			totalStorage
			usedStorage
			stripeCustomerId
			plan
			subscriptionStatus
			periodEnd
			dev {
				id
			}
			provider {
				id
			}
			profileImage {
				url
				etag
			}
			apps {
				total
				items {
					id
					name
					description
					published
					webLink
					googlePlayLink
					microsoftStoreLink
				}
			}
		`
	)

	if (Array.isArray(retrieveUserResponse)) {
		// Error handling
		if (retrieveUserResponse.length > 0) {
			await Dav.Logout()
		}

		return false
	}

	let oldUser = await DatabaseOperations.GetUser()

	let newUser: DatabaseUser = {
		Id: retrieveUserResponse.Id,
		Email: retrieveUserResponse.Email,
		FirstName: retrieveUserResponse.FirstName,
		Confirmed: retrieveUserResponse.Confirmed,
		TotalStorage: retrieveUserResponse.TotalStorage,
		UsedStorage: retrieveUserResponse.UsedStorage,
		StripeCustomerId: retrieveUserResponse.StripeCustomerId,
		Plan: retrieveUserResponse.Plan,
		SubscriptionStatus: retrieveUserResponse.SubscriptionStatus,
		PeriodEnd: retrieveUserResponse.PeriodEnd,
		Dev: retrieveUserResponse.Dev != null,
		Provider: retrieveUserResponse.Provider != null,
		ProfileImage: oldUser != null ? oldUser.ProfileImage : null,
		ProfileImageEtag: oldUser != null ? oldUser.ProfileImageEtag : null,
		Apps: retrieveUserResponse.Apps
	}

	if (
		oldUser == null ||
		oldUser.ProfileImageEtag != retrieveUserResponse.ProfileImageEtag
	) {
		// Download the new profile image
		let profileImageResponse = await GetProfileImageOfUser()

		if (isSuccessStatusCode(profileImageResponse.status)) {
			newUser.ProfileImage = (profileImageResponse as ApiResponse<Blob>).data
			newUser.ProfileImageEtag = retrieveUserResponse.ProfileImageEtag
		} else {
			// TODO: Error handling
		}
	}

	// Save the user in the database
	await DatabaseOperations.SetUser(newUser)

	// Update the user in Dav
	Dav.user = {
		Id: retrieveUserResponse.Id,
		Email: retrieveUserResponse.Email,
		FirstName: retrieveUserResponse.FirstName,
		Confirmed: retrieveUserResponse.Confirmed,
		TotalStorage: retrieveUserResponse.TotalStorage,
		UsedStorage: retrieveUserResponse.UsedStorage,
		StripeCustomerId: retrieveUserResponse.StripeCustomerId,
		Plan: retrieveUserResponse.Plan,
		SubscriptionStatus: retrieveUserResponse.SubscriptionStatus,
		PeriodEnd: retrieveUserResponse.PeriodEnd,
		Dev: retrieveUserResponse.Dev,
		Provider: retrieveUserResponse.Provider,
		ProfileImage:
			(await BlobToBase64(newUser.ProfileImage, defaultProfileImageUrl)) ||
			`${profileImageBaseUrl}/${retrieveUserResponse.Id}`,
		Apps: retrieveUserResponse.Apps
	}

	if (Dav.callbacks.UserDownloaded) Dav.callbacks.UserDownloaded()
	return true
}

export async function Sync(): Promise<boolean> {
	if (isSyncing || Dav.accessToken == null) return false
	isSyncing = true

	// Holds the table ids, e.g. 1, 2, 3, 4
	var tableIds = Dav.tableIds
	// Holds the parallel table ids, e.g. 2, 3
	var parallelTableIds = Dav.parallelTableIds
	// Holds the order of the table ids, sorted by the pages and the parallel table ids, e.g. 1, 2, 3, 2, 3, 4
	var sortedTableIds: Array<number> = []
	// Holds the pages of the table; in the format <tableId, pages>
	var tablePages: Map<number, number> = new Map<number, number>()
	// Holds the last downloaded page; in the format <tableId, pages>
	var currentTablePages: Map<number, number> = new Map<number, number>()
	// Holds the latest table result; in the format <tableId, GetTableResponseData>
	var tableResults: Map<number, GetTableResponseData> = new Map<
		number,
		GetTableResponseData
	>()
	// Holds the uuids of the table objects that were removed on the server but not locally; in the format <tableId, Array<string>>
	var removedTableObjectUuids: Map<number, Array<string>> = new Map<
		number,
		Array<string>
	>()
	// Is true if all http calls of the specified table are successful; in the format <tableId, Boolean>
	var getTableResultsOkay: Map<number, boolean> = new Map<number, boolean>()
	// Holds the new table etags for the tables
	var tableEtags: Map<number, string> = new Map<number, string>()

	if (tableIds == null || tableIds.length == 0 || parallelTableIds == null)
		return false

	// Get the first page of each table
	for (let tableId of tableIds) {
		// Get the first page of the table
		let getTableResult = await GetTable({ id: tableId })
		getTableResultsOkay.set(
			tableId,
			isSuccessStatusCode(getTableResult.status)
		)
		if (!isSuccessStatusCode(getTableResult.status)) continue

		let tableData = (getTableResult as ApiResponse<GetTableResponseData>).data

		// Check if the table has any changes
		if (tableData.etag == (await DatabaseOperations.GetTableEtag(tableId))) {
			continue
		}

		// Save the result
		tableResults.set(tableId, tableData)
		tablePages.set(tableId, tableData.pages)
		currentTablePages.set(tableId, 1)
		tableEtags.set(tableId, tableData.etag)
	}

	// Generate the sorted tableIds list
	sortedTableIds = SortTableIds(tableIds, parallelTableIds, tablePages)

	// Populate removedTableObjectUuids
	for (let tableId of [...new Set(sortedTableIds)]) {
		removedTableObjectUuids.set(tableId, [])

		for (let tableObject of await DatabaseOperations.GetAllTableObjects(
			tableId,
			true
		)) {
			removedTableObjectUuids.get(tableId).push(tableObject.Uuid)
		}
	}

	// Process the table results
	for (let tableId of sortedTableIds) {
		if (!getTableResultsOkay.get(tableId)) continue

		let removedTableObjects = removedTableObjectUuids.get(tableId)
		let tableObjects = tableResults.get(tableId).tableObjects
		let tableChanged = false

		for (let obj of tableObjects) {
			// Remove the table objects from removedTableObjectUuids
			let i = removedTableObjects.findIndex(uuid => uuid == obj.uuid)
			if (i != -1) removedTableObjects.splice(i, 1)

			// Is the table object in the database?
			let currentTableObject = await DatabaseOperations.GetTableObject(
				obj.uuid
			)

			if (currentTableObject != null) {
				// Has the etag changed?
				if (obj.etag == currentTableObject.Etag) {
					// Is it a file and is it already downloaded?
					if (
						currentTableObject.IsFile &&
						currentTableObject.File == null
					) {
						// Download the file
						fileDownloads.push({
							uuid: currentTableObject.Uuid
						})
					}
				} else if (
					currentTableObject.UploadStatus ==
					TableObjectUploadStatus.UpToDate
				) {
					// Get the updated table object from the server
					let getTableObjectResponse = await GetTableObject({
						uuid: currentTableObject.Uuid
					})
					if (!isSuccessStatusCode(getTableObjectResponse.status)) continue

					let tableObject = (
						getTableObjectResponse as ApiResponse<TableObjectResponseData>
					).data.tableObject
					await tableObject.SetUploadStatus(
						TableObjectUploadStatus.UpToDate
					)

					// Is it a file?
					if (tableObject.IsFile) {
						// Set the old etag
						await tableObject.SetEtag(currentTableObject.Etag)

						// Download the file and save the new etag
						fileDownloads.push({
							uuid: tableObject.Uuid,
							etag: obj.etag
						})
					} else {
						if (Dav.callbacks.UpdateTableObject)
							Dav.callbacks.UpdateTableObject(tableObject)
						tableChanged = true
					}
				}
			} else {
				// Get the table object
				let getTableObjectResponse = await GetTableObject({
					uuid: obj.uuid
				})
				if (!isSuccessStatusCode(getTableObjectResponse.status)) continue

				let tableObject = (
					getTableObjectResponse as ApiResponse<TableObjectResponseData>
				).data.tableObject
				await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate)

				// Is it a file?
				if (tableObject.IsFile) {
					// Download the file
					fileDownloads.push({
						uuid: tableObject.Uuid
					})
				} else {
					if (Dav.callbacks.UpdateTableObject)
						Dav.callbacks.UpdateTableObject(tableObject)

					tableChanged = true
				}
			}
		}

		// Check if there is a next page
		currentTablePages.set(tableId, currentTablePages.get(tableId) + 1)

		if (currentTablePages.get(tableId) > tablePages.get(tableId)) {
			if (Dav.callbacks.UpdateAllOfTable)
				Dav.callbacks.UpdateAllOfTable(tableId, tableChanged, true)

			// Save the new table etag
			await DatabaseOperations.SetTableEtag(tableId, tableEtags.get(tableId))
		}

		if (Dav.callbacks.UpdateAllOfTable)
			Dav.callbacks.UpdateAllOfTable(tableId, tableChanged, false)

		// Get the next page
		let getTableResult = await GetTable({
			id: tableId,
			page: currentTablePages.get(tableId)
		})
		if (!isSuccessStatusCode(getTableResult.status)) {
			getTableResultsOkay.set(tableId, false)
			continue
		}

		tableResults.set(
			tableId,
			(getTableResult as ApiResponse<GetTableResponseData>).data
		)
	}

	// RemovedTableObjects now includes all table objects that were deleted on the server but not locally
	// Delete these table objects locally
	for (let tableId of removedTableObjectUuids.keys()) {
		if (!getTableResultsOkay.get(tableId)) continue
		let removedTableObjects = removedTableObjectUuids.get(tableId)

		for (let uuid of removedTableObjects) {
			let obj = await DatabaseOperations.GetTableObject(uuid)
			if (obj == null || obj.UploadStatus == TableObjectUploadStatus.New)
				continue

			await obj.DeleteImmediately()
			if (Dav.callbacks.DeleteTableObject)
				Dav.callbacks.DeleteTableObject(obj)
		}
	}

	isSyncing = false
	syncCompleted = true

	// Check if the sync was successful for all tables
	for (let value of getTableResultsOkay.values()) {
		if (!value) return false
	}

	return true
}

export async function SyncPush(): Promise<boolean> {
	if (Dav.accessToken == null) return false
	if (isSyncing || (!syncCompleted && Dav.environment != Environment.Test)) {
		syncAgain = true
		return false
	}
	isSyncing = true

	// Get all table objects from the database
	let tableObjects: TableObject[] =
		await DatabaseOperations.GetAllTableObjects(-1, true)
	let filteredTableObjects = tableObjects
		.filter(obj => obj.UploadStatus != TableObjectUploadStatus.UpToDate)
		.reverse()

	for (let tableObject of filteredTableObjects) {
		switch (tableObject.UploadStatus) {
			case TableObjectUploadStatus.New:
				// Check if the TableObject is a file and if it can be uploaded
				if (tableObject.IsFile && tableObject.File != null) {
					// Check if the user has enough online storage
					let user = await DatabaseOperations.GetUser()

					if (user != null) {
						let fileSize = tableObject.File.size

						if (
							user.UsedStorage + fileSize > user.TotalStorage &&
							user.TotalStorage != 0
						) {
							continue
						}
					}
				}

				let createResult = await CreateTableObjectOnServer(tableObject)

				if (createResult.success) {
					if (
						Object.keys(tableObject.Properties).length >
						maxPropertiesUploadCount
					) {
						tableObject.UploadStatus = TableObjectUploadStatus.Updated
						syncAgain = true
					} else {
						tableObject.UploadStatus = TableObjectUploadStatus.UpToDate
					}

					tableObject.Etag = (createResult.message as TableObject).Etag
					await DatabaseOperations.SetTableObject(tableObject)
				} else if (createResult.message != null) {
					// Check the errors
					let errors = (createResult.message as ApiErrorResponse).errors

					// Check if the table object already exists
					let i = errors.findIndex(
						error => error.code == ErrorCodes.UuidAlreadyInUse
					)
					if (i != -1) {
						// Set the upload status to UpToDate
						tableObject.UploadStatus = TableObjectUploadStatus.UpToDate
						await DatabaseOperations.SetTableObject(tableObject)
					}
				}
				break
			case TableObjectUploadStatus.Updated:
				let updateResult = await UpdateTableObjectOnServer(tableObject)

				if (updateResult.success) {
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate
					tableObject.Etag = (updateResult.message as TableObject).Etag
					await DatabaseOperations.SetTableObject(tableObject, false)
				} else if (updateResult.message != null) {
					// Check the errors
					let errors = (updateResult.message as ApiErrorResponse).errors

					// Check if the table object does not exist
					let i = errors.findIndex(
						error => error.code == ErrorCodes.TableObjectDoesNotExist
					)
					if (i != -1) {
						// Delete the table object
						await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
					}
				}
				break
			case TableObjectUploadStatus.Deleted:
				let deleteResult = await DeleteTableObjectOnServer(tableObject)

				if (deleteResult.success) {
					// Delete the table object
					await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
				} else if (deleteResult.message != null) {
					// Check the errors
					let errors = (deleteResult.message as ApiErrorResponse).errors

					let i = errors.findIndex(
						error =>
							error.code == ErrorCodes.TableObjectDoesNotExist ||
							error.code == ErrorCodes.ActionNotAllowed
					)
					if (i != -1) {
						// Delete the table object
						await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
					}
				}
				break
			case TableObjectUploadStatus.Removed:
				let removeResult = await RemoveTableObjectOnServer(tableObject)

				if (removeResult.success) {
					// Delete the table object
					await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
				} else if (removeResult.message != null) {
					// Check the errors
					let errors = (removeResult.message as ApiErrorResponse).errors

					let i = errors.findIndex(
						error =>
							error.code ==
								ErrorCodes.TableObjectUserAccessDoesNotExist ||
							error.code == ErrorCodes.TableObjectDoesNotExist
					)
					if (i != -1) {
						// Delete the table object
						await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
					}
				}
				break
		}
	}

	isSyncing = false

	if (syncAgain) {
		syncAgain = false
		return await SyncPush()
	}

	return true
}

export async function StartWebsocketConnection() {
	if (Dav.accessToken == null || Dav.environment == Environment.Test) return

	// Create a WebsocketConnection on the server
	let createWebsocketConnectionResponse = await CreateWebsocketConnection()
	if (createWebsocketConnectionResponse.status != 201) return

	let token = (
		createWebsocketConnectionResponse as ApiResponse<WebsocketConnectionResponseData>
	).data.token
	let baseUrl = Dav.apiBaseUrl.replace("http", "ws")

	webSocket = new WebSocket(`${baseUrl}/cable?token=${token}`)

	webSocket.onopen = () => {
		websocketConnectionEstablished = true

		let json = JSON.stringify({
			command: "subscribe",
			identifier: JSON.stringify({
				channel: tableObjectUpdateChannelName
			})
		})
		webSocket.send(json)
	}

	webSocket.onmessage = async e => {
		let json = JSON.parse(e.data)

		if (json.type == "ping" || json.message == null) {
			return
		} else if (json.type == "reject_subscription") {
			CloseWebsocketConnection()
			return
		}

		let uuid = json.message.uuid
		let change = json.message.change
		let accessTokenMd5 = json.message.access_token_md5
		if (uuid == null || change == null || accessTokenMd5 == null) return

		// Don't notify the app if the session is the current session
		if (CryptoJS.MD5(Dav.accessToken) == accessTokenMd5) return

		if (change == 0 || change == 1) {
			// Get the table object from the server and update it locally
			let getTableObjectResponse = await GetTableObject({ uuid })
			if (getTableObjectResponse.status != 200) return

			let tableObject = (
				getTableObjectResponse as ApiResponse<TableObjectResponseData>
			).data.tableObject

			await DatabaseOperations.SetTableObject(tableObject)
			if (Dav.callbacks.UpdateTableObject)
				Dav.callbacks.UpdateTableObject(tableObject)
		} else if (change == 2) {
			let tableObject = await DatabaseOperations.GetTableObject(uuid)
			if (tableObject == null) return

			if (Dav.callbacks.DeleteTableObject)
				Dav.callbacks.DeleteTableObject(tableObject)

			// Remove the table object in the database
			DatabaseOperations.RemoveTableObject(uuid)
		}
	}
}

export async function CloseWebsocketConnection() {
	if (!websocketConnectionEstablished) return
	webSocket.close()
	websocketConnectionEstablished = false
}

export async function DownloadFiles() {
	if (downloadingFiles) return
	downloadingFiles = true

	while (fileDownloads.length > 0) {
		let fileDownload = fileDownloads.pop()
		let tableObject = await DatabaseOperations.GetTableObject(
			fileDownload.uuid
		)
		if (tableObject == null || !tableObject.IsFile) continue

		if (!(await tableObject.DownloadFile())) continue

		// Update the table object with the new etag
		if (fileDownload.etag != null) {
			await tableObject.SetEtag(fileDownload.etag)
		}

		if (Dav.callbacks.UpdateTableObject)
			Dav.callbacks.UpdateTableObject(tableObject, true)
	}

	downloadingFiles = false
}

export async function DownloadTableObject(uuid: string) {
	// Get the table object from the database
	let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)

	// Get the table object from the server
	let getResponse = await GetTableObject({ uuid })
	if (!isSuccessStatusCode(getResponse.status)) return

	let tableObject = (getResponse as ApiResponse<TableObjectResponseData>).data
		.tableObject

	if (tableObjectFromDatabase != null) {
		// Has the etag changed?
		if (tableObjectFromDatabase.Etag == tableObject.Etag) {
			// Is it a file and is it already downloaded?
			if (
				tableObjectFromDatabase.IsFile &&
				tableObjectFromDatabase.File == null
			) {
				// Download the file
				fileDownloads.unshift({
					uuid: tableObject.Uuid
				})
			}
		} else {
			await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate)

			// Is it a file?
			if (tableObject.IsFile) {
				// Download the file and save the new etag
				fileDownloads.unshift({
					uuid: tableObject.Uuid,
					etag: tableObject.Etag
				})

				// Set the old etag
				await tableObject.SetEtag(tableObjectFromDatabase.Etag)
			} else {
				if (Dav.callbacks.UpdateTableObject)
					Dav.callbacks.UpdateTableObject(tableObject)
			}
		}
	} else {
		await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate)

		if (tableObject.IsFile) {
			// Download the file
			fileDownloads.unshift({
				uuid: tableObject.Uuid,
				etag: tableObject.Etag
			})
		} else {
			if (Dav.callbacks.UpdateTableObject)
				Dav.callbacks.UpdateTableObject(tableObject)
		}
	}

	// Start the file downloads if necessary
	if (fileDownloads.length > 0) {
		await DownloadFiles()
	}
}

//#region Utility functions
async function CreateTableObjectOnServer(
	tableObject: TableObject
): Promise<{ success: boolean; message: TableObject | ApiErrorResponse }> {
	if (Dav.accessToken == null) return { success: false, message: null }

	if (tableObject.IsFile) {
		// Create the table object
		let createTableObjectResponse = await CreateTableObject({
			uuid: tableObject.Uuid,
			tableId: tableObject.TableId,
			file: true,
			properties: {
				[extPropertyName]: tableObject.GetPropertyValue(extPropertyName)
			}
		})

		if (!isSuccessStatusCode(createTableObjectResponse.status)) {
			// Check if the table object already exists
			let errorResponse = createTableObjectResponse as ApiErrorResponse
			let i = errorResponse.errors.findIndex(
				error => error.code == ErrorCodes.UuidAlreadyInUse
			)

			if (i == -1) {
				return {
					success: false,
					message: errorResponse
				}
			}
		}

		if (tableObject.File != null) {
			// Upload the file
			let setTableObjectFileResponse = await SetTableObjectFile({
				uuid: tableObject.Uuid,
				data: await GetBlobData(tableObject.File),
				type: tableObject.File.type
			})

			if (isSuccessStatusCode(setTableObjectFileResponse.status)) {
				let setTableObjectFileResponseData = (
					setTableObjectFileResponse as ApiResponse<TableObjectResponseData>
				).data

				// Save the new table etag
				await DatabaseOperations.SetTableEtag(
					tableObject.TableId,
					setTableObjectFileResponseData.tableEtag
				)

				return {
					success: true,
					message: setTableObjectFileResponseData.tableObject
				}
			}

			return {
				success: false,
				message: setTableObjectFileResponse as ApiErrorResponse
			}
		}
	} else {
		// Get the properties
		let properties = {}
		for (let key of Object.keys(tableObject.Properties)) {
			let property = tableObject.Properties[key]
			if (property.local) continue

			properties[key] = property.value
		}

		// Create the table object
		let createTableObjectResponse = await CreateTableObject({
			uuid: tableObject.Uuid,
			tableId: tableObject.TableId,
			file: false,
			properties
		})

		if (isSuccessStatusCode(createTableObjectResponse.status)) {
			let createTableObjectResponseData = (
				createTableObjectResponse as ApiResponse<TableObjectResponseData>
			).data

			// Save the new etag
			await DatabaseOperations.SetTableEtag(
				tableObject.TableId,
				createTableObjectResponseData.tableEtag
			)

			return {
				success: true,
				message: createTableObjectResponseData.tableObject
			}
		}

		return {
			success: false,
			message: createTableObjectResponse as ApiErrorResponse
		}
	}

	return {
		success: false,
		message: null
	}
}

async function UpdateTableObjectOnServer(
	tableObject: TableObject
): Promise<{ success: boolean; message: TableObject | ApiErrorResponse }> {
	if (Dav.accessToken == null) return { success: false, message: null }

	if (tableObject.IsFile && tableObject.File != null) {
		// Upload the file
		let setTableObjectFileResponse = await SetTableObjectFile({
			uuid: tableObject.Uuid,
			data: await GetBlobData(tableObject.File),
			type: tableObject.File.type
		})

		if (!isSuccessStatusCode(setTableObjectFileResponse.status)) {
			return {
				success: false,
				message: setTableObjectFileResponse as ApiErrorResponse
			}
		}

		// Check if the ext has changed
		let tableObjectResponseData = (
			setTableObjectFileResponse as ApiResponse<TableObjectResponseData>
		).data
		let tableObjectResponseDataExt =
			tableObjectResponseData.tableObject.GetPropertyValue(extPropertyName)
		let tableObjectExt = tableObject.GetPropertyValue(extPropertyName)

		// Save the new table etag
		await DatabaseOperations.SetTableEtag(
			tableObject.TableId,
			tableObjectResponseData.tableEtag
		)

		if (tableObjectResponseDataExt != tableObjectExt) {
			// Update the table object with the new ext
			let updateTableObjectResponse = await UpdateTableObject({
				uuid: tableObject.Uuid,
				properties: {
					[extPropertyName]: tableObjectExt
				}
			})

			if (isSuccessStatusCode(updateTableObjectResponse.status)) {
				let updateTableObjectResponseData = (
					updateTableObjectResponse as ApiResponse<TableObjectResponseData>
				).data

				// Save the new table etag
				await DatabaseOperations.SetTableEtag(
					tableObject.TableId,
					updateTableObjectResponseData.tableEtag
				)

				return {
					success: true,
					message: updateTableObjectResponseData.tableObject
				}
			}

			return {
				success: false,
				message: updateTableObjectResponse as ApiErrorResponse
			}
		}

		return {
			success: true,
			message: tableObjectResponseData.tableObject
		}
	} else if (!tableObject.IsFile) {
		// Get the properties
		let properties = {}
		for (let key of Object.keys(tableObject.Properties)) {
			let property = tableObject.Properties[key]
			if (property.local) continue

			properties[key] = property.value
		}

		// Update the table object
		let updateTableObjectResponse = await UpdateTableObject({
			uuid: tableObject.Uuid,
			properties
		})

		if (isSuccessStatusCode(updateTableObjectResponse.status)) {
			let updateTableObjectResponseData = (
				updateTableObjectResponse as ApiResponse<TableObjectResponseData>
			).data

			// Save the new table etag
			await DatabaseOperations.SetTableEtag(
				tableObject.TableId,
				updateTableObjectResponseData.tableEtag
			)

			return {
				success: true,
				message: updateTableObjectResponseData.tableObject
			}
		}

		return {
			success: false,
			message: updateTableObjectResponse as ApiErrorResponse
		}
	}

	return {
		success: false,
		message: null
	}
}

async function DeleteTableObjectOnServer(
	tableObject: TableObject
): Promise<{ success: boolean; message: {} | ApiErrorResponse }> {
	if (Dav.accessToken == null) return { success: false, message: null }

	let deleteTableObjectResponse = await DeleteTableObject({
		uuid: tableObject.Uuid
	})

	if (isSuccessStatusCode(deleteTableObjectResponse.status)) {
		return {
			success: true,
			message: {}
		}
	}

	return {
		success: false,
		message: deleteTableObjectResponse as ApiErrorResponse
	}
}

async function RemoveTableObjectOnServer(
	tableObject: TableObject
): Promise<{ success: boolean; message: {} | ApiErrorResponse }> {
	if (Dav.accessToken == null) return { success: false, message: null }

	let removeTableObjectResponse = await RemoveTableObject({
		uuid: tableObject.Uuid
	})

	if (isSuccessStatusCode(removeTableObjectResponse.status)) {
		return {
			success: true,
			message: {}
		}
	}

	return {
		success: false,
		message: removeTableObjectResponse as ApiErrorResponse
	}
}

export function setDownloadingFileUuid(uuid: string) {
	downloadingFileUuid = uuid
}
//#endregion
