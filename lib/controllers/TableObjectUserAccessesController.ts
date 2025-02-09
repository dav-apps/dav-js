import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ErrorCode, TableObjectUserAccessResource } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function createTableObjectUserAccess(
	queryData: string,
	variables: {
		accessToken?: string
		tableObjectUuid: string
		tableAlias?: number
	}
): Promise<TableObjectUserAccessResource | ErrorCode[]> {
	try {
		let response = await request<{
			createTableObjectUserAccess: TableObjectUserAccessResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateTableObjectUserAccess(
					$tableObjectUuid: String!
					$tableAlias: Int
				) {
					createTableObjectUserAccess(
						tableObjectUuid: $tableObjectUuid
						tableAlias: $tableAlias
					) {
						${queryData}
					}
				}
			`,
			{
				tableObjectUuid: variables.tableObjectUuid,
				tableAlias: variables.tableAlias
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.createTableObjectUserAccess
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createTableObjectUserAccess(queryData, variables)
	}
}

export async function deleteTableObjectUserAccess(
	queryData: string,
	variables: {
		accessToken?: string
		tableObjectUuid: string
	}
): Promise<TableObjectUserAccessResource | ErrorCode[]> {
	try {
		let response = await request<{
			deleteTableObjectUserAccess: TableObjectUserAccessResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation DeleteTableObjectUserAccess($uuid: String!) {
					deleteTableObjectUserAccess(uuid: $uuid) {
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

		return response.deleteTableObjectUserAccess
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await deleteTableObjectUserAccess(queryData, variables)
	}
}
