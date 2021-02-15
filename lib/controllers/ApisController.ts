import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils'
import { Api } from '../models/Api'
import { ConvertObjectArrayToApiEndpoints } from '../models/ApiEndpoint'
import { ConvertObjectArrayToApiFunctions } from '../models/ApiFunction'
import { ConvertObjectArrayToApiErrors } from '../models/ApiError'

export async function CreateApi(params: {
	accessToken?: string,
	appId: number,
	name: string
}): Promise<ApiResponse<Api> | ApiErrorResponse> {
	try {
		let response = await axios.default({
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

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CreateApi(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function GetApi(params: {
	accessToken?: string,
	id: number
}): Promise<ApiResponse<Api> | ApiErrorResponse>{
	try {
		let response = await axios.default({
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

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await GetApi(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}