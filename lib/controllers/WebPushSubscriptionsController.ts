import * as axios from 'axios'
import { Dav } from '../Dav'
import { WebPushSubscription } from '../models/WebPushSubscription'
import { ApiResponse, ApiErrorResponse, WebPushSubscriptionUploadStatus } from '../types'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils'

export async function CreateWebPushSubscription(params: {
	accessToken?: string,
	uuid?: string,
	endpoint: string,
	p256dh: string,
	auth: string
}): Promise<ApiResponse<WebPushSubscription> | ApiErrorResponse> {
	try {
		let data = {
			endpoint: params.endpoint,
			p256dh: params.p256dh,
			auth: params.auth
		}
		if (params.uuid != null) data["uuid"] = params.uuid

		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/web_push_subscription`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data
		})

		return {
			status: response.status,
			data: new WebPushSubscription(
				response.data.uuid,
				response.data.endpoint,
				response.data.p256dh,
				response.data.auth,
				WebPushSubscriptionUploadStatus.UpToDate
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await CreateWebPushSubscription(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function GetWebPushSubscription(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<WebPushSubscription> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/web_push_subscription/${params.uuid}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: new WebPushSubscription(
				response.data.uuid,
				response.data.endpoint,
				response.data.p256dh,
				response.data.auth
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await GetWebPushSubscription(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}

export async function DeleteWebPushSubscription(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/web_push_subscription/${params.uuid}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: new WebPushSubscription(
				response.data.uuid,
				response.data.endpoint,
				response.data.p256dh,
				response.data.auth
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let result = await HandleApiError(error)

		if (typeof result == "string") {
			return await DeleteWebPushSubscription(params)
		} else {
			return result as ApiErrorResponse
		}
	}
}