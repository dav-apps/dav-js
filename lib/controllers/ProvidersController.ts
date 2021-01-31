import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { HandleApiError } from '../utils'

export interface ProviderResponseData {
	id: number
	userId: number
	stripeAccountId: string
}

export async function CreateProvider(params: {
	country: string
}): Promise<ApiResponse<ProviderResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/provider`,
			headers: {
				Authorization: Dav.accessToken
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
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CreateProvider(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function GetProvider(): Promise<ApiResponse<ProviderResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/provider`,
			headers: {
				Authorization: Dav.accessToken
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
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await GetProvider()
		} else {
			return result as ApiErrorResponse
		}
	}
}