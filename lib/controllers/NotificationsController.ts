import { request, gql, ClientError } from "graphql-request"
import axios from "axios"
import { Dav } from "../Dav.js"
import {
	ApiResponse,
	ApiErrorResponse,
	GenericUploadStatus,
	ErrorCode,
	List,
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
import { Notification } from "../models/Notification.js"

export async function listNotifications(
	queryData: string,
	variables?: {
		accessToken?: string
	}
): Promise<List<NotificationResource> | ErrorCode[]> {
	try {
		let response = await request<{
			listNotifications: List<NotificationResource>
		}>(
			Dav.newApiBaseUrl,
			gql`
				query ListNotifications {
					listNotifications {
						${queryData}
					}
				}
			`,
			{},
			{
				Authorization: variables?.accessToken ?? Dav.accessToken
			}
		)

		return response.listNotifications
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables?.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await listNotifications(queryData, variables)
	}
}

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

export async function updateNotification(
	queryData: string,
	variables: {
		accessToken?: string
		uuid: string
		time?: number
		interval?: number
		title?: string
		body?: string
		icon?: string
		image?: string
		href?: string
	}
): Promise<NotificationResource | ErrorCode[]> {
	try {
		let response = await request<{
			updateNotification: NotificationResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation UpdateNotification(
					$uuid: String!
					$time: Int
					$interval: Int
					$title: String
					$body: String
					$icon: String
					$image: String
					$href: String
				) {
					updateNotification(
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
			{
				uuid: variables.uuid,
				time: variables.time,
				interval: variables.interval,
				title: variables.title,
				body: variables.body,
				icon: variables.icon,
				image: variables.image,
				href: variables.href
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.updateNotification
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await updateNotification(queryData, variables)
	}
}

export async function deleteNotification(
	queryData: string,
	variables: {
		accessToken?: string
		uuid: string
	}
): Promise<NotificationResource | ErrorCode[]> {
	try {
		let response = await request<{
			deleteNotification: NotificationResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation DeleteNotification($uuid: String!) {
					deleteNotification(uuid: $uuid) {
						${queryData}
					}
				}
			`,
			{
				uuid: variables.uuid
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.deleteNotification
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await deleteNotification(queryData, variables)
	}
}
