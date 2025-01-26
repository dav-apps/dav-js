import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ErrorCode, PurchaseResource } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function createPurchase(
	queryData: string,
	variables: { accessToken?: string; tableObjectUuid: string }
): Promise<PurchaseResource | ErrorCode[]> {
	try {
		let response = await request<{ createPurchase: PurchaseResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreatePurchase($tableObjectUuid: String!) {
					createPurchase(tableObjectUuid: $tableObjectUuid) {
						${queryData}
					}
				}
			`,
			{
				tableObjectUuid: variables.tableObjectUuid
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.createPurchase
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createPurchase(queryData, variables)
	}
}
