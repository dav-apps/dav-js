import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { ApiResponse, ApiErrorResponse } from '../../lib/types.js'
import { davDevAuth } from '../constants.js'
import * as ErrorCodes from '../../lib/errorCodes.js'
import {
	CreateSession,
	CreateSessionFromAccessToken,
	RenewSession,
	DeleteSession,
	SessionResponseData
} from '../../lib/controllers/SessionsController.js'

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
		let deviceOs = "Windows 10"
		let accessToken = "hiuhfeiugasdasd"
		let websiteAccessToken = "jsodhiosdfhiosfd"
		
		let url = `${Dav.apiBaseUrl}/session`

		let expectedResult: ApiResponse<SessionResponseData> = {
			status: 201,
			data: {
				accessToken,
				websiteAccessToken
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
			assert.equal(data.device_os, deviceOs)

			request.respondWith({
				status: expectedResult.status,
				response: {
					access_token: accessToken,
					website_access_token: websiteAccessToken
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
			deviceOs
		}) as ApiResponse<SessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.accessToken, expectedResult.data.accessToken)
		assert.equal(result.data.websiteAccessToken, expectedResult.data.websiteAccessToken)
	})

	it("should call createSession endpoint with error", async () => {
		// Arrange
		let email = "test@example.com"
		let password = "123456"
		let appId = 35
		let apiKey = "asdasd0htw8hiefiusfbs"
		let deviceName = "TestDevice"
		let deviceOs = "Windows 10"

		let url = `${Dav.apiBaseUrl}/session`

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
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, email)
			assert.equal(data.password, password)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
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
		let deviceOs = "Windows 10"
		
		let responseAccessToken = "oihdfibsdfig93q"
		let url = `${Dav.apiBaseUrl}/session/access_token`

		let expectedResult: ApiResponse<SessionResponseData> = {
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
			deviceOs
		}) as ApiResponse<SessionResponseData>

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
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.access_token, accessToken)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
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
			deviceOs
		}) as ApiErrorResponse

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

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Act
		let result = await RenewSession({
			accessToken
		}) as ApiResponse<SessionResponseData>

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
			errors: [{
				code: ErrorCodes.ActionNotAllowed,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
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
		let result = await RenewSession({
			accessToken
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
				code: ErrorCodes.ActionNotAllowed,
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