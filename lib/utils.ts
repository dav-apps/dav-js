import { ApiErrorResponse } from './types'

export function generateUuid() {
	var d = new Date().getTime()
	if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
		d += performance.now()		//use high-precision timer if available
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0
		d = Math.floor(d / 16)
		return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
	})
}

export function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - base64String.length % 4) % 4)
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

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

export function ConvertErrorToApiErrorResponse(error: any) : ApiErrorResponse {
	if (error.response) {
		// API error
		return {
			status: error.response.status,
			errors: error.response.data.errors
		}
	} else {
		// JavaScript error
		return {status: -1, errors: []};
	}
}

export function SortTableIds(
	tableIds: Array<number>,
	parallelTableIds: Array<number>,
	tableIdPages: Map<number, number>
) : Array<number> {
	var preparedTableIds: Array<number> = []

	// Remove all table ids in parallelTableIds that do not occur in tableIds
	let removeParallelTableIds: Array<number> = []
	for (let i = 0; i < parallelTableIds.length; i++) {
		let value = parallelTableIds[i]
		if (tableIds.indexOf(value) == -1) {
			removeParallelTableIds.push(value)
		}
	}

	for (let tableId of removeParallelTableIds) {
		let index = parallelTableIds.indexOf(tableId)
		if (index != -1) {
			parallelTableIds.splice(index, 1)
		}
	}

	// Prepare pagesOfParallelTable
	var pagesOfParallelTable: Map<number, number> = new Map<number, number>()
	for (let [key, value] of tableIdPages) {
		if (parallelTableIds.indexOf(key) != -1) {
			pagesOfParallelTable.set(key, value)
		}
	}

	// Count the pages
	let pagesSum = 0
	for (let [key, value] of tableIdPages) {
		pagesSum += value

		if (parallelTableIds.indexOf(key) != -1) {
			pagesOfParallelTable.set(key, value - 1)
		}
	}

	let index = 0
	let currentTableIdIndex = 0
	let parallelTableIdsInserted = false

	while (index < pagesSum) {
		let currentTableId = tableIds[currentTableIdIndex]
		let currentTablePages = tableIdPages.get(currentTableId)

		if (parallelTableIds.indexOf(currentTableId) != -1) {
			// Add the table id once as it belongs to parallel table ids
			preparedTableIds.push(currentTableId)
			index++
		} else {
			// Add it for all pages
			for (let j = 0; j < currentTablePages; j++) {
				preparedTableIds.push(currentTableId)
				index++
			}
		}

		// Check if all parallel table ids are in prepared table ids
		let hasAll = true
		for (let tableId of parallelTableIds) {
			if (preparedTableIds.indexOf(tableId) == -1) {
				hasAll = false
			}
		}

		if (hasAll && !parallelTableIdsInserted) {
			parallelTableIdsInserted = true
			let pagesOfParallelTableSum = 0

			// Update pagesOfParallelTableSum
			for (let [key, value] of pagesOfParallelTable) {
				pagesOfParallelTableSum += value
			}

			// Append the parallel table ids in the right order
			while (pagesOfParallelTableSum > 0) {
				for (let parallelTableId of parallelTableIds) {
					if (pagesOfParallelTable.get(parallelTableId) > 0) {
						preparedTableIds.push(parallelTableId)
						pagesOfParallelTableSum--

						let oldPages = pagesOfParallelTable.get(parallelTableId)
						pagesOfParallelTable.set(parallelTableId, oldPages - 1)

						index++
					}
				}
			}
		}

		currentTableIdIndex++
	}

	return preparedTableIds
}

export async function requestNotificationPermission(): Promise<boolean> {
	return await Notification.requestPermission() == "granted"
}