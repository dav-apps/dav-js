import * as axios from 'axios'
import { Dav } from '../Dav'
import { Auth } from '../models/Auth'
import { ApiErrorResponse, ApiResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'

export interface CreateSessionResponseData{
	jwt: string
}

export async function CreateSession(params: {
	auth: Auth,
	email: string,
	password: string,
	appId: number,
	apiKey: string,
	deviceName?: string,
	deviceType?: string,
	deviceOs?: string
}): Promise<ApiResponse<CreateSessionResponseData> | ApiErrorResponse>{
	try {
		let data = {
			email: params.email,
			password: params.password,
			app_id: params.appId,
			api_key: params.apiKey
		}
		if (params.deviceName != null) data["device_name"] = params.deviceName
		if (params.deviceType != null) data["device_type"] = params.deviceType
		if (params.deviceOs != null) data["device_os"] = params.deviceOs

		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/session`,
			headers: {
				Authorization: params.auth.token
			},
			data
		})

		return {
			status: response.status,
			data: {
				jwt: response.data.jwt
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function CreateSessionFromJwt(params: {
	auth: Auth,
	jwt: string,
	appId: number,
	apiKey: string,
	deviceName?: string,
	deviceType?: string,
	deviceOs?: string
}): Promise<ApiResponse<CreateSessionResponseData> | ApiErrorResponse>{
	try {
		let data = {
			jwt: params.jwt,
			app_id: params.appId,
			api_key: params.apiKey
		}
		if (params.deviceName != null) data["device_name"] = params.deviceName
		if (params.deviceType != null) data["device_type"] = params.deviceType
		if (params.deviceOs != null) data["device_os"] = params.deviceOs

		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/session/jwt`,
			headers: {
				Authorization: params.auth.token
			},
			data
		})

		return {
			status: response.status,
			data: {
				jwt: response.data.jwt
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function DeleteSession(params: {
	jwt: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/session`,
			headers: {
				Authorization: params.jwt
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}