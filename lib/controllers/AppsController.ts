import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'
import { App } from '../models/App'
import { ConvertObjectArrayToTables } from '../models/Table'
import { ConvertObjectArrayToApis } from '../models/Api'

export async function GetApp(params: {
	jwt: string,
	id: number
}): Promise<ApiResponse<App> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/app/${params.id}`,
			headers: {
				Authorization: params.jwt
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
				ConvertObjectArrayToTables(response.data.tables),
				ConvertObjectArrayToApis(response.data.apis)
			)
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}