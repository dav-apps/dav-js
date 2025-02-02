import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { Notification } from "../../lib/models/Notification.js"
import {
	UpdateNotification,
	DeleteNotification
} from "../../lib/controllers/NotificationsController.js"

beforeEach(() => {
	mock.reset()
})

describe("UpdateNotification function", () => {
	it("should call updateNotification endpoint", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"
		let time = 12345
		let interval = 100
		let title = "TestNotification"
		let body = "Hello World"

		let accessToken = "aiodoasfoasf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notification/${uuid}`

		let expectedResult: ApiResponse<Notification> = {
			status: 200,
			data: new Notification({
				Uuid: uuid,
				Time: time,
				Interval: interval,
				Title: title,
				Body: body
			})
		}

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			return [
				expectedResult.status,
				{
					id: 12,
					user_id: 12,
					app_id: 12,
					uuid,
					time,
					interval,
					title,
					body
				}
			]
		})

		// Act
		let result = (await UpdateNotification({
			uuid,
			time,
			interval,
			title,
			body
		})) as ApiResponse<Notification>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Time, expectedResult.data.Time)
		assert.equal(result.data.Interval, expectedResult.data.Interval)
		assert.equal(result.data.Title, expectedResult.data.Title)
		assert.equal(result.data.Body, expectedResult.data.Body)
	})

	it("should call updateNotification endpoint with error", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"
		let time = 12345
		let interval = 100
		let title = "TestNotification"
		let body = "Hello World"

		let accessToken = "aiodoasfoasf"
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

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

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
		let result = (await UpdateNotification({
			uuid,
			time,
			interval,
			title,
			body
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call updateNotification endpoint and renew the session", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"
		let time = 12345
		let interval = 100
		let title = "TestNotification"
		let body = "Hello World"

		let accessToken = "aiodoasfoasf"
		let newAccessToken = "sdhosdfhiosdfhiosfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notification/${uuid}`

		let expectedResult: ApiResponse<Notification> = {
			status: 200,
			data: new Notification({
				Uuid: uuid,
				Time: time,
				Interval: interval,
				Title: title,
				Body: body
			})
		}

		mock
			.onPut(url)
			.replyOnce(config => {
				// First updateNotification request
				assert.equal(config.headers.Authorization, accessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.time, time)
				assert.equal(data.interval, interval)
				assert.equal(data.title, title)
				assert.equal(data.body, body)

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
			.onPut(url)
			.replyOnce(config => {
				// Second updateNotification request
				assert.equal(config.headers.Authorization, newAccessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.time, time)
				assert.equal(data.interval, interval)
				assert.equal(data.title, title)
				assert.equal(data.body, body)

				return [
					expectedResult.status,
					{
						id: 12,
						user_id: 12,
						app_id: 12,
						uuid,
						time,
						interval,
						title,
						body
					}
				]
			})

		// Act
		let result = (await UpdateNotification({
			uuid,
			time,
			interval,
			title,
			body
		})) as ApiResponse<Notification>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Time, expectedResult.data.Time)
		assert.equal(result.data.Interval, expectedResult.data.Interval)
		assert.equal(result.data.Title, expectedResult.data.Title)
		assert.equal(result.data.Body, expectedResult.data.Body)
	})
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
