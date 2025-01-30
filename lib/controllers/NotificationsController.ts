import { request, gql, ClientError } from "graphql-request"
import axios from "axios"
import { Dav } from "../Dav.js"
import {
	ApiResponse,
	ApiErrorResponse,
	GenericUploadStatus,
	ErrorCode,
	NotificationResource
} from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	getErrorCodesOfGraphQLError,
	HandleApiError,
	PrepareRequestParams,
	handleGraphQLErrors
} from "../utils.js"
import { Auth } from "../models/Auth.js"
import {
	Notification,
	ConvertObjectArrayToNotifications
} from "../models/Notification.js"

export async function createNotification(
	queryData: string,
	variables: {
		accessToken?: string
		uuid?: string
		time: number
		interval: number
		title: string
		body: string
		icon?: string
		image?: string
		href?: string
	}
): Promise<NotificationResource | ErrorCode[]> {
	try {
		let response = await request<{
			createNotification: NotificationResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateNotification(
					$uuid: String
					$time: Int!
					$interval: Int!
					$title: String!
					$body: String!
					$icon: String
					$image: String
					$href: String
				) {
					createNotification(
						uuid: $uuid
						time: $time
						interval: $interval
						title: $title
						body: $body
						icon: $icon
						image: $image
						href: $href
					) {
						${queryData}
					}
				}
			`,
			variables,
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.createNotification
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createNotification(queryData, variables)
	}
}

export async function createNotificationForUser(
	queryData: string,
	variables: {
		auth: Auth
		uuid?: string
		userId: number
		appId: number
		time: number
		interval: number
		title: string
		body: string
		icon?: string
		image?: string
		href?: string
	}
): Promise<NotificationResource | ErrorCode[]> {
	try {
		let response = await request<{
			createNotificationForUser: NotificationResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateNotificationForUser(
					$uuid: String
					$userId: Int!
					$appId: Int!
					$time: Int!
					$interval: Int!
					$title: String!
					$body: String!
					$icon: String
					$image: String
					$href: String
				) {
					createNotificationForUser(
						uuid: $uuid
						userId: $userId
						appId: $appId
						time: $time
						interval: $interval
						title: $title
						body: $body
						icon: $icon
						image: $image
						href: $href
					) {
						${queryData}
					}
				}
			`,
			variables,
			{
				Authorization: variables.auth.token
			}
		)

		return response.createNotificationForUser
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
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
