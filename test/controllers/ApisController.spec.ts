import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import { Api } from '../../lib/models/Api'
import { CreateApi, GetApi } from '../../lib/controllers/ApisController'
import { ApiEndpoint } from '../../lib/models/ApiEndpoint'
import { ApiFunction } from '../../lib/models/ApiFunction'
import { ApiError } from '../../lib/models/ApiError'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateApi function", () => {
	it("should call createApi endpoint", async () => {
		// Arrange
		let id = 213
		let appId = 252
		let name = "TestApi"

		let accessToken = "asjbgdsbjsfjsdfsdof"
		let url = `${Dav.apiBaseUrl}/api`

		let expectedResult: ApiResponse<Api> = {
			status: 201,
			data: new Api(
				id,
				name,
				[],
				[],
				[]
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.app_id, appId)
			assert.equal(data.name, name)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					app_id: appId,
					name,
					endpoints: [],
					functions: [],
					errors: []
				}
			})
		})

		// Act
		let result = await CreateApi({
			accessToken,
			appId,
			name
		}) as ApiResponse<Api>

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
		let url = `${Dav.apiBaseUrl}/api`

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
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.app_id, appId)
			assert.equal(data.name, name)

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
		let result = await CreateApi({
			accessToken,
			appId,
			name
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("GetApi function", () => {
	it("should call getApi endpoint", async () => {
		// Arrange
		let id = 12
		let appId = 2
		let name = "TestApi"
		let apiEndpointId = 2
		let apiEndpointPath = "test/path/:id"
		let apiEndpointMethod = "GET"
		let apiEndpointCaching = true
		let apiFunctionId = 24
		let apiFunctionName = "TestFunction"
		let apiFunctionParams = ["a", "b"]
		let apiErrorId = 46
		let apiErrorCode = 1111
		let apiErrorMessage = "Test ErrorMessage"

		let accessToken = "idshfhif9w8h39f24hfw"
		let url = `${Dav.apiBaseUrl}/api/${id}`

		let expectedResult: ApiResponse<Api> = {
			status: 200,
			data: new Api(
				id,
				name,
				[
					new ApiEndpoint(
						apiEndpointId,
						apiEndpointPath,
						apiEndpointMethod,
						null,
						apiEndpointCaching
					)
				],
				[
					new ApiFunction(
						apiFunctionId,
						apiFunctionName,
						apiFunctionParams,
						null
					)
				],
				[
					new ApiError(
						apiErrorId,
						apiErrorCode,
						apiErrorMessage
					)
				]
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					appId,
					name,
					endpoints: [{
						id: apiEndpointId,
						path: apiEndpointPath,
						method: apiEndpointMethod,
						caching: apiEndpointCaching
					}],
					functions: [{
						id: apiFunctionId,
						name: apiFunctionName,
						params: apiFunctionParams.join(',')
					}],
					errors: [{
						id: apiErrorId,
						code: apiErrorCode,
						message: apiErrorMessage
					}]
				}
			})
		})

		// Act
		let result = await GetApi({
			accessToken,
			id
		}) as ApiResponse<Api>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Name, expectedResult.data.Name)

		assert.equal(result.data.Endpoints.length, 1)
		assert.equal(result.data.Endpoints[0].Id, expectedResult.data.Endpoints[0].Id)
		assert.equal(result.data.Endpoints[0].Path, expectedResult.data.Endpoints[0].Path)
		assert.equal(result.data.Endpoints[0].Method, expectedResult.data.Endpoints[0].Method)
		assert.equal(result.data.Endpoints[0].Caching, expectedResult.data.Endpoints[0].Caching)
		assert.equal(result.data.Endpoints[0].Commands, expectedResult.data.Endpoints[0].Commands)
		
		assert.equal(result.data.Functions.length, 1)
		assert.equal(result.data.Functions[0].Id, expectedResult.data.Functions[0].Id)
		assert.equal(result.data.Functions[0].Name, expectedResult.data.Functions[0].Name)
		assert.equal(result.data.Functions[0].Params.join(','), expectedResult.data.Functions[0].Params.join(','))
		assert.equal(result.data.Functions[0].Commands, expectedResult.data.Functions[0].Commands)

		assert.equal(result.data.Errors.length, 1)
		assert.equal(result.data.Errors[0].Id, expectedResult.data.Errors[0].Id)
		assert.equal(result.data.Errors[0].Code, expectedResult.data.Errors[0].Code)
		assert.equal(result.data.Errors[0].Message, expectedResult.data.Errors[0].Message)
	})

	it("should call getApi endpoint with error", async () => {
		// Arrange
		let id = 12

		let accessToken = "idshfhif9w8h39f24hfw"
		let url = `${Dav.apiBaseUrl}/api/${id}`

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
			assert.equal(request.config.method, 'get')
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
		let result = await GetApi({
			accessToken,
			id
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})