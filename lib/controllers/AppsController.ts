import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ErrorCode, List, AppResource } from "../types.js"
import {
	getErrorCodesOfGraphQLError,
	handleGraphQLErrors,
	convertAppResourceToApp
} from "../utils.js"
import { App } from "../models/App.js"

export async function retrieveApp(
	queryData: string,
	variables: {
		accessToken?: string
		id: number
	}
): Promise<App | ErrorCode[]> {
	try {
		let response = await request<{ retrieveApp: AppResource }>(
			Dav.newApiBaseUrl,
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

		return convertAppResourceToApp(response.retrieveApp)
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
): Promise<App[] | ErrorCode[]> {
	try {
		let response = await request<{ listApps: List<AppResource> }>(
			Dav.newApiBaseUrl,
			gql`
				query ListApps($published: Boolean) {
					listApps(published: $published) {
						${queryData}
					}
				}
			`,
			variables
		)

		if (response.listApps == null) {
			return null
		} else {
			let apps: App[] = []

			for (let app of response.listApps.items) {
				apps.push(convertAppResourceToApp(app))
			}

			return apps
		}
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
): Promise<App | ErrorCode[]> {
	try {
		let response = await request<{ updateApp: AppResource }>(
			Dav.newApiBaseUrl,
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

		return convertAppResourceToApp(response.updateApp)
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
