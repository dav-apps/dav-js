import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils'
import { App, ConvertObjectArrayToApps } from '../models/App'

export interface GetDevResponseData{
	id: number,
	apps: App[]
}

export async function GetDev(params?: {
	accessToken?: string
}): Promise<ApiResponse<GetDevResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/dev`,
			headers: {
				Authorization: params != null && params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {
				id: response.data.id,
				apps: ConvertObjectArrayToApps(response.data.apps)
			}
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await GetDev(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}