import { assert } from "chai"
import moxios from "moxios"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import {
	CreateProvider,
	GetProvider,
	ProviderResponseData
} from "../../lib/controllers/ProvidersController.js"

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateProvider function", () => {
	it("should call createProvider endpoint", async () => {
		// Arrange
		let id = 23
		let userId = 23
		let stripeAccountId = "sjdghsdfhosdfjiosfd"
		let country = "DE"

		let accessToken = "jdfjsdghisdgsfid"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/provider`

		let expectedResult: ApiResponse<ProviderResponseData> = {
			status: 201,
			data: {
				id,
				userId,
				stripeAccountId
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "post")
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(
				request.config.headers["Content-Type"],
				"application/json"
			)

			let data = JSON.parse(request.config.data)
			assert.equal(data.country, country)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					stripe_account_id: stripeAccountId
				}
			})
		})

		// Act
		let result = (await CreateProvider({
			country
		})) as ApiResponse<ProviderResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.id, expectedResult.data.id)
		assert.equal(result.data.userId, expectedResult.data.userId)
		assert.equal(
			result.data.stripeAccountId,
			expectedResult.data.stripeAccountId
		)
	})

	it("should call createProvider endpoint with error", async () => {
		// Arrange
		let country = "DE"

		let accessToken = "jdfjsdghisdgsfid"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/provider`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "post")
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(
				request.config.headers["Content-Type"],
				"application/json"
			)

			let data = JSON.parse(request.config.data)
			assert.equal(data.country, country)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			})
		})

		// Act
		let result = (await CreateProvider({
			country
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createProvider endpoint and renew the session", async () => {
		// Arrange
		let id = 23
		let userId = 23
		let stripeAccountId = "sjdghsdfhosdfjiosfd"
		let country = "DE"

		let accessToken = "jdfjsdghisdgsfid"
		let newAccessToken = "iohsdfhiosdfoihsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/provider`

		let expectedResult: ApiResponse<ProviderResponseData> = {
			status: 201,
			data: {
				id,
				userId,
				stripeAccountId
			}
		}

		// First createProvider request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "post")
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(
				request.config.headers["Content-Type"],
				"application/json"
			)

			let data = JSON.parse(request.config.data)
			assert.equal(data.country, country)

			request.respondWith({
				status: 403,
				response: {
					errors: [
						{
							code: ErrorCodes.AccessTokenMustBeRenewed,
							message: "Access token must be renewed"
						}
					]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, "put")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second createProvider request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "post")
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(
				request.config.headers["Content-Type"],
				"application/json"
			)

			let data = JSON.parse(request.config.data)
			assert.equal(data.country, country)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					stripe_account_id: stripeAccountId
				}
			})
		})

		// Act
		let result = (await CreateProvider({
			country
		})) as ApiResponse<ProviderResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.id, expectedResult.data.id)
		assert.equal(result.data.userId, expectedResult.data.userId)
		assert.equal(
			result.data.stripeAccountId,
			expectedResult.data.stripeAccountId
		)
	})
})

describe("GetProvider function", () => {
	it("should call getProvider endpoint", async () => {
		// Arrange
		let id = 23
		let userId = 23
		let stripeAccountId = "sjdghsdfhosdfjiosfd"

		let accessToken = "iosdgshiodshiodf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/provider`

		let expectedResult: ApiResponse<ProviderResponseData> = {
			status: 200,
			data: {
				id,
				userId,
				stripeAccountId
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "get")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					stripe_account_id: stripeAccountId
				}
			})
		})

		// Act
		let result = (await GetProvider()) as ApiResponse<ProviderResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.id, expectedResult.data.id)
		assert.equal(result.data.userId, expectedResult.data.userId)
		assert.equal(
			result.data.stripeAccountId,
			expectedResult.data.stripeAccountId
		)
	})

	it("should call getProvider endpoint with error", async () => {
		// Arrange
		let accessToken = "iosdgshiodshiodf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/provider`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "get")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			})
		})

		// Act
		let result = (await GetProvider()) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getProvider endpoint and renew the session", async () => {
		// Arrange
		let id = 23
		let userId = 23
		let stripeAccountId = "sjdghsdfhosdfjiosfd"

		let accessToken = "iosdgshiodshiodf"
		let newAccessToken = "sodosdfhiosdfiosdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/provider`

		let expectedResult: ApiResponse<ProviderResponseData> = {
			status: 200,
			data: {
				id,
				userId,
				stripeAccountId
			}
		}

		// First getProvider request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "get")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 403,
				response: {
					errors: [
						{
							code: ErrorCodes.AccessTokenMustBeRenewed,
							message: "Access token must be renewed"
						}
					]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, "put")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second getProvider request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "get")
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					stripe_account_id: stripeAccountId
				}
			})
		})

		// Act
		let result = (await GetProvider()) as ApiResponse<ProviderResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.id, expectedResult.data.id)
		assert.equal(result.data.userId, expectedResult.data.userId)
		assert.equal(
			result.data.stripeAccountId,
			expectedResult.data.stripeAccountId
		)
	})
})
