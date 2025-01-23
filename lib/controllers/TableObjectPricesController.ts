import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import {
	Currency,
	TableObjectPriceType,
	TableObjectPriceResource,
	ErrorCode
} from "../types.js"
import { getErrorCodesOfGraphQLError } from "../utils.js"
import { Auth } from "../models/Auth.js"

export async function setTableObjectPrice(
	queryData: string,
	variables: {
		auth: Auth
		tableObjectUuid: string
		price: number
		currency: Currency
		type: TableObjectPriceType
	}
): Promise<TableObjectPriceResource | ErrorCode[]> {
	try {
		let response = await request<{
			setTableObjectPrice: TableObjectPriceResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation SetTableObjectPrice(
					$tableObjectUuid: String!
					$price: Int!
					$currency: Currency!
					$type: TableObjectPriceType!
				) {
					setTableObjectPrice(
						tableObjectUuid: $tableObjectUuid
						price: $price
						currency: $currency
						type: $type
					) {
						${queryData}
					}
				}
			`,
			{
				tableObjectUuid: variables.tableObjectUuid,
				price: variables.price,
				currency: variables.currency,
				type: variables.type
			},
			{
				Authorization: variables.auth.token
			}
		)

		return response.setTableObjectPrice
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}
