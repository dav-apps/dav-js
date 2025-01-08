import { ClientError } from "graphql-request"
import { Dav } from "./Dav.js"
import { ApiResponse, ApiErrorResponse, ErrorCode } from "./types.js"
import * as ErrorCodes from "./errorCodes.js"
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

		if (errorCode != null) {
			errorCodes.push(errorCode as ErrorCode)
		}
	}

	return errorCodes
}

export function ConvertErrorToApiErrorResponse(error: any): ApiErrorResponse {
	if (error.response) {
		// API error
		return {
			status: error.response.status,
			errors: error.response.data.errors
		}
	} else {
		// JavaScript error
		return { status: -1, errors: [] }
	}
}

export async function HandleApiError(error: any): Promise<ApiErrorResponse> {
	let errorResponse = ConvertErrorToApiErrorResponse(error)

	if (
		errorResponse.errors &&
		errorResponse.errors.length > 0 &&
		errorResponse.errors[0].code == ErrorCodes.AccessTokenMustBeRenewed
	) {
		return null
	} else {
		return errorResponse
	}
}

export async function handleGraphQLErrors(
	errorCodes: ErrorCode[]
): Promise<void | ErrorCode[]> {
	if (errorCodes.includes("SESSION_ENDED")) {
		return await renewSession()
	}
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

export function SortTableIds(
	tableIds: number[],
	parallelTableIds: number[],
	tableIdPages: Map<number, number>
) {
	// Clone tableIdPages
	let tableIdPagesCopy = new Map<number, number>()

	for (let key of tableIdPages.keys()) {
		if (tableIds.includes(key)) {
			tableIdPagesCopy.set(key, tableIdPages.get(key))
		}
	}

	// Remove all entries in tableIdPages with value = 0
	for (let key of tableIdPagesCopy.keys()) {
		if (tableIdPagesCopy.get(key) == 0) {
			tableIdPagesCopy.delete(key)
		}
	}

	let sortedTableIds: number[] = []
	let currentTableIdIndex = 0

	while (getSumOfValuesInMap(tableIdPagesCopy) > 0) {
		if (currentTableIdIndex >= tableIds.length) {
			currentTableIdIndex = 0
		}

		let currentTableId = tableIds[currentTableIdIndex]

		if (!tableIdPagesCopy.has(currentTableId)) {
			currentTableIdIndex++
			continue
		}

		if (
			parallelTableIds.includes(currentTableId) &&
			parallelTableIds.length > 1
		) {
			// Add just one page of the current table
			sortedTableIds.push(currentTableId)
			tableIdPagesCopy.set(
				currentTableId,
				tableIdPagesCopy.get(currentTableId) - 1
			)

			// Remove the table id from the pages if there are no pages left
			if (tableIdPagesCopy.get(currentTableId) <= 0) {
				tableIdPagesCopy.delete(currentTableId)
			}

			// Check if this was the last table of parallelTableIds
			let i = parallelTableIds.indexOf(currentTableId)
			let isLastParallelTable = i == parallelTableIds.length - 1

			if (isLastParallelTable) {
				// Move to the start of the array
				currentTableIdIndex = 0
			} else {
				currentTableIdIndex++
			}
		} else {
			// Add all pages of the current table
			for (let i = 0; i < tableIdPagesCopy.get(currentTableId); i++) {
				sortedTableIds.push(currentTableId)
			}

			// Clear the pages of the current table
			tableIdPagesCopy.delete(currentTableId)

			// Go to the next table
			currentTableIdIndex++
		}
	}

	return sortedTableIds
}

function getSumOfValuesInMap(map: Map<number, number>) {
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
