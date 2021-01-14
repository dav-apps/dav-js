import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse } from '../../lib/types'
import { App } from '../../lib/models/App'
import { GetApp } from '../../lib/controllers/AppsController'
import { Table } from '../../lib/models/Table'
import { Api } from '../../lib/models/Api'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("GetApp function", () => {
	it("should call getApp endpoint", async () => {
		// Arrange
		let id = 53
		let name = "TestApp"
		let description = "A test app"
		let published = true
		let webLink = "https://test.example.com"
		let googlePlayLink = "https://play.google.com/asdasdasd"
		let microsoftStoreLink = null
		let tableId = 12
		let tableName = "TestTable"
		let apiId = 2
		let apiName = "TestApi"

		let jwt = "ioasdwhehwt08r3q0feh0"
		let url = `${Dav.apiBaseUrl}/app/${id}`

		let expectedResult: ApiResponse<App> = {
			status: 200,
			data: new App(
				id,
				name,
				description,
				published,
				webLink,
				googlePlayLink,
				microsoftStoreLink,
				null,
				[
					new Table(
						tableId,
						id,
						tableName
					)
				],
				[
					new Api(
						apiId,
						apiName,
						[],
						[],
						[]
					)
				]
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					name,
					description,
					published,
					web_link: webLink,
					google_play_link: googlePlayLink,
					microsoft_store_link: microsoftStoreLink,
					tables: [{
						id: tableId,
						name: tableName
					}],
					apis: [{
						id: apiId,
						name: apiName
					}]
				}
			})
		})

		// Act
		let result = await GetApp({
			jwt,
			id
		}) as ApiResponse<App>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Name, expectedResult.data.Name)
		assert.equal(result.data.Description, expectedResult.data.Description)
		assert.equal(result.data.Published, expectedResult.data.Published)
		assert.equal(result.data.WebLink, expectedResult.data.WebLink)
		assert.equal(result.data.GooglePlayLink, expectedResult.data.GooglePlayLink)
		assert.equal(result.data.MicrosoftStoreLink, expectedResult.data.MicrosoftStoreLink)
		
		assert.equal(result.data.Tables.length, 1)
		assert.equal(result.data.Tables[0].Id, expectedResult.data.Tables[0].Id)
		assert.equal(result.data.Tables[0].Name, expectedResult.data.Tables[0].Name)

		assert.equal(result.data.Apis.length, 1)
		assert.equal(result.data.Apis[0].Id, expectedResult.data.Apis[0].Id)
		assert.equal(result.data.Apis[0].Name, expectedResult.data.Apis[0].Name)
	})

	it("should call getApp endpoint with error", async () => {
		// Arrange
		let id = 53

		let jwt = "ioasdwhehwt08r3q0feh0"
		let url = `${Dav.apiBaseUrl}/app/${id}`

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
			assert.equal(request.config.headers.Authorization, jwt)

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
		let result = await GetApp({
			jwt,
			id
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})