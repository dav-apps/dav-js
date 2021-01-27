import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import { Notification } from '../../lib/models/Notification'
import {
	CreateNotification,
	GetNotifications,
	UpdateNotification,
	DeleteNotification
} from '../../lib/controllers/NotificationsController'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateNotification function", () => {
	it("should call createNotification endpoint", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"
		let time = 12345
		let interval = 100
		let title = "TestNotification"
		let body = "Hello World"

		let accessToken = "asdobagahsiasd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notification`

		let expectedResult: ApiResponse<Notification> = {
			status: 201,
			data: new Notification({
				Uuid: uuid,
				Time: time,
				Interval: interval,
				Title: title,
				Body: body
			})
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					app_id: 12,
					uuid,
					time,
					interval,
					title,
					body
				}
			})
		})

		// Act
		let result = await CreateNotification({
			uuid,
			time,
			interval,
			title,
			body
		}) as ApiResponse<Notification>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Time, expectedResult.data.Time)
		assert.equal(result.data.Interval, expectedResult.data.Interval)
		assert.equal(result.data.Title, expectedResult.data.Title)
		assert.equal(result.data.Body, expectedResult.data.Body)
	})

	it("should call createNotification endpoint with error", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"
		let time = 12345
		let interval = 100
		let title = "TestNotification"
		let body = "Hello World"

		let accessToken = "asdobagahsiasd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notification`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await CreateNotification({
			uuid,
			time,
			interval,
			title,
			body
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createNotification endpoint and renew the session", async () => {
		// Arrange
		let uuid = "a185fe9f-e774-49ea-bb04-3b23650dd8c0"
		let time = 12345
		let interval = 100
		let title = "TestNotification"
		let body = "Hello World"

		let accessToken = "asdobagahsiasd"
		let newAccessToken = "sdgksdjfskdhfsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/notification`

		let expectedResult: ApiResponse<Notification> = {
			status: 201,
			data: new Notification({
				Uuid: uuid,
				Time: time,
				Interval: interval,
				Title: title,
				Body: body
			})
		}

		// First createNotification request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: 1602,
						message: "Action not allowed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second createNotification request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					app_id: 12,
					uuid,
					time,
					interval,
					title,
					body
				}
			})
		})

		// Act
		let result = await CreateNotification({
			uuid,
			time,
			interval,
			title,
			body
		}) as ApiResponse<Notification>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Time, expectedResult.data.Time)
		assert.equal(result.data.Interval, expectedResult.data.Interval)
		assert.equal(result.data.Title, expectedResult.data.Title)
		assert.equal(result.data.Body, expectedResult.data.Body)
	})
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

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
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
			})
		})

		// Act
		let result = await GetNotifications() as ApiResponse<Notification[]>

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
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await GetNotifications() as ApiErrorResponse

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

		// First getNotifications request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: 1602,
						message: "Action not allowed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second getNotifications request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
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
			})
		})

		// Act
		let result = await GetNotifications() as ApiResponse<Notification[]>

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

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					app_id: 12,
					uuid,
					time,
					interval,
					title,
					body
				}
			})
		})

		// Act
		let result = await UpdateNotification({
			uuid,
			time,
			interval,
			title,
			body
		}) as ApiResponse<Notification>

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
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})
		
		// Act
		let result = await UpdateNotification({
			uuid,
			time,
			interval,
			title,
			body
		}) as ApiErrorResponse

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

		// First updateNotification request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: 1602,
						message: "Action not allowed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second updateNotification request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.time, time)
			assert.equal(data.interval, interval)
			assert.equal(data.title, title)
			assert.equal(data.body, body)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					app_id: 12,
					uuid,
					time,
					interval,
					title,
					body
				}
			})
		})

		// Act
		let result = await UpdateNotification({
			uuid,
			time,
			interval,
			title,
			body
		}) as ApiResponse<Notification>

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

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteNotification({
			uuid
		}) as ApiResponse<{}>

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
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await DeleteNotification({
			uuid
		}) as ApiErrorResponse

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

		// First deleteNotification request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: 1602,
						message: "Action not allowed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second deleteNotification request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteNotification({
			uuid
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})
})