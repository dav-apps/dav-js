import axios from 'axios'
import { Dav } from '../Dav.js'
import { WebPushSubscription } from '../models/WebPushSubscription.js'
import { ApiResponse, ApiErrorResponse, WebPushSubscriptionUploadStatus } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError, PrepareRequestParams } from '../utils.js'

export async function CreateWebPushSubscription(params: {
	accessToken?: string,
	uuid?: string,
	endpoint: string,
	p256dh: string,
	auth: string
}): Promise<ApiResponse<WebPushSubscription> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: 'post',
			url: `${Dav.apiBaseUrl}/web_push_subscription`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: PrepareRequestParams({
				uuid: params.uuid,
				endpoint: params.endpoint,
				p256dh: params.p256dh,
				auth: params.auth
			})
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

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateWebPushSubscription(params)
	}
}

export async function GetWebPushSubscription(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<WebPushSubscription> | ApiErrorResponse> {
	try {
		let response = await axios({
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

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetWebPushSubscription(params)
	}
}

export async function DeleteWebPushSubscription(params: {
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
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

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await DeleteWebPushSubscription(params)
	}
}