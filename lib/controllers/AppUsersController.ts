import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'

export interface GetAppUsersResponseData{
	appUsers: AppUser[]
}

export interface AppUser{
	userId: number
	createdAt: Date
}

export async function GetAppUsers(params: {
	jwt: string,
	id: number
}): Promise<ApiResponse<GetAppUsersResponseData> | ApiErrorResponse> {
	try {
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/app/${params.id}/users`,
			headers: {
				Authorization: params.jwt
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
		return ConvertErrorToApiErrorResponse(error)
	}
}