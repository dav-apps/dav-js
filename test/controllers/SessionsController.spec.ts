import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import { davDevAuth } from '../constants'
import {
	CreateSession,
	CreateSessionFromJwt,
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
		let jwt = "hiuhfeiugasdasd"
		
		let url = `${Dav.apiBaseUrl}/session`

		let expectedResult: ApiResponse<CreateSessionResponseData> = {
			status: 201,
			data: {
				jwt
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
					jwt
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
		assert.equal(result.data.jwt, expectedResult.data.jwt)
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

describe("CreateSessionFromJwt function", () => {
	it("should call createSessionFromJwt endpoint", async () => {
		// Arrange
		let jwt = "asdasdasdasdasd"
		let appId = 83
		let apiKey = "sndksfndsdfsdfsdf"
		let deviceName = "TestDevice"
		let deviceType = "Laptop"
		let deviceOs = "Windows 10"
		
		let responseJwt = "oihdfibsdfig93q"
		let url = `${Dav.apiBaseUrl}/session/jwt`

		let expectedResult: ApiResponse<CreateSessionResponseData> = {
			status: 201,
			data: {
				jwt: responseJwt
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
			assert.equal(data.jwt, jwt)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_type, deviceType)
			assert.equal(data.device_os, deviceOs)

			request.respondWith({
				status: expectedResult.status,
				response: {
					jwt: responseJwt
				}
			})
		})

		// Act
		let result = await CreateSessionFromJwt({
			auth: davDevAuth,
			jwt,
			appId,
			apiKey,
			deviceName,
			deviceOs,
			deviceType
		}) as ApiResponse<CreateSessionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.jwt, expectedResult.data.jwt)
	})

	it("should call createSessionFromJwt endpoint with error", async () => {
		// Arrange
		let jwt = "asdasdasdasdasd"
		let appId = 83
		let apiKey = "sndksfndsdfsdfsdf"
		let deviceName = "TestDevice"
		let deviceType = "Laptop"
		let deviceOs = "Windows 10"

		let url = `${Dav.apiBaseUrl}/session/jwt`

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
			assert.equal(data.jwt, jwt)
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
		let result = await CreateSessionFromJwt({
			auth: davDevAuth,
			jwt,
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
		let jwt = "asdkgdajbodfasud"
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
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteSession({
			jwt
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call deleteSession endpoint with error", async () => {
		// Arrange
		let jwt = "asdkgdajbodfasud"
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
			assert.equal(request.config.headers.Authorization, jwt)

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
			jwt
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})