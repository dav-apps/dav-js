import axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiResponse, ApiErrorResponse } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils.js'
import { Api } from '../models/Api.js'
import { ConvertObjectArrayToApiEndpoints } from '../models/ApiEndpoint.js'
import { ConvertObjectArrayToApiFunctions } from '../models/ApiFunction.js'
import { ConvertObjectArrayToApiErrors } from '../models/ApiError.js'

export async function CreateApi(params: {
	accessToken?: string,
	appId: number,
	name: string
}): Promise<ApiResponse<Api> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: 'post',
			url: `${Dav.apiBaseUrl}/api`,
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
			data: new Api(
				response.data.id,
				response.data.name,
				[],
				[],
				[]
			)
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

export async function GetApi(params: {
	accessToken?: string,
	id: number
}): Promise<ApiResponse<Api> | ApiErrorResponse>{
	try {
		let response = await axios({
			method: 'get',
			url: `${Dav.apiBaseUrl}/api/${params.id}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: new Api(
				response.data.id,
				response.data.name,
				ConvertObjectArrayToApiEndpoints(response.data.endpoints),
				ConvertObjectArrayToApiFunctions(response.data.functions),
				ConvertObjectArrayToApiErrors(response.data.errors)
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetApi(params)
	}
}