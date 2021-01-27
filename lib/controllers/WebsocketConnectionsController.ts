import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiErrorResponse, ApiResponse } from '../types'
import { HandleApiError } from '../utils'

export interface WebsocketConnectionResponseData{
	token: string
}

export async function CreateWebsocketConnection(): Promise<ApiResponse<WebsocketConnectionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/websocket_connection`,
			headers: {
				Authorization: Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {
				token: response.data.token
			}
		}
	} catch (error) {
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CreateWebsocketConnection()
		} else {
			return result as ApiErrorResponse
		}
	}
}