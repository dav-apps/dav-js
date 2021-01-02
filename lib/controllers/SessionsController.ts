import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiErrorResponse, ApiResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'

export async function DeleteSession(params: {
	jwt: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/session`,
			headers: {
				Authorization: params.jwt
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}