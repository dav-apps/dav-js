import * as axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiResponse, ApiErrorResponse, GenericUploadStatus } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils.js'
import { Notification, ConvertObjectArrayToNotifications } from '../models/Notification.js'

export async function CreateNotification(params: {
	accessToken?: string,
	uuid?: string,
	time: number,
	interval: number,
	title: string,
	body: string
}): Promise<ApiResponse<Notification> | ApiErrorResponse> {
	try {
		let data = {
			time: params.time,
			interval: params.interval,
			title: params.title,
			body: params.body
		}
		if (params.uuid != null) data["uuid"] = params.uuid
		
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/notification`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data
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
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/notifications`,
			headers: {
				Authorization: params != null && params.accessToken != null ? params.accessToken : Dav.accessToken
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
	accessToken?: string,
	uuid: string,
	time?: number,
	interval?: number,
	title?: string,
	body?: string
}): Promise<ApiResponse<Notification> | ApiErrorResponse>{
	try {
		let data = {}
		if (params.time != null) data["time"] = params.time
		if (params.interval != null) data["interval"] = params.interval
		if (params.title != null) data["title"] = params.title
		if (params.body != null) data["body"] = params.body
		
		let response = await axios.default({
			method: 'put',
			url: `${Dav.apiBaseUrl}/notification/${params.uuid}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data
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
	accessToken?: string,
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse>{
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/notification/${params.uuid}`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
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