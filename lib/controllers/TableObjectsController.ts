import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiErrorResponse, ApiResponse, TableObjectUploadStatus } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'
import { TableObject } from '../models/TableObject'

export async function CreateTableObject(params: {
	accessToken: string,
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
				Authorization: params.accessToken
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
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function GetTableObject(params: {
	accessToken: string,
	uuid: string
}): Promise<ApiResponse<TableObject> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: params.accessToken
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
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function UpdateTableObject(params: {
	accessToken: string,
	uuid: string,
	properties: { [name: string]: string | boolean | number }
}): Promise<ApiResponse<TableObject> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'put',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: params.accessToken
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
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function DeleteTableObject(params: {
	accessToken: string,
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: params.accessToken
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function SetTableObjectFile(params: {
	accessToken: string,
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
				Authorization: params.accessToken,
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
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function RemoveTableObject(params: {
	accessToken: string,
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}/access`,
			headers: {
				Authorization: params.accessToken
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}