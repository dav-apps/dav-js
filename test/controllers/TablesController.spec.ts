import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { Table } from "../../lib/models/Table.js"
import {
	GetTable,
	GetTableResponseData
} from "../../lib/controllers/TablesController.js"

beforeEach(() => {
	mock.reset()
})

describe("GetTable function", () => {
	it("should call getTable endpoint", async () => {
		// Arrange
		let id = 234
		let appId = 25
		let name = "TestTable"
		let pages = 2
		let etag = "skljdfsjkldjlskfd"
		let firstTableObjectUuid = "oasdoiahd93r12rhasdasdasdasdh"
		let firstTableObjectEtag = "sdfksjdfskdf"
		let secondTableObjectUuid = "hisdiogjw349hoihefnfkwq"
		let secondTableObjectEtag = "oiajsdaksjdasd"

		let accessToken = "aihoasodihaisfu"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table/${id}`
		let count = 4
		let page = 1

		let expectedResult: ApiResponse<GetTableResponseData> = {
			status: 200,
			data: {
				table: new Table(id, appId, name),
				pages,
				etag,
				tableObjects: [
					{
						uuid: firstTableObjectUuid,
						etag: firstTableObjectEtag
					},
					{
						uuid: secondTableObjectUuid,
						etag: secondTableObjectEtag
					}
				]
			}
		}

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			assert.equal(config.params.count, count)
			assert.equal(config.params.page, page)

			return [
				expectedResult.status,
				{
					id,
					app_id: appId,
					name,
					pages,
					etag,
					table_objects: [
						{
							uuid: firstTableObjectUuid,
							etag: firstTableObjectEtag
						},
						{
							uuid: secondTableObjectUuid,
							etag: secondTableObjectEtag
						}
					]
				}
			]
		})

		// Act
		let result = (await GetTable({
			id,
			count,
			page
		})) as ApiResponse<GetTableResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.table.Id, expectedResult.data.table.Id)
		assert.equal(result.data.table.AppId, expectedResult.data.table.AppId)
		assert.equal(result.data.table.Name, expectedResult.data.table.Name)
		assert.equal(result.data.pages, expectedResult.data.pages)
		assert.equal(result.data.etag, expectedResult.data.etag)
		assert.equal(
			result.data.tableObjects.length,
			expectedResult.data.tableObjects.length
		)
		assert.equal(
			result.data.tableObjects[0].uuid,
			expectedResult.data.tableObjects[0].uuid
		)
		assert.equal(
			result.data.tableObjects[0].etag,
			expectedResult.data.tableObjects[0].etag
		)
		assert.equal(
			result.data.tableObjects[1].uuid,
			expectedResult.data.tableObjects[1].uuid
		)
		assert.equal(
			result.data.tableObjects[1].etag,
			expectedResult.data.tableObjects[1].etag
		)
	})

	it("should call getTable endpoint with error", async () => {
		// Arrange
		let id = 234

		let accessToken = "aihoasodihaisfu"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table/${id}`
		let count = 4
		let page = 1

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

			assert.equal(config.params.count, count)
			assert.equal(config.params.page, page)

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
		let result = (await GetTable({
			id,
			count,
			page
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getTable endpoint and renew the session", async () => {
		// Arrange
		let id = 234
		let appId = 25
		let name = "TestTable"
		let pages = 2
		let etag = "lksdfjjklsdjklfsd"
		let firstTableObjectUuid = "oasdoiahd93r12rhasdasdasdasdh"
		let firstTableObjectEtag = "sdfksjdfskdf"
		let secondTableObjectUuid = "hisdiogjw349hoihefnfkwq"
		let secondTableObjectEtag = "oiajsdaksjdasd"

		let accessToken = "aihoasodihaisfu"
		let newAccessToken = "osidghosidfhsdfh"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table/${id}`
		let count = 4
		let page = 1

		let expectedResult: ApiResponse<GetTableResponseData> = {
			status: 200,
			data: {
				table: new Table(id, appId, name),
				pages,
				etag,
				tableObjects: [
					{
						uuid: firstTableObjectUuid,
						etag: firstTableObjectEtag
					},
					{
						uuid: secondTableObjectUuid,
						etag: secondTableObjectEtag
					}
				]
			}
		}

		mock
			.onGet(url)
			.replyOnce(config => {
				// First getTable request
				assert.equal(config.headers.Authorization, accessToken)

				assert.equal(config.params.count, count)
				assert.equal(config.params.page, page)

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
				// Second getTable request
				assert.equal(config.headers.Authorization, newAccessToken)

				assert.equal(config.params.count, count)
				assert.equal(config.params.page, page)

				return [
					expectedResult.status,
					{
						id,
						app_id: appId,
						name,
						pages,
						etag,
						table_objects: [
							{
								uuid: firstTableObjectUuid,
								etag: firstTableObjectEtag
							},
							{
								uuid: secondTableObjectUuid,
								etag: secondTableObjectEtag
							}
						]
					}
				]
			})

		// Act
		let result = (await GetTable({
			id,
			count,
			page
		})) as ApiResponse<GetTableResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.table.Id, expectedResult.data.table.Id)
		assert.equal(result.data.table.AppId, expectedResult.data.table.AppId)
		assert.equal(result.data.table.Name, expectedResult.data.table.Name)
		assert.equal(result.data.pages, expectedResult.data.pages)
		assert.equal(result.data.etag, expectedResult.data.etag)
		assert.equal(
			result.data.tableObjects.length,
			expectedResult.data.tableObjects.length
		)
		assert.equal(
			result.data.tableObjects[0].uuid,
			expectedResult.data.tableObjects[0].uuid
		)
		assert.equal(
			result.data.tableObjects[0].etag,
			expectedResult.data.tableObjects[0].etag
		)
		assert.equal(
			result.data.tableObjects[1].uuid,
			expectedResult.data.tableObjects[1].uuid
		)
		assert.equal(
			result.data.tableObjects[1].etag,
			expectedResult.data.tableObjects[1].etag
		)
	})
})
