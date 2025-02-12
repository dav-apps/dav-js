import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ErrorCode, List, AppResource } from "../types.js"
import { getErrorCodesOfGraphQLError, handleGraphQLErrors } from "../utils.js"

export async function retrieveApp(
	queryData: string,
	variables: {
		accessToken?: string
		id: number
	}
): Promise<AppResource | ErrorCode[]> {
	try {
		let response = await request<{ retrieveApp: AppResource }>(
			Dav.apiBaseUrl,
			gql`
				query RetrieveApp($id: Int!) {
					retrieveApp(id: $id) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.retrieveApp
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await retrieveApp(queryData, variables)
	}
}

export async function listApps(
	queryData: string,
	variables: {
		published?: boolean
	}
): Promise<List<AppResource> | ErrorCode[]> {
	try {
		let response = await request<{ listApps: List<AppResource> }>(
			Dav.apiBaseUrl,
			gql`
				query ListApps($published: Boolean) {
					listApps(published: $published) {
						${queryData}
					}
				}
			`,
			variables
		)

		return response.listApps
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function updateApp(
	queryData: string,
	variables: {
		accessToken?: string
		id: number
		name?: string
		description?: string
		published?: boolean
		webLink?: string
		googlePlayLink?: string
		microsoftStoreLink?: string
	}
): Promise<AppResource | ErrorCode[]> {
	try {
		let response = await request<{ updateApp: AppResource }>(
			Dav.apiBaseUrl,
			gql`
				mutation UpdateApp(
					$id: Int!
					$name: String
					$description: String
					$published: Boolean
					$webLink: String
					$googlePlayLink: String
					$microsoftStoreLink: String
				) {
					updateApp(
						id: $id
						name: $name
						description: $description
						published: $published
						webLink: $webLink
						googlePlayLink: $googlePlayLink
						microsoftStoreLink: $microsoftStoreLink
					) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id,
				name: variables.name,
				description: variables.description,
				published: variables.published,
				webLink: variables.webLink,
				googlePlayLink: variables.googlePlayLink,
				microsoftStoreLink: variables.microsoftStoreLink
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.updateApp
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await updateApp(queryData, variables)
	}
}
