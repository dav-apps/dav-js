import { ClientError } from "graphql-request"
import { Dav } from "./Dav.js"
import { User } from "./models/User.js"
import { Dev } from "./models/Dev.js"
import { App } from "./models/App.js"
import { Table } from "./models/Table.js"
import { TableObject } from "./models/TableObject.js"
import { Notification as DavNotification } from "./models/Notification.js"
import { Purchase } from "./models/Purchase.js"
import {
	ApiErrorResponse2,
	ErrorCode,
	UserResource,
	DevResource,
	AppResource,
	TableResource,
	TableObjectResource,
	NotificationResource,
	PurchaseResource,
	TableObjectProperties
} from "./types.js"
import * as DatabaseOperations from "./providers/DatabaseOperations.js"
import * as SessionsController from "./controllers/SessionsController.js"

export function generateUuid() {
	var d = new Date().getTime()

	if (
		typeof performance !== "undefined" &&
		typeof performance.now === "function"
	) {
		d += performance.now() //use high-precision timer if available
	}

	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0
		d = Math.floor(d / 16)
		return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
	})
}

export function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding)
		.replace(/\-/g, "+")
		.replace(/_/g, "/")

	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(rawData.length)

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

export function getTableObjectKey(tableId?: number, uuid?: string) {
	if ((!tableId || tableId == -1) && !uuid) {
		return "tableObject:"
	} else if (tableId && !uuid) {
		return `tableObject:${tableId}/`
	} else if (tableId && uuid) {
		return `tableObject:${tableId}/${uuid}`
	} else {
		return null
	}
}

export function getTableEtagKey(tableId: number) {
	return `tableEtag:${tableId}`
}

export function getNotificationKey(uuid?: string) {
	if (uuid != null) {
		return `notification:${uuid}`
	} else {
		return "notification:"
	}
}

export function getErrorCodesOfGraphQLError(e: ClientError): ErrorCode[] {
	let errors = e.response.errors
	if (errors == null) return []

	let errorCodes: ErrorCode[] = []

	for (let error of errors) {
		const errorCode = error.extensions?.code as string
		const errors = (error.extensions?.errors as string[]) ?? []

		if (errorCode == "VALIDATION_FAILED") {
			for (let errorCode of errors) {
				errorCodes.push(errorCode as ErrorCode)
			}
		} else if (errorCode != null) {
			errorCodes.push(errorCode as ErrorCode)
		}
	}

	return errorCodes
}

export function convertErrorToApiErrorResponse2(error: any): ApiErrorResponse2 {
	if (error.response) {
		// API error
		return {
			status: error.response.status,
			error: error.response.data.error
		}
	} else {
		// JavaScript error
		return { status: -1 }
	}
}

export async function handleApiError2(error: any): Promise<ApiErrorResponse2> {
	let errorResponse = convertErrorToApiErrorResponse2(error)

	if (
		errorResponse.error != null &&
		errorResponse.error.code == "SESSION_EXPIRED"
	) {
		return null
	} else {
		return errorResponse
	}
}

export async function handleGraphQLErrors(
	errorCodes: ErrorCode[]
): Promise<null | ErrorCode[]> {
	if (errorCodes.includes("SESSION_EXPIRED")) {
		return await renewSession()
	}

	return errorCodes
}

/**
 * Calls the renew session mutation with the old access token
 * and saves the new access token in the database
 */
export async function renewSession(): Promise<null | ErrorCode[]> {
	let renewSessionResponse = await SessionsController.renewSession(
		`accessToken`,
		{ accessToken: Dav.accessToken }
	)

	if (Array.isArray(renewSessionResponse)) {
		return renewSessionResponse as ErrorCode[]
	} else {
		let newAccessToken = renewSessionResponse.accessToken

		// Save the new access token in the database
		await SetAccessToken(newAccessToken)

		if (Dav.callbacks.AccessTokenRenewed) {
			Dav.callbacks.AccessTokenRenewed(newAccessToken)
		}

		return null
	}
}

