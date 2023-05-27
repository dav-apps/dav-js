import { assert } from "chai"
import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { Api } from "../../lib/models/Api.js"
import { CreateApi } from "../../lib/controllers/ApisController.js"

let mock: MockAdapter = new MockAdapter(axios)

beforeEach(() => {
	mock.reset()
})

describe("CreateApi function", () => {
	it("should call createApi endpoint", async () => {
		// Arrange
		let id = 213
		let appId = 252
		let name = "TestApi"

		let accessToken = "asjbgdsbjsfjsdfsdof"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/api`

		let expectedResult: ApiResponse<Api> = {
			status: 201,
			data: new Api(id, name, [], [], [])
		}

		mock.onPost(url).reply(config => {
			// Assert for the request
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.app_id, appId)
			assert.equal(data.name, name)

			return [
				expectedResult.status,
				{
					id,
					app_id: appId,
					name,
					endpoints: [],
					functions: [],
					errors: []
				}
			]
		})

		// Act
		let result = (await CreateApi({
			appId,
			name
		})) as ApiResponse<Api>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Name, expectedResult.data.Name)
		assert.equal(result.data.Endpoints.length, 0)
		assert.equal(result.data.Functions.length, 0)
		assert.equal(result.data.Errors.length, 0)
	})

	it("should call createApi endpoint with error", async () => {
		// Arrange
		let appId = 252
		let name = "TestApi"

		let accessToken = "asjbgdsbjsfjsdfsdof"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/api`

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
			// Assert for the request
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.app_id, appId)
			assert.equal(data.name, name)

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
		let result = (await CreateApi({
			appId,
			name
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createApi endpoint and renew the session", async () => {
		// Arrange
		let id = 33
		let appId = 252
		let name = "TestApi"

		let accessToken = "asjbgdsbjsfjsdfsdof"
		let newAccessToken = "sdgosdgosdgoisgd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/api`

		let expectedResult: ApiResponse<Api> = {
			status: 201,
			data: new Api(id, name, [], [], [])
		}

		mock
			.onPost(url)
			.replyOnce(config => {
				// First createApi request
				assert.equal(config.headers.Authorization, accessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.app_id, appId)
				assert.equal(data.name, name)

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
				// Second createApi request
				assert.equal(config.headers.Authorization, newAccessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.app_id, appId)
				assert.equal(data.name, name)

				return [
					expectedResult.status,
					{
						id,
						app_id: appId,
						name,
						endpoints: [],
						functions: [],
						errors: []
					}
				]
			})

		// Act
		let result = (await CreateApi({
			appId,
			name
		})) as ApiResponse<Api>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Name, expectedResult.data.Name)
		assert.equal(result.data.Endpoints.length, 0)
		assert.equal(result.data.Functions.length, 0)
		assert.equal(result.data.Errors.length, 0)
	})
})
