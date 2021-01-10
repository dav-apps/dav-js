import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import { Api } from '../../lib/models/Api'
import { CreateApi } from '../../lib/controllers/ApisController'

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

		let jwt = "asjbgdsbjsfjsdfsdof"
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
			assert.equal(request.config.headers.Authorization, jwt)
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
			jwt,
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

		let jwt = "asjbgdsbjsfjsdfsdof"
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
			assert.equal(request.config.headers.Authorization, jwt)
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
			jwt,
			appId,
			name
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})