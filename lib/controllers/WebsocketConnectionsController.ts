import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiErrorResponse, ApiResponse } from '../types'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils'

export interface WebsocketConnectionResponseData{
	token: string
}

export async function CreateWebsocketConnection(params?: {
	accessToken?: string
}): Promise<ApiResponse<WebsocketConnectionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/websocket_connection`,
			headers: {
				Authorization: params != null && params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {
				token: response.data.token
			}
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CreateWebsocketConnection()
		} else {
			return result as ApiErrorResponse
		}
	}
}