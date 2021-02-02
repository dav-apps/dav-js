import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { HandleApiError } from '../utils'
import { Currency, Purchase } from '../models/Purchase'

export async function CreatePurchase(params: {
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
				Authorization: Dav.accessToken
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
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CreatePurchase(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function GetPurchase(params: {
	id: number
}): Promise<ApiResponse<Purchase> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/purchase/${params.id}`,
			headers: {
				Authorization: Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {
				Id: response.data.id,
				UserId: response.data.user_id,
				TableObjectId: response.data.table_object_id,
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
		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await GetPurchase(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}