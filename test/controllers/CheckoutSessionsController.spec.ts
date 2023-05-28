import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../index.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import {
	CreateCheckoutSession,
	CreateCheckoutSessionResponseData,
	CreateCheckoutSessionMode
} from "../../lib/controllers/CheckoutSessionsController.js"

beforeEach(() => {
	mock.reset()
})

describe("CreateCheckoutSession function", () => {
	it("should call createCheckoutSession endpoint", async () => {
		// Arrange
		let mode: CreateCheckoutSessionMode = "subscription"
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

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.mode, mode)
			assert.equal(data.plan, plan)
			assert.equal(data.success_url, successUrl)
			assert.equal(data.cancel_url, cancelUrl)

			return [
				expectedResult.status,
				{
					session_url: sessionUrl
				}
			]
		})

		// Act
		let result = (await CreateCheckoutSession({
			mode,
			plan,
			successUrl,
			cancelUrl
		})) as ApiResponse<CreateCheckoutSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.sessionUrl, sessionUrl)
	})

	it("should call createCheckoutSession endpoint with error", async () => {
		// Arrange
		let mode: CreateCheckoutSessionMode = "subscription"
		let plan = 1
		let successUrl = "https://dav-apps.tech/user?success=true&plan=1"
		let cancelUrl = "https://dav-apps.tech/user"

		let accessToken = "sdhfhsdffjhksfdsfjkd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/checkout_session`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.mode, mode)
			assert.equal(data.plan, plan)
			assert.equal(data.success_url, successUrl)
			assert.equal(data.cancel_url, cancelUrl)

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
		let result = (await CreateCheckoutSession({
			mode,
			plan,
			successUrl,
			cancelUrl
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createCheckoutSession endpoint and renew the session", async () => {
		// Arrange
		let mode: CreateCheckoutSessionMode = "subscription"
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

		mock
			.onPost(url)
			.replyOnce(config => {
				// First createCheckoutSession request
				assert.equal(config.headers.Authorization, accessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.mode, mode)
				assert.equal(data.plan, plan)
				assert.equal(data.success_url, successUrl)
				assert.equal(data.cancel_url, cancelUrl)

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
			.onPost(url)
			.replyOnce(config => {
				// Second createCheckoutSession request
				assert.equal(config.headers.Authorization, newAccessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.mode, mode)
				assert.equal(data.plan, plan)
				assert.equal(data.success_url, successUrl)
				assert.equal(data.cancel_url, cancelUrl)

				return [
					expectedResult.status,
					{
						session_url: sessionUrl
					}
				]
			})

		// Act
		let result = (await CreateCheckoutSession({
			mode,
			plan,
			successUrl,
			cancelUrl
		})) as ApiResponse<CreateCheckoutSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.sessionUrl, sessionUrl)
	})
})
