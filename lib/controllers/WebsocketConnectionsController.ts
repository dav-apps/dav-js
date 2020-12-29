import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiErrorResponse, ApiResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'

export interface WebsocketConnectionResponseData{
	token: string
}

export async function CreateWebsocketConnection(params: {
	jwt: string
}): Promise<ApiResponse<WebsocketConnectionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/websocket_connection`,
			headers: {
				Authorization: params.jwt
			}
		})

		return {
			status: response.status,
			data: {
				token: response.data.token
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}