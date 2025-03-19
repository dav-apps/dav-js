import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import {
	ErrorCode,
	CheckoutSessionResource,
	Plan,
	TableObjectPriceType,
	Currency
} from "../types.js"
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
			Dav.apiBaseUrl,
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

export async function createPaymentCheckoutSession(
	queryData: string,
	variables: {
		accessToken?: string
		tableObjectUuid: string
		type: TableObjectPriceType
		price?: number
		currency?: Currency
		productName: string
		productImage: string
		shippingRate?: {
			name: string
			price: number
		}
		successUrl: string
		cancelUrl: string
	}
): Promise<CheckoutSessionResource | ErrorCode[]> {
	try {
		let response = await request<{
			createPaymentCheckoutSession: CheckoutSessionResource
		}>(
			Dav.apiBaseUrl,
			gql`
				mutation CreatePaymentCheckoutSession(
					$tableObjectUuid: String!
					$type: TableObjectPriceType!
					$price: Int
					$currency: Currency
					$productName: String!
					$productImage: String!
					$shippingRate: ShippingRate
					$successUrl: String!
					$cancelUrl: String!
				) {
					createPaymentCheckoutSession(
						tableObjectUuid: $tableObjectUuid
						type: $type
						price: $price
						currency: $currency
						productName: $productName
						productImage: $productImage
						shippingRate: $shippingRate
						successUrl: $successUrl
						cancelUrl: $cancelUrl
					) {
						${queryData}			
					}
				}
			`,
			{
				tableObjectUuid: variables.tableObjectUuid,
				type: variables.type,
				price: variables.price,
				currency: variables.currency,
				productName: variables.productName,
				productImage: variables.productImage,
				shippingRate: variables.shippingRate,
				successUrl: variables.successUrl,
				cancelUrl: variables.cancelUrl
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.createPaymentCheckoutSession
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createPaymentCheckoutSession(queryData, variables)
	}
}