export async function SetAccessToken(accessToken: string) {
	Dav.accessToken = accessToken

	// Save the access token in the database
	let session = await DatabaseOperations.GetSession()
	if (session == null) return

	session.AccessToken = accessToken
	await DatabaseOperations.SetSession(session)
}

export function SortTableNames(
	tableNames: string[],
	parallelTableNames: string[],
	tableNamePages: Map<string, number>
) {
	// Clone tableIdPages
	let tableNamePagesCopy = new Map<string, number>()

	for (let key of tableNamePages.keys()) {
		if (tableNames.includes(key)) {
			tableNamePagesCopy.set(key, tableNamePages.get(key))
		}
	}

	// Remove all entries in tableIdPages with value = 0
	for (let key of tableNamePagesCopy.keys()) {
		if (tableNamePagesCopy.get(key) == 0) {
			tableNamePagesCopy.delete(key)
		}
	}

	let sortedTableNames: string[] = []
	let currentTableNameIndex = 0

	while (getSumOfValuesInMap(tableNamePagesCopy) > 0) {
		if (currentTableNameIndex >= tableNames.length) {
			currentTableNameIndex = 0
		}

		let currentTableName = tableNames[currentTableNameIndex]

		if (!tableNamePagesCopy.has(currentTableName)) {
			currentTableNameIndex++
			continue
		}

		if (
			parallelTableNames.includes(currentTableName) &&
			parallelTableNames.length > 1
		) {
			// Add just one page of the current table
			sortedTableNames.push(currentTableName)
			tableNamePagesCopy.set(
				currentTableName,
				tableNamePagesCopy.get(currentTableName) - 1
			)

			// Remove the table id from the pages if there are no pages left
			if (tableNamePagesCopy.get(currentTableName) <= 0) {
				tableNamePagesCopy.delete(currentTableName)
			}

			// Check if this was the last table of parallelTableIds
			let i = parallelTableNames.indexOf(currentTableName)
			let isLastParallelTable = i == parallelTableNames.length - 1

			if (isLastParallelTable) {
				// Move to the start of the array
				currentTableNameIndex = 0
			} else {
				currentTableNameIndex++
			}
		} else {
			// Add all pages of the current table
			for (let i = 0; i < tableNamePagesCopy.get(currentTableName); i++) {
				sortedTableNames.push(currentTableName)
			}

			// Clear the pages of the current table
			tableNamePagesCopy.delete(currentTableName)

			// Go to the next table
			currentTableNameIndex++
		}
	}

	return sortedTableNames
}

function getSumOfValuesInMap(map: Map<string, number>): number {
	let sum = 0

	for (let key of map.keys()) {
		sum += map.get(key)
	}

	return sum
}

export async function requestNotificationPermission(): Promise<boolean> {
	return (await Notification.requestPermission()) == "granted"
}

export async function BlobToBase64(
	file: Blob,
	defaultValue: string = null
): Promise<string> {
	if (file == null || typeof FileReader == "undefined") return defaultValue

	let fileReader = new FileReader()
	let readFilePromise: Promise<ProgressEvent> = new Promise(resolve => {
		fileReader.onloadend = resolve
		fileReader.readAsDataURL(file)
	})
	await readFilePromise
	return fileReader.result as string
}

export async function GetBlobData(file: Blob) {
	let readFilePromise: Promise<ProgressEvent> = new Promise(resolve => {
		let fileReader = new FileReader()
		fileReader.onloadend = resolve
		fileReader.readAsArrayBuffer(file)
	})
	let readFileResult: ProgressEvent = await readFilePromise
	return readFileResult.currentTarget["result"]
}

export async function requestStoragePersistence(): Promise<boolean> {
	if (
		!navigator.storage ||
		!navigator.storage.persist ||
		!navigator.storage.persisted
	) {
		return false
	}

	// Check if the storage is already persisting
	if (await navigator.storage.persisted()) return true

	// Ask for storage persistence
	return await navigator.storage.persist()
}

export function isSuccessStatusCode(code: number) {
	return code >= 200 && code < 300
}

export function PrepareRequestParams(params: Object, joinArrays = false) {
	let newParams = {}

	for (let key of Object.keys(params)) {
		if (params[key] == null) continue

		let value = params[key]

		if (joinArrays && Array.isArray(value)) {
			if (value.length == 0) continue
			value = value.join(",")
		}

		newParams[key] = value
	}

	return newParams
}

//#region Converter functions
export function convertUserResourceToUser(userResource: UserResource): User {
	if (userResource == null) return null

	const apps: App[] = []

	if (userResource.apps?.items != null) {
		for (let app of userResource.apps.items) {
			apps.push(convertAppResourceToApp(app))
		}
	}

	return new User(
		userResource.id,
		userResource.email,
		userResource.firstName,
		userResource.confirmed,
		userResource.totalStorage,
		userResource.usedStorage,
		userResource.stripeCustomerId,
		userResource.plan,
		userResource.subscriptionStatus,
		userResource.periodEnd == null ? null : new Date(userResource.periodEnd),
		userResource.dev != null,
		userResource.provider != null,
		userResource.profileImage?.url,
		userResource.profileImage?.etag,
		apps
	)
}

export function convertDevResourceToDev(devResource: DevResource): Dev {
	if (devResource == null) return null

	const apps: App[] = []

	if (devResource.apps?.items != null) {
		for (let app of devResource.apps.items) {
			apps.push(convertAppResourceToApp(app))
		}
	}

	return new Dev(devResource.id, apps)
}

export function convertAppResourceToApp(appResource: AppResource): App {
	if (appResource == null) return null

	const tables: Table[] = []

	if (appResource.tables?.items != null) {
		for (let table of appResource.tables.items) {
			tables.push(convertTableResourceToTable(table))
		}
	}

	return new App(
		appResource.id,
		appResource.name,
		appResource.description,
		appResource.published,
		appResource.webLink,
		appResource.googlePlayLink,
		appResource.microsoftStoreLink,
		0,
		tables
	)
}

export function convertTableResourceToTable(
	tableResource: TableResource
): Table {
	if (tableResource == null) return null

	return new Table(tableResource.id, 0, tableResource.name, tableResource.etag)
}

export function convertTableObjectResourceToTableObject(
	tableObjectResource: TableObjectResource
): TableObject {
	if (tableObjectResource == null) return null

	let properties: TableObjectProperties = {}

	for (let key of Object.keys(tableObjectResource.properties)) {
		properties[key] = {
			value: tableObjectResource.properties[key],
			local: false
		}
	}

	const purchases: Purchase[] = []

	if (tableObjectResource.purchases?.items != null) {
		for (let purchase of tableObjectResource.purchases.items) {
			purchases.push(convertPurchaseResourceToPurchase(purchase))
		}
	}

	return new TableObject({
		Uuid: tableObjectResource.uuid,
		TableId: tableObjectResource.table?.id ?? 0,
		User: convertUserResourceToUser(tableObjectResource.user),
		IsFile: tableObjectResource.fileUrl != null,
		Etag: tableObjectResource.etag,
		Properties: properties,
		Purchases: purchases
	})
}

export function convertNotificationResourceToNotification(
	notificationResource: NotificationResource
): DavNotification {
	if (notificationResource == null) return null

	return new DavNotification({
		Uuid: notificationResource.uuid,
		Time: new Date(notificationResource.time).valueOf() / 1000,
		Interval: notificationResource.interval,
		Title: notificationResource.title,
		Body: notificationResource.body
	})
}

export function convertPurchaseResourceToPurchase(
	purchaseResource: PurchaseResource
) {
	return new Purchase(
		0,
		0,
		purchaseResource.uuid,
		null,
		null,
		null,
		null,
		null,
		purchaseResource.price,
		purchaseResource.currency,
		null
	)
}
//#endregion
