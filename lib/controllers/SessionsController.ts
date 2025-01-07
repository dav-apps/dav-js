import axios from "axios"
import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { Auth } from "../models/Auth.js"
import { ApiResponse, ApiErrorResponse, ErrorCode } from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	getErrorCodesOfGraphQLError,
	PrepareRequestParams
} from "../utils.js"

export interface SessionResponseData {
	accessToken: string
	websiteAccessToken?: string
}

export async function CreateSession(params: {
	auth: Auth
	email: string
	password: string
	appId: number
	apiKey: string
	deviceName?: string
	deviceOs?: string
}): Promise<ApiResponse<SessionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/session`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				email: params.email,
				password: params.password,
				app_id: params.appId,
				api_key: params.apiKey,
				device_name: params.deviceName,
				device_os: params.deviceOs
			})
		})

		return {
			status: response.status,
			data: {
				accessToken: response.data.access_token,
				websiteAccessToken: response.data.website_access_token
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function CreateSessionFromAccessToken(params: {
	auth: Auth
	accessToken: string
	appId: number
	apiKey: string
	deviceName?: string
	deviceOs?: string
}): Promise<ApiResponse<SessionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/session/access_token`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				access_token: params.accessToken,
				app_id: params.appId,
				api_key: params.apiKey,
				device_name: params.deviceName,
				device_os: params.deviceOs
			})
		})

		return {
			status: response.status,
			data: {
				accessToken: response.data.access_token
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function renewSession(
	queryData: string,
	variables: {
		accessToken: string
	}
): Promise<SessionResponseData | ErrorCode[]> {
	try {
		let response = await request<{ renewSession: SessionResponseData }>(
			Dav.newApiBaseUrl,
			gql`
				mutation RenewSession {
					renewSession {
						${queryData}
					}
				}
			`,
			{},
			{
				Authorization: variables.accessToken
			}
		)

		if (response.renewSession == null) {
			return null
		} else {
			response.renewSession
		}
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function RenewSession(params: {
	accessToken: string
}): Promise<ApiResponse<SessionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.apiBaseUrl}/session/renew`,
			headers: {
				Authorization: params.accessToken
			}
		})

		return {
			status: response.status,
			data: {
				accessToken: response.data.access_token
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function DeleteSession(params: {
	accessToken: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "delete",
			url: `${Dav.apiBaseUrl}/session`,
			headers: {
				Authorization: params.accessToken
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
