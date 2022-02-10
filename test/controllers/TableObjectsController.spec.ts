import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { ApiResponse, ApiErrorResponse } from '../../lib/types.js'
import * as ErrorCodes from '../../lib/errorCodes.js'
import { TableObject } from '../../lib/models/TableObject.js'
import {
	CreateTableObject,
	GetTableObject,
	UpdateTableObject,
	DeleteTableObject,
	RemoveTableObject,
	TableObjectResponseData
} from '../../lib/controllers/TableObjectsController.js'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreateTableObject function", () => {
	it("should call createTableObject endpoint", async () => {
		// Arrange
		let uuid = "cc229955-1e1f-4dc2-8e42-6d265df4bc65"
		let tableId = 52
		let file = false
		let etag = "asodashoishoda"
		let tableEtag = "skdfsjkfdkjhsfd"
		let belongsToUser = true
		let purchase = null
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 523.1

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			IsFile: file,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue },
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let accessToken = "asdasdasdasd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object`

		let expectedResult: ApiResponse<TableObjectResponseData> = {
			status: 201,
			data: {
				tableEtag,
				tableObject
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.table_id, tableId)
			assert.equal(data.file, file)
			assert.equal(data.properties[firstPropertyName], firstPropertyValue)
			assert.equal(data.properties[secondPropertyName], secondPropertyValue)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					table_id: tableId,
					uuid,
					file,
					etag,
					table_etag: tableEtag,
					belongs_to_user: belongsToUser,
					purchase,
					properties: {
						[firstPropertyName]: firstPropertyValue,
						[secondPropertyName]: secondPropertyValue
					}
				}
			})
		})

		// Act
		let result = await CreateTableObject({
			uuid,
			tableId,
			file,
			properties: {
				[firstPropertyName]: firstPropertyValue,
				[secondPropertyName]: secondPropertyValue
			}
		}) as ApiResponse<TableObjectResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.tableEtag, expectedResult.data.tableEtag)
		assert.equal(result.data.tableObject.TableId, expectedResult.data.tableObject.TableId)
		assert.equal(result.data.tableObject.Uuid, expectedResult.data.tableObject.Uuid)
		assert.equal(result.data.tableObject.IsFile, expectedResult.data.tableObject.IsFile)
		assert.equal(result.data.tableObject.Etag, expectedResult.data.tableObject.Etag)
		assert.equal(result.data.tableObject.BelongsToUser, expectedResult.data.tableObject.BelongsToUser)
		assert.equal(result.data.tableObject.Purchase, expectedResult.data.tableObject.Purchase)
		assert.equal(Object.keys(result.data.tableObject.Properties).length, Object.keys(expectedResult.data.tableObject.Properties).length)
		assert.equal(result.data.tableObject.GetPropertyValue(firstPropertyName), expectedResult.data.tableObject.GetPropertyValue(firstPropertyName))
		assert.equal(result.data.tableObject.GetPropertyValue(secondPropertyName), expectedResult.data.tableObject.GetPropertyValue(secondPropertyName))
	})

	it("should call createTableObject endpoint with error", async () => {
		// Arrange
		let uuid = "cc229955-1e1f-4dc2-8e42-6d265df4bc65"
		let tableId = 52
		let file = false
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 523.1

		let accessToken = "asdasdasdasd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object`

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
			assert.equal(data.uuid, uuid)
			assert.equal(data.table_id, tableId)
			assert.equal(data.file, file)
			assert.equal(data.properties[firstPropertyName], firstPropertyValue)
			assert.equal(data.properties[secondPropertyName], secondPropertyValue)

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
		let result = await CreateTableObject({
			uuid,
			tableId,
			file,
			properties: {
				[firstPropertyName]: firstPropertyValue,
				[secondPropertyName]: secondPropertyValue
			}
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createTableObject endpoint and renew the session", async () => {
		// Arrange
		let uuid = "cc229955-1e1f-4dc2-8e42-6d265df4bc65"
		let tableId = 52
		let file = false
		let etag = "dsfhosdfhosfd"
		let tableEtag = "shkdfksjdfjhksfd"
		let belongsToUser = true
		let purchase = null
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 523.1

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			IsFile: file,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue },
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let accessToken = "asdasdasdasd"
		let newAccessToken = "psgisodjgosidj"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object`

		let expectedResult: ApiResponse<TableObjectResponseData> = {
			status: 201,
			data: {
				tableEtag,
				tableObject
			}
		}

		// First createTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.table_id, tableId)
			assert.equal(data.file, file)
			assert.equal(data.properties[firstPropertyName], firstPropertyValue)
			assert.equal(data.properties[secondPropertyName], secondPropertyValue)

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

		// Second createTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.uuid, uuid)
			assert.equal(data.table_id, tableId)
			assert.equal(data.file, file)
			assert.equal(data.properties[firstPropertyName], firstPropertyValue)
			assert.equal(data.properties[secondPropertyName], secondPropertyValue)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					table_id: tableId,
					uuid,
					file,
					etag,
					table_etag: tableEtag,
					belongs_to_user: belongsToUser,
					purchase,
					properties: {
						[firstPropertyName]: firstPropertyValue,
						[secondPropertyName]: secondPropertyValue
					}
				}
			})
		})

		// Act
		let result = await CreateTableObject({
			uuid,
			tableId,
			file,
			properties: {
				[firstPropertyName]: firstPropertyValue,
				[secondPropertyName]: secondPropertyValue
			}
		}) as ApiResponse<TableObjectResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.tableEtag, expectedResult.data.tableEtag)
		assert.equal(result.data.tableObject.TableId, expectedResult.data.tableObject.TableId)
		assert.equal(result.data.tableObject.Uuid, expectedResult.data.tableObject.Uuid)
		assert.equal(result.data.tableObject.IsFile, expectedResult.data.tableObject.IsFile)
		assert.equal(result.data.tableObject.Etag, expectedResult.data.tableObject.Etag)
		assert.equal(result.data.tableObject.BelongsToUser, expectedResult.data.tableObject.BelongsToUser)
		assert.equal(result.data.tableObject.Purchase, expectedResult.data.tableObject.Purchase)
		assert.equal(Object.keys(result.data.tableObject.Properties).length, Object.keys(expectedResult.data.tableObject.Properties).length)
		assert.equal(result.data.tableObject.GetPropertyValue(firstPropertyName), expectedResult.data.tableObject.GetPropertyValue(firstPropertyName))
		assert.equal(result.data.tableObject.GetPropertyValue(secondPropertyName), expectedResult.data.tableObject.GetPropertyValue(secondPropertyName))
	})
})

describe("GetTableObject function", () => {
	it("should call getTableObject endpoint", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"
		let tableId = 52
		let file = false
		let etag = "iosdfhiosdhoisdf"
		let belongsToUser = false
		let purchase = "sdfksdklfjsdlfk"
		let firstPropertyName = "test1"
		let firstPropertyValue = 42
		let secondPropertyName = "test2"
		let secondPropertyValue = true

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			IsFile: file,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue },
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

		let expectedResult: ApiResponse<TableObjectResponseData> = {
			status: 201,
			data: {
				tableEtag: null,
				tableObject
			}
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
					id: 12,
					user_id: 12,
					table_id: tableId,
					uuid,
					file,
					etag,
					belongs_to_user: belongsToUser,
					purchase,
					properties: {
						[firstPropertyName]: firstPropertyValue,
						[secondPropertyName]: secondPropertyValue
					}
				}
			})
		})

		// Act
		let result = await GetTableObject({
			uuid
		}) as ApiResponse<TableObjectResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.isUndefined(result.data.tableEtag)
		assert.equal(result.data.tableObject.TableId, expectedResult.data.tableObject.TableId)
		assert.equal(result.data.tableObject.Uuid, expectedResult.data.tableObject.Uuid)
		assert.equal(result.data.tableObject.IsFile, expectedResult.data.tableObject.IsFile)
		assert.equal(result.data.tableObject.Etag, expectedResult.data.tableObject.Etag)
		assert.equal(result.data.tableObject.BelongsToUser, expectedResult.data.tableObject.BelongsToUser)
		assert.equal(result.data.tableObject.Purchase, expectedResult.data.tableObject.Purchase)
		assert.equal(Object.keys(result.data.tableObject.Properties).length, Object.keys(expectedResult.data.tableObject.Properties).length)
		assert.equal(result.data.tableObject.GetPropertyValue(firstPropertyName), expectedResult.data.tableObject.GetPropertyValue(firstPropertyName))
		assert.equal(result.data.tableObject.GetPropertyValue(secondPropertyName), expectedResult.data.tableObject.GetPropertyValue(secondPropertyName))
	})

	it("should call getTableObject endpoint with error", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

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
		let result = await GetTableObject({
			uuid
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getTableObject endpoint and renew the session", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"
		let tableId = 52
		let file = false
		let etag = "iosdfhiosdfhiosdf"
		let belongsToUser = true
		let purchase = null
		let firstPropertyName = "test1"
		let firstPropertyValue = 42
		let secondPropertyName = "test2"
		let secondPropertyValue = true

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			IsFile: file,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue },
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let accessToken = "iosdfshodhsdf"
		let newAccessToken = "jiosdgiofhiosgssdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

		let expectedResult: ApiResponse<TableObjectResponseData> = {
			status: 201,
			data: {
				tableEtag: null,
				tableObject
			}
		}

		// First getTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

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

		// Second getTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					table_id: tableId,
					uuid,
					file,
					etag,
					belongs_to_user: belongsToUser,
					purchase,
					properties: {
						[firstPropertyName]: firstPropertyValue,
						[secondPropertyName]: secondPropertyValue
					}
				}
			})
		})

		// Act
		let result = await GetTableObject({
			uuid
		}) as ApiResponse<TableObjectResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.isUndefined(result.data.tableEtag)
		assert.equal(result.data.tableObject.TableId, expectedResult.data.tableObject.TableId)
		assert.equal(result.data.tableObject.Uuid, expectedResult.data.tableObject.Uuid)
		assert.equal(result.data.tableObject.IsFile, expectedResult.data.tableObject.IsFile)
		assert.equal(result.data.tableObject.Etag, expectedResult.data.tableObject.Etag)
		assert.equal(result.data.tableObject.BelongsToUser, expectedResult.data.tableObject.BelongsToUser)
		assert.equal(result.data.tableObject.Purchase, expectedResult.data.tableObject.Purchase)
		assert.equal(Object.keys(result.data.tableObject.Properties).length, Object.keys(expectedResult.data.tableObject.Properties).length)
		assert.equal(result.data.tableObject.GetPropertyValue(firstPropertyName), expectedResult.data.tableObject.GetPropertyValue(firstPropertyName))
		assert.equal(result.data.tableObject.GetPropertyValue(secondPropertyName), expectedResult.data.tableObject.GetPropertyValue(secondPropertyName))
	})
})

describe("UpdateTableObject function", () => {
	it("should call updateTableObject endpoint", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"
		let tableId = 52
		let file = false
		let etag = "shodhsdfhosdf"
		let tableEtag = "sjkdfsjkdfjksfd"
		let belongsToUser = true
		let purchase = null
		let firstPropertyName = "test1"
		let firstPropertyValue = 42
		let secondPropertyName = "test2"
		let secondPropertyValue = true

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			IsFile: file,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue },
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

		let expectedResult: ApiResponse<TableObjectResponseData> = {
			status: 201,
			data: {
				tableEtag,
				tableObject
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.properties[firstPropertyName], firstPropertyValue)
			assert.equal(data.properties[secondPropertyName], secondPropertyValue)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					table_id: tableId,
					uuid,
					file,
					etag,
					table_etag: tableEtag,
					belongs_to_user: belongsToUser,
					purchase,
					properties: {
						[firstPropertyName]: firstPropertyValue,
						[secondPropertyName]: secondPropertyValue
					}
				}
			})
		})

		// Act
		let result = await UpdateTableObject({
			uuid,
			properties: {
				[firstPropertyName]: firstPropertyValue,
				[secondPropertyName]: secondPropertyValue
			}
		}) as ApiResponse<TableObjectResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.tableEtag, expectedResult.data.tableEtag)
		assert.equal(result.data.tableObject.TableId, expectedResult.data.tableObject.TableId)
		assert.equal(result.data.tableObject.Uuid, expectedResult.data.tableObject.Uuid)
		assert.equal(result.data.tableObject.IsFile, expectedResult.data.tableObject.IsFile)
		assert.equal(result.data.tableObject.Etag, expectedResult.data.tableObject.Etag)
		assert.equal(result.data.tableObject.BelongsToUser, expectedResult.data.tableObject.BelongsToUser)
		assert.equal(result.data.tableObject.Purchase, expectedResult.data.tableObject.Purchase)
		assert.equal(Object.keys(result.data.tableObject.Properties).length, Object.keys(expectedResult.data.tableObject.Properties).length)
		assert.equal(result.data.tableObject.GetPropertyValue(firstPropertyName), expectedResult.data.tableObject.GetPropertyValue(firstPropertyName))
		assert.equal(result.data.tableObject.GetPropertyValue(secondPropertyName), expectedResult.data.tableObject.GetPropertyValue(secondPropertyName))
	})

	it("should call updateTableObject endpoint with error", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"
		let firstPropertyName = "test1"
		let firstPropertyValue = 42
		let secondPropertyName = "test2"
		let secondPropertyValue = true

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

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
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.properties[firstPropertyName], firstPropertyValue)
			assert.equal(data.properties[secondPropertyName], secondPropertyValue)

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
		let result = await UpdateTableObject({
			uuid,
			properties: {
				[firstPropertyName]: firstPropertyValue,
				[secondPropertyName]: secondPropertyValue
			}
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call updateTableObject endpoint and renew the session", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"
		let tableId = 52
		let file = false
		let etag = "osdfhsodhsdfs"
		let tableEtag = "kdfsjksdfjhksfd"
		let belongsToUser = false
		let purchase = "iosdhhsdfoisfhiosd"
		let firstPropertyName = "test1"
		let firstPropertyValue = 42
		let secondPropertyName = "test2"
		let secondPropertyValue = true

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			IsFile: file,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue },
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let accessToken = "iosdfshodhsdf"
		let newAccessToken = "iosdsdfosjdfsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

		let expectedResult: ApiResponse<TableObjectResponseData> = {
			status: 201,
			data: {
				tableEtag,
				tableObject
			}
		}

		// First updateTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.properties[firstPropertyName], firstPropertyValue)
			assert.equal(data.properties[secondPropertyName], secondPropertyValue)

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

		// Second updateTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.properties[firstPropertyName], firstPropertyValue)
			assert.equal(data.properties[secondPropertyName], secondPropertyValue)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: 12,
					user_id: 12,
					table_id: tableId,
					uuid,
					file,
					etag,
					table_etag: tableEtag,
					belongs_to_user: belongsToUser,
					purchase,
					properties: {
						[firstPropertyName]: firstPropertyValue,
						[secondPropertyName]: secondPropertyValue
					}
				}
			})
		})

		// Act
		let result = await UpdateTableObject({
			uuid,
			properties: {
				[firstPropertyName]: firstPropertyValue,
				[secondPropertyName]: secondPropertyValue
			}
		}) as ApiResponse<TableObjectResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.tableEtag, expectedResult.data.tableEtag)
		assert.equal(result.data.tableObject.TableId, expectedResult.data.tableObject.TableId)
		assert.equal(result.data.tableObject.Uuid, expectedResult.data.tableObject.Uuid)
		assert.equal(result.data.tableObject.IsFile, expectedResult.data.tableObject.IsFile)
		assert.equal(result.data.tableObject.Etag, expectedResult.data.tableObject.Etag)
		assert.equal(result.data.tableObject.BelongsToUser, expectedResult.data.tableObject.BelongsToUser)
		assert.equal(result.data.tableObject.Purchase, expectedResult.data.tableObject.Purchase)
		assert.equal(Object.keys(result.data.tableObject.Properties).length, Object.keys(expectedResult.data.tableObject.Properties).length)
		assert.equal(result.data.tableObject.GetPropertyValue(firstPropertyName), expectedResult.data.tableObject.GetPropertyValue(firstPropertyName))
		assert.equal(result.data.tableObject.GetPropertyValue(secondPropertyName), expectedResult.data.tableObject.GetPropertyValue(secondPropertyName))
	})
})

describe("DeleteTableObject function", () => {
	it("should call deleteTableObject endpoint", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteTableObject({
			uuid
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call deleteTableObject endpoint with error", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

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
			assert.equal(request.config.method, 'delete')
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
		let result = await DeleteTableObject({
			uuid
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call deleteTableObject endpoint and renew session", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"

		let accessToken = "iosdfshodhsdf"
		let newAccessToken = "osdosdgsdhfshdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		// First deleteTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, accessToken)

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

		// Second deleteTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteTableObject({
			uuid
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})
})

describe("RemoveTableObject function", () => {
	it("should call removeTableObject endpoint", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}/access`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await RemoveTableObject({
			uuid
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call removeTableObject endpoint with error", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}/access`

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
			assert.equal(request.config.method, 'delete')
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
		let result = await RemoveTableObject({
			uuid
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call removeTableObject endpoint and renew the session", async () => {
		// Arrange
		let uuid = "9491bd47-8d1f-4172-b290-c89a58f354dc"

		let accessToken = "iosdfshodhsdf"
		let newAccessToken = "sjdgjsdfsijfdsfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${uuid}/access`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		// First removeTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, accessToken)

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

		// Second removeTableObject request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await RemoveTableObject({
			uuid
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})
})