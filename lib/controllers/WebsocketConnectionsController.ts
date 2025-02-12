import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { WebsocketConnectionResource, ErrorCode } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function createWebsocketConnection(
	queryData: string,
	variables?: {
		accessToken?: string
	}
): Promise<WebsocketConnectionResource | ErrorCode[]> {
	try {
		let response = await request<{
			createWebsocketConnection: WebsocketConnectionResource
		}>(
			Dav.apiBaseUrl,
			gql`
				query CreateWebsocketConnection {
					createWebsocketConnection {
						${queryData}
					}
				}
			`,
			{},
			{
				Authorization: variables?.accessToken ?? Dav.accessToken
			}
		)

		return response.createWebsocketConnection
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createWebsocketConnection(queryData, variables)
	}
}
