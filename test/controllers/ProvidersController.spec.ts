import { assert } from "chai"
import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import {
	CreateProvider,
	GetProvider,
	ProviderResponseData
} from "../../lib/controllers/ProvidersController.js"

let mock: MockAdapter = new MockAdapter(axios)

beforeEach(() => {
	mock.reset()
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

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.country, country)

			return [
				expectedResult.status,
				{
					id,
					user_id: userId,
					stripe_account_id: stripeAccountId
				}
			]
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

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.country, country)

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

		mock
			.onPost(url)
			.replyOnce(config => {
				// First createProvider request
				assert.equal(config.headers.Authorization, accessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.country, country)

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
				// Second createProvider request
				assert.equal(config.headers.Authorization, newAccessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.country, country)

				return [
					expectedResult.status,
					{
						id,
						user_id: userId,
						stripe_account_id: stripeAccountId
					}
				]
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

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					id,
					user_id: userId,
					stripe_account_id: stripeAccountId
				}
			]
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

		mock
			.onGet(url)
			.replyOnce(config => {
				// First getProvider request
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
				// Second getProvider request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [
					expectedResult.status,
					{
						id,
						user_id: userId,
						stripe_account_id: stripeAccountId
					}
				]
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
