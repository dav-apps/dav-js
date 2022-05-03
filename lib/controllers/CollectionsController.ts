import axios from 'axios'
import { Dav } from '../Dav.js'
import { Auth } from '../models/Auth.js'
import { ApiResponse, ApiErrorResponse } from '../types.js'
import { ConvertErrorToApiErrorResponse, PrepareRequestParams } from '../utils.js'

export interface CollectionResponseData {
	Id: number
	TableId: number
	Name: string
}

export async function SetTableObjectsOfCollection(params: {
	auth: Auth,
	name: string,
	tableId: number,
	tableObjects: string[]
}): Promise<ApiResponse<CollectionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: 'put',
			url: `${Dav.apiBaseUrl}/collection/table_objects`,
			headers: {
				Authorization: params.auth.token,
				'Content-Type': 'application/json'
			},
			data: PrepareRequestParams({
				name: params.name,
				table_id: params.tableId,
				table_objects: params.tableObjects
			})
		})

		return {
			status: response.status,
			data: {
				Id: response.data.id,
				TableId: response.data.table_id,
				Name: response.data.name
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}