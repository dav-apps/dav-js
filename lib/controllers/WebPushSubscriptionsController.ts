import * as axios from 'axios'
import { Dav } from '../Dav'
import { WebPushSubscription } from '../models/WebPushSubscription'
import { ApiResponse, ApiErrorResponse, WebPushSubscriptionUploadStatus } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'

export async function CreateWebPushSubscription(params: {
	jwt: string,
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
		if(params.uuid != null) data["uuid"] = params.uuid

		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/web_push_subscription`,
			headers: {
				Authorization: params.jwt
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
		return ConvertErrorToApiErrorResponse(error)
	}
}