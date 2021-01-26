import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import { davDevAuth } from '../constants'
import {
	CreateSession,
	CreateSessionFromAccessToken,
	DeleteSession,
	CreateSessionResponseData
} from '../../lib/controllers/SessionsController'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateSession function", () => {
	it("should call createSession endpoint", async () => {
		// Arrange
		let email = "test@example.com"
		let password = "123456"
		let appId = 35
		let apiKey = "asdasd0htw8hiefiusfbs"
		let deviceName = "TestDevice"
		let deviceType = "Laptop"
		let deviceOs = "Windows 10"
		let accessToken = "hiuhfeiugasdasd"
		
		let url = `${Dav.apiBaseUrl}/session`

		let expectedResult: ApiResponse<CreateSessionResponseData> = {
			status: 201,
			data: {
				accessToken
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, email)
			assert.equal(data.password, password)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_type, deviceType)
			assert.equal(data.device_os, deviceOs)

			request.respondWith({
				status: expectedResult.status,
				response: {
					access_token: accessToken
				}
			})
		})

		// Act
		let result = await CreateSession({
			auth: davDevAuth,
			email,
			password,
			appId,
			apiKey,
			deviceName,
			deviceType,
			deviceOs
		}) as ApiResponse<CreateSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.accessToken, expectedResult.data.accessToken)
	})

	it("should call createSession endpoint with error", async () => {
		// Arrange
		let email = "test@example.com"
		let password = "123456"
		let appId = 35
		let apiKey = "asdasd0htw8hiefiusfbs"
		let deviceName = "TestDevice"
		let deviceType = "Laptop"
		let deviceOs = "Windows 10"

		let url = `${Dav.apiBaseUrl}/session`

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
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, email)
			assert.equal(data.password, password)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_type, deviceType)
			assert.equal(data.device_os, deviceOs)

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
		let result = await CreateSession({
			auth: davDevAuth,
			email,
			password,
			appId,
			apiKey,
			deviceName,
			deviceType,
			deviceOs
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("CreateSessionFromAccessToken function", () => {
	it("should call createSessionFromAccessToken endpoint", async () => {
		// Arrange
		let accessToken = "asdasdasdasdasd"
		let appId = 83
		let apiKey = "sndksfndsdfsdfsdf"
		let deviceName = "TestDevice"
		let deviceType = "Laptop"
		let deviceOs = "Windows 10"
		
		let responseAccessToken = "oihdfibsdfig93q"
		let url = `${Dav.apiBaseUrl}/session/access_token`

		let expectedResult: ApiResponse<CreateSessionResponseData> = {
			status: 201,
			data: {
				accessToken: responseAccessToken
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.access_token, accessToken)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_type, deviceType)
			assert.equal(data.device_os, deviceOs)

			request.respondWith({
				status: expectedResult.status,
				response: {
					access_token: responseAccessToken
				}
			})
		})

		// Act
		let result = await CreateSessionFromAccessToken({
			auth: davDevAuth,
			accessToken,
			appId,
			apiKey,
			deviceName,
			deviceOs,
			deviceType
		}) as ApiResponse<CreateSessionResponseData>

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
		let deviceType = "Laptop"
		let deviceOs = "Windows 10"

		let url = `${Dav.apiBaseUrl}/session/access_token`

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
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.access_token, accessToken)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_type, deviceType)
			assert.equal(data.device_os, deviceOs)

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
		let result = await CreateSessionFromAccessToken({
			auth: davDevAuth,
			accessToken,
			appId,
			apiKey,
			deviceName,
			deviceOs,
			deviceType
		}) as ApiErrorResponse

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

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteSession({
			accessToken
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call deleteSession endpoint with error", async () => {
		// Arrange
		let accessToken = "asdkgdajbodfasud"
		let url = `${Dav.apiBaseUrl}/session`

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
			assert.equal(request.config.method, 'delete')
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
		let result = await DeleteSession({
			accessToken
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})