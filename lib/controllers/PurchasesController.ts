import axios from "axios"
import { Dav } from "../Dav.js"
import { ApiResponse, ApiErrorResponse, Currency } from "../types.js"
import { ConvertErrorToApiErrorResponse, HandleApiError } from "../utils.js"
import { Auth } from "../models/Auth.js"
import { Purchase } from "../models/Purchase.js"

export async function GetPurchase(params: {
	auth: Auth
	uuid: string
}): Promise<ApiResponse<Purchase> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/purchase/${params.uuid}`,
			headers: {
				Authorization: params.auth.token
			}
		})

		return {
			status: response.status,
			data: {
				Id: response.data.id,
				UserId: response.data.user_id,
				Uuid: response.data.uuid,
				PaymentIntentId: response.data.payment_intent_id,
				ProviderName: response.data.provider_name,
				ProviderImage: response.data.provider_image,
				ProductName: response.data.product_name,
				ProductImage: response.data.product_image,
				Price: response.data.price,
				Currency: response.data.currency,
				Completed: response.data.completed
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function DeletePurchase(params: {
	accessToken?: string
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "delete",
			url: `${Dav.apiBaseUrl}/purchase/${params.uuid}`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await DeletePurchase(params)
	}
}
