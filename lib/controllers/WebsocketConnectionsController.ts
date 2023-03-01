import axios from "axios"
import { Dav } from "../Dav.js"
import { ApiErrorResponse, ApiResponse } from "../types.js"
import { ConvertErrorToApiErrorResponse, HandleApiError } from "../utils.js"

export interface WebsocketConnectionResponseData {
	token: string
}

export async function CreateWebsocketConnection(params?: {
	accessToken?: string
}): Promise<ApiResponse<WebsocketConnectionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/websocket_connection`,
			headers: {
				Authorization:
					params != null && params.accessToken != null
						? params.accessToken
						: Dav.accessToken
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

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateWebsocketConnection()
	}
}
