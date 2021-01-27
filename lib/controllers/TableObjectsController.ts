import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiErrorResponse, ApiResponse, TableObjectUploadStatus } from '../types'
import { HandleApiError } from '../utils'
import { TableObject } from '../models/TableObject'

export async function CreateTableObject(params: {
	uuid?: string,
	tableId: number,
	file?: boolean,
	properties?: { [name: string]: string | boolean | number }
}): Promise<ApiResponse<TableObject> | ApiErrorResponse> {
	try {
		let data = {
			table_id: params.tableId
		}
		if (params.uuid != null) data["uuid"] = params.uuid
		if (params.file != null) data["file"] = params.file
		if (params.properties != null) data["properties"] = params.properties

		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/table_object`,
			headers: {
				Authorization: Dav.accessToken
			},
			data
		})

		let tableObject = new TableObject(response.data.uuid)
		tableObject.TableId = response.data.table_id
		tableObject.IsFile = response.data.file
		tableObject.Etag = response.data.etag
		tableObject.UploadStatus = TableObjectUploadStatus.UpToDate

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}
		
		return {
			status: response.status,
			data: tableObject
		}
	} catch (error) {
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CreateTableObject(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function GetTableObject(params: {
	uuid: string
}): Promise<ApiResponse<TableObject> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: Dav.accessToken
			}
		})

		let tableObject = new TableObject(response.data.uuid)
		tableObject.TableId = response.data.table_id
		tableObject.IsFile = response.data.file
		tableObject.Etag = response.data.etag

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: tableObject
		}
	} catch (error) {
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await GetTableObject(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function UpdateTableObject(params: {
	uuid: string,
	properties: { [name: string]: string | boolean | number }
}): Promise<ApiResponse<TableObject> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'put',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: Dav.accessToken
			},
			data: {
				properties: params.properties
			}
		})

		let tableObject = new TableObject(response.data.uuid)
		tableObject.TableId = response.data.table_id
		tableObject.IsFile = response.data.file
		tableObject.Etag = response.data.etag

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: tableObject
		}
	} catch (error) {
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await UpdateTableObject(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function DeleteTableObject(params: {
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await DeleteTableObject(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function SetTableObjectFile(params: {
	uuid: string,
	file: Blob
}): Promise<ApiResponse<TableObject> | ApiErrorResponse> {
	// Read the blob
	let readFilePromise: Promise<ProgressEvent> = new Promise((resolve) => {
		let fileReader = new FileReader()
		fileReader.onloadend = resolve
		fileReader.readAsArrayBuffer(params.file)
	})
	let readFileResult: ProgressEvent = await readFilePromise
	let data = readFileResult.currentTarget["result"]

	try {
		let response = await axios.default({
			method: 'put',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}/file`,
			headers: {
				Authorization: Dav.accessToken,
				'Content-Type': params.file.type
			},
			data
		})

		let tableObject = new TableObject(response.data.uuid)
		tableObject.TableId = response.data.table_id
		tableObject.IsFile = response.data.file
		tableObject.Etag = response.data.etag

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: tableObject
		}
	} catch (error) {
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await SetTableObjectFile(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function RemoveTableObject(params: {
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}/access`,
			headers: {
				Authorization: Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await RemoveTableObject(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}