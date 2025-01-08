import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { App } from "../../lib/models/App.js"
import { CreateApp, UpdateApp } from "../../lib/controllers/AppsController.js"

beforeEach(() => {
	mock.reset()
})

describe("CreateApp function", () => {
	it("should call createApp endpoint", async () => {
		// Arrange
		let id = 23
		let name = "TestApp"
		let description = "This is a test app"

		let accessToken = "sodfnosgdbjsgdjsdgosgd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/app`

		let expectedResult: ApiResponse<App> = {
			status: 201,
			data: new App(id, name, description, false, null, null, null)
		}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.name, name)
			assert.equal(data.description, description)

			return [
				expectedResult.status,
				{
					id,
					name,
					description,
					published: false,
					web_link: null,
					google_play_link: null,
					microsoft_store_link: null
				}
			]
		})

		// Act
		let result = (await CreateApp({
			name,
			description
		})) as ApiResponse<App>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Name, expectedResult.data.Name)
		assert.equal(result.data.Description, expectedResult.data.Description)
		assert.equal(result.data.Published, expectedResult.data.Published)
		assert.equal(result.data.WebLink, expectedResult.data.WebLink)
		assert.equal(
			result.data.GooglePlayLink,
			expectedResult.data.GooglePlayLink
		)
		assert.equal(
			result.data.MicrosoftStoreLink,
			expectedResult.data.MicrosoftStoreLink
		)
	})

	it("should call createApp function with error", async () => {
		// Arrange
		let name = "TestApp"
		let description = "This is a test app"

		let accessToken = "sodfnosgdbjsgdjsdgosgd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/app`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.name, name)
			assert.equal(data.description, description)

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
		let result = (await CreateApp({
			name,
			description
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createApp endpoint and renew the session", async () => {
		// Arrange
		let id = 23
		let name = "TestApp"
		let description = "This is a test app"

		let accessToken = "sodfnosgdbjsgdjsdgosgd"
		let newAccessToken = "psfjiojsdgiosgdsgid"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/app`

		let expectedResult: ApiResponse<App> = {
			status: 201,
			data: new App(id, name, description, false, null, null, null)
		}

		mock
			.onPost(url)
			.replyOnce(config => {
				// First createApp request
				assert.equal(config.headers.Authorization, accessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.name, name)
				assert.equal(data.description, description)

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
			.onPost(url)
			.replyOnce(config => {
				// Second createApp request
				assert.equal(config.headers.Authorization, newAccessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.name, name)
				assert.equal(data.description, description)

				return [
					expectedResult.status,
					{
						id,
						name,
						description,
						published: false,
						web_link: null,
						google_play_link: null,
						microsoft_store_link: null
					}
				]
			})

		// Act
		let result = (await CreateApp({
			name,
			description
		})) as ApiResponse<App>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Name, expectedResult.data.Name)
		assert.equal(result.data.Description, expectedResult.data.Description)
		assert.equal(result.data.Published, expectedResult.data.Published)
		assert.equal(result.data.WebLink, expectedResult.data.WebLink)
		assert.equal(
			result.data.GooglePlayLink,
			expectedResult.data.GooglePlayLink
		)
		assert.equal(
			result.data.MicrosoftStoreLink,
			expectedResult.data.MicrosoftStoreLink
		)
	})
})

describe("UpdateApp function", () => {
	it("should call updateApp endpoint", async () => {
		// Arrange
		let id = 42
		let name = "Updated name"
		let description = "Updated description"
		let published = true
		let webLink = "https://cards.dav-apps.tech"
		let googlePlayLink = "https://play.google.com/cards"
		let microsoftStoreLink = "https://store.microsoft.com/cards"

		let accessToken = "ishdf0heh942893gurowfe"
		Dav.accessToken = accessToken
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
				microsoftStoreLink
			)
		}

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.name, name)
			assert.equal(data.description, description)
			assert.equal(data.published, published)
			assert.equal(data.web_link, webLink)
			assert.equal(data.google_play_link, googlePlayLink)
			assert.equal(data.microsoft_store_link, microsoftStoreLink)

			return [
				expectedResult.status,
				{
					id,
					name,
					description,
					published,
					web_link: webLink,
					google_play_link: googlePlayLink,
					microsoft_store_link: microsoftStoreLink
				}
			]
		})

		// Act
		let result = (await UpdateApp({
			id,
			name,
			description,
			published,
			webLink,
			googlePlayLink,
			microsoftStoreLink
		})) as ApiResponse<App>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Name, expectedResult.data.Name)
		assert.equal(result.data.Description, expectedResult.data.Description)
		assert.equal(result.data.Published, expectedResult.data.Published)
		assert.equal(result.data.WebLink, expectedResult.data.WebLink)
		assert.equal(
			result.data.GooglePlayLink,
			expectedResult.data.GooglePlayLink
		)
		assert.equal(
			result.data.MicrosoftStoreLink,
			expectedResult.data.MicrosoftStoreLink
		)
	})

	it("should call updateApp endpoint with error", async () => {
		// Arrange
		let id = 42
		let name = "Updated name"
		let description = "Updated description"
		let published = true
		let webLink = "https://cards.dav-apps.tech"
		let googlePlayLink = "https://play.google.com/cards"
		let microsoftStoreLink = "https://store.microsoft.com/cards"

		let accessToken = "ishdf0heh942893gurowfe"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/app/${id}`

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
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.name, name)
			assert.equal(data.description, description)
			assert.equal(data.published, published)
			assert.equal(data.web_link, webLink)
			assert.equal(data.google_play_link, googlePlayLink)
			assert.equal(data.microsoft_store_link, microsoftStoreLink)

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
		let result = (await UpdateApp({
			id,
			name,
			description,
			published,
			webLink,
			googlePlayLink,
			microsoftStoreLink
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call updateApp endpoint and renew the session", async () => {
		// Arrange
		let id = 42
		let name = "Updated name"
		let description = "Updated description"
		let published = true
		let webLink = "https://cards.dav-apps.tech"
		let googlePlayLink = "https://play.google.com/cards"
		let microsoftStoreLink = "https://store.microsoft.com/cards"

		let accessToken = "ishdf0heh942893gurowfe"
		let newAccessToken = "sodgosdghsdghshdg"
		Dav.accessToken = accessToken
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
				microsoftStoreLink
			)
		}

		mock
			.onPut(url)
			.replyOnce(config => {
				// First updateApp request
				assert.equal(config.headers.Authorization, accessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.name, name)
				assert.equal(data.description, description)
				assert.equal(data.published, published)
				assert.equal(data.web_link, webLink)
				assert.equal(data.google_play_link, googlePlayLink)
				assert.equal(data.microsoft_store_link, microsoftStoreLink)

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
			.onPut(url)
			.replyOnce(config => {
				// Second updateApp request
				assert.equal(config.headers.Authorization, newAccessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.name, name)
				assert.equal(data.description, description)
				assert.equal(data.published, published)
				assert.equal(data.web_link, webLink)
				assert.equal(data.google_play_link, googlePlayLink)
				assert.equal(data.microsoft_store_link, microsoftStoreLink)

				return [
					expectedResult.status,
					{
						id,
						name,
						description,
						published,
						web_link: webLink,
						google_play_link: googlePlayLink,
						microsoft_store_link: microsoftStoreLink
					}
				]
			})

		// Act
		let result = (await UpdateApp({
			id,
			name,
			description,
			published,
			webLink,
			googlePlayLink,
			microsoftStoreLink
		})) as ApiResponse<App>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Name, expectedResult.data.Name)
		assert.equal(result.data.Description, expectedResult.data.Description)
		assert.equal(result.data.Published, expectedResult.data.Published)
		assert.equal(result.data.WebLink, expectedResult.data.WebLink)
		assert.equal(
			result.data.GooglePlayLink,
			expectedResult.data.GooglePlayLink
		)
		assert.equal(
			result.data.MicrosoftStoreLink,
			expectedResult.data.MicrosoftStoreLink
		)
	})
})
