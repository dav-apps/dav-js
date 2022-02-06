import axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiResponse, ApiErrorResponse } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils.js'

export interface CreateCheckoutSessionResponseData {
	sessionUrl: string
}

export async function CreateCheckoutSession(params: {
	accessToken?: string,
	plan: number,
	successUrl: string,
	cancelUrl: string
}): Promise<ApiResponse<CreateCheckoutSessionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: 'post',
			url: `${Dav.apiBaseUrl}/checkout_session`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken,
				'Content-Type': 'application/json'
			},
			data: {
				plan: params.plan,
				success_url: params.successUrl,
				cancel_url: params.cancelUrl
			}
		})

		return {
			status: response.status,
			data: {
				sessionUrl: response.data.session_url
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateCheckoutSession(params)
	}
}