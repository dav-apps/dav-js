import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { ApiResponse, ApiErrorResponse } from '../../index.js'
import * as ErrorCodes from '../../lib/errorCodes.js'
import {
	CreateCheckoutSession,
	CreateCheckoutSessionResponseData
} from '../../lib/controllers/CheckoutSessionsController.js'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateCheckoutSession function", () => {
	it("should call createCheckoutSession endpoint", async () => {
		// Arrange
		let mode = "subscription"
		let plan = 1
		let successUrl = "https://dav-apps.tech/user?success=true&plan=1"
		let cancelUrl = "https://dav-apps.tech/user"
		let sessionUrl = "https://checkout.stripe.com/sahihdshjksfsfjkd"

		let accessToken = "sdhfhsdffjhksfdsfjkd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/checkout_session`

		let expectedResult: ApiResponse<CreateCheckoutSessionResponseData> = {
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
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.mode, mode)
			assert.equal(data.plan, plan)
			assert.equal(data.success_url, successUrl)
			assert.equal(data.cancel_url, cancelUrl)

			request.respondWith({
				status: expectedResult.status,
				response: {
					session_url: sessionUrl
				}
			})
		})

		// Act
		let result = await CreateCheckoutSession({
			mode,
			plan,
			successUrl,
			cancelUrl
		}) as ApiResponse<CreateCheckoutSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.sessionUrl, sessionUrl)
	})

	it("should call createCheckoutSession endpoint with error", async () => {
		// Arrange
		let mode = "subscription"
		let plan = 1
		let successUrl = "https://dav-apps.tech/user?success=true&plan=1"
		let cancelUrl = "https://dav-apps.tech/user"

		let accessToken = "sdhfhsdffjhksfdsfjkd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/checkout_session`

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
			assert.equal(data.mode, mode)
			assert.equal(data.plan, plan)
			assert.equal(data.success_url, successUrl)
			assert.equal(data.cancel_url, cancelUrl)

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
		let result = await CreateCheckoutSession({
			mode,
			plan,
			successUrl,
			cancelUrl
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createCheckoutSession endpoint and renew the session", async () => {
		// Arrange
		let mode = "subscription"
		let plan = 1
		let successUrl = "https://dav-apps.tech/user?success=true&plan=1"
		let cancelUrl = "https://dav-apps.tech/user"
		let sessionUrl = "https://checkout.stripe.com/sahihdshjksfsfjkd"

		let accessToken = "sdhfhsdffjhksfdsfjkd"
		let newAccessToken = "shodhiosdiosfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/checkout_session`

		let expectedResult: ApiResponse<CreateCheckoutSessionResponseData> = {
			status: 201,
			data: {
				sessionUrl
			}
		}

		// First createCheckoutSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.mode, mode)
			assert.equal(data.plan, plan)
			assert.equal(data.success_url, successUrl)
			assert.equal(data.cancel_url, cancelUrl)

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

		// Second createCheckoutSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.mode, mode)
			assert.equal(data.plan, plan)
			assert.equal(data.success_url, successUrl)
			assert.equal(data.cancel_url, cancelUrl)

			request.respondWith({
				status: expectedResult.status,
				response: {
					session_url: sessionUrl
				}
			})
		})

		// Act
		let result = await CreateCheckoutSession({
			mode,
			plan,
			successUrl,
			cancelUrl
		}) as ApiResponse<CreateCheckoutSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.sessionUrl, sessionUrl)
	})
})