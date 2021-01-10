import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'
import { Api } from '../models/Api'

export async function CreateApi(params: {
	jwt: string,
	appId: number,
	name: string
}): Promise<ApiResponse<Api> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/api`,
			headers: {
				Authorization: params.jwt
			},
			data: {
				app_id: params.appId,
				name: params.name
			}
		})

		return {
			status: response.status,
			data: new Api(
				response.data.id,
				response.data.name,
				[],
				[],
				[]
			)
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}