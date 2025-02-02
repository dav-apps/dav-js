import { request, gql, ClientError } from "graphql-request"
import axios from "axios"
import { Dav } from "../Dav.js"
import { WebPushSubscription } from "../models/WebPushSubscription.js"
import {
	ApiResponse,
	ApiErrorResponse,
	WebPushSubscriptionResource,
	ErrorCode
} from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	HandleApiError,
	getErrorCodesOfGraphQLError,
	handleGraphQLErrors
} from "../utils.js"

export async function createWebPushSubscription(
	queryData: string,
	variables: {
		accessToken?: string
		uuid?: string
		endpoint: string
		p256dh: string
		auth: string
	}
): Promise<WebPushSubscriptionResource | ErrorCode[]> {
	try {
		let response = await request<{
			createWebPushSubscription: WebPushSubscriptionResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateWebPushSubscription(
					$uuid: String
					$endpoint: String!
					$p256dh: String!
					$auth: String!
				) {
					createWebPushSubscription(
						uuid: $uuid
						endpoint: $endpoint
						p256dh: $p256dh
						auth: $auth
					) {
						${queryData}
					}
				}
			`,
			{
				uuid: variables.uuid,
				endpoint: variables.endpoint,
				p256dh: variables.p256dh,
				auth: variables.auth
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.createWebPushSubscription
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createWebPushSubscription(queryData, variables)
	}
}

export async function GetWebPushSubscription(params: {
	accessToken?: string
	uuid: string
}): Promise<ApiResponse<WebPushSubscription> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/web_push_subscription/${params.uuid}`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
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
