import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { DeleteNotification } from "../../lib/controllers/NotificationsController.js"

beforeEach(() => {
	mock.reset()
})

describe("DeleteNotification function", () => {
	it("should call deleteNotification endpoint", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"

		let accessToken = "sfanksgdjsdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notification/${uuid}`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		mock.onDelete(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [expectedResult.status, {}]
		})

		// Act
		let result = (await DeleteNotification({
			uuid
		})) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call deleteNotification endpoint with error", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"

		let accessToken = "sfanksgdjsdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notification/${uuid}`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onDelete(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

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
		let result = (await DeleteNotification({
			uuid
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call deleteNotification endpoint and renew the session", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"

		let accessToken = "sfanksgdjsdgsdsf"
		let newAccessToken = "hiosdgosdosdfobsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notification/${uuid}`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		mock
			.onDelete(url)
			.replyOnce(config => {
				// First deleteNotification request
				assert.equal(config.headers.Authorization, accessToken)

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
			.onDelete(url)
			.replyOnce(config => {
				// Second deleteNotification request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [expectedResult.status, {}]
			})

		// Act
		let result = (await DeleteNotification({
			uuid
		})) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})
})
