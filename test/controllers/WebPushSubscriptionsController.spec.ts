import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { WebPushSubscription } from "../../lib/models/WebPushSubscription.js"
import { GetWebPushSubscription } from "../../lib/controllers/WebPushSubscriptionsController.js"

beforeEach(() => {
	mock.reset()
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
			data: new WebPushSubscription(uuid, endpoint, p256dh, auth)
		}

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					id: 12,
					user_id: 12,
					uuid,
					endpoint,
					p256dh,
					auth
				}
			]
		})

		// Act
		let result = (await GetWebPushSubscription({
			uuid
		})) as ApiResponse<WebPushSubscription>

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
		let result = (await GetWebPushSubscription({
			uuid
		})) as ApiErrorResponse

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
			data: new WebPushSubscription(uuid, endpoint, p256dh, auth)
		}

		mock
			.onGet(url)
			.replyOnce(config => {
				// First getWebPushSubscription request
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
				// Second getWebPushSubscription request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [
					expectedResult.status,
					{
						id: 12,
						user_id: 12,
						uuid,
						endpoint,
						p256dh,
						auth
					}
				]
			})

		// Act
		let result = (await GetWebPushSubscription({
			uuid
		})) as ApiResponse<WebPushSubscription>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Endpoint, expectedResult.data.Endpoint)
		assert.equal(result.data.P256dh, expectedResult.data.P256dh)
		assert.equal(result.data.Auth, expectedResult.data.Auth)
	})
})
