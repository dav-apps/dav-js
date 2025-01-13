import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ErrorCode, CustomerPortalSessionResource } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function createCustomerPortalSession(
	queryData: string,
	variables?: {
		accessToken?: string
	}
): Promise<CustomerPortalSessionResource | ErrorCode[]> {
	try {
		let response = await request<{
			createCustomerPortalSession: CustomerPortalSessionResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateCustomerPortalSession {
					createCustomerPortalSession {
						${queryData}
					}
				}
			`,
			{},
			{
				Authorization: variables?.accessToken ?? Dav.accessToken
			}
		)

		return response.createCustomerPortalSession
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables?.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createCustomerPortalSession(queryData, variables)
	}
}
