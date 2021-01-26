import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import {
	CreateWebsocketConnection,
	WebsocketConnectionResponseData
} from '../../lib/controllers/WebsocketConnectionsController'

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
		let result = await CreateWebsocketConnection({
			accessToken
		}) as ApiResponse<WebsocketConnectionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.token, expectedResult.data.token)
	})

	it("should call createWebsocketConnection endpoint with error", async () => {
		// Arrange
		let token = "shodghosdgs"

		let accessToken = "asdhioagdioasg"
		let url = `${Dav.apiBaseUrl}/websocket_connection`

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
		let result = await CreateWebsocketConnection({
			accessToken
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})