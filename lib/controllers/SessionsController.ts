import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { Auth } from "../models/Auth.js"
import { ErrorCode } from "../types.js"
import { getErrorCodesOfGraphQLError } from "../utils.js"

export interface SessionResponseData {
	accessToken: string
	websiteAccessToken?: string
}

export async function createSession(
	queryData: string,
	variables: {
		auth: Auth
		email: string
		password: string
		appId: number
		apiKey: string
		deviceName?: string
		deviceOs?: string
	}
): Promise<SessionResponseData | ErrorCode[]> {
	try {
		let response = await request<{ createSession: SessionResponseData }>(
			Dav.apiBaseUrl,
			gql`
				mutation CreateSession(
					$email: String!
					$password: String!
					$appId: Int!
					$apiKey: String!
					$deviceName: String
					$deviceOs: String
				) {
					createSession(
						email: $email
						password: $password
						appId: $appId
						apiKey: $apiKey
						deviceName: $deviceName
						deviceOs: $deviceOs
					) {
						${queryData}
					}
				}
			`,
			{
				email: variables.email,
				password: variables.password,
				appId: variables.appId,
				apiKey: variables.apiKey,
				deviceName: variables.deviceName,
				deviceOs: variables.deviceOs
			},
			{
				Authorization: variables.auth.token
			}
		)

		return response.createSession
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function createSessionFromAccessToken(
	queryData: string,
	variables: {
		auth: Auth
		accessToken: string
		appId: number
		apiKey: string
		deviceName?: string
		deviceOs?: string
	}
): Promise<SessionResponseData | ErrorCode[]> {
	try {
		let response = await request<{
			createSessionFromAccessToken: SessionResponseData
		}>(
			Dav.apiBaseUrl,
			gql`
				mutation CreateSessionFromAccessToken(
					$accessToken: String!
					$appId: Int!
					$apiKey: String!
					$deviceName: String
					$deviceOs: String
				) {
					createSessionFromAccessToken(
						accessToken: $accessToken
						appId: $appId
						apiKey: $apiKey
						deviceName: $deviceName
						deviceOs: $deviceOs
					) {
						${queryData}
					}
				}
			`,
			{
				accessToken: variables.accessToken,
				appId: variables.appId,
				apiKey: variables.apiKey,
				deviceName: variables.deviceName,
				deviceOs: variables.deviceOs
			},
			{
				Authorization: variables.auth.token
			}
		)

		return response.createSessionFromAccessToken
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function renewSession(
	queryData: string,
	variables: {
		accessToken: string
	}
): Promise<SessionResponseData | ErrorCode[]> {
	try {
		let response = await request<{ renewSession: SessionResponseData }>(
			Dav.apiBaseUrl,
			gql`
				mutation RenewSession {
					renewSession {
						${queryData}
					}
				}
			`,
			{},
			{
				Authorization: variables.accessToken
			}
		)

		return response.renewSession
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function deleteSession(
	queryData: string,
	variables: {
		accessToken: string
	}
): Promise<SessionResponseData | ErrorCode[]> {
	try {
		let response = await request<{ deleteSession: SessionResponseData }>(
			Dav.apiBaseUrl,
			gql`
				mutation DeleteSession {
					deleteSession {
						${queryData}
					}
				}
			`,
			{},
			{
				Authorization: variables.accessToken
			}
		)

		return response.deleteSession
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}
