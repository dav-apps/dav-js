import { assert } from "chai"
import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import {
	CreateWebsocketConnection,
	WebsocketConnectionResponseData
} from "../../lib/controllers/WebsocketConnectionsController.js"

let mock: MockAdapter = new MockAdapter(axios)

beforeEach(() => {
	mock.reset()
})

describe("CreateWebsocketConnection function", () => {
	it("should call createWebsocketConnection endpoint", async () => {
		// Arrange
		let token = "shodghosdgs"

		let accessToken = "asdhioagdioasg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/websocket_connection`

		let expectedResult: ApiResponse<WebsocketConnectionResponseData> = {
			status: 201,
			data: {
				token
			}
		}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					token
				}
			]
		})

		// Act
		let result =
			(await CreateWebsocketConnection()) as ApiResponse<WebsocketConnectionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.token, expectedResult.data.token)
	})

	it("should call createWebsocketConnection endpoint with error", async () => {
		// Arrange
		let accessToken = "asdhioagdioasg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/websocket_connection`

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
		let result = (await CreateWebsocketConnection()) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createWebsocketConnection endpoint and renew the session", async () => {
		// Arrange
		let token = "shodghosdgs"

		let accessToken = "asdhioagdioasg"
		let newAccessToken = "shiodghiosdhiosdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/websocket_connection`

		let expectedResult: ApiResponse<WebsocketConnectionResponseData> = {
			status: 201,
			data: {
				token
			}
		}

		mock
			.onPost(url)
			.replyOnce(config => {
				// First createWebsocketConnection request
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
				// Second createWebsocketConnection request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [
					expectedResult.status,
					{
						token
					}
				]
			})

		// Act
		let result =
			(await CreateWebsocketConnection()) as ApiResponse<WebsocketConnectionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.token, expectedResult.data.token)
	})
})
