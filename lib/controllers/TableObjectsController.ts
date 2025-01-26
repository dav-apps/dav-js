import axios from "axios"
import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { maxPropertiesUploadCount } from "../constants.js"
import {
	ApiErrorResponse,
	ApiResponse,
	ErrorCode,
	TableObjectUploadStatus,
	TableObjectResource,
	ApiErrorResponse2,
	List
} from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	convertErrorToApiErrorResponse2,
	HandleApiError,
	PrepareRequestParams,
	getErrorCodesOfGraphQLError,
	handleApiError2,
	handleGraphQLErrors,
	convertTableObjectResourceToTableObject
} from "../utils.js"
import { TableObject } from "../models/TableObject.js"
import { Auth } from "../models/Auth.js"

export interface TableObjectResponseData {
	tableEtag: string
	tableObject: TableObject
}

export async function retrieveTableObject(
	queryData: string,
	variables: {
		accessToken?: string
		uuid: string
	}
): Promise<TableObject | ErrorCode[]> {
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

		return convertTableObjectResourceToTableObject(response.tableObject)
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
): Promise<TableObject[] | ErrorCode[]> {
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

		let tableObjects: TableObject[] = []

		if (response.listTableObjectsByProperty?.items != null) {
			for (let tableObjectResource of response.listTableObjectsByProperty
				.items) {
				tableObjects.push(
					convertTableObjectResourceToTableObject(tableObjectResource)
				)
			}
		}

		return tableObjects
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
	}
): Promise<TableObject | ErrorCode[]> {
	try {
		let response = await request<{ createTableObject: TableObjectResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateTableObject(
					$uuid: String
					$tableId: Int!
					$file: Boolean
				) {
					createTableObject(
						uuid: $uuid
						tableId: $tableId
						file: $file
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

		return convertTableObjectResourceToTableObject(response.createTableObject)
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

export async function deleteTableObject(
	queryData: string,
	variables: {
		accessToken?: string
		uuid: string
	}
): Promise<TableObject | ErrorCode[]> {
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

		return convertTableObjectResourceToTableObject(response.deleteTableObject)
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
}): Promise<ApiResponse<{}> | ApiErrorResponse2> {
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
			data: {}
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

export async function CreateTableObject(params: {
	accessToken?: string
	uuid?: string
	tableId: number
	file?: boolean
	properties?: { [name: string]: string | boolean | number }
}): Promise<ApiResponse<TableObjectResponseData> | ApiErrorResponse> {
	try {
		let data = PrepareRequestParams({
			table_id: params.tableId,
			uuid: params.uuid,
			file: params.file
		})

		if (params.properties != null) {
			let propertyKeys = Object.keys(params.properties)

			if (propertyKeys.length > maxPropertiesUploadCount) {
				// Get the first 100 keys
				let properties = {}
				let keys = Object.keys(params.properties).slice(
					0,
					maxPropertiesUploadCount
				)

				for (let key of keys) {
					properties[key] = params.properties[key]
				}

				data["properties"] = properties
			} else {
				data["properties"] = params.properties
			}
		}

		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/table_object`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data
		})

		let tableObject = new TableObject({
			Uuid: response.data.uuid,
			TableId: response.data.table_id,
			IsFile: response.data.file,
			UploadStatus: TableObjectUploadStatus.UpToDate,
			Etag: response.data.etag,
			BelongsToUser: response.data.belongs_to_user,
			Purchase: response.data.purchase
		})

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: {
				tableEtag: response.data.table_etag,
				tableObject
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateTableObject(params)
	}
}

export async function GetTableObject(params: {
	accessToken?: string
	uuid: string
}): Promise<ApiResponse<TableObjectResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		let tableObject = new TableObject({
			Uuid: response.data.uuid,
			TableId: response.data.table_id,
			IsFile: response.data.file,
			Etag: response.data.etag,
			BelongsToUser: response.data.belongs_to_user,
			Purchase: response.data.purchase
		})

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: {
				tableEtag: response.data.table_etag,
				tableObject
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetTableObject(params)
	}
}

export async function UpdateTableObject(params: {
	accessToken?: string
	uuid: string
	properties: { [name: string]: string | boolean | number }
}): Promise<ApiResponse<TableObjectResponseData> | ApiErrorResponse> {
	try {
		let propertyKeys = Object.keys(params.properties)
		let response

		if (propertyKeys.length > maxPropertiesUploadCount) {
			let selectedProperties = {}

			while (propertyKeys.length > 0) {
				selectedProperties = {}

				for (let i = 0; i < maxPropertiesUploadCount; i++) {
					if (propertyKeys.length == 0) break

					let key = propertyKeys[i]
					selectedProperties[key] = params.properties[key]
					propertyKeys.splice(i, 1)
				}

				response = await axios({
					method: "put",
					url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
					headers: {
						Authorization:
							params.accessToken != null
								? params.accessToken
								: Dav.accessToken
					},
					data: {
						properties: selectedProperties
					}
				})
			}
		} else {
			response = await axios({
				method: "put",
				url: `${Dav.apiBaseUrl}/table_object/${params.uuid}`,
				headers: {
					Authorization:
						params.accessToken != null
							? params.accessToken
							: Dav.accessToken
				},
				data: {
					properties: params.properties
				}
			})
		}

		let tableObject = new TableObject({
			Uuid: response.data.uuid,
			TableId: response.data.table_id,
			IsFile: response.data.file,
			Etag: response.data.etag,
			BelongsToUser: response.data.belongs_to_user,
			Purchase: response.data.purchase
		})

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: {
				tableEtag: response.data.table_etag,
				tableObject
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await UpdateTableObject(params)
	}
}

export async function SetTableObjectFile(params: {
	accessToken?: string
	uuid: string
	data: string
	type: string
}): Promise<ApiResponse<TableObjectResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}/file`,
			headers: {
				Authorization:
					params.accessToken != null
						? params.accessToken
						: Dav.accessToken,
				"Content-Type": params.type
			},
			data: params.data
		})

		let tableObject = new TableObject({
			Uuid: response.data.uuid,
			TableId: response.data.table_id,
			IsFile: response.data.file,
			Etag: response.data.etag,
			BelongsToUser: response.data.belongs_to_user,
			Purchase: response.data.purchase
		})

		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = { value: response.data.properties[key] }
		}

		return {
			status: response.status,
			data: {
				tableEtag: response.data.table_etag,
				tableObject
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await SetTableObjectFile(params)
	}
}

export async function GetTableObjectFile(params: {
	accessToken?: string
	uuid: string
}): Promise<ApiResponse<Blob> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}/file`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			responseType: "blob"
		})

		return {
			status: response.status,
			data: response.data as Blob
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetTableObjectFile(params)
	}
}

export async function RemoveTableObject(params: {
	accessToken?: string
	uuid: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "delete",
			url: `${Dav.apiBaseUrl}/table_object/${params.uuid}/access`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await RemoveTableObject(params)
	}
}
