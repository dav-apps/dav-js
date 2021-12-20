import axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiResponse, ApiErrorResponse } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError } from '../utils.js'

export interface GetUserActivitiesResponseData {
	days: UserActivityDay[]
}

export interface UserActivityDay {
	time: Date
	countDaily: number
	countWeekly: number
	countMonthly: number
	countYearly: number
}

export async function GetUserActivities(params: {
	accessToken?: string,
	start?: number,
	end?: number
}): Promise<ApiResponse<GetUserActivitiesResponseData> | ApiErrorResponse> {
	try {
		let urlParams = {}
		if (params.start != null) urlParams["start"] = params.start
		if (params.end != null) urlParams["end"] = params.end

		let response = await axios({
			method: 'get',
			url: `${Dav.apiBaseUrl}/user_activities`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			params
		})

		let days: UserActivityDay[] = []

		for (let day of response.data.days) {
			days.push({
				time: new Date(day.time),
				countDaily: day.count_daily,
				countWeekly: day.count_weekly,
				countMonthly: day.count_monthly,
				countYearly: day.count_yearly
			})
		}

		return {
			status: response.status,
			data: {
				days
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetUserActivities(params)
	}
}