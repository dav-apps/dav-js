import CryptoJS from "crypto-js"
import axios from "axios"
import { Dav } from "../Dav.js"
import {
	ApiErrorResponse2,
	ApiResponse,
	ErrorCode,
	Environment,
	DatabaseUser,
	SessionUploadStatus,
	TableObjectUploadStatus,
	TableResource,
	TableObjectResource
} from "../types.js"
import {
	SortTableNames,
	BlobToBase64,
	GetBlobData,
	isSuccessStatusCode,
	convertUserResourceToUser,
	convertTableObjectResourceToTableObject
} from "../utils.js"
import {
	defaultProfileImageUrl,
	profileImageBaseUrl,
	extPropertyName,
	tableObjectUpdateChannelName,
	maxPropertiesUploadCount
} from "../constants.js"
import { TableObject } from "../models/TableObject.js"
import * as DatabaseOperations from "./DatabaseOperations.js"
import { retrieveUser } from "../controllers/UsersController.js"
import { retrieveTable } from "../controllers/TablesController.js"
import {
	createTableObject,
	deleteTableObject,
	retrieveTableObject,
	updateTableObject,
	uploadTableObjectFile
} from "../controllers/TableObjectsController.js"
import { deleteTableObjectUserAccess } from "../controllers/TableObjectUserAccessesController.js"
import { createWebsocketConnection } from "../controllers/WebsocketConnectionsController.js"
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

const retrieveTableQueryData = `
		id
		etag
		tableObjects(
			limit: $limit
			offset: $offset
		) {
			total
			items {
				uuid
			}
		}
	`
const retrieveTableObjectQueryData = `
		uuid
		table {
			id
		}
		user {
			id
			email
			firstName
		}
		fileUrl
		etag
		properties
	`

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
		if (Dav.callbacks.UserDownloaded) {
			Dav.callbacks.UserDownloaded()
		}

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
	let retrievedUser = convertUserResourceToUser(retrieveUserResponse)

	let newUser: DatabaseUser = {
		Id: retrievedUser.Id,
		Email: retrievedUser.Email,
		FirstName: retrievedUser.FirstName,
		Confirmed: retrievedUser.Confirmed,
		TotalStorage: retrievedUser.TotalStorage,
		UsedStorage: retrievedUser.UsedStorage,
		StripeCustomerId: retrievedUser.StripeCustomerId,
		Plan: retrievedUser.Plan,
		SubscriptionStatus: retrievedUser.SubscriptionStatus,
		PeriodEnd: retrievedUser.PeriodEnd,
		Dev: retrievedUser.Dev != null,
		Provider: retrievedUser.Provider != null,
		ProfileImage: oldUser != null ? oldUser.ProfileImage : null,
		ProfileImageEtag: oldUser != null ? oldUser.ProfileImageEtag : null,
		Apps: retrievedUser.Apps
	}

	if (
		oldUser == null ||
		oldUser.ProfileImageEtag != retrievedUser.ProfileImageEtag
	) {
		// Download the new profile image
		try {
			let profileImageResponse = await axios({
				method: "get",
				url: retrievedUser.ProfileImage,
				responseType: "blob"
			})

			newUser.ProfileImage = profileImageResponse.data
			newUser.ProfileImageEtag = retrievedUser.ProfileImageEtag
		} catch (error) {
			console.error("Error in downloading the user profile image", error)
		}
	}

	// Save the user in the database
	await DatabaseOperations.SetUser(newUser)

	// Update the user in Dav
	Dav.user = {
		Id: retrievedUser.Id,
		Email: retrievedUser.Email,
		FirstName: retrievedUser.FirstName,
		Confirmed: retrievedUser.Confirmed,
		TotalStorage: retrievedUser.TotalStorage,
		UsedStorage: retrievedUser.UsedStorage,
		StripeCustomerId: retrievedUser.StripeCustomerId,
		Plan: retrievedUser.Plan,
		SubscriptionStatus: retrievedUser.SubscriptionStatus,
		PeriodEnd: retrievedUser.PeriodEnd,
		Dev: retrievedUser.Dev,
		Provider: retrievedUser.Provider,
		ProfileImage:
			(await BlobToBase64(newUser.ProfileImage, defaultProfileImageUrl)) ||
			`${profileImageBaseUrl}/${retrievedUser.Id}`,
		Apps: retrievedUser.Apps
	}

	if (Dav.callbacks.UserDownloaded) {
		Dav.callbacks.UserDownloaded()
	}

	return true
}

