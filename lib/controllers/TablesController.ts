import axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiResponse, ApiErrorResponse } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils.js'
import { Table } from '../models/Table.js'

export interface GetTableResponseData {
	table: Table
	pages: number
	etag: string
	tableObjects: {
		uuid: string
		etag: string
	}[]
}

export async function CreateTable(params: {
	accessToken?: string,
	appId: number,
	name: string
}): Promise<ApiResponse<Table> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: 'post',
			url: `${Dav.apiBaseUrl}/table`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: {
				app_id: params.appId,
				name: params.name
			}
		})

		return {
			status: response.status,
			data: new Table(
				response.data.id,
				response.data.app_id,
				response.data.name
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateTable(params)
	}
}

export async function GetTable(params: {
	accessToken?: string,
	id: number,
	count?: number,
	page?: number
}): Promise<ApiResponse<GetTableResponseData> | ApiErrorResponse> {
	try {
		let urlParams = {}
		if (params.count != null) urlParams["count"] = params.count
		if (params.page != null) urlParams["page"] = params.page

		let response = await axios({
			method: 'get',
			url: `${Dav.apiBaseUrl}/table/${params.id}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			params: urlParams
		})

		return {
			status: response.status,
			data: {
				table: new Table(
					response.data.id,
					response.data.app_id,
					response.data.name
				),
				pages: response.data.pages,
				etag: response.data.etag,
				tableObjects: response.data.table_objects
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetTable(params)
	}
}
