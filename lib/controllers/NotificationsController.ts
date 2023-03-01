import axios from "axios"
import { Dav } from "../Dav.js"
import { ApiResponse, ApiErrorResponse, GenericUploadStatus } from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	HandleApiError,
	PrepareRequestParams
} from "../utils.js"
import {
	Notification,
	ConvertObjectArrayToNotifications
} from "../models/Notification.js"

export async function CreateNotification(params: {
	accessToken?: string
	uuid?: string
	time: number
	interval: number
	title: string
	body: string
}): Promise<ApiResponse<Notification> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/notification`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: PrepareRequestParams({
				uuid: params.uuid,
				time: params.time,
				interval: params.interval,
				title: params.title,
				body: params.body
			})
		})

		return {
			status: response.status,
			data: new Notification({
				Uuid: response.data.uuid,
				Time: response.data.time,
				Interval: response.data.interval,
				Title: response.data.title,
				Body: response.data.body,
				UploadStatus: GenericUploadStatus.UpToDate
			})
		}
	} catch (error) {
		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateNotification(params)
	}
}

export async function GetNotifications(params?: {
	accessToken?: string
}): Promise<ApiResponse<Notification[]> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/notifications`,
			headers: {
				Authorization:
					params != null && params.accessToken != null
						? params.accessToken
						: Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: ConvertObjectArrayToNotifications(response.data.notifications)
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetNotifications()
	}
}

export async function UpdateNotification(params: {
	accessToken?: string
	uuid: string
	time?: number
	interval?: number
	title?: string
	body?: string
}): Promise<ApiResponse<Notification> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.apiBaseUrl}/notification/${params.uuid}`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: PrepareRequestParams({
				time: params.time,
				interval: params.interval,
				title: params.title,
				body: params.body
			})
		})

		return {
			status: response.status,
			data: new Notification({
				Uuid: response.data.uuid,
				Time: response.data.time,
				Interval: response.data.interval,
				Title: response.data.title,
				Body: response.data.body,
				UploadStatus: GenericUploadStatus.UpToDate
			})
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await UpdateNotification(params)
	}
}

export async function DeleteNotification(params: {
	accessToken?: string
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "delete",
			url: `${Dav.apiBaseUrl}/notification/${params.uuid}`,
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

		return await DeleteNotification(params)
	}
}
