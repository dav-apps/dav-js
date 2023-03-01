import axios from "axios"
import { Dav } from "../Dav.js"
import { ApiResponse, ApiErrorResponse } from "../types.js"
import { ConvertErrorToApiErrorResponse, HandleApiError } from "../utils.js"
import { App, ConvertObjectArrayToApps } from "../models/App.js"

export interface GetDevResponseData {
	id: number
	apps: App[]
}

export async function GetDev(params?: {
	accessToken?: string
}): Promise<ApiResponse<GetDevResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/dev`,
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
				id: response.data.id,
				apps: ConvertObjectArrayToApps(response.data.apps)
			}
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetDev(params)
	}
}
