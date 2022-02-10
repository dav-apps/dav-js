import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { ApiResponse, ApiErrorResponse } from '../../lib/types.js'
import * as ErrorCodes from '../../lib/errorCodes.js'
import { Table } from '../../lib/models/Table.js'
import {
	CreateTable,
	GetTable,
	GetTableResponseData
} from '../../lib/controllers/TablesController.js'

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
		Dav.accessToken = accessToken
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
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table`

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
			appId,
			name
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createTable endpoint and renew the session", async () => {
		// Arrange
		let id = 145
		let appId = 35
		let name = "TestTable"

		let accessToken = "asoidaogiasdiuasd"
		let newAccessToken = "josdgjosdjiosdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table`

		let expectedResult: ApiResponse<Table> = {
			status: 201,
			data: new Table(id, appId, name)
		}

		// First createTable request
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
				status: 403,
				response: {
					errors: [{
						code: ErrorCodes.AccessTokenMustBeRenewed,
						message: "Access token must be renewed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second createTable request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)
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
			appId,
			name
		}) as ApiResponse<Table>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.AppId, expectedResult.data.AppId)
		assert.equal(result.data.Name, expectedResult.data.Name)
	})
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
			})
		})

		// Act
		let result = await GetTable({
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
		assert.equal(result.data.etag, expectedResult.data.etag)
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
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table/${id}`
		let count = 4
		let page = 1

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
			id,
			count,
			page
		}) as ApiErrorResponse

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

		// First getTable request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			assert.equal(request.config.params.count, count)
			assert.equal(request.config.params.page, page)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: ErrorCodes.AccessTokenMustBeRenewed,
						message: "Access token must be renewed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second getTable request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			assert.equal(request.config.params.count, count)
			assert.equal(request.config.params.page, page)

			request.respondWith({
				status: expectedResult.status,
				response: {
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
			})
		})

		// Act
		let result = await GetTable({
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
		assert.equal(result.data.etag, expectedResult.data.etag)
		assert.equal(result.data.tableObjects.length, expectedResult.data.tableObjects.length)
		assert.equal(result.data.tableObjects[0].uuid, expectedResult.data.tableObjects[0].uuid)
		assert.equal(result.data.tableObjects[0].etag, expectedResult.data.tableObjects[0].etag)
		assert.equal(result.data.tableObjects[1].uuid, expectedResult.data.tableObjects[1].uuid)
		assert.equal(result.data.tableObjects[1].etag, expectedResult.data.tableObjects[1].etag)
	})
})