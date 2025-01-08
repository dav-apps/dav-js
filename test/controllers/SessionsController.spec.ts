import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import { davDevAuth } from "../constants.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import {
	CreateSessionFromAccessToken,
	RenewSession,
	DeleteSession,
	SessionResponseData
} from "../../lib/controllers/SessionsController.js"

beforeEach(() => {
	mock.reset()
})

describe("CreateSessionFromAccessToken function", () => {
	it("should call createSessionFromAccessToken endpoint", async () => {
		// Arrange
		let accessToken = "asdasdasdasdasd"
		let appId = 83
		let apiKey = "sndksfndsdfsdfsdf"
		let deviceName = "TestDevice"
		let deviceOs = "Windows 10"

		let responseAccessToken = "oihdfibsdfig93q"
		let url = `${Dav.apiBaseUrl}/session/access_token`

		let expectedResult: ApiResponse<SessionResponseData> = {
			status: 201,
			data: {
				accessToken: responseAccessToken
			}
		}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, davDevAuth.token)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.access_token, accessToken)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_os, deviceOs)

			return [
				expectedResult.status,
				{
					access_token: responseAccessToken
				}
			]
		})

		// Act
		let result = (await CreateSessionFromAccessToken({
			auth: davDevAuth,
			accessToken,
			appId,
			apiKey,
			deviceName,
			deviceOs
		})) as ApiResponse<SessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.accessToken, expectedResult.data.accessToken)
	})

	it("should call createSessionFromAccessToken endpoint with error", async () => {
		// Arrange
		let accessToken = "asdasdasdasdasd"
		let appId = 83
		let apiKey = "sndksfndsdfsdfsdf"
		let deviceName = "TestDevice"
		let deviceOs = "Windows 10"

		let url = `${Dav.apiBaseUrl}/session/access_token`

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
			assert.equal(config.headers.Authorization, davDevAuth.token)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.access_token, accessToken)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_os, deviceOs)

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
		let result = (await CreateSessionFromAccessToken({
			auth: davDevAuth,
			accessToken,
			appId,
			apiKey,
			deviceName,
			deviceOs
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("RenewSession function", () => {
	it("should call renewSession endpoint", async () => {
		// Arrange
		let accessToken = "snjdgosndgosgd"
		let newAccessToken = "siodgsodghsdg"
		let url = `${Dav.apiBaseUrl}/session/renew`

		let expectedResult: ApiResponse<SessionResponseData> = {
			status: 200,
			data: {
				accessToken: newAccessToken
			}
		}

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					access_token: newAccessToken
				}
			]
		})

		// Act
		let result = (await RenewSession({
			accessToken
		})) as ApiResponse<SessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.accessToken, expectedResult.data.accessToken)
	})

	it("should call renewSession endpoint with error", async () => {
		// Arrange
		let accessToken = "snjdgosndgosgd"
		let url = `${Dav.apiBaseUrl}/session/renew`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onPut(url).reply(config => {
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
		let result = (await RenewSession({
			accessToken
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("DeleteSession function", () => {
	it("should call deleteSession endpoint", async () => {
		// Arrange
		let accessToken = "asdkgdajbodfasud"
		let url = `${Dav.apiBaseUrl}/session`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		mock.onDelete(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [expectedResult.status, {}]
		})

		// Act
		let result = (await DeleteSession({
			accessToken
		})) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call deleteSession endpoint with error", async () => {
		// Arrange
		let accessToken = "asdkgdajbodfasud"
		let url = `${Dav.apiBaseUrl}/session`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onDelete(url).reply(config => {
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
		let result = (await DeleteSession({
			accessToken
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})
