import axios from "axios"
import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import { ApiResponse, ApiErrorResponse, ErrorCode } from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	getErrorCodesOfGraphQLError,
	HandleApiError,
	handleGraphQLErrors,
	PrepareRequestParams
} from "../utils.js"
import { App, AppResource } from "../models/App.js"
import { ConvertObjectArrayToApps } from "../models/App.js"
import { ConvertObjectArrayToTables } from "../models/Table.js"

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

		if (response.retrieveApp == null) {
			return null
		} else {
			return new App(
				response.retrieveApp.id,
				response.retrieveApp.name,
				response.retrieveApp.description,
				response.retrieveApp.published,
				response.retrieveApp.webLink,
				response.retrieveApp.googlePlayLink,
				response.retrieveApp.microsoftStoreLink
			)
		}
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

export async function CreateApp(params: {
	accessToken?: string
	name: string
	description: string
}): Promise<ApiResponse<App> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/app`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: PrepareRequestParams({
				name: params.name,
				description: params.description
			})
		})

		return {
			status: response.status,
			data: new App(
				response.data.id,
				response.data.name,
				response.data.description,
				response.data.published,
				response.data.web_link,
				response.data.google_play_link,
				response.data.microsoft_store_link
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateApp(params)
	}
}

export async function GetApps(): Promise<
	ApiResponse<App[]> | ApiErrorResponse
> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/apps`
		})

		return {
			status: response.status,
			data: ConvertObjectArrayToApps(response.data.apps)
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function GetApp(params: {
	accessToken?: string
	id: number
}): Promise<ApiResponse<App> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/app/${params.id}`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: new App(
				response.data.id,
				response.data.name,
				response.data.description,
				response.data.published,
				response.data.web_link,
				response.data.google_play_link,
				response.data.microsoft_store_link,
				null,
				ConvertObjectArrayToTables(response.data.tables)
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetApp(params)
	}
}

export async function UpdateApp(params: {
	accessToken?: string
	id: number
	name?: string
	description?: string
	published?: boolean
	webLink?: string
	googlePlayLink?: string
	microsoftStoreLink?: string
}): Promise<ApiResponse<App> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.apiBaseUrl}/app/${params.id}`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: PrepareRequestParams({
				name: params.name,
				description: params.description,
				published: params.published,
				web_link: params.webLink,
				google_play_link: params.googlePlayLink,
				microsoft_store_link: params.microsoftStoreLink
			})
		})

		return {
			status: response.status,
			data: new App(
				response.data.id,
				response.data.name,
				response.data.description,
				response.data.published,
				response.data.web_link,
				response.data.google_play_link,
				response.data.microsoft_store_link
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await UpdateApp(params)
	}
}
