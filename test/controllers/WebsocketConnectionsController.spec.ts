import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { ApiResponse, ApiErrorResponse } from '../../lib/types.js'
import * as ErrorCodes from '../../lib/errorCodes.js'
import {
	CreateWebsocketConnection,
	WebsocketConnectionResponseData
} from '../../lib/controllers/WebsocketConnectionsController.js'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
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

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					token
				}
			})
		})

		// Act
		let result = await CreateWebsocketConnection() as ApiResponse<WebsocketConnectionResponseData>

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
		let result = await CreateWebsocketConnection() as ApiErrorResponse

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

		// First createWebsocketConnection request
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

		// Second createWebsocketConnection request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					token
				}
			})
		})

		// Act
		let result = await CreateWebsocketConnection() as ApiResponse<WebsocketConnectionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.token, expectedResult.data.token)
	})
})