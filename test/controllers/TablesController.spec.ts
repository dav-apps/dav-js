import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import { Table } from '../../lib/models/Table'
import {
	CreateTable,
	GetTable,
	GetTableResponseData
} from '../../lib/controllers/TablesController'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateTable function", () => {
	it("should call createTable endpoint", async () => {
		// Arrange
		let id = 145
		let appId = 35
		let name = "TestTable"

		let accessToken = "asoidaogiasdiuasd"
		let url = `${Dav.apiBaseUrl}/table`

		let expectedResult: ApiResponse<Table> = {
			status: 201,
			data: new Table(id, appId, name)
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
					name
				}
			})
		})

		// Act
		let result = await CreateTable({
			accessToken,
			appId,
			name
		}) as ApiResponse<Table>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.AppId, expectedResult.data.AppId)
		assert.equal(result.data.Name, expectedResult.data.Name)
	})

	it("should call createTable endpoint with error", async () => {
		// Arrange
		let appId = 35
		let name = "TestTable"

		let accessToken = "asoidaogiasdiuasd"
		let url = `${Dav.apiBaseUrl}/table`

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
		let result = await CreateTable({
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

describe("GetTable function", () => {
	it("should call getTable endpoint", async () => {
		// Arrange
		let id = 234
		let appId = 25
		let name = "TestTable"
		let pages = 2
		let firstTableObjectUuid = "oasdoiahd93r12rhasdasdasdasdh"
		let firstTableObjectEtag = "sdfksjdfskdf"
		let secondTableObjectUuid = "hisdiogjw349hoihefnfkwq"
		let secondTableObjectEtag = "oiajsdaksjdasd"

		let accessToken = "aihoasodihaisfu"
		let url = `${Dav.apiBaseUrl}/table/${id}`
		let count = 4
		let page = 1

		let expectedResult: ApiResponse<GetTableResponseData> = {
			status: 200,
			data: {
				table: new Table(id, appId, name),
				pages,
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

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			assert.equal(request.config.params.count, count)
			assert.equal(request.config.params.page, page)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					app_id: appId,
					name,
					pages,
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
			})
		})

		// Act
		let result = await GetTable({
			accessToken,
			id,
			count,
			page
		}) as ApiResponse<GetTableResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.table.Id, expectedResult.data.table.Id)
		assert.equal(result.data.table.AppId, expectedResult.data.table.AppId)
		assert.equal(result.data.table.Name, expectedResult.data.table.Name)
		assert.equal(result.data.pages, expectedResult.data.pages)
		assert.equal(result.data.tableObjects.length, expectedResult.data.tableObjects.length)
		assert.equal(result.data.tableObjects[0].uuid, expectedResult.data.tableObjects[0].uuid)
		assert.equal(result.data.tableObjects[0].etag, expectedResult.data.tableObjects[0].etag)
		assert.equal(result.data.tableObjects[1].uuid, expectedResult.data.tableObjects[1].uuid)
		assert.equal(result.data.tableObjects[1].etag, expectedResult.data.tableObjects[1].etag)
	})

	it("should call getTable endpoint with error", async () => {
		// Arrange
		let id = 234

		let accessToken = "aihoasodihaisfu"
		let url = `${Dav.apiBaseUrl}/table/${id}`
		let count = 4
		let page = 1

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

			assert.equal(request.config.params.count, count)
			assert.equal(request.config.params.page, page)

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
		let result = await GetTable({
			accessToken,
			id,
			count,
			page
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})