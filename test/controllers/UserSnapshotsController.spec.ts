import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import {
	GetUserSnapshots,
	GetUserSnapshotsResponseData
} from "../../lib/controllers/UserSnapshotsController.js"

beforeEach(() => {
	mock.reset()
})

describe("GetUserSnapshots function", () => {
	it("should call getUserSnapshots endpoint", async () => {
		// Arrange
		let start = 111111111
		let end = 222222222
		let firstUserSnapshotTime = new Date("2021-01-11 23:00:00 UTC")
		let firstUserSnapshotDailyActive = 12
		let firstUserSnapshotWeeklyActive = 14
		let firstUserSnapshotMonthlyActive = 15
		let firstUserSnapshotYearlyActive = 20
		let firstUserSnapshotFreePlan = 34
		let firstUserSnapshotPlusPlan = 12
		let firstUserSnapshotProPlan = 5
		let firstUserSnapshotEmailConfirmed = 32
		let firstUserSnapshotEmailUnconfirmed = 42
		let secondUserSnapshotTime = new Date("2021-01-16 23:00:00 UTC")
		let secondUserSnapshotDailyActive = 7
		let secondUserSnapshotWeeklyActive = 8
		let secondUserSnapshotMonthlyActive = 11
		let secondUserSnapshotYearlyActive = 22
		let secondUserSnapshotFreePlan = 42
		let secondUserSnapshotPlusPlan = 25
		let secondUserSnapshotProPlan = 9
		let secondUserSnapshotEmailConfirmed = 23
		let secondUserSnapshotEmailUnconfirmed = 14

		let accessToken = "iohafduwe98hh9fesbodc"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user_snapshots`

		let expectedResult: ApiResponse<GetUserSnapshotsResponseData> = {
			status: 200,
			data: {
				snapshots: [
					{
						time: firstUserSnapshotTime,
						dailyActive: firstUserSnapshotDailyActive,
						weeklyActive: firstUserSnapshotWeeklyActive,
						monthlyActive: firstUserSnapshotMonthlyActive,
						yearlyActive: firstUserSnapshotYearlyActive,
						freePlan: firstUserSnapshotFreePlan,
						plusPlan: firstUserSnapshotPlusPlan,
						proPlan: firstUserSnapshotProPlan,
						emailConfirmed: firstUserSnapshotEmailConfirmed,
						emailUnconfirmed: firstUserSnapshotEmailUnconfirmed
					},
					{
						time: secondUserSnapshotTime,
						dailyActive: secondUserSnapshotDailyActive,
						weeklyActive: secondUserSnapshotWeeklyActive,
						monthlyActive: secondUserSnapshotMonthlyActive,
						yearlyActive: secondUserSnapshotYearlyActive,
						freePlan: secondUserSnapshotFreePlan,
						plusPlan: secondUserSnapshotPlusPlan,
						proPlan: secondUserSnapshotProPlan,
						emailConfirmed: secondUserSnapshotEmailConfirmed,
						emailUnconfirmed: secondUserSnapshotEmailUnconfirmed
					}
				]
			}
		}

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			assert.equal(start, config.params.start)
			assert.equal(end, config.params.end)

			return [
				expectedResult.status,
				{
					snapshots: [
						{
							time: firstUserSnapshotTime.toString(),
							daily_active: firstUserSnapshotDailyActive,
							weekly_active: firstUserSnapshotWeeklyActive,
							monthly_active: firstUserSnapshotMonthlyActive,
							yearly_active: firstUserSnapshotYearlyActive,
							free_plan: firstUserSnapshotFreePlan,
							plus_plan: firstUserSnapshotPlusPlan,
							pro_plan: firstUserSnapshotProPlan,
							email_confirmed: firstUserSnapshotEmailConfirmed,
							email_unconfirmed: firstUserSnapshotEmailUnconfirmed
						},
						{
							time: secondUserSnapshotTime.toString(),
							daily_active: secondUserSnapshotDailyActive,
							weekly_active: secondUserSnapshotWeeklyActive,
							monthly_active: secondUserSnapshotMonthlyActive,
							yearly_active: secondUserSnapshotYearlyActive,
							free_plan: secondUserSnapshotFreePlan,
							plus_plan: secondUserSnapshotPlusPlan,
							pro_plan: secondUserSnapshotProPlan,
							email_confirmed: secondUserSnapshotEmailConfirmed,
							email_unconfirmed: secondUserSnapshotEmailUnconfirmed
						}
					]
				}
			]
		})

		// Act
		let result = (await GetUserSnapshots({
			start,
			end
		})) as ApiResponse<GetUserSnapshotsResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.snapshots.length, 2)

		assert.equal(
			result.data.snapshots[0].time.toString(),
			expectedResult.data.snapshots[0].time.toString()
		)
		assert.equal(
			result.data.snapshots[0].dailyActive,
			expectedResult.data.snapshots[0].dailyActive
		)
		assert.equal(
			result.data.snapshots[0].weeklyActive,
			expectedResult.data.snapshots[0].weeklyActive
		)
		assert.equal(
			result.data.snapshots[0].monthlyActive,
			expectedResult.data.snapshots[0].monthlyActive
		)
		assert.equal(
			result.data.snapshots[0].yearlyActive,
			expectedResult.data.snapshots[0].yearlyActive
		)
		assert.equal(
			result.data.snapshots[0].freePlan,
			expectedResult.data.snapshots[0].freePlan
		)
		assert.equal(
			result.data.snapshots[0].plusPlan,
			expectedResult.data.snapshots[0].plusPlan
		)
		assert.equal(
			result.data.snapshots[0].proPlan,
			expectedResult.data.snapshots[0].proPlan
		)
		assert.equal(
			result.data.snapshots[0].emailConfirmed,
			expectedResult.data.snapshots[0].emailConfirmed
		)
		assert.equal(
			result.data.snapshots[0].emailUnconfirmed,
			expectedResult.data.snapshots[0].emailUnconfirmed
		)

		assert.equal(
			result.data.snapshots[1].time.toString(),
			expectedResult.data.snapshots[1].time.toString()
		)
		assert.equal(
			result.data.snapshots[1].dailyActive,
			expectedResult.data.snapshots[1].dailyActive
		)
		assert.equal(
			result.data.snapshots[1].weeklyActive,
			expectedResult.data.snapshots[1].weeklyActive
		)
		assert.equal(
			result.data.snapshots[1].monthlyActive,
			expectedResult.data.snapshots[1].monthlyActive
		)
		assert.equal(
			result.data.snapshots[1].yearlyActive,
			expectedResult.data.snapshots[1].yearlyActive
		)
		assert.equal(
			result.data.snapshots[1].freePlan,
			expectedResult.data.snapshots[1].freePlan
		)
		assert.equal(
			result.data.snapshots[1].plusPlan,
			expectedResult.data.snapshots[1].plusPlan
		)
		assert.equal(
			result.data.snapshots[1].proPlan,
			expectedResult.data.snapshots[1].proPlan
		)
		assert.equal(
			result.data.snapshots[1].emailConfirmed,
			expectedResult.data.snapshots[1].emailConfirmed
		)
		assert.equal(
			result.data.snapshots[1].emailUnconfirmed,
			expectedResult.data.snapshots[1].emailUnconfirmed
		)
	})

	it("should call getUserSnapshots endpoint with error", async () => {
		// Arrange
		let start = 111111111
		let end = 222222222

		let accessToken = "iohafduwe98hh9fesbodc"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user_snapshots`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			assert.equal(start, config.params.start)
			assert.equal(end, config.params.end)

			return [
				expectedResult.status,
				{
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			]
		})

		// Act
		let result = (await GetUserSnapshots({
			start,
			end
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getUserSnapshots endpoint and renew the session", async () => {
		// Arrange
		let start = 111111111
		let end = 222222222
		let firstUserSnapshotTime = new Date("2021-01-11 23:00:00 UTC")
		let firstUserSnapshotDailyActive = 12
		let firstUserSnapshotWeeklyActive = 14
		let firstUserSnapshotMonthlyActive = 15
		let firstUserSnapshotYearlyActive = 20
		let firstUserSnapshotFreePlan = 34
		let firstUserSnapshotPlusPlan = 12
		let firstUserSnapshotProPlan = 5
		let firstUserSnapshotEmailConfirmed = 32
		let firstUserSnapshotEmailUnconfirmed = 42
		let secondUserSnapshotTime = new Date("2021-01-16 23:00:00 UTC")
		let secondUserSnapshotDailyActive = 7
		let secondUserSnapshotWeeklyActive = 8
		let secondUserSnapshotMonthlyActive = 11
		let secondUserSnapshotYearlyActive = 22
		let secondUserSnapshotFreePlan = 42
		let secondUserSnapshotPlusPlan = 25
		let secondUserSnapshotProPlan = 9
		let secondUserSnapshotEmailConfirmed = 23
		let secondUserSnapshotEmailUnconfirmed = 14

		let accessToken = "iohafduwe98hh9fesbodc"
		let newAccessToken = "iofgjiosdfiosdfjiosd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user_snapshots`

		let expectedResult: ApiResponse<GetUserSnapshotsResponseData> = {
			status: 200,
			data: {
				snapshots: [
					{
						time: firstUserSnapshotTime,
						dailyActive: firstUserSnapshotDailyActive,
						weeklyActive: firstUserSnapshotWeeklyActive,
						monthlyActive: firstUserSnapshotMonthlyActive,
						yearlyActive: firstUserSnapshotYearlyActive,
						freePlan: firstUserSnapshotFreePlan,
						plusPlan: firstUserSnapshotPlusPlan,
						proPlan: firstUserSnapshotProPlan,
						emailConfirmed: firstUserSnapshotEmailConfirmed,
						emailUnconfirmed: firstUserSnapshotEmailUnconfirmed
					},
					{
						time: secondUserSnapshotTime,
						dailyActive: secondUserSnapshotDailyActive,
						weeklyActive: secondUserSnapshotWeeklyActive,
						monthlyActive: secondUserSnapshotMonthlyActive,
						yearlyActive: secondUserSnapshotYearlyActive,
						freePlan: secondUserSnapshotFreePlan,
						plusPlan: secondUserSnapshotPlusPlan,
						proPlan: secondUserSnapshotProPlan,
						emailConfirmed: secondUserSnapshotEmailConfirmed,
						emailUnconfirmed: secondUserSnapshotEmailUnconfirmed
					}
				]
			}
		}

		mock
			.onGet(url)
			.replyOnce(config => {
				// First getUserSnapshots request
				assert.equal(config.headers.Authorization, accessToken)

				assert.equal(start, config.params.start)
				assert.equal(end, config.params.end)

				return [
					403,
					{
						errors: [
							{
								code: ErrorCodes.AccessTokenMustBeRenewed,
								message: "Access token must be renewed"
							}
						]
					}
				]
			})
			.onPut(`${Dav.apiBaseUrl}/session/renew`)
			.replyOnce(config => {
				// renewSession request
				assert.equal(config.headers.Authorization, accessToken)

				return [
					200,
					{
						access_token: newAccessToken
					}
				]
			})
			.onGet(url)
			.replyOnce(config => {
				// Second getUserSnapshots request
				assert.equal(config.headers.Authorization, newAccessToken)

				assert.equal(start, config.params.start)
				assert.equal(end, config.params.end)

				return [
					expectedResult.status,
					{
						snapshots: [
							{
								time: firstUserSnapshotTime,
								daily_active: firstUserSnapshotDailyActive,
								weekly_active: firstUserSnapshotWeeklyActive,
								monthly_active: firstUserSnapshotMonthlyActive,
								yearly_active: firstUserSnapshotYearlyActive,
								free_plan: firstUserSnapshotFreePlan,
								plus_plan: firstUserSnapshotPlusPlan,
								pro_plan: firstUserSnapshotProPlan,
								email_confirmed: firstUserSnapshotEmailConfirmed,
								email_unconfirmed: firstUserSnapshotEmailUnconfirmed
							},
							{
								time: secondUserSnapshotTime,
								daily_active: secondUserSnapshotDailyActive,
								weekly_active: secondUserSnapshotWeeklyActive,
								monthly_active: secondUserSnapshotMonthlyActive,
								yearly_active: secondUserSnapshotYearlyActive,
								free_plan: secondUserSnapshotFreePlan,
								plus_plan: secondUserSnapshotPlusPlan,
								pro_plan: secondUserSnapshotProPlan,
								email_confirmed: secondUserSnapshotEmailConfirmed,
								email_unconfirmed: secondUserSnapshotEmailUnconfirmed
							}
						]
					}
				]
			})

		// Act
		let result = (await GetUserSnapshots({
			start,
			end
		})) as ApiResponse<GetUserSnapshotsResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.snapshots.length, 2)

		assert.equal(
			result.data.snapshots[0].time.toString(),
			expectedResult.data.snapshots[0].time.toString()
		)
		assert.equal(
			result.data.snapshots[0].dailyActive,
			expectedResult.data.snapshots[0].dailyActive
		)
		assert.equal(
			result.data.snapshots[0].weeklyActive,
			expectedResult.data.snapshots[0].weeklyActive
		)
		assert.equal(
			result.data.snapshots[0].monthlyActive,
			expectedResult.data.snapshots[0].monthlyActive
		)
		assert.equal(
			result.data.snapshots[0].yearlyActive,
			expectedResult.data.snapshots[0].yearlyActive
		)
		assert.equal(
			result.data.snapshots[0].freePlan,
			expectedResult.data.snapshots[0].freePlan
		)
		assert.equal(
			result.data.snapshots[0].plusPlan,
			expectedResult.data.snapshots[0].plusPlan
		)
		assert.equal(
			result.data.snapshots[0].proPlan,
			expectedResult.data.snapshots[0].proPlan
		)
		assert.equal(
			result.data.snapshots[0].emailConfirmed,
			expectedResult.data.snapshots[0].emailConfirmed
		)
		assert.equal(
			result.data.snapshots[0].emailUnconfirmed,
			expectedResult.data.snapshots[0].emailUnconfirmed
		)

		assert.equal(
			result.data.snapshots[1].time.toString(),
			expectedResult.data.snapshots[1].time.toString()
		)
		assert.equal(
			result.data.snapshots[1].dailyActive,
			expectedResult.data.snapshots[1].dailyActive
		)
		assert.equal(
			result.data.snapshots[1].weeklyActive,
			expectedResult.data.snapshots[1].weeklyActive
		)
		assert.equal(
			result.data.snapshots[1].monthlyActive,
			expectedResult.data.snapshots[1].monthlyActive
		)
		assert.equal(
			result.data.snapshots[1].yearlyActive,
			expectedResult.data.snapshots[1].yearlyActive
		)
		assert.equal(
			result.data.snapshots[1].freePlan,
			expectedResult.data.snapshots[1].freePlan
		)
		assert.equal(
			result.data.snapshots[1].plusPlan,
			expectedResult.data.snapshots[1].plusPlan
		)
		assert.equal(
			result.data.snapshots[1].proPlan,
			expectedResult.data.snapshots[1].proPlan
		)
		assert.equal(
			result.data.snapshots[1].emailConfirmed,
			expectedResult.data.snapshots[1].emailConfirmed
		)
		assert.equal(
			result.data.snapshots[1].emailUnconfirmed,
			expectedResult.data.snapshots[1].emailUnconfirmed
		)
	})
})
