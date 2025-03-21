import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ErrorCode, DevResource } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function retrieveDev(
	queryData: string,
	variables?: {
		accessToken?: string
	}
): Promise<DevResource | ErrorCode[]> {
	try {
		let response = await request<{ retrieveDev: DevResource }>(
			Dav.apiBaseUrl,
			gql`
				query RetrieveDev {
					retrieveDev {
						${queryData}
					}
				}
			`,
			{},
			{
				Authorization: variables?.accessToken ?? Dav.accessToken
			}
		)

		return response.retrieveDev
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await retrieveDev(queryData, variables)
	}
}
