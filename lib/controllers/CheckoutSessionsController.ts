import axios from "axios"
import { Dav } from "../Dav.js"
import { ApiResponse, ApiErrorResponse, Currency } from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	HandleApiError,
	PrepareRequestParams
} from "../utils.js"

export interface CreateCheckoutSessionResponseData {
	sessionUrl: string
}

export type CreateCheckoutSessionMode = "setup" | "subscription" | "payment"

export async function CreateCheckoutSession(params: {
	accessToken?: string
	mode?: CreateCheckoutSessionMode
	plan?: number
	currency?: Currency
	productName?: string
	productImage?: string
	tableObjects?: string[]
	successUrl: string
	cancelUrl: string
}): Promise<ApiResponse<CreateCheckoutSessionResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/checkout_session`,
			headers: {
				Authorization:
					params.accessToken != null
						? params.accessToken
						: Dav.accessToken,
				"Content-Type": "application/json"
			},
			data: PrepareRequestParams({
				mode: params.mode,
				plan: params.plan,
				currency: params.currency,
				product_name: params.productName,
				product_image: params.productImage,
				table_objects: params.tableObjects,
				success_url: params.successUrl,
				cancel_url: params.cancelUrl
			})
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
