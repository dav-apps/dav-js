import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import {
	CreateStripeCustomerForUser,
	CreateStripeCustomerForUserResponseData
} from "../../lib/controllers/UsersController.js"

beforeEach(() => {
	mock.reset()
})

describe("CreateStripeCustomerForUser function", () => {
	it("should call createStripeCustomerForUser endpoint", async () => {
		// Arrange
		let stripeCustomerId = "sogdosdfiodsfd"

		let accessToken = "shiodfhosdghiosdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiResponse<CreateStripeCustomerForUserResponseData> =
			{
				status: 201,
				data: {
					stripeCustomerId
				}
			}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					stripe_customer_id: stripeCustomerId
				}
			]
		})

		// Act
		let result =
			(await CreateStripeCustomerForUser()) as ApiResponse<CreateStripeCustomerForUserResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(
			result.data.stripeCustomerId,
			expectedResult.data.stripeCustomerId
		)
	})

	it("should call createStripeCustomerForUser endpoint with error", async () => {
		// Arrange
		let accessToken = "shiodfhosdghiosdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/stripe`

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
		let result = (await CreateStripeCustomerForUser()) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createStripeCustomerForUser endpoint and renew the session", async () => {
		// Arrange
		let stripeCustomerId = "sogdosdfiodsfd"

		let accessToken = "shiodfhosdghiosdg"
		let newAccessToken = "iohfgosdfiohsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiResponse<CreateStripeCustomerForUserResponseData> =
			{
				status: 201,
				data: {
					stripeCustomerId
				}
			}

		mock
			.onPost(url)
			.replyOnce(config => {
				// First createStripeCustomerForUser request
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
			.onPost(url)
			.replyOnce(config => {
				// Second createStripeCustomerForUser request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [
					expectedResult.status,
					{
						stripe_customer_id: stripeCustomerId
					}
				]
			})

		// Act
		let result =
			(await CreateStripeCustomerForUser()) as ApiResponse<CreateStripeCustomerForUserResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(
			result.data.stripeCustomerId,
			expectedResult.data.stripeCustomerId
		)
	})
})
