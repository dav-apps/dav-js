import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { Auth } from "../models/Auth.js"
import { List, ErrorCode, ShippingAddressResource } from "../types.js"
import { getErrorCodesOfGraphQLError } from "../utils.js"

export async function listShippingAddresses(
	queryData: string,
	variables: {
		auth: Auth
		userId: number
		limit?: number
		offset?: number
	}
): Promise<List<ShippingAddressResource> | ErrorCode[]> {
	try {
		let response = await request<{
			listShippingAddresses: List<ShippingAddressResource>
		}>(
			Dav.apiBaseUrl,
			gql`
				query ListShippingAddresses(
					$userId: Int!
					$limit: Int
					$offset: Int
				) {
					listShippingAddresses(
						userId: $userId
						limit: $limit
						offset: $offset
					) {
						${queryData}
					}
				}
			`,
			{
				userId: variables.userId,
				limit: variables.limit,
				offset: variables.offset
			},
			{
				Authorization: variables.auth.token
			}
		)

		return response.listShippingAddresses
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}
