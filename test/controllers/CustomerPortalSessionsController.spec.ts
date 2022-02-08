import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { ApiResponse, ApiErrorResponse } from '../../index.js'
import * as ErrorCodes from '../../lib/errorCodes.js'
import {
	CreateCustomerPortalSession,
	CreateCustomerPortalSessionResponseData
} from '../../lib/controllers/CustomerPortalSessionsConroller.js'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateCustomerPortalSession function", () => {
	it("should call createCustomerPortalSession endpoint", async () => {
		// Arrange
		let sessionUrl = "https://billing.stripe.com/sahihdshjksfsfjkd"

		let accessToken = "sdsfdhsfdjksfdhkjsfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/customer_portal_session`

		let expectedResult: ApiResponse<CreateCustomerPortalSessionResponseData> = {
			status: 201,
			data: {
				sessionUrl
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					session_url: sessionUrl
				}
			})
		})

		// Act
		let result = await CreateCustomerPortalSession() as ApiResponse<CreateCustomerPortalSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.sessionUrl, sessionUrl)
	})

	it("should call createCustomerPortalSession endpoint with error", async () => {
		// Arrange
		let accessToken = "sdsfdhsfdjksfdhkjsfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/customer_portal_session`

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
		let result = await CreateCustomerPortalSession() as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createCustomerPortalSession endpoint and renew the session", async () => {
		// Arrange
		let sessionUrl = "https://billing.stripe.com/sahihdshjksfsfjkd"

		let accessToken = "sdsfdhsfdjksfdhkjsfd"
		let newAccessToken = "shiofshodjhksdfjhksfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/customer_portal_session`

		let expectedResult: ApiResponse<CreateCustomerPortalSessionResponseData> = {
			status: 201,
			data: {
				sessionUrl
			}
		}

		// First createCustomerPortalSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
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

		// Second createCustomerPortalSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					session_url: sessionUrl
				}
			})
		})

		// Act
		let result = await CreateCustomerPortalSession() as ApiResponse<CreateCustomerPortalSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.sessionUrl, sessionUrl)
	})
})