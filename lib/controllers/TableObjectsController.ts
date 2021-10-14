import * as axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiErrorResponse, ApiResponse, TableObjectUploadStatus } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils.js'
import { TableObject } from '../models/TableObject.js'

export async function CreateTableObject(params: {
	accessToken?: string,
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
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data
		})

		let tableObject = new TableObject({
			Uuid: response.data.uuid,
			TableId: response.data.table_id,
			IsFile: response.data.file,
			UploadStatus: TableObjectUploadStatus.UpToDate,
			Etag: response.data.etag,
			BelongsToUser: response.data.belongs_to_user,
			Purchase: response.data.purchase
		})

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}
		
		return {
			status: response.status,
			data: tableObject
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateTableObject(params)
	}
}

export async function GetTableObject(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<TableObject> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		let tableObject = new TableObject({
			Uuid: response.data.uuid,
			TableId: response.data.table_id,
			IsFile: response.data.file,
			Etag: response.data.etag,
			BelongsToUser: response.data.belongs_to_user,
			Purchase: response.data.purchase
		})

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: tableObject
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetTableObject(params)
	}
}

export async function UpdateTableObject(params: {
	accessToken?: string,
	uuid: string,
	properties: { [name: string]: string | boolean | number }
}): Promise<ApiResponse<TableObject> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'put',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: {
				properties: params.properties
			}
		})

		let tableObject = new TableObject({
			Uuid: response.data.uuid,
			TableId: response.data.table_id,
			IsFile: response.data.file,
			Etag: response.data.etag,
			BelongsToUser: response.data.belongs_to_user,
			Purchase: response.data.purchase
		})

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: tableObject
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await UpdateTableObject(params)
	}
}

export async function DeleteTableObject(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await DeleteTableObject(params)
	}
}

export async function SetTableObjectFile(params: {
	accessToken?: string,
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
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken,
				'Content-Type': params.file.type
			},
			data
		})

		let tableObject = new TableObject({
			Uuid: response.data.uuid,
			TableId: response.data.table_id,
			IsFile: response.data.file,
			Etag: response.data.etag,
			BelongsToUser: response.data.belongs_to_user,
			Purchase: response.data.purchase
		})

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: tableObject
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await SetTableObjectFile(params)
	}
}

export async function GetTableObjectFile(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<Blob> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}/file`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			responseType: 'blob'
		})

		return {
			status: response.status,
			data: response.data as Blob
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetTableObjectFile(params)
	}
}

export async function RemoveTableObject(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}/access`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await RemoveTableObject(params)
	}
}