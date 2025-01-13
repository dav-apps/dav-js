import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ErrorCode, CheckoutSessionResource, Plan } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function createSubscriptionCheckoutSession(
	queryData: string,
	variables: {
		accessToken?: string
		plan: Plan
		successUrl: string
		cancelUrl: string
	}
): Promise<CheckoutSessionResource | ErrorCode[]> {
	try {
		let response = await request<{
			createSubscriptionCheckoutSession: CheckoutSessionResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateSubscriptionCheckoutSession(
					$plan: Plan!
					$successUrl: String!
					$cancelUrl: String!
				) {
					createSubscriptionCheckoutSession(
						plan: $plan
						successUrl: $successUrl
						cancelUrl: $cancelUrl
					) {
						${queryData}			
					}
				}
			`,
			{
				plan: variables.plan,
				successUrl: variables.successUrl,
				cancelUrl: variables.cancelUrl
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.createSubscriptionCheckoutSession
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createSubscriptionCheckoutSession(queryData, variables)
	}
}
