import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { SetTableObjectsOfCollection, CollectionResponseData } from '../../lib/controllers/CollectionsController.js'
import { davDevAuth } from '../constants.js'
import { ApiResponse, ApiErrorResponse } from '../../lib/types.js'
import * as ErrorCodes from '../../lib/errorCodes.js'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("SetTableObjectsOfCollection function", () => {
	it("should call setTableObjectsOfCollection endpoint", async () => {
		// Arrange
		let id = 213
		let tableId = 12
		let name = "TestCollection"

		let url = `${Dav.apiBaseUrl}/collection/table_objects`

		let expectedResult: ApiResponse<CollectionResponseData> = {
			status: 200,
			data: {
				Id: id,
				TableId: tableId,
				Name: name
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					table_id: tableId,
					name
				}
			})
		})

		// Act
		let result = await SetTableObjectsOfCollection({
			auth: davDevAuth,
			name,
			tableId,
			tableObjects: [
				"asdasdasd",
				"sdffdhsdfsdf"
			]
		}) as ApiResponse<CollectionResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.TableId, expectedResult.data.TableId)
		assert.equal(result.data.Name, expectedResult.data.Name)
	})

	it("should call setTableObjectsOfCollection endpoint with error", async () => {
		// Arrange
		let id = 213
		let tableId = 12
		let name = "TestCollection"

		let url = `${Dav.apiBaseUrl}/collection/table_objects`

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
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

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
		let result = await SetTableObjectsOfCollection({
			auth: davDevAuth,
			name,
			tableId,
			tableObjects: [
				"asdasdasd",
				"sdffdhsdfsdf"
			]
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})