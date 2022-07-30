import axios from 'axios'
import { Dav } from '../Dav.js'
import { ApiResponse, ApiErrorResponse } from '../types.js'
import { ConvertErrorToApiErrorResponse, HandleApiError, PrepareRequestParams } from '../utils.js'

export interface GetAppUserSnapshotsResponseData {
	snapshots: AppUserSnapshot[]
}

export interface AppUserSnapshot {
	time: Date
	dailyActive: number
	weeklyActive: number
	monthlyActive: number
   yearlyActive: number
   freePlan: number
   plusPlan: number
   proPlan: number
}

export async function GetAppUserSnapshots(params: {
	accessToken?: string,
	id: number,
	start?: number,
	end?: number
}): Promise<ApiResponse<GetAppUserSnapshotsResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: 'get',
			url: `${Dav.apiBaseUrl}/app/${params.id}/user_snapshots`,
			headers: {
				Authorization: params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			params: PrepareRequestParams({
				start: params.start,
				end: params.end
			})
		})

		let snapshots: AppUserSnapshot[] = []

		for (let snapshot of response.data.snapshots) {
			snapshots.push({
				time: new Date(snapshot.time),
				dailyActive: snapshot.daily_active,
				weeklyActive: snapshot.weekly_active,
				monthlyActive: snapshot.monthly_active,
            yearlyActive: snapshot.yearly_active,
            freePlan: snapshot.free_plan,
            plusPlan: snapshot.plus_plan,
            proPlan: snapshot.pro_plan
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

		return await GetAppUserSnapshots(params)
	}
}