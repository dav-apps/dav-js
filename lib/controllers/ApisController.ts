import axios from "axios"
import { Dav } from "../Dav.js"
import { ApiResponse, ApiErrorResponse } from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	HandleApiError,
	PrepareRequestParams
} from "../utils.js"
import { Api } from "../models/Api.js"

export async function CreateApi(params: {
	accessToken?: string
	appId: number
	name: string
}): Promise<ApiResponse<Api> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/api`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: PrepareRequestParams({
				app_id: params.appId,
				name: params.name
			})
		})

		return {
			status: response.status,
			data: new Api(response.data.id, response.data.name, [], [], [])
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateApi(params)
	}
}