export async function Sync(): Promise<boolean> {
	if (isSyncing || Dav.accessToken == null) return false
	isSyncing = true

	// Holds the table names, e.g. 1, 2, 3, 4
	let tableNames = Dav.tableNames
	// Holds the parallel table names, e.g. 2, 3
	let parallelTableNames = Dav.parallelTableNames
	// Holds the order of the table names, sorted by the pages and the parallel table names, e.g. 1, 2, 3, 2, 3, 4
	let sortedTableNames: Array<string> = []
	// Mapping for the table names to the table ids
	let tableIds: Map<string, number> = new Map<string, number>()
	// Holds the pages of the table; in the format <tableName, pages>
	let tablePages: Map<string, number> = new Map<string, number>()
	// Holds the last downloaded page; in the format <tableName, pages>
	let currentTablePages: Map<string, number> = new Map<string, number>()
	// Holds the latest table result; in the format <tableName, GetTableResponseData>
	let tableResults: Map<string, TableResource> = new Map<
		string,
		TableResource
	>()
	// Holds the uuids of the table objects that were removed on the server but not locally; in the format <tableName, Array<string>>
	let removedTableObjectUuids: Map<string, Array<string>> = new Map<
		string,
		Array<string>
	>()
	// Is true if all http calls of the specified table are successful; in the format <tableName, Boolean>
	let getTableResultsOkay: Map<string, boolean> = new Map<string, boolean>()
	// Holds the new table etags for the tables
	let tableEtags: Map<string, string> = new Map<string, string>()

	if (
		tableNames == null ||
		tableNames.length == 0 ||
		parallelTableNames == null
	) {
		return false
	}

	const tableObjectsLimit = 100

	// Get the first page of each table
	for (let tableName of tableNames) {
		// Get the first page of the table
		let retrieveTableResponse = await retrieveTable(retrieveTableQueryData, {
			name: tableName,
			limit: tableObjectsLimit
		})

		let retrieveTableSuccess = !Array.isArray(retrieveTableResponse)

		getTableResultsOkay.set(tableName, retrieveTableSuccess)
		if (!retrieveTableSuccess) continue

		let table = retrieveTableResponse as TableResource
		tableIds.set(tableName, table.id)

		// Check if the table has any changes
		if (table.etag == (await DatabaseOperations.GetTableEtag(table.id))) {
			continue
		}

		// Save the result
		tableResults.set(tableName, table)
		tablePages.set(
			tableName,
			Math.ceil(table.tableObjects.total / tableObjectsLimit)
		)
		currentTablePages.set(tableName, 1)
		tableEtags.set(tableName, table.etag)
	}

	// Generate the sorted tableIds list
	sortedTableNames = SortTableNames(tableNames, parallelTableNames, tablePages)

	// Populate removedTableObjectUuids
	for (let tableName of [...new Set(sortedTableNames)]) {
		removedTableObjectUuids.set(tableName, [])

		for (let tableObject of await DatabaseOperations.GetAllTableObjects(
			tableIds.get(tableName),
			true
		)) {
			removedTableObjectUuids.get(tableName).push(tableObject.Uuid)
		}
	}

	// Process the table results
	for (let tableName of sortedTableNames) {
		if (!getTableResultsOkay.get(tableName)) continue

		let removedTableObjects = removedTableObjectUuids.get(tableName)
		let tableObjects = tableResults.get(tableName).tableObjects
		let tableChanged = false

		for (let obj of tableObjects.items) {
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
					let retrieveTableObjectResponse = await retrieveTableObject(
						retrieveTableObjectQueryData,
						{
							uuid: currentTableObject.Uuid
						}
					)

					if (Array.isArray(retrieveTableObjectResponse)) continue

					let tableObject = convertTableObjectResourceToTableObject(
						retrieveTableObjectResponse
					)

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
						if (Dav.callbacks.UpdateTableObject) {
							Dav.callbacks.UpdateTableObject(tableObject)
						}

						tableChanged = true
					}
				}
			} else {
				// Get the table object
				let retrieveTableObjectResponse = await retrieveTableObject(
					retrieveTableObjectQueryData,
					{
						uuid: obj.uuid
					}
				)

				if (Array.isArray(retrieveTableObjectResponse)) continue

				let tableObject = convertTableObjectResourceToTableObject(
					retrieveTableObjectResponse
				)

				await tableObject.SetUploadStatus(TableObjectUploadStatus.UpToDate)

				// Is it a file?
				if (tableObject.IsFile) {
					// Download the file
					fileDownloads.push({
						uuid: tableObject.Uuid
					})
				} else {
					if (Dav.callbacks.UpdateTableObject) {
						Dav.callbacks.UpdateTableObject(tableObject)
					}

					tableChanged = true
				}
			}
		}

		// Check if there is a next page
		currentTablePages.set(tableName, currentTablePages.get(tableName) + 1)

		if (currentTablePages.get(tableName) > tablePages.get(tableName)) {
			if (Dav.callbacks.UpdateAllOfTable) {
				Dav.callbacks.UpdateAllOfTable(tableName, tableChanged, true)
			}

			// Save the new table etag
			await DatabaseOperations.SetTableEtag(
				tableIds.get(tableName),
				tableEtags.get(tableName)
			)
		}

		if (Dav.callbacks.UpdateAllOfTable) {
			Dav.callbacks.UpdateAllOfTable(
				tableIds.get(tableName),
				tableChanged,
				false
			)
		}

		// Get the next page
		let retrieveTableResponse = await retrieveTable(retrieveTableQueryData, {
			name: tableName,
			limit: tableObjectsLimit,
			offset: (currentTablePages.get(tableName) - 1) * tableObjectsLimit
		})

		if (Array.isArray(retrieveTableResponse)) {
			getTableResultsOkay.set(tableName, false)
			continue
		}

		tableResults.set(tableName, retrieveTableResponse)
	}

	// RemovedTableObjects now includes all table objects that were deleted on the server but not locally
	// Delete these table objects locally
	for (let tableName of removedTableObjectUuids.keys()) {
		if (!getTableResultsOkay.get(tableName)) continue
		let removedTableObjects = removedTableObjectUuids.get(tableName)

		for (let uuid of removedTableObjects) {
			let obj = await DatabaseOperations.GetTableObject(uuid)

			if (obj == null || obj.UploadStatus == TableObjectUploadStatus.New) {
				continue
			}

			await obj.DeleteImmediately()

			if (Dav.callbacks.DeleteTableObject) {
				Dav.callbacks.DeleteTableObject(obj)
			}
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

				if (!Array.isArray(createResult)) {
					if (
						Object.keys(tableObject.Properties).length >
						maxPropertiesUploadCount
					) {
						tableObject.UploadStatus = TableObjectUploadStatus.Updated
						syncAgain = true
					} else {
						tableObject.UploadStatus = TableObjectUploadStatus.UpToDate
					}

					tableObject.Etag = createResult.etag
					await DatabaseOperations.SetTableObject(tableObject)
				} else if (createResult.includes("UUID_ALREADY_IN_USE")) {
					// Set the upload status to UpToDate
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate
					await DatabaseOperations.SetTableObject(tableObject)
				}

				break
			case TableObjectUploadStatus.Updated:
				let updateResult = await UpdateTableObjectOnServer(tableObject)

				if (!Array.isArray(updateResult)) {
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate
					tableObject.Etag = updateResult.etag

					await DatabaseOperations.SetTableObject(tableObject, false)
				} else if (updateResult.includes("TABLE_OBJECT_DOES_NOT_EXIST")) {
					// Delete the table object
					await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
				}

				break
			case TableObjectUploadStatus.Deleted:
				let deleteResult = await deleteTableObject(`uuid`, {
					uuid: tableObject.Uuid
				})

				if (Array.isArray(deleteResult)) {
					if (
						deleteResult.includes("TABLE_OBJECT_DOES_NOT_EXIST") ||
						deleteResult.includes("ACTION_NOT_ALLOWED")
					) {
						// Delete the table object
						await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
					}
				} else {
					// Delete the table object
					await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
				}

				break
			case TableObjectUploadStatus.Removed:
				let removeResult = await deleteTableObjectUserAccess(`tableAlias`, {
					tableObjectUuid: tableObject.Uuid
				})

				if (
					!Array.isArray(removeResult) ||
					removeResult.includes("TABLE_OBJECT_DOES_NOT_EXIST") ||
					removeResult.includes("TABLE_OBJECT_USER_ACCESS_DOES_NOT_EXIST")
				) {
					// Delete the table object
					await DatabaseOperations.RemoveTableObject(tableObject.Uuid)
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
	let createWebsocketConnectionResponse = await createWebsocketConnection(
		`token`
	)

	if (Array.isArray(createWebsocketConnectionResponse)) return

	const token = createWebsocketConnectionResponse.token
	const baseUrl = Dav.apiBaseUrl.replace("http", "ws")

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
			let retrieveTableObjectResponse = await retrieveTableObject(
				retrieveTableObjectQueryData,
				{
					uuid
				}
			)

			if (Array.isArray(retrieveTableObjectResponse)) return

			let tableObject = convertTableObjectResourceToTableObject(
				retrieveTableObjectResponse
			)

			await DatabaseOperations.SetTableObject(tableObject)

			if (Dav.callbacks.UpdateTableObject) {
				Dav.callbacks.UpdateTableObject(tableObject)
			}
		} else if (change == 2) {
			let tableObject = await DatabaseOperations.GetTableObject(uuid)
			if (tableObject == null) return

			if (Dav.callbacks.DeleteTableObject) {
				Dav.callbacks.DeleteTableObject(tableObject)
			}

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
	let retrieveTableObjectResponse = await retrieveTableObject(
		retrieveTableObjectQueryData,
		{ uuid }
	)
	if (Array.isArray(retrieveTableObjectResponse)) return

	let tableObject = convertTableObjectResourceToTableObject(
		retrieveTableObjectResponse
	)

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
): Promise<TableObjectResource | ErrorCode[]> {
	if (Dav.accessToken == null) return null

	if (tableObject.IsFile) {
		// Create the table object
		let createTableObjectResponse = await createTableObject(
			retrieveTableObjectQueryData,
			{
				uuid: tableObject.Uuid,
				tableId: tableObject.TableId,
				file: true,
				ext: tableObject.GetPropertyValue(extPropertyName) as string
			}
		)

		if (
			Array.isArray(createTableObjectResponse) &&
			createTableObjectResponse.includes("UUID_ALREADY_IN_USE")
		) {
			return createTableObjectResponse
		}

		if (tableObject.File != null) {
			// Upload the file
			let uploadTableObjectFileResponse = await uploadTableObjectFile({
				uuid: tableObject.Uuid,
				data: await GetBlobData(tableObject.File),
				contentType: tableObject.File.type
			})

			if (!Array.isArray(uploadTableObjectFileResponse)) {
				let uploadTableObjectFileResponseData = (
					uploadTableObjectFileResponse as ApiResponse<TableObjectResource>
				).data

				// Save the new table etag
				await DatabaseOperations.SetTableEtag(
					tableObject.TableId,
					uploadTableObjectFileResponseData.table.etag
				)

				return createTableObjectResponse
			}

			return uploadTableObjectFileResponse
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
		let createTableObjectResponse = await createTableObject(
			retrieveTableObjectQueryData,
			{
				uuid: tableObject.Uuid,
				tableId: tableObject.TableId,
				file: false,
				properties
			}
		)

		if (!Array.isArray(createTableObjectResponse)) {
			// Save the new etag
			await DatabaseOperations.SetTableEtag(
				tableObject.TableId,
				createTableObjectResponse.table.etag
			)

			return createTableObjectResponse
		}

		return createTableObjectResponse
	}
}

async function UpdateTableObjectOnServer(
	tableObject: TableObject
): Promise<TableObjectResource | ErrorCode[]> {
	if (Dav.accessToken == null) return null

	if (tableObject.IsFile && tableObject.File != null) {
		// Upload the file
		let uploadTableObjectFileResponse = await uploadTableObjectFile({
			uuid: tableObject.Uuid,
			data: await GetBlobData(tableObject.File),
			contentType: tableObject.File.type
		})

		if (!isSuccessStatusCode(uploadTableObjectFileResponse.status)) {
			let errorResponse = uploadTableObjectFileResponse as ApiErrorResponse2

			if (errorResponse.error == null) {
				return null
			} else {
				return [errorResponse.error?.code as ErrorCode]
			}
		}

		// Check if the ext has changed
		let uploadTableObjectFileResponseData = (
			uploadTableObjectFileResponse as ApiResponse<TableObjectResource>
		).data

		let tableObjectResponseDataExt =
			uploadTableObjectFileResponseData.properties[extPropertyName]

		let tableObjectExt = tableObject.GetPropertyValue(
			extPropertyName
		) as string

		// Save the new table etag
		await DatabaseOperations.SetTableEtag(
			tableObject.TableId,
			uploadTableObjectFileResponseData.table.etag
		)

		if (tableObjectResponseDataExt != tableObjectExt) {
			// Update the table object with the new ext
			let updateTableObjectResponse = await updateTableObject(
				`
					table {
						etag
					}
				`,
				{
					uuid: tableObject.Uuid,
					ext: tableObjectExt
				}
			)

			if (!Array.isArray(updateTableObjectResponse)) {
				// Save the new table etag
				await DatabaseOperations.SetTableEtag(
					tableObject.TableId,
					updateTableObjectResponse.table.etag
				)
			}

			return updateTableObjectResponse
		}

		return uploadTableObjectFileResponseData
	} else if (!tableObject.IsFile) {
		// Get the properties
		let properties = {}
		for (let key of Object.keys(tableObject.Properties)) {
			let property = tableObject.Properties[key]
			if (property.local) continue

			properties[key] = property.value
		}

		// Update the table object
		let updateTableObjectResponse = await updateTableObject(
			`
				table {
					etag
				}
			`,
			{
				uuid: tableObject.Uuid,
				properties
			}
		)

		if (!Array.isArray(updateTableObjectResponse)) {
			// Save the new table etag
			await DatabaseOperations.SetTableEtag(
				tableObject.TableId,
				updateTableObjectResponse.table.etag
			)
		}

		return updateTableObjectResponse
	}

	return null
}

export function setDownloadingFileUuid(uuid: string) {
	downloadingFileUuid = uuid
}
//#endregion
