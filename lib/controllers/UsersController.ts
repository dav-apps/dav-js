import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'
import { User } from '../models/User'
import { ConvertObjectArrayToApps } from '../models/App'

export async function GetUser(params: {
	jwt: string
}): Promise<ApiResponse<User> | ApiErrorResponse>{
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/user`,
			headers: {
				Authorization: params.jwt
			}
		})

		return {
			status: response.status,
			data: new User(
				response.data.id,
				response.data.email,
				response.data.first_name,
				response.data.confirmed,
				response.data.total_storage,
				response.data.used_storage,
				response.data.stripe_customer_id,
				response.data.plan,
				response.data.subscription_status,
				response.data.period_end == null ? null : new Date(response.data.period_end),
				response.data.dev,
				response.data.provider,
				ConvertObjectArrayToApps(response.data.apps)
			)
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}