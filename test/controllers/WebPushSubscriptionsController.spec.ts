import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import * as ErrorCodes from '../../lib/errorCodes'
import { WebPushSubscription } from '../../lib/models/WebPushSubscription'
import {
	CreateWebPushSubscription,
	GetWebPushSubscription
} from '../../lib/controllers/WebPushSubscriptionsController'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateWebPushSubscription function", () => {
	it("should call createWebPushSubscription endpoint", async () => {
		// Arrange
		let uuid = "3853277f-3633-4092-998d-15b928345924"
		let endpoint = "https://bla.microsoft.com/test"
		let p256dh = "asdasfpadgijsdghosidg"
		let auth = "uiafuihdahuiaf"

		let accessToken = "shiodghsodghsgod"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/web_push_subscription`

		let expectedResult: ApiResponse<WebPushSubscription> = {
			status: 201,
			data: new WebPushSubscription(
				uuid,
				endpoint,
				p256dh,
				auth
			)
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
			assert.equal(data.endpoint, endpoint)
			assert.equal(data.p256dh, p256dh)
			assert.equal(data.auth, auth)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					uuid,
					endpoint,
					p256dh,
					auth
				}
			})
		})

		// Act
		let result = await CreateWebPushSubscription({
			uuid,
			endpoint,
			p256dh,
			auth
		}) as ApiResponse<WebPushSubscription>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Endpoint, expectedResult.data.Endpoint)
		assert.equal(result.data.P256dh, expectedResult.data.P256dh)
		assert.equal(result.data.Auth, expectedResult.data.Auth)
	})

	it("should call createWebPushSubscription endpoint with error", async () => {
		// Arrange
		let uuid = "3853277f-3633-4092-998d-15b928345924"
		let endpoint = "https://bla.microsoft.com/test"
		let p256dh = "asdasfpadgijsdghosidg"
		let auth = "uiafuihdahuiaf"

		let accessToken = "shiodghsodghsgod"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/web_push_subscription`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: ErrorCodes.ActionNotAllowed,
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
			assert.equal(data.endpoint, endpoint)
			assert.equal(data.p256dh, p256dh)
			assert.equal(data.auth, auth)

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
		let result = await CreateWebPushSubscription({
			uuid,
			endpoint,
			p256dh,
			auth
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createWebPushSubscription endpoint and renew the session", async () => {
		// Arrange
		let uuid = "3853277f-3633-4092-998d-15b928345924"
		let endpoint = "https://bla.microsoft.com/test"
		let p256dh = "asdasfpadgijsdghosidg"
		let auth = "uiafuihdahuiaf"

		let accessToken = "shiodghsodghsgod"
		let newAccessToken = "shiogdhiosdghiosgd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/web_push_subscription`

		let expectedResult: ApiResponse<WebPushSubscription> = {
			status: 201,
			data: new WebPushSubscription(
				uuid,
				endpoint,
				p256dh,
				auth
			)
		}

		// First createWebPushSubscription request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.endpoint, endpoint)
			assert.equal(data.p256dh, p256dh)
			assert.equal(data.auth, auth)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: ErrorCodes.AccessTokenMustBeRenewed,
						message: "Access token must be renewed"
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

		// Second createWebPushSubscription request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.endpoint, endpoint)
			assert.equal(data.p256dh, p256dh)
			assert.equal(data.auth, auth)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					uuid,
					endpoint,
					p256dh,
					auth
				}
			})
		})

		// Act
		let result = await CreateWebPushSubscription({
			uuid,
			endpoint,
			p256dh,
			auth
		}) as ApiResponse<WebPushSubscription>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Endpoint, expectedResult.data.Endpoint)
		assert.equal(result.data.P256dh, expectedResult.data.P256dh)
		assert.equal(result.data.Auth, expectedResult.data.Auth)
	})
})

describe("GetWebPushSubscription function", () => {
	it("should call getWebPushSubscription endpoint", async () => {
		// Arrange
		let uuid = "a400f12b-468d-4283-bc56-859e6b3d96b6"
		let endpoint = "https://bla.microsoft.com/test"
		let p256dh = "asdasfpadgijsdghosidg"
		let auth = "uiafuihdahuiaf"

		let accessToken = "shiodghsodghsgod"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/web_push_subscription/${uuid}`

		let expectedResult: ApiResponse<WebPushSubscription> = {
			status: 200,
			data: new WebPushSubscription(
				uuid,
				endpoint,
				p256dh,
				auth
			)
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
					id: 12,
					user_id: 12,
					uuid,
					endpoint,
					p256dh,
					auth
				}
			})
		})

		// Act
		let result = await GetWebPushSubscription({
			uuid
		}) as ApiResponse<WebPushSubscription>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Endpoint, expectedResult.data.Endpoint)
		assert.equal(result.data.P256dh, expectedResult.data.P256dh)
		assert.equal(result.data.Auth, expectedResult.data.Auth)
	})

	it("should call getWebPushSubscription endpoint with error", async () => {
		// Arrange
		let uuid = "a400f12b-468d-4283-bc56-859e6b3d96b6"

		let accessToken = "shiodghsodghsgod"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/web_push_subscription/${uuid}`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: ErrorCodes.ActionNotAllowed,
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
		let result = await GetWebPushSubscription({
			uuid
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getWebPushSubscription endpoint and renew the session", async () => {
		// Arrange
		let uuid = "a400f12b-468d-4283-bc56-859e6b3d96b6"
		let endpoint = "https://bla.microsoft.com/test"
		let p256dh = "asdasfpadgijsdghosidg"
		let auth = "uiafuihdahuiaf"

		let accessToken = "shiodghsodghsgod"
		let newAccessToken = "shiodsghiodhiosgd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/web_push_subscription/${uuid}`

		let expectedResult: ApiResponse<WebPushSubscription> = {
			status: 201,
			data: new WebPushSubscription(
				uuid,
				endpoint,
				p256dh,
				auth
			)
		}

		// First getWebPushSubscription request
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
						code: ErrorCodes.AccessTokenMustBeRenewed,
						message: "Access token must be renewed"
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

		// Second getWebPushSubscription request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					uuid,
					endpoint,
					p256dh,
					auth
				}
			})
		})

		// Act
		let result = await GetWebPushSubscription({
			uuid
		}) as ApiResponse<WebPushSubscription>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Endpoint, expectedResult.data.Endpoint)
		assert.equal(result.data.P256dh, expectedResult.data.P256dh)
		assert.equal(result.data.Auth, expectedResult.data.Auth)
	})
})