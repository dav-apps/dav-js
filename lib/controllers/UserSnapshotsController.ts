import axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiResponse, ApiErrorResponse } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError, PrepareRequestParams } from '../utils.js'

export interface GetUserSnapshotsResponseData {
	snapshots: UserSnapshot[]
}

export interface UserSnapshot {
	time: Date
	dailyActive: number
	weeklyActive: number
	monthlyActive: number
   yearlyActive: number
   freePlan: number
   plusPlan: number
   proPlan: number
   emailConfirmed: number
   emailUnconfirmed: number
}

export async function GetUserSnapshots(params: {
	accessToken?: string,
	start?: number,
	end?: number
}): Promise<ApiResponse<GetUserSnapshotsResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: 'get',
			url: `${Dav.apiBaseUrl}/user_snapshots`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			params: PrepareRequestParams({
				start: params.start,
				end: params.end
			})
		})

		let snapshots: UserSnapshot[] = []

		for (let snapshot of response.data.snapshots) {
			snapshots.push({
				time: new Date(snapshot.time),
				dailyActive: snapshot.daily_active,
				weeklyActive: snapshot.weekly_active,
				monthlyActive: snapshot.monthly_active,
            yearlyActive: snapshot.yearly_active,
            freePlan: snapshot.free_plan,
            plusPlan: snapshot.plus_plan,
            proPlan: snapshot.pro_plan,
            emailConfirmed: snapshot.email_confirmed,
            emailUnconfirmed: snapshot.email_unconfirmed
			})
		}

		return {
			status: response.status,
			data: {
				snapshots
			}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetUserSnapshots(params)
	}
}