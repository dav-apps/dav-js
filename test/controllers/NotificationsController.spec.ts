import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { Notification } from "../../lib/models/Notification.js"
import {
	GetNotifications,
	UpdateNotification,
	DeleteNotification
} from "../../lib/controllers/NotificationsController.js"

beforeEach(() => {
	mock.reset()
})

describe("GetNotifications function", () => {
	it("should call getNotifications endpoint", async () => {
		// Arrange
		let firstNotificationUuid = "55774a68-1167-4cea-a832-b81e6bae17e5"
		let firstNotificationTime = 59723982
		let firstNotificationInterval = 20000
		let firstNotificationTitle = "First notification"
		let firstNotificationBody = "This is a test notification"

		let secondNotificationUuid = "5b247046-8359-410c-8bb7-9c22d38e1c26"
		let secondNotificationTime = 984735345
		let secondNotificationInterval = 0
		let secondNotificationTitle = "Second notification"
		let secondNotificationBody = "Hello World"

		let accessToken = "asdohiafuoasdoasd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notifications`

		let expectedResult: ApiResponse<Notification[]> = {
			status: 200,
			data: [
				new Notification({
					Uuid: firstNotificationUuid,
					Time: firstNotificationTime,
					Interval: firstNotificationInterval,
					Title: firstNotificationTitle,
					Body: firstNotificationBody
				}),
				new Notification({
					Uuid: secondNotificationUuid,
					Time: secondNotificationTime,
					Interval: secondNotificationInterval,
					Title: secondNotificationTitle,
					Body: secondNotificationBody
				})
			]
		}

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					notifications: [
						{
							id: 12,
							user_id: 12,
							app_id: 12,
							uuid: firstNotificationUuid,
							time: firstNotificationTime,
							interval: firstNotificationInterval,
							title: firstNotificationTitle,
							body: firstNotificationBody
						},
						{
							id: 12,
							user_id: 12,
							app_id: 12,
							uuid: secondNotificationUuid,
							time: secondNotificationTime,
							interval: secondNotificationInterval,
							title: secondNotificationTitle,
							body: secondNotificationBody
						}
					]
				}
			]
		})

		// Act
		let result = (await GetNotifications()) as ApiResponse<Notification[]>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.length, expectedResult.data.length)

		assert.equal(result.data[0].Uuid, expectedResult.data[0].Uuid)
		assert.equal(result.data[0].Time, expectedResult.data[0].Time)
		assert.equal(result.data[0].Interval, expectedResult.data[0].Interval)
		assert.equal(result.data[0].Title, expectedResult.data[0].Title)
		assert.equal(result.data[0].Body, expectedResult.data[0].Body)

		assert.equal(result.data[1].Uuid, expectedResult.data[1].Uuid)
		assert.equal(result.data[1].Time, expectedResult.data[1].Time)
		assert.equal(result.data[1].Interval, expectedResult.data[1].Interval)
		assert.equal(result.data[1].Title, expectedResult.data[1].Title)
		assert.equal(result.data[1].Body, expectedResult.data[1].Body)
	})

	it("should call getNotifications endpoint with error", async () => {
		// Arrange
		let accessToken = "asdohiafuoasdoasd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notifications`

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
		let result = (await GetNotifications()) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getNotifications endpoint and renew the session", async () => {
		// Arrange
		let firstNotificationUuid = "55774a68-1167-4cea-a832-b81e6bae17e5"
		let firstNotificationTime = 59723982
		let firstNotificationInterval = 20000
		let firstNotificationTitle = "First notification"
		let firstNotificationBody = "This is a test notification"

		let secondNotificationUuid = "5b247046-8359-410c-8bb7-9c22d38e1c26"
		let secondNotificationTime = 984735345
		let secondNotificationInterval = 0
		let secondNotificationTitle = "Second notification"
		let secondNotificationBody = "Hello World"

		let accessToken = "asdohiafuoasdoasd"
		let newAccessToken = "siodgosdosdgksdgöl"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notifications`

		let expectedResult: ApiResponse<Notification[]> = {
			status: 200,
			data: [
				new Notification({
					Uuid: firstNotificationUuid,
					Time: firstNotificationTime,
					Interval: firstNotificationInterval,
					Title: firstNotificationTitle,
					Body: firstNotificationBody
				}),
				new Notification({
					Uuid: secondNotificationUuid,
					Time: secondNotificationTime,
					Interval: secondNotificationInterval,
					Title: secondNotificationTitle,
					Body: secondNotificationBody
				})
			]
		}

		mock
			.onGet(url)
			.replyOnce(config => {
				// First getNotifications request
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
			.onGet(url)
			.replyOnce(config => {
				// Second getNotifications request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [
					expectedResult.status,
					{
						notifications: [
							{
								id: 12,
								user_id: 12,
								app_id: 12,
								uuid: firstNotificationUuid,
								time: firstNotificationTime,
								interval: firstNotificationInterval,
								title: firstNotificationTitle,
								body: firstNotificationBody
							},
							{
								id: 12,
								user_id: 12,
								app_id: 12,
								uuid: secondNotificationUuid,
								time: secondNotificationTime,
								interval: secondNotificationInterval,
								title: secondNotificationTitle,
								body: secondNotificationBody
							}
						]
					}
				]
			})

		// Act
		let result = (await GetNotifications()) as ApiResponse<Notification[]>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.length, expectedResult.data.length)

		assert.equal(result.data[0].Uuid, expectedResult.data[0].Uuid)
		assert.equal(result.data[0].Time, expectedResult.data[0].Time)
		assert.equal(result.data[0].Interval, expectedResult.data[0].Interval)
		assert.equal(result.data[0].Title, expectedResult.data[0].Title)
		assert.equal(result.data[0].Body, expectedResult.data[0].Body)

		assert.equal(result.data[1].Uuid, expectedResult.data[1].Uuid)
		assert.equal(result.data[1].Time, expectedResult.data[1].Time)
		assert.equal(result.data[1].Interval, expectedResult.data[1].Interval)
		assert.equal(result.data[1].Title, expectedResult.data[1].Title)
		assert.equal(result.data[1].Body, expectedResult.data[1].Body)
	})
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
