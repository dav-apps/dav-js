import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { WebPushSubscriptionResource, ErrorCode } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function retrieveWebPushSubscription(
	queryData: string,
	variables: {
		accessToken?: string
		uuid: string
	}
): Promise<WebPushSubscriptionResource | ErrorCode[]> {
	try {
		let response = await request<{
			webPushSubscription: WebPushSubscriptionResource
		}>(
			Dav.apiBaseUrl,
			gql`
				query RetrieveWebPushSubscription($uuid: String!) {
					retrieveWebPushSubscription(uuid: $uuid) {
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

		return response.webPushSubscription
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await retrieveWebPushSubscription(queryData, variables)
	}
}

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
			Dav.apiBaseUrl,
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
