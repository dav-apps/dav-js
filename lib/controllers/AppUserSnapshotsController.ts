import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { List, AppUserSnapshotResource, ErrorCode } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function listAppUserSnapshots(
	queryData: string,
	variables: {
		accessToken?: string
		appId: number
		start?: number
		end?: number
	}
): Promise<AppUserSnapshotResource[] | ErrorCode[]> {
	try {
		let response = await request<{
			listAppUserSnapshots: List<AppUserSnapshotResource>
		}>(
			Dav.apiBaseUrl,
			gql`
				query ListAppUserSnapshots(
					$appId: Int!
					$start: Int
					$end: Int
				) {
					listAppUserSnapshots(
						appId: $appId
						start: $start
						end: $end
					) {
						${queryData}
					}
				}
			`,
			{
				appId: variables.appId,
				start: variables.start,
				end: variables.end
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.listAppUserSnapshots.items
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await listAppUserSnapshots(queryData, variables)
	}
}
