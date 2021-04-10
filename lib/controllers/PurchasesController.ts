import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse, Currency } from '../types'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils'
import { Auth } from '../models/Auth'
import { Purchase } from '../models/Purchase'

export async function CreatePurchase(params: {
	accessToken?: string,
	tableObjectUuid: string,
	providerName: string,
	providerImage: string,
	productName: string,
	productImage: string,
	currency: Currency
}): Promise<ApiResponse<Purchase> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/table_object/${params.tableObjectUuid}/purchase`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: {
				provider_name: params.providerName,
				provider_image: params.providerImage,
				product_name: params.productName,
				product_image: params.productImage,
				currency: params.currency
			}
		})

		return {
			status: response.status,
			data: {
				Id: response.data.id,
				UserId: response.data.user_id,
				TableObjectId: response.data.table_object_id,
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
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CreatePurchase(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function GetPurchase(params: {
	auth: Auth,
	uuid: string
}): Promise<ApiResponse<Purchase> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
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
				TableObjectId: response.data.table_object_id,
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

export async function CompletePurchase(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<Purchase> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/purchase/${params.uuid}/complete`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {
				Id: response.data.id,
				UserId: response.data.user_id,
				TableObjectId: response.data.table_object_id,
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
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CompletePurchase(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}