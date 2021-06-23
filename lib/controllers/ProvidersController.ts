import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils'

export interface ProviderResponseData {
	id: number
	userId: number
	stripeAccountId: string
}

export async function CreateProvider(params: {
	accessToken?: string,
	country: string
}): Promise<ApiResponse<ProviderResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/provider`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: {
				country: params.country
			}
		})

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				stripeAccountId: response.data.stripe_account_id
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateProvider(params)
	}
}

export async function GetProvider(params?: {
	accessToken?: string
}): Promise<ApiResponse<ProviderResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/provider`,
			headers: {
				Authorization: params != null && params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				stripeAccountId: response.data.stripe_account_id
			}
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetProvider()
	}
}