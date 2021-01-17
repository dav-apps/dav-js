import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'
import { App, ConvertObjectArrayToApps } from '../models/App'

export interface GetDevResponseData{
	id: number,
	apps: App[]
}

export async function GetDev(params: {
	jwt: string
}): Promise<ApiResponse<GetDevResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/dev`,
			headers: {
				Authorization: params.jwt
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
		return ConvertErrorToApiErrorResponse(error)
	}
}