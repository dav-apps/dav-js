import { assert } from "chai"
import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { Dav } from "../../lib/Dav.js"
import {
	SetTableObjectsOfCollection,
	CollectionResponseData
} from "../../lib/controllers/CollectionsController.js"
import { davDevAuth } from "../constants.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"

let mock: MockAdapter = new MockAdapter(axios)

beforeEach(() => {
	mock.reset()
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

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, davDevAuth.token)
			assert.include(config.headers["Content-Type"], "application/json")

			return [
				expectedResult.status,
				{
					id,
					table_id: tableId,
					name
				}
			]
		})

		// Act
		let result = (await SetTableObjectsOfCollection({
			auth: davDevAuth,
			name,
			tableId,
			tableObjects: ["asdasdasd", "sdffdhsdfsdf"]
		})) as ApiResponse<CollectionResponseData>

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
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, davDevAuth.token)
			assert.include(config.headers["Content-Type"], "application/json")

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
		let result = (await SetTableObjectsOfCollection({
			auth: davDevAuth,
			name,
			tableId,
			tableObjects: ["asdasdasd", "sdffdhsdfsdf"]
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})
