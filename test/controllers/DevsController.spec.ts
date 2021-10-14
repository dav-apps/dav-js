import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { ApiResponse, ApiErrorResponse } from '../../lib/types.js'
import * as ErrorCodes from '../../lib/errorCodes.js'
import { App } from '../../lib/models/App.js'
import { GetDev, GetDevResponseData } from '../../lib/controllers/DevsController.js'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("GetDev function", () => {
	it("should call getDev endpoint", async () => {
		// Arrange
		let id = 41
		let firstAppId = 12
		let firstAppName = "TestApp"
		let firstAppDescription = "TestApp description"
		let firstAppPublished = true
		let firstAppWebLink = "https://testapp.dav-apps.tech"
		let firstAppGooglePlayLink = null
		let firstAppMicrosoftStoreLink = null
		let secondAppId = 14
		let secondAppName = "SecondTestApp"
		let secondAppDescription = "This is the second test app"
		let secondAppPublished = true
		let secondAppWebLink = null
		let secondAppGooglePlayLink = "https://play.google.com/store/apps/bla"
		let secondAppMicrosoftStoreLink = "https://store.microsoft.com/bla"

		let accessToken = "9ßdf0thhsdffoth"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/dev`

		let expectedResult: ApiResponse<GetDevResponseData> = {
			status: 200,
			data: {
				id,
				apps: [
					new App(
						firstAppId,
						firstAppName,
						firstAppDescription,
						firstAppPublished,
						firstAppWebLink,
						firstAppGooglePlayLink,
						firstAppMicrosoftStoreLink
					),
					new App(
						secondAppId,
						secondAppName,
						secondAppDescription,
						secondAppPublished,
						secondAppWebLink,
						secondAppGooglePlayLink,
						secondAppMicrosoftStoreLink
					)
				]
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
					id,
					apps: [
						{
							id: firstAppId,
							name: firstAppName,
							description: firstAppDescription,
							published: firstAppPublished,
							web_link: firstAppWebLink,
							google_play_link: firstAppGooglePlayLink,
							microsoft_store_link: firstAppMicrosoftStoreLink
						},
						{
							id: secondAppId,
							name: secondAppName,
							description: secondAppDescription,
							published: secondAppPublished,
							web_link: secondAppWebLink,
							google_play_link: secondAppGooglePlayLink,
							microsoft_store_link: secondAppMicrosoftStoreLink
						}
					]
				}
			})
		})

		// Act
		let result = await GetDev() as ApiResponse<GetDevResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.id, expectedResult.data.id)
		assert.equal(result.data.apps.length, expectedResult.data.apps.length)

		assert.equal(result.data.apps[0].Id, expectedResult.data.apps[0].Id)
		assert.equal(result.data.apps[0].Name, expectedResult.data.apps[0].Name)
		assert.equal(result.data.apps[0].Description, expectedResult.data.apps[0].Description)
		assert.equal(result.data.apps[0].Published, expectedResult.data.apps[0].Published)
		assert.equal(result.data.apps[0].WebLink, expectedResult.data.apps[0].WebLink)
		assert.equal(result.data.apps[0].GooglePlayLink, expectedResult.data.apps[0].GooglePlayLink)
		assert.equal(result.data.apps[0].MicrosoftStoreLink, expectedResult.data.apps[0].MicrosoftStoreLink)

		assert.equal(result.data.apps[1].Id, expectedResult.data.apps[1].Id)
		assert.equal(result.data.apps[1].Name, expectedResult.data.apps[1].Name)
		assert.equal(result.data.apps[1].Description, expectedResult.data.apps[1].Description)
		assert.equal(result.data.apps[1].Published, expectedResult.data.apps[1].Published)
		assert.equal(result.data.apps[1].WebLink, expectedResult.data.apps[1].WebLink)
		assert.equal(result.data.apps[1].GooglePlayLink, expectedResult.data.apps[1].GooglePlayLink)
		assert.equal(result.data.apps[1].MicrosoftStoreLink, expectedResult.data.apps[1].MicrosoftStoreLink)
	})

	it("should call getDev endpoint with error", async () => {
		// Arrange
		let accessToken = "9ßdf0thhsdffoth"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/dev`

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
		let result = await GetDev() as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getDev endpoint and renew the session", async () => {
		// Arrange
		let id = 41
		let firstAppId = 12
		let firstAppName = "TestApp"
		let firstAppDescription = "TestApp description"
		let firstAppPublished = true
		let firstAppWebLink = "https://testapp.dav-apps.tech"
		let firstAppGooglePlayLink = null
		let firstAppMicrosoftStoreLink = null
		let secondAppId = 14
		let secondAppName = "SecondTestApp"
		let secondAppDescription = "This is the second test app"
		let secondAppPublished = true
		let secondAppWebLink = null
		let secondAppGooglePlayLink = "https://play.google.com/store/apps/bla"
		let secondAppMicrosoftStoreLink = "https://store.microsoft.com/bla"

		let accessToken = "9ßdf0thhsdffoth"
		let newAccessToken = "sjgiosdfsiodfhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/dev`

		let expectedResult: ApiResponse<GetDevResponseData> = {
			status: 200,
			data: {
				id,
				apps: [
					new App(
						firstAppId,
						firstAppName,
						firstAppDescription,
						firstAppPublished,
						firstAppWebLink,
						firstAppGooglePlayLink,
						firstAppMicrosoftStoreLink
					),
					new App(
						secondAppId,
						secondAppName,
						secondAppDescription,
						secondAppPublished,
						secondAppWebLink,
						secondAppGooglePlayLink,
						secondAppMicrosoftStoreLink
					)
				]
			}
		}

		// First getDev request
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

		// Second getDev request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					apps: [
						{
							id: firstAppId,
							name: firstAppName,
							description: firstAppDescription,
							published: firstAppPublished,
							web_link: firstAppWebLink,
							google_play_link: firstAppGooglePlayLink,
							microsoft_store_link: firstAppMicrosoftStoreLink
						},
						{
							id: secondAppId,
							name: secondAppName,
							description: secondAppDescription,
							published: secondAppPublished,
							web_link: secondAppWebLink,
							google_play_link: secondAppGooglePlayLink,
							microsoft_store_link: secondAppMicrosoftStoreLink
						}
					]
				}
			})
		})

		// Act
		let result = await GetDev() as ApiResponse<GetDevResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.id, expectedResult.data.id)
		assert.equal(result.data.apps.length, expectedResult.data.apps.length)

		assert.equal(result.data.apps[0].Id, expectedResult.data.apps[0].Id)
		assert.equal(result.data.apps[0].Name, expectedResult.data.apps[0].Name)
		assert.equal(result.data.apps[0].Description, expectedResult.data.apps[0].Description)
		assert.equal(result.data.apps[0].Published, expectedResult.data.apps[0].Published)
		assert.equal(result.data.apps[0].WebLink, expectedResult.data.apps[0].WebLink)
		assert.equal(result.data.apps[0].GooglePlayLink, expectedResult.data.apps[0].GooglePlayLink)
		assert.equal(result.data.apps[0].MicrosoftStoreLink, expectedResult.data.apps[0].MicrosoftStoreLink)

		assert.equal(result.data.apps[1].Id, expectedResult.data.apps[1].Id)
		assert.equal(result.data.apps[1].Name, expectedResult.data.apps[1].Name)
		assert.equal(result.data.apps[1].Description, expectedResult.data.apps[1].Description)
		assert.equal(result.data.apps[1].Published, expectedResult.data.apps[1].Published)
		assert.equal(result.data.apps[1].WebLink, expectedResult.data.apps[1].WebLink)
		assert.equal(result.data.apps[1].GooglePlayLink, expectedResult.data.apps[1].GooglePlayLink)
		assert.equal(result.data.apps[1].MicrosoftStoreLink, expectedResult.data.apps[1].MicrosoftStoreLink)
	})
})