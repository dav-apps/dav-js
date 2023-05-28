import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../index.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import {
	CreateCustomerPortalSession,
	CreateCustomerPortalSessionResponseData
} from "../../lib/controllers/CustomerPortalSessionsConroller.js"

beforeEach(() => {
	mock.reset()
})

describe("CreateCustomerPortalSession function", () => {
	it("should call createCustomerPortalSession endpoint", async () => {
		// Arrange
		let sessionUrl = "https://billing.stripe.com/sahihdshjksfsfjkd"

		let accessToken = "sdsfdhsfdjksfdhkjsfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/customer_portal_session`

		let expectedResult: ApiResponse<CreateCustomerPortalSessionResponseData> =
			{
				status: 201,
				data: {
					sessionUrl
				}
			}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					session_url: sessionUrl
				}
			]
		})

		// Act
		let result =
			(await CreateCustomerPortalSession()) as ApiResponse<CreateCustomerPortalSessionResponseData>

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
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onPost(url).reply(config => {
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
		let result = (await CreateCustomerPortalSession()) as ApiErrorResponse

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

		let expectedResult: ApiResponse<CreateCustomerPortalSessionResponseData> =
			{
				status: 201,
				data: {
					sessionUrl
				}
			}

		mock.onPost(url).replyOnce(config => {
			// First createCustomerPortalSession request
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
		}).onPut(`${Dav.apiBaseUrl}/session/renew`).replyOnce(config => {
			// renewSession request
			assert.equal(config.headers.Authorization, accessToken)

			return [
				200,
				{
					access_token: newAccessToken
				}
			]
		}).onPost(url).replyOnce(config => {
			// Second createCustomerPortalSession request
			assert.equal(config.headers.Authorization, newAccessToken)

			return [
				expectedResult.status,
				{
					session_url: sessionUrl
				}
			]
		})

		// Act
		let result =
			(await CreateCustomerPortalSession()) as ApiResponse<CreateCustomerPortalSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.sessionUrl, sessionUrl)
	})
})
