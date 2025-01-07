import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import { ApiResponse, ApiErrorResponse } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { App } from "../../lib/models/App.js"
import {
	CreateApp,
	GetApps,
	GetApp,
	UpdateApp
} from "../../lib/controllers/AppsController.js"
import { Table } from "../../lib/models/Table.js"

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

describe("GetApps function", () => {
	it("should call getApps endpoint", async () => {
		// Arrange
		let firstAppId = 12
		let firstAppDevId = 1
		let firstAppName = "TestApp"
		let firstAppDescription = "TestApp description"
		let firstAppPublished = true
		let firstAppWebLink = "https://testapp.dav-apps.tech"
		let firstAppGooglePlayLink = null
		let firstAppMicrosoftStoreLink = null
		let secondAppId = 14
		let secondAppDevId = 2
		let secondAppName = "SecondTestApp"
		let secondAppDescription = "This is the second test app"
		let secondAppPublished = true
		let secondAppWebLink = null
		let secondAppGooglePlayLink = "https://play.google.com/store/apps/bla"
		let secondAppMicrosoftStoreLink = "https://store.microsoft.com/bla"

		let url = `${Dav.apiBaseUrl}/apps`

		let expectedResult: ApiResponse<App[]> = {
			status: 200,
			data: [
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

		mock.onGet(url).reply(config => {
			return [
				expectedResult.status,
				{
					apps: [
						{
							id: firstAppId,
							dev_id: firstAppDevId,
							name: firstAppName,
							description: firstAppDescription,
							published: firstAppPublished,
							web_link: firstAppWebLink,
							google_play_link: firstAppGooglePlayLink,
							microsoft_store_link: firstAppMicrosoftStoreLink
						},
						{
							id: secondAppId,
							dev_id: secondAppDevId,
							name: secondAppName,
							description: secondAppDescription,
							published: secondAppPublished,
							web_link: secondAppWebLink,
							google_play_link: secondAppGooglePlayLink,
							microsoft_store_link: secondAppMicrosoftStoreLink
						}
					]
				}
			]
		})

		// Act
		let result = (await GetApps()) as ApiResponse<App[]>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.length, expectedResult.data.length)

		assert.equal(result.data[0].Id, expectedResult.data[0].Id)
		assert.equal(result.data[0].Name, expectedResult.data[0].Name)
		assert.equal(
			result.data[0].Description,
			expectedResult.data[0].Description
		)
		assert.equal(result.data[0].Published, expectedResult.data[0].Published)
		assert.equal(result.data[0].WebLink, expectedResult.data[0].WebLink)
		assert.equal(
			result.data[0].GooglePlayLink,
			expectedResult.data[0].GooglePlayLink
		)
		assert.equal(
			result.data[0].MicrosoftStoreLink,
			expectedResult.data[0].MicrosoftStoreLink
		)

		assert.equal(result.data[1].Id, expectedResult.data[1].Id)
		assert.equal(result.data[1].Name, expectedResult.data[1].Name)
		assert.equal(
			result.data[1].Description,
			expectedResult.data[1].Description
		)
		assert.equal(result.data[1].Published, expectedResult.data[1].Published)
		assert.equal(result.data[1].WebLink, expectedResult.data[1].WebLink)
		assert.equal(
			result.data[1].GooglePlayLink,
			expectedResult.data[1].GooglePlayLink
		)
		assert.equal(
			result.data[1].MicrosoftStoreLink,
			expectedResult.data[1].MicrosoftStoreLink
		)
	})

	it("should call getApps endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/apps`

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
		let result = (await GetApps()) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
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

		let accessToken = "ioasdwhehwt08r3q0feh0"
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
				microsoftStoreLink,
				null,
				[new Table(tableId, id, tableName)]
			)
		}

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					id,
					name,
					description,
					published,
					web_link: webLink,
					google_play_link: googlePlayLink,
					microsoft_store_link: microsoftStoreLink,
					tables: [
						{
							id: tableId,
							name: tableName
						}
					],
					apis: [
						{
							id: apiId,
							name: apiName
						}
					]
				}
			]
		})

		// Act
		let result = (await GetApp({
			id
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

		assert.equal(result.data.Tables.length, 1)
		assert.equal(result.data.Tables[0].Id, expectedResult.data.Tables[0].Id)
		assert.equal(
			result.data.Tables[0].Name,
			expectedResult.data.Tables[0].Name
		)
	})

	it("should call getApp endpoint with error", async () => {
		// Arrange
		let id = 53

		let accessToken = "ioasdwhehwt08r3q0feh0"
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

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

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
		let result = (await GetApp({
			id
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getApp endpoint and renew the session", async () => {
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

		let accessToken = "ioasdwhehwt08r3q0feh0"
		let newAccessToken = "sgksgkodsgkodsdfn"
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
				microsoftStoreLink,
				null,
				[new Table(tableId, id, tableName)]
			)
		}

		mock
			.onGet(url)
			.replyOnce(config => {
				// First getApp request
				assert.equal(config.headers.Authorization, accessToken)

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
				// Second getApp request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [
					expectedResult.status,
					{
						id,
						name,
						description,
						published,
						web_link: webLink,
						google_play_link: googlePlayLink,
						microsoft_store_link: microsoftStoreLink,
						tables: [
							{
								id: tableId,
								name: tableName
							}
						],
						apis: [
							{
								id: apiId,
								name: apiName
							}
						]
					}
				]
			})

		// Act
		let result = (await GetApp({
			id
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

		assert.equal(result.data.Tables.length, 1)
		assert.equal(result.data.Tables[0].Id, expectedResult.data.Tables[0].Id)
		assert.equal(
			result.data.Tables[0].Name,
			expectedResult.data.Tables[0].Name
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
