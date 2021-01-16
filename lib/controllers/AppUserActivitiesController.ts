import * as axios from 'axios'
import { Dav } from '../Dav'
import { ApiResponse, ApiErrorResponse } from '../types'
import { ConvertErrorToApiErrorResponse } from '../utils'

export interface GetAppUserActivitiesResponseData{
	days: AppUserActivityDay[]
}

export interface AppUserActivityDay{
	time: Date,
	countDaily: number,
	countMonthly: number,
	countYearly: number
}

export async function GetAppUserActivities(params: {
	jwt: string,
	id: number,
	start?: number,
	end?: number
}): Promise<ApiResponse<GetAppUserActivitiesResponseData> | ApiErrorResponse>{
	try {
		let urlParams = {}
		if (params.start != null) urlParams["start"] = params.start
		if (params.end != null) urlParams["end"] = params.end

		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/app/${params.id}/user_activities`,
			headers: {
				Authorization: params.jwt
			},
			params
		})

		let days: AppUserActivityDay[] = []

		for (let day of response.data.days) {
			days.push({
				time: new Date(day.time),
				countDaily: day.count_daily,
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
		return ConvertErrorToApiErrorResponse(error)
	}
}