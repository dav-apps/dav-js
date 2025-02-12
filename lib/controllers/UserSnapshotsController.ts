import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { List, ErrorCode, UserSnapshotResource } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function listUserSnapshots(
	queryData: string,
	variables?: {
		accessToken?: string
		start?: number
		end?: number
	}
): Promise<List<UserSnapshotResource> | ErrorCode[]> {
	try {
		let response = await request<{
			listUserSnapshots: List<UserSnapshotResource>
		}>(
			Dav.apiBaseUrl,
			gql`
				query ListUserSnapshots($start: Int, $end: Int) {
					listUserSnapshots(start: $start, end: $end) {
						${queryData}
					}
				}
			`,
			{
				start: variables?.start,
				end: variables?.end
			},
			{
				Authorization: variables?.accessToken ?? Dav.accessToken
			}
		)

		return response.listUserSnapshots
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await listUserSnapshots(queryData, variables)
	}
}
