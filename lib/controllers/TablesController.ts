import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ErrorCode, TableResource } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function retrieveTable(
	queryData: string,
	variables: {
		accessToken?: string
		name: string
		limit?: number
		offset?: number
	}
): Promise<TableResource | ErrorCode[]> {
	try {
		let limitParam = queryData.includes("limit") ? "$limit: Int" : ""
		let offsetParam = queryData.includes("offset") ? "$offset: Int" : ""

		let response = await request<{ retrieveTable: TableResource }>(
			Dav.apiBaseUrl,
			gql`
				query RetrieveTable(
					$name: String!
					${limitParam}
					${offsetParam}
				) {
					retrieveTable(name: $name) {
						${queryData}
					}
				}
			`,
			{
				name: variables.name
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.retrieveTable
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await retrieveTable(queryData, variables)
	}
}
