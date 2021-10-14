import * as axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiResponse, ApiErrorResponse } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils.js'

export interface GetAppUsersResponseData{
	appUsers: AppUser[]
}

export interface AppUser{
	userId: number
	createdAt: Date
}

export async function GetAppUsers(params: {
	accessToken?: string,
	id: number
}): Promise<ApiResponse<GetAppUsersResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/app/${params.id}/users`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			}
		})

		let appUsers: AppUser[] = []

		for (let appUser of response.data.app_users) {
			appUsers.push({
				userId: appUser.user_id,
				createdAt: new Date(appUser.created_at)
			})
		}

		return {
			status: response.status,
			data: {
				appUsers: appUsers
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetAppUsers(params)
	}
}