import axios from "axios"
import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import {
	ApiResponse,
	ErrorCode,
	TableObjectResource,
	ApiErrorResponse2,
	List
} from "../types.js"
import {
	convertErrorToApiErrorResponse2,
	getErrorCodesOfGraphQLError,
	handleApiError2,
	handleGraphQLErrors
} from "../utils.js"
import { Auth } from "../models/Auth.js"

export async function retrieveTableObject(
	queryData: string,
	variables: {
		accessToken?: string
		uuid: string
	}
): Promise<TableObjectResource | ErrorCode[]> {
	try {
		let response = await request<{ tableObject: TableObjectResource }>(
			Dav.newApiBaseUrl,
			gql`
				query RetrieveTableObject($uuid: String!) {
					retrieveTableObject(uuid: $uuid) {
						${queryData}
					}
				}
			`,
			{
				uuid: variables.uuid
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.tableObject
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await retrieveTableObject(queryData, variables)
	}
}

export async function listTableObjectsByProperty(
	queryData: string,
	variables: {
		auth: Auth
		userId?: number
		appId: number
		tableName?: string
		propertyName: string
		propertyValue: string
		exact?: boolean
		limit?: number
		offset?: number
	}
): Promise<List<TableObjectResource> | ErrorCode[]> {
	try {
		let response = await request<{
			listTableObjectsByProperty: List<TableObjectResource>
		}>(
			Dav.newApiBaseUrl,
			gql`
				query ListTableObjectsByProperty(
					$userId: Int
					$appId: Int!
					$tableName: String
					$propertyName: String!
					$propertyValue: String!
					$exact: Boolean
					$limit: Int
					$offset: Int
				) {
					listTableObjectsByProperty(
						userId: $userId
						appId: $appId
						tableName: $tableName
						propertyName: $propertyName
						propertyValue: $propertyValue
						exact: $exact
						limit: $limit
						offset: $offset
					) {
						${queryData}
					}
				}
			`,
			{
				userId: variables.userId,
				appId: variables.appId,
				tableName: variables.tableName,
				propertyName: variables.propertyName,
				propertyValue: variables.propertyValue,
				exact: variables.exact,
				limit: variables.limit,
				offset: variables.offset
			},
			{
				Authorization: variables.auth.token
			}
		)

		return response.listTableObjectsByProperty
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function createTableObject(
	queryData: string,
	variables: {
		accessToken?: string
		uuid?: string
		tableId: number
		file?: boolean
		ext?: string
		properties?: { [name: string]: string | boolean | number }
	}
): Promise<TableObjectResource | ErrorCode[]> {
	try {
		let response = await request<{ createTableObject: TableObjectResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateTableObject(
					$uuid: String
					$tableId: Int!
					$file: Boolean
					$ext: String
					$properties: JSONObject
				) {
					createTableObject(
						uuid: $uuid
						tableId: $tableId
						file: $file
						ext: $ext
						properties: $properties
					) {
						${queryData}
					}
				}
			`,
			{
				uuid: variables.uuid,
				tableId: variables.tableId
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.createTableObject
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await createTableObject(queryData, variables)
	}
}

export async function updateTableObject(
	queryData: string,
	variables: {
		accessToken?: string
		uuid: string
		ext?: string
		properties?: { [name: string]: string | boolean | number }
	}
): Promise<TableObjectResource | ErrorCode[]> {
	try {
		let response = await request<{ updateTableObject: TableObjectResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation UpdateTableObject(
					$uuid: String!
					$ext: String
					$properties: JSONObject
				) {
					updateTableObject(
						uuid: $uuid
						ext: $ext
						properties: $properties
					) {
						${queryData}
					}
				}
			`,
			{
				uuid: variables.uuid,
				ext: variables.ext,
				properties: variables.properties
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.updateTableObject
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await updateTableObject(queryData, variables)
	}
}

export async function deleteTableObject(
	queryData: string,
	variables: {
		accessToken?: string
		uuid: string
	}
): Promise<TableObjectResource | ErrorCode[]> {
	try {
		let response = await request<{ deleteTableObject: TableObjectResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation DeleteTableObject($uuid: String!) {
					deleteTableObject(uuid: $uuid) {
						${queryData}
					}
				}
			`,
			{
				uuid: variables.uuid
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return response.deleteTableObject
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await deleteTableObject(queryData, variables)
	}
}

export async function uploadTableObjectFile(params: {
	accessToken?: string
	uuid: string
	contentType: string
	data: string
}): Promise<ApiResponse<TableObjectResource> | ApiErrorResponse2> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.newApiBaseUrl}/tableObject/${params.uuid}/file`,
			headers: {
				Authorization: params.accessToken ?? Dav.accessToken,
				"Content-Type": params.contentType
			},
			data: params.data
		})

		return {
			status: response.status,
			data: response.data
		}
	} catch (error) {
		if (params.accessToken != null) {
			return convertErrorToApiErrorResponse2(error)
		}

		let renewSessionError = await handleApiError2(error)
		if (renewSessionError != null) return renewSessionError

		return await uploadTableObjectFile(params)
	}
}
