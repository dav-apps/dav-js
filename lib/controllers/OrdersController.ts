import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { Auth } from "../models/Auth.js"
import { ErrorCode, OrderResource, OrderStatus } from "../types.js"
import { getErrorCodesOfGraphQLError } from "../utils.js"

export async function retrieveOrder(
	queryData: string,
	variables: { auth: Auth; uuid: string }
): Promise<OrderResource | ErrorCode[]> {
	try {
		let response = await request<{ retrieveOrder: OrderResource }>(
			Dav.apiBaseUrl,
			gql`
				query RetrieveOrder($uuid: String!) {
					retrieveOrder(uuid: $uuid) {
						${queryData}
					}
				}
			`,
			{
				uuid: variables.uuid
			},
			{
				Authorization: variables.auth.token
			}
		)

		return response.retrieveOrder
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function updateOrder(
	queryData: string,
	variables: { auth: Auth; uuid: string; status?: OrderStatus }
): Promise<OrderResource | ErrorCode[]> {
	try {
		let response = await request<{ updateOrder: OrderResource }>(
			Dav.apiBaseUrl,
			gql`
				mutation UpdateOrder(
					$uuid: String!
					$status: OrderStatus
				) {
					updateOrder(
						uuid: $uuid
						status: $status
					) {
						${queryData}
					}
				}
			`,
			{
				uuid: variables.uuid,
				status: variables.status
			},
			{
				Authorization: variables.auth.token
			}
		)

		return response.updateOrder
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}
