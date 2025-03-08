import { assert } from "chai"
import localforage from "localforage"
import {
	ApiResponse,
	ApiErrorResponse,
	Environment,
	SessionUploadStatus,
	DatabaseUser,
	Plan,
	TableObjectUploadStatus,
	List,
	TableObjectResource,
	TableResource,
	ErrorCode,
	SubscriptionStatus
} from "../../lib/types.js"
import { generateUuid } from "../../lib/utils.js"
import * as Constants from "../constants.js"
import { defaultProfileImageUrl } from "../../lib/constants.js"
import { Dav } from "../../lib/Dav.js"
import { App } from "../../lib/models/App.js"
import { TableObject } from "../../lib/models/TableObject.js"
import {
	SessionSyncPush,
	LoadUser,
	UserSync,
	Sync,
	SyncPush,
	DownloadTableObject
} from "../../lib/providers/SyncManager.js"
import * as DatabaseOperations from "../../lib/providers/DatabaseOperations.js"
import * as SessionsController from "../../lib/controllers/SessionsController.js"
import * as TablesController from "../../lib/controllers/TablesController.js"
import * as TableObjectsController from "../../lib/controllers/TableObjectsController.js"

beforeEach(async () => {
	// Reset global variables
	Dav.environment = Environment.Test
	Dav.skipSyncPushInTests = true
	Dav.isLoggedIn = false
	Dav.accessToken = null

	// Clear the database
	await localforage.clear()
})

afterEach(async () => {
	// Delete the tableObjects
	await deleteTableObjectsOfTable(Constants.testAppFirstTestTableName)
	await deleteTableObjectsOfTable(Constants.testAppSecondTestTableName)
})

async function deleteTableObjectsOfTable(tableName: string) {
	let getTableResponse = await TablesController.retrieveTable(
		`
			tableObjects {
				items {
					uuid
				}
			}
		`,
		{
			accessToken: Constants.testerXTestAppAccessToken,
			name: tableName
		}
	)

	if (Array.isArray(getTableResponse)) {
		console.error("Error in getting table", getTableResponse)
	} else {
		let tableObjects = (getTableResponse as TableResource).tableObjects.items

		for (let tableObject of tableObjects) {
			let deleteTableObjectResponse =
				await TableObjectsController.deleteTableObject(`uuid`, {
					accessToken: Constants.testerXTestAppAccessToken,
					uuid: tableObject.uuid
				})

			if (Array.isArray(deleteTableObjectResponse)) {
				console.error("Error in deleting table object", deleteTableObjectResponse)
			}
		}
	}
}

describe("SessionSyncPush function", () => {
	it("should delete the session on the server", async () => {
		// Arranage
		let createSessionResponse = await SessionsController.createSession(`accessToken`, {
			auth: Constants.davDevAuth,
			email: Constants.tester.email,
			password: Constants.tester.password,
			appId: Constants.testAppId,
			apiKey: Constants.testerDevAuth.apiKey
		})
		assert.isNotArray(createSessionResponse)
		const accessToken = (createSessionResponse as SessionsController.SessionResponseData).accessToken

		await DatabaseOperations.SetSession({
			AccessToken: accessToken,
			UploadStatus: SessionUploadStatus.Deleted
		})

		// Act
		await SessionSyncPush()

		// Assert
		let sessionFromDatabase = await DatabaseOperations.GetSession()
		assert.isNull(sessionFromDatabase)

		let deleteSessionResponse = await SessionsController.deleteSession(`accessToken`, {
			accessToken
		})
		assert.isArray(deleteSessionResponse)

		const deleteSessionErrors = (deleteSessionResponse as ErrorCode[])
		assert.isTrue(deleteSessionErrors.includes("SESSION_DOES_NOT_EXIST"))
	})

	it("should remove the session from the database if the session does not exist on the server", async () => {
		// Arrange
		await DatabaseOperations.SetSession({
			AccessToken: "sdhiosgiodsghio",
			UploadStatus: SessionUploadStatus.Deleted
		})

		// Act
		await SessionSyncPush()

		// Assert
		let sessionFromDatabase = await DatabaseOperations.GetSession()
		assert.isNull(sessionFromDatabase)
	})
})

describe("LoadUser function", () => {
	it("should load the user from the database", async () => {
		// Arrange
		let userLoadedCallbackCalled = false

		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			callbacks: {
				UserLoaded: () => {
					userLoadedCallbackCalled = true
				}
			}
		})

		const user: DatabaseUser = {
			Id: 12,
			Email: "test@dav-apps.tech",
			FirstName: "TestUser",
			Confirmed: false,
			TotalStorage: 3092432443,
			UsedStorage: 12341,
			StripeCustomerId: null,
			Plan: Plan.Free,
			SubscriptionStatus: null,
			PeriodEnd: null,
			Dev: false,
			Provider: false,
			ProfileImage: null,
			ProfileImageEtag: "iofosdgsdgsdgsdg",
			Apps: [
				new App(
					12,
					"TestApp",
					"This is a test app",
					true,
					"https://testapp.dav-apps.tech",
					"https://play.google.com/store/asdasd",
					null,
					1231414
				)
			]
		}

		await DatabaseOperations.SetUser(user)

		// Act
		await LoadUser()

		// Assert
		assert.isTrue(userLoadedCallbackCalled)

		assert.equal(Dav.user.Id, user.Id)
		assert.equal(Dav.user.Email, user.Email)
		assert.equal(Dav.user.FirstName, user.FirstName)
		assert.equal(Dav.user.Confirmed, user.Confirmed)
		assert.equal(Dav.user.TotalStorage, user.TotalStorage)
		assert.equal(Dav.user.UsedStorage, user.UsedStorage)
		assert.equal(Dav.user.StripeCustomerId, user.StripeCustomerId)
		assert.equal(Dav.user.Plan, user.Plan)
		assert.equal(Dav.user.SubscriptionStatus, user.SubscriptionStatus)
		assert.equal(Dav.user.PeriodEnd, user.PeriodEnd)
		assert.equal(Dav.user.Dev, user.Dev)
		assert.equal(Dav.user.Provider, user.Provider)
		assert.equal(Dav.user.ProfileImage, defaultProfileImageUrl)
	})

	it("should call the callback if the user is not logged in", async () => {
		// Arrange
		let userLoadedCallbackCalled = false

		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			callbacks: {
				UserLoaded: () => {
					userLoadedCallbackCalled = true
				}
			}
		})

		// Act
		await LoadUser()

		// Assert
		assert.isTrue(userLoadedCallbackCalled)
	})
})

describe("UserSync function", () => {
	it("should download the user and save it in the database", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		// Act
		await UserSync()

		// Assert
		let userFromDatabase = await DatabaseOperations.GetUser()
		assert.isNotNull(userFromDatabase)

		assert.equal(userFromDatabase.Id, Constants.tester.id)
		assert.equal(userFromDatabase.Email, Constants.tester.email)
		assert.equal(userFromDatabase.FirstName, Constants.tester.firstName)
		assert.equal(userFromDatabase.Confirmed, Constants.tester.confirmed)
		assert.equal(userFromDatabase.TotalStorage, Constants.tester.totalStorage)
		assert.equal(userFromDatabase.UsedStorage, Constants.tester.usedStorage)
		assert.isNull(userFromDatabase.StripeCustomerId)
		assert.equal(userFromDatabase.Plan, Constants.tester.plan)
		assert.equal(userFromDatabase.SubscriptionStatus, SubscriptionStatus.Active)
		assert.isNull(userFromDatabase.PeriodEnd)
		assert.equal(userFromDatabase.Dev, Constants.tester.dev)
		assert.equal(userFromDatabase.Provider, Constants.tester.provider)

		assert.equal(Dav.user.Id, Constants.tester.id)
		assert.equal(Dav.user.Email, Constants.tester.email)
		assert.equal(Dav.user.FirstName, Constants.tester.firstName)
		assert.equal(Dav.user.Confirmed, Constants.tester.confirmed)
		assert.equal(Dav.user.TotalStorage, Constants.tester.totalStorage)
		assert.equal(Dav.user.UsedStorage, Constants.tester.usedStorage)
		assert.equal(Dav.user.Plan, Constants.tester.plan)
		assert.equal(Dav.user.Dev, Constants.tester.dev)
		assert.equal(Dav.user.Provider, Constants.tester.provider)
	})

	it("should download the user and update the existing user in the database", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		await DatabaseOperations.SetUser({
			Id: 4,
			Email: "oldtest@example.com",
			FirstName: "Old first name",
			Confirmed: false,
			TotalStorage: 1000000,
			UsedStorage: 200000,
			Plan: Plan.Plus,
			Dev: false,
			Provider: false,
			ProfileImage: null,
			ProfileImageEtag: null,
			Apps: []
		})

		// Act
		await UserSync()

		// Assert
		let userFromDatabase = await DatabaseOperations.GetUser()
		assert.isNotNull(userFromDatabase)

		assert.equal(userFromDatabase.Id, Constants.tester.id)
		assert.equal(userFromDatabase.Email, Constants.tester.email)
		assert.equal(userFromDatabase.FirstName, Constants.tester.firstName)
		assert.equal(userFromDatabase.Confirmed, Constants.tester.confirmed)
		assert.equal(userFromDatabase.TotalStorage, Constants.tester.totalStorage)
		assert.equal(userFromDatabase.UsedStorage, Constants.tester.usedStorage)
		assert.isNull(userFromDatabase.StripeCustomerId)
		assert.equal(userFromDatabase.Plan, Constants.tester.plan)
		assert.equal(userFromDatabase.SubscriptionStatus, SubscriptionStatus.Active)
		assert.isNull(userFromDatabase.PeriodEnd)
		assert.equal(userFromDatabase.Dev, Constants.tester.dev)
		assert.equal(userFromDatabase.Provider, Constants.tester.provider)

		assert.equal(Dav.user.Id, Constants.tester.id)
		assert.equal(Dav.user.Email, Constants.tester.email)
		assert.equal(Dav.user.FirstName, Constants.tester.firstName)
		assert.equal(Dav.user.Confirmed, Constants.tester.confirmed)
		assert.equal(Dav.user.TotalStorage, Constants.tester.totalStorage)
		assert.equal(Dav.user.UsedStorage, Constants.tester.usedStorage)
		assert.equal(Dav.user.Plan, Constants.tester.plan)
		assert.equal(Dav.user.Dev, Constants.tester.dev)
		assert.equal(Dav.user.Provider, Constants.tester.provider)
	})

	it("should log the user out if the session does not exist", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = "shoghiosgdhiosgsghiod"

		await DatabaseOperations.SetUser({
			Id: 4,
			Email: "oldtest@example.com",
			FirstName: "Old first name",
			Confirmed: false,
			TotalStorage: 1000000,
			UsedStorage: 200000,
			Plan: Plan.Plus,
			Dev: false,
			Provider: false,
			ProfileImage: null,
			ProfileImageEtag: null,
			Apps: []
		})

		// Act
		await UserSync()

		// Assert
		assert.isFalse(Dav.isLoggedIn)
		assert.isNull(Dav.accessToken)

		let userFromDatabase = await DatabaseOperations.GetUser()
		assert.isNull(userFromDatabase)
	})
})

describe("Sync function", () => {
	it("should download all table objects from the server and update the properties of existing table objects", async () => {
		// Arrange (1)
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			tableNames: [
				Constants.testAppFirstTestTableName,
				Constants.testAppSecondTestTableName
			]
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstTableObjectUuid = generateUuid()
		let firstTableObjectTableId = Constants.testAppFirstTestTableId
		let firstTableObjectFirstPropertyName = "page1"
		let firstTableObjectFirstPropertyValue = "Hello World"
		let firstTableObjectSecondPropertyName = "page2"
		let firstTableObjectSecondPropertyValue = "Hallo Welt"

		let secondTableObjectUuid = generateUuid()
		let secondTableObjectTableId = Constants.testAppSecondTestTableId
		let secondTableObjectFirstPropertyName = "test1"
		let secondTableObjectFirstPropertyValue = "First test"
		let secondTableObjectSecondPropertyName = "test2"
		let secondTableObjectSecondPropertyValue = "Second test"

		await TableObjectsController.createTableObject(`uuid`, {
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: firstTableObjectUuid,
			tableId: firstTableObjectTableId,
			properties: {
				[firstTableObjectFirstPropertyName]:
					firstTableObjectFirstPropertyValue,
				[firstTableObjectSecondPropertyName]:
					firstTableObjectSecondPropertyValue
			}
		})

		await TableObjectsController.createTableObject(`uuid`, {
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: secondTableObjectUuid,
			tableId: secondTableObjectTableId,
			properties: {
				[secondTableObjectFirstPropertyName]:
					secondTableObjectFirstPropertyValue,
				[secondTableObjectSecondPropertyName]:
					secondTableObjectSecondPropertyValue
			}
		})

		// Act (1)
		await Sync()

		// Assert (1)
		let allTableObjects = await DatabaseOperations.GetAllTableObjects()
		assert.equal(allTableObjects.length, 2)

		let firstTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(firstTableObjectUuid)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.Uuid, firstTableObjectUuid)
		assert.equal(
			firstTableObjectFromDatabase.TableId,
			firstTableObjectTableId
		)
		assert.equal(
			Object.keys(firstTableObjectFromDatabase.Properties).length,
			2
		)
		assert.equal(
			firstTableObjectFromDatabase.GetPropertyValue(
				firstTableObjectFirstPropertyName
			),
			firstTableObjectFirstPropertyValue
		)
		assert.equal(
			firstTableObjectFromDatabase.GetPropertyValue(
				firstTableObjectSecondPropertyName
			),
			firstTableObjectSecondPropertyValue
		)

		let secondTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(secondTableObjectUuid)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.Uuid, secondTableObjectUuid)
		assert.equal(
			secondTableObjectFromDatabase.TableId,
			secondTableObjectTableId
		)
		assert.equal(
			Object.keys(secondTableObjectFromDatabase.Properties).length,
			2
		)
		assert.equal(
			secondTableObjectFromDatabase.GetPropertyValue(
				secondTableObjectFirstPropertyName
			),
			secondTableObjectFirstPropertyValue
		)
		assert.equal(
			secondTableObjectFromDatabase.GetPropertyValue(
				secondTableObjectSecondPropertyName
			),
			secondTableObjectSecondPropertyValue
		)

		// Arrange (2)
		let firstTableObjectFirstUpdatedPropertyValue = "First updated value"
		let firstTableObjectSecondUpdatedPropertyValue =
			"Erster aktualisierter Wert"

		let secondTableObjectFirstUpdatedPropertyValue = "Second updated value"
		let secondTableObjectSecondUpdatedPropertyValue =
			"Zweiter aktualisierter Wert"

		await TableObjectsController.updateTableObject(`uuid`, {
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: firstTableObjectUuid,
			properties: {
				[firstTableObjectFirstPropertyName]:
					firstTableObjectFirstUpdatedPropertyValue,
				[firstTableObjectSecondPropertyName]:
					firstTableObjectSecondUpdatedPropertyValue
			}
		})

		await TableObjectsController.updateTableObject(`uuid`, {
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: secondTableObjectUuid,
			properties: {
				[secondTableObjectFirstPropertyName]:
					secondTableObjectFirstUpdatedPropertyValue,
				[secondTableObjectSecondPropertyName]:
					secondTableObjectSecondUpdatedPropertyValue
			}
		})

		// Act (2)
		await Sync()

		// Assert (2)
		allTableObjects = await DatabaseOperations.GetAllTableObjects()
		assert.equal(allTableObjects.length, 2)

		firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(
			firstTableObjectUuid
		)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.Uuid, firstTableObjectUuid)
		assert.equal(
			firstTableObjectFromDatabase.TableId,
			firstTableObjectTableId
		)
		assert.equal(
			Object.keys(firstTableObjectFromDatabase.Properties).length,
			2
		)
		assert.equal(
			firstTableObjectFromDatabase.GetPropertyValue(
				firstTableObjectFirstPropertyName
			),
			firstTableObjectFirstUpdatedPropertyValue
		)
		assert.equal(
			firstTableObjectFromDatabase.GetPropertyValue(
				firstTableObjectSecondPropertyName
			),
			firstTableObjectSecondUpdatedPropertyValue
		)

		secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(
			secondTableObjectUuid
		)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.Uuid, secondTableObjectUuid)
		assert.equal(
			secondTableObjectFromDatabase.TableId,
			secondTableObjectTableId
		)
		assert.equal(
			Object.keys(secondTableObjectFromDatabase.Properties).length,
			2
		)
		assert.equal(
			secondTableObjectFromDatabase.GetPropertyValue(
				secondTableObjectFirstPropertyName
			),
			secondTableObjectFirstUpdatedPropertyValue
		)
		assert.equal(
			secondTableObjectFromDatabase.GetPropertyValue(
				secondTableObjectSecondPropertyName
			),
			secondTableObjectSecondUpdatedPropertyValue
		)
	})

	it("should remove the table objects that are not on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			tableNames: [
				Constants.testAppFirstTestTableName,
				Constants.testAppSecondTestTableName
			]
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstTableObjectUuid = generateUuid()
		let firstTableObjectTableId = Constants.testAppFirstTestTableId
		let firstTableObjectFirstPropertyName = "page1"
		let firstTableObjectFirstPropertyValue = "Hello World"
		let firstTableObjectSecondPropertyName = "page2"
		let firstTableObjectSecondPropertyValue = "Hallo Welt"

		let secondTableObjectUuid = generateUuid()
		let secondTableObjectTableId = Constants.testAppSecondTestTableId
		let secondTableObjectFirstPropertyName = "test1"
		let secondTableObjectFirstPropertyValue = "First test"
		let secondTableObjectSecondPropertyName = "test2"
		let secondTableObjectSecondPropertyValue = "Second test"

		let localTableObjectUuid = generateUuid()
		let localTableObjectTableId = Constants.testAppFirstTestTableId
		let localTableObjectFirstPropertyName = "page1"
		let localTableObjectFirstPropertyValue = "Guten Tag"
		let localTableObjectSecondPropertyName = "page2"
		let localTableObjectSecondPropertyValue = "Good day"

		await TableObjectsController.createTableObject(`uuid`, {
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: firstTableObjectUuid,
			tableId: firstTableObjectTableId,
			properties: {
				[firstTableObjectFirstPropertyName]:
					firstTableObjectFirstPropertyValue,
				[firstTableObjectSecondPropertyName]:
					firstTableObjectSecondPropertyValue
			}
		})

		await TableObjectsController.createTableObject(`uuid`, {
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: secondTableObjectUuid,
			tableId: secondTableObjectTableId,
			properties: {
				[secondTableObjectFirstPropertyName]:
					secondTableObjectFirstPropertyValue,
				[secondTableObjectSecondPropertyName]:
					secondTableObjectSecondPropertyValue
			}
		})

		await DatabaseOperations.SetTableObject(
			new TableObject({
				Uuid: localTableObjectUuid,
				TableId: localTableObjectTableId,
				Properties: {
					[localTableObjectFirstPropertyName]: {
						value: localTableObjectFirstPropertyValue
					},
					[localTableObjectSecondPropertyName]: {
						value: localTableObjectSecondPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.UpToDate
			})
		)

		// Act
		await Sync()

		// Assert
		let allTableObjects = await DatabaseOperations.GetAllTableObjects()
		assert.equal(allTableObjects.length, 2)

		let firstTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(firstTableObjectUuid)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.Uuid, firstTableObjectUuid)
		assert.equal(
			firstTableObjectFromDatabase.TableId,
			firstTableObjectTableId
		)
		assert.equal(
			Object.keys(firstTableObjectFromDatabase.Properties).length,
			2
		)
		assert.equal(
			firstTableObjectFromDatabase.GetPropertyValue(
				firstTableObjectFirstPropertyName
			),
			firstTableObjectFirstPropertyValue
		)
		assert.equal(
			firstTableObjectFromDatabase.GetPropertyValue(
				firstTableObjectSecondPropertyName
			),
			firstTableObjectSecondPropertyValue
		)

		let secondTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(secondTableObjectUuid)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.Uuid, secondTableObjectUuid)
		assert.equal(
			secondTableObjectFromDatabase.TableId,
			secondTableObjectTableId
		)
		assert.equal(
			Object.keys(secondTableObjectFromDatabase.Properties).length,
			2
		)
		assert.equal(
			secondTableObjectFromDatabase.GetPropertyValue(
				secondTableObjectFirstPropertyName
			),
			secondTableObjectFirstPropertyValue
		)
		assert.equal(
			secondTableObjectFromDatabase.GetPropertyValue(
				secondTableObjectSecondPropertyName
			),
			secondTableObjectSecondPropertyValue
		)
	})
})
/*
describe("SyncPush function", () => {
	it("should create table objects on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			tableIds: [
				Constants.testAppFirstTestTableId,
				Constants.testAppSecondTestTableId
			]
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstTableObjectUuid = generateUuid()
		let firstTableObjectTableId = Constants.testAppFirstTestTableId
		let firstTableObjectFirstPropertyName = "page1"
		let firstTableObjectFirstPropertyValue = "Hello World"
		let firstTableObjectSecondPropertyName = "page2"
		let firstTableObjectSecondPropertyValue = "Hallo Welt"

		let secondTableObjectUuid = generateUuid()
		let secondTableObjectTableId = Constants.testAppSecondTestTableId
		let secondTableObjectFirstPropertyName = "test1"
		let secondTableObjectFirstPropertyValue = "First test"
		let secondTableObjectSecondPropertyName = "test2"
		let secondTableObjectSecondPropertyValue = "Second test"

		await DatabaseOperations.SetTableObjects([
			new TableObject({
				Uuid: firstTableObjectUuid,
				TableId: firstTableObjectTableId,
				Properties: {
					[firstTableObjectFirstPropertyName]: {
						value: firstTableObjectFirstPropertyValue
					},
					[firstTableObjectSecondPropertyName]: {
						value: firstTableObjectSecondPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.New
			}),
			new TableObject({
				Uuid: secondTableObjectUuid,
				TableId: secondTableObjectTableId,
				Properties: {
					[secondTableObjectFirstPropertyName]: {
						value: secondTableObjectFirstPropertyValue
					},
					[secondTableObjectSecondPropertyName]: {
						value: secondTableObjectSecondPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.New
			})
		])

		// Act
		await SyncPush()

		// Assert
		let firstTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(firstTableObjectUuid)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(
			firstTableObjectFromDatabase.UploadStatus,
			TableObjectUploadStatus.UpToDate
		)

		let secondTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(secondTableObjectUuid)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(
			secondTableObjectFromDatabase.UploadStatus,
			TableObjectUploadStatus.UpToDate
		)

		let firstTableObjectFromServerResponse =
			await TableObjectsController.GetTableObject({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: firstTableObjectUuid
			})
		assert.equal(firstTableObjectFromServerResponse.status, 200)

		let firstTableObjectFromServer = (
			firstTableObjectFromServerResponse as ApiResponse<TableObjectResponseData>
		).data.tableObject
		assert.equal(firstTableObjectFromServer.Uuid, firstTableObjectUuid)
		assert.equal(firstTableObjectFromServer.TableId, firstTableObjectTableId)
		assert.equal(Object.keys(firstTableObjectFromServer.Properties).length, 2)
		assert.equal(
			firstTableObjectFromServer.GetPropertyValue(
				firstTableObjectFirstPropertyName
			),
			firstTableObjectFirstPropertyValue
		)
		assert.equal(
			firstTableObjectFromServer.GetPropertyValue(
				firstTableObjectSecondPropertyName
			),
			firstTableObjectSecondPropertyValue
		)

		let secondTableObjectFromServerResponse =
			await TableObjectsController.GetTableObject({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: secondTableObjectUuid
			})
		assert.equal(secondTableObjectFromServerResponse.status, 200)

		let secondTableObjectFromServer = (
			secondTableObjectFromServerResponse as ApiResponse<TableObjectResponseData>
		).data.tableObject
		assert.equal(secondTableObjectFromServer.Uuid, secondTableObjectUuid)
		assert.equal(
			secondTableObjectFromServer.TableId,
			secondTableObjectTableId
		)
		assert.equal(
			Object.keys(secondTableObjectFromServer.Properties).length,
			2
		)
		assert.equal(
			secondTableObjectFromServer.GetPropertyValue(
				secondTableObjectFirstPropertyName
			),
			secondTableObjectFirstPropertyValue
		)
		assert.equal(
			secondTableObjectFromServer.GetPropertyValue(
				secondTableObjectSecondPropertyName
			),
			secondTableObjectSecondPropertyValue
		)
	})

	it("should update table objects on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			tableIds: [
				Constants.testAppFirstTestTableId,
				Constants.testAppSecondTestTableId
			]
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstTableObjectUuid = generateUuid()
		let firstTableObjectTableId = Constants.testAppFirstTestTableId
		let firstTableObjectFirstPropertyName = "page1"
		let firstTableObjectFirstPropertyValue = "Hello World"
		let firstTableObjectSecondPropertyName = "page2"
		let firstTableObjectSecondPropertyValue = "Hallo Welt"

		let secondTableObjectUuid = generateUuid()
		let secondTableObjectTableId = Constants.testAppSecondTestTableId
		let secondTableObjectFirstPropertyName = "test1"
		let secondTableObjectFirstPropertyValue = "First test"
		let secondTableObjectSecondPropertyName = "test2"
		let secondTableObjectSecondPropertyValue = "Second test"

		await TableObjectsController.CreateTableObject({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: firstTableObjectUuid,
			tableId: firstTableObjectTableId,
			properties: {
				[firstTableObjectFirstPropertyName]:
					firstTableObjectFirstPropertyValue,
				[firstTableObjectSecondPropertyName]:
					firstTableObjectSecondPropertyValue
			}
		})

		await TableObjectsController.CreateTableObject({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: secondTableObjectUuid,
			tableId: secondTableObjectTableId,
			properties: {
				[secondTableObjectFirstPropertyName]:
					secondTableObjectFirstPropertyValue,
				[secondTableObjectSecondPropertyName]:
					secondTableObjectSecondPropertyValue
			}
		})

		let firstTableObjectFirstUpdatedPropertyValue = "First updated value"
		let firstTableObjectSecondUpdatedPropertyValue =
			"Erster aktualisierter Wert"

		let secondTableObjectFirstUpdatedPropertyValue = "Second updated value"
		let secondTableObjectSecondUpdatedPropertyValue =
			"Zweiter aktualisierter Wert"

		await DatabaseOperations.SetTableObjects([
			new TableObject({
				Uuid: firstTableObjectUuid,
				TableId: firstTableObjectTableId,
				Properties: {
					[firstTableObjectFirstPropertyName]: {
						value: firstTableObjectFirstUpdatedPropertyValue
					},
					[firstTableObjectSecondPropertyName]: {
						value: firstTableObjectSecondUpdatedPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.Updated
			}),
			new TableObject({
				Uuid: secondTableObjectUuid,
				TableId: secondTableObjectTableId,
				Properties: {
					[secondTableObjectFirstPropertyName]: {
						value: secondTableObjectFirstUpdatedPropertyValue
					},
					[secondTableObjectSecondPropertyName]: {
						value: secondTableObjectSecondUpdatedPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.Updated
			})
		])

		// Act
		await SyncPush()

		// Assert
		let firstTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(firstTableObjectUuid)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.Uuid, firstTableObjectUuid)
		assert.equal(
			firstTableObjectFromDatabase.TableId,
			firstTableObjectTableId
		)
		assert.equal(
			Object.keys(firstTableObjectFromDatabase.Properties).length,
			2
		)
		assert.equal(
			firstTableObjectFromDatabase.GetPropertyValue(
				firstTableObjectFirstPropertyName
			),
			firstTableObjectFirstUpdatedPropertyValue
		)
		assert.equal(
			firstTableObjectFromDatabase.GetPropertyValue(
				firstTableObjectSecondPropertyName
			),
			firstTableObjectSecondUpdatedPropertyValue
		)
		assert.equal(
			firstTableObjectFromDatabase.UploadStatus,
			TableObjectUploadStatus.UpToDate
		)

		let secondTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(secondTableObjectUuid)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.Uuid, secondTableObjectUuid)
		assert.equal(
			secondTableObjectFromDatabase.TableId,
			secondTableObjectTableId
		)
		assert.equal(
			Object.keys(secondTableObjectFromDatabase.Properties).length,
			2
		)
		assert.equal(
			secondTableObjectFromDatabase.GetPropertyValue(
				secondTableObjectFirstPropertyName
			),
			secondTableObjectFirstUpdatedPropertyValue
		)
		assert.equal(
			secondTableObjectFromDatabase.GetPropertyValue(
				secondTableObjectSecondPropertyName
			),
			secondTableObjectSecondUpdatedPropertyValue
		)
		assert.equal(
			secondTableObjectFromDatabase.UploadStatus,
			TableObjectUploadStatus.UpToDate
		)

		let firstTableObjectFromServerResponse =
			await TableObjectsController.GetTableObject({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: firstTableObjectUuid
			})
		assert.equal(firstTableObjectFromServerResponse.status, 200)

		let firstTableObjectFromServer = (
			firstTableObjectFromServerResponse as ApiResponse<TableObjectResponseData>
		).data.tableObject
		assert.equal(firstTableObjectFromServer.Uuid, firstTableObjectUuid)
		assert.equal(firstTableObjectFromServer.TableId, firstTableObjectTableId)
		assert.equal(Object.keys(firstTableObjectFromServer.Properties).length, 2)
		assert.equal(
			firstTableObjectFromServer.GetPropertyValue(
				firstTableObjectFirstPropertyName
			),
			firstTableObjectFirstUpdatedPropertyValue
		)
		assert.equal(
			firstTableObjectFromServer.GetPropertyValue(
				firstTableObjectSecondPropertyName
			),
			firstTableObjectSecondUpdatedPropertyValue
		)

		let secondTableObjectFromServerResponse =
			await TableObjectsController.GetTableObject({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: secondTableObjectUuid
			})
		assert.equal(secondTableObjectFromServerResponse.status, 200)

		let secondTableObjectFromServer = (
			secondTableObjectFromServerResponse as ApiResponse<TableObjectResponseData>
		).data.tableObject
		assert.equal(secondTableObjectFromServer.Uuid, secondTableObjectUuid)
		assert.equal(
			secondTableObjectFromServer.TableId,
			secondTableObjectTableId
		)
		assert.equal(
			Object.keys(secondTableObjectFromServer.Properties).length,
			2
		)
		assert.equal(
			secondTableObjectFromServer.GetPropertyValue(
				secondTableObjectFirstPropertyName
			),
			secondTableObjectFirstUpdatedPropertyValue
		)
		assert.equal(
			secondTableObjectFromServer.GetPropertyValue(
				secondTableObjectSecondPropertyName
			),
			secondTableObjectSecondUpdatedPropertyValue
		)
	})

	it("should delete table objects on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			tableIds: [
				Constants.testAppFirstTestTableId,
				Constants.testAppSecondTestTableId
			]
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstTableObjectUuid = generateUuid()
		let firstTableObjectTableId = Constants.testAppFirstTestTableId
		let firstTableObjectFirstPropertyName = "page1"
		let firstTableObjectFirstPropertyValue = "Hello World"
		let firstTableObjectSecondPropertyName = "page2"
		let firstTableObjectSecondPropertyValue = "Hallo Welt"

		let secondTableObjectUuid = generateUuid()
		let secondTableObjectTableId = Constants.testAppSecondTestTableId
		let secondTableObjectFirstPropertyName = "test1"
		let secondTableObjectFirstPropertyValue = "First test"
		let secondTableObjectSecondPropertyName = "test2"
		let secondTableObjectSecondPropertyValue = "Second test"

		await TableObjectsController.CreateTableObject({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: firstTableObjectUuid,
			tableId: firstTableObjectTableId,
			properties: {
				[firstTableObjectFirstPropertyName]:
					firstTableObjectFirstPropertyValue,
				[firstTableObjectSecondPropertyName]:
					firstTableObjectSecondPropertyValue
			}
		})

		await TableObjectsController.CreateTableObject({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: secondTableObjectUuid,
			tableId: secondTableObjectTableId,
			properties: {
				[secondTableObjectFirstPropertyName]:
					secondTableObjectFirstPropertyValue,
				[secondTableObjectSecondPropertyName]:
					secondTableObjectSecondPropertyValue
			}
		})

		await DatabaseOperations.SetTableObjects([
			new TableObject({
				Uuid: firstTableObjectUuid,
				TableId: firstTableObjectTableId,
				Properties: {
					[firstTableObjectFirstPropertyName]: {
						value: firstTableObjectFirstPropertyValue
					},
					[firstTableObjectSecondPropertyName]: {
						value: firstTableObjectSecondPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.Deleted
			}),
			new TableObject({
				Uuid: secondTableObjectUuid,
				TableId: secondTableObjectTableId,
				Properties: {
					[secondTableObjectFirstPropertyName]: {
						value: secondTableObjectFirstPropertyValue
					},
					[secondTableObjectSecondPropertyName]: {
						value: secondTableObjectSecondPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.Deleted
			})
		])

		// Act
		await SyncPush()

		// Assert
		let firstTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(firstTableObjectUuid)
		assert.isNull(firstTableObjectFromDatabase)

		let secondTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(secondTableObjectUuid)
		assert.isNull(secondTableObjectFromDatabase)

		let firstTableObjectFromServerResponse =
			await TableObjectsController.GetTableObject({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: firstTableObjectUuid
			})
		assert.equal(firstTableObjectFromServerResponse.status, 404)
		assert.equal(
			(firstTableObjectFromServerResponse as ApiErrorResponse).errors[0]
				.code,
			ErrorCodes.TableObjectDoesNotExist
		)

		let secondTableObjectFromServerResponse =
			await TableObjectsController.GetTableObject({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: secondTableObjectUuid
			})
		assert.equal(secondTableObjectFromServerResponse.status, 404)
		assert.equal(
			(secondTableObjectFromServerResponse as ApiErrorResponse).errors[0]
				.code,
			ErrorCodes.TableObjectDoesNotExist
		)
	})

	it("should delete updated, deleted and removed table objects that do not exist on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			tableIds: [
				Constants.testAppFirstTestTableId,
				Constants.testAppSecondTestTableId
			]
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstTableObjectUuid = generateUuid()
		let firstTableObjectTableId = Constants.testAppFirstTestTableId
		let firstTableObjectFirstPropertyName = "page1"
		let firstTableObjectFirstPropertyValue = "Hello World"
		let firstTableObjectSecondPropertyName = "page2"
		let firstTableObjectSecondPropertyValue = "Hallo Welt"

		let secondTableObjectUuid = generateUuid()
		let secondTableObjectTableId = Constants.testAppSecondTestTableId
		let secondTableObjectFirstPropertyName = "test1"
		let secondTableObjectFirstPropertyValue = "First test"
		let secondTableObjectSecondPropertyName = "test2"
		let secondTableObjectSecondPropertyValue = "Second test"

		let thirdTableObjectUuid = generateUuid()
		let thirdTableObjectTableId = Constants.testAppSecondTestTableId
		let thirdTableObjectFirstPropertyName = "bla1"
		let thirdTableObjectFirstPropertyValue = "Third test"
		let thirdTableObjectSecondPropertyName = "bla2"
		let thirdTableObjectSecondPropertyValue = "Fourth test"

		await DatabaseOperations.SetTableObjects([
			new TableObject({
				Uuid: firstTableObjectUuid,
				TableId: firstTableObjectTableId,
				Properties: {
					[firstTableObjectFirstPropertyName]: {
						value: firstTableObjectFirstPropertyValue
					},
					[firstTableObjectSecondPropertyName]: {
						value: firstTableObjectSecondPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.Updated
			}),
			new TableObject({
				Uuid: secondTableObjectUuid,
				TableId: secondTableObjectTableId,
				Properties: {
					[secondTableObjectFirstPropertyName]: {
						value: secondTableObjectFirstPropertyValue
					},
					[secondTableObjectSecondPropertyName]: {
						value: secondTableObjectSecondPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.Deleted
			}),
			new TableObject({
				Uuid: thirdTableObjectUuid,
				TableId: thirdTableObjectTableId,
				Properties: {
					[thirdTableObjectFirstPropertyName]: {
						value: thirdTableObjectFirstPropertyValue
					},
					[thirdTableObjectSecondPropertyName]: {
						value: thirdTableObjectSecondPropertyValue
					}
				},
				UploadStatus: TableObjectUploadStatus.Removed
			})
		])

		// Act
		await SyncPush()

		// Assert
		let firstTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(firstTableObjectUuid)
		assert.isNull(firstTableObjectFromDatabase)

		let secondTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(secondTableObjectUuid)
		assert.isNull(secondTableObjectFromDatabase)

		let thirdTableObjectFromDatabase =
			await DatabaseOperations.GetTableObject(thirdTableObjectUuid)
		assert.isNull(thirdTableObjectFromDatabase)
	})
})

describe("DownloadTableObject function", () => {
	it("should download the table object and save it in the database", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			tableIds: [
				Constants.testAppFirstTestTableId,
				Constants.testAppSecondTestTableId
			]
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let tableObjectUuid = generateUuid()
		let tableObjectTableId = Constants.testAppFirstTestTableId
		let tableObjectFirstPropertyName = "page1"
		let tableObjectFirstPropertyValue = "Hello World"
		let tableObjectSecondPropertyName = "page2"
		let tableObjectSecondPropertyValue = "Hallo Welt"

		await TableObjectsController.CreateTableObject({
			uuid: tableObjectUuid,
			tableId: tableObjectTableId,
			properties: {
				[tableObjectFirstPropertyName]: tableObjectFirstPropertyValue,
				[tableObjectSecondPropertyName]: tableObjectSecondPropertyValue
			}
		})

		// Act
		await DownloadTableObject(tableObjectUuid)

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(
			tableObjectUuid
		)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, tableObjectUuid)
		assert.equal(tableObjectFromDatabase.TableId, tableObjectTableId)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(
			tableObjectFromDatabase.GetPropertyValue(tableObjectFirstPropertyName),
			tableObjectFirstPropertyValue
		)
		assert.equal(
			tableObjectFromDatabase.GetPropertyValue(
				tableObjectSecondPropertyName
			),
			tableObjectSecondPropertyValue
		)
	})

	it("should download the table object and update it in the database", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId,
			tableIds: [
				Constants.testAppFirstTestTableId,
				Constants.testAppSecondTestTableId
			]
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let tableObjectUuid = generateUuid()
		let tableObjectTableId = Constants.testAppFirstTestTableId
		let tableObjectFirstPropertyName = "page1"
		let tableObjectFirstPropertyValue = "Hello World"
		let tableObjectSecondPropertyName = "page2"
		let tableObjectSecondPropertyValue = "Hallo Welt"

		await DatabaseOperations.SetTableObject(
			new TableObject({
				Uuid: tableObjectUuid,
				TableId: tableObjectTableId,
				Properties: {
					[tableObjectFirstPropertyName]: {
						value: tableObjectFirstPropertyValue
					},
					[tableObjectSecondPropertyName]: {
						value: tableObjectSecondPropertyValue
					}
				}
			})
		)

		let tableObjectFirstUpdatedPropertyValue = "First updated value"
		let tableObjectSecondUpdatedPropertyValue = "Erster aktualisierter Wert"

		await TableObjectsController.CreateTableObject({
			uuid: tableObjectUuid,
			tableId: tableObjectTableId,
			properties: {
				[tableObjectFirstPropertyName]:
					tableObjectFirstUpdatedPropertyValue,
				[tableObjectSecondPropertyName]:
					tableObjectSecondUpdatedPropertyValue
			}
		})

		// Act
		await DownloadTableObject(tableObjectUuid)

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(
			tableObjectUuid
		)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, tableObjectUuid)
		assert.equal(tableObjectFromDatabase.TableId, tableObjectTableId)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(
			tableObjectFromDatabase.GetPropertyValue(tableObjectFirstPropertyName),
			tableObjectFirstUpdatedPropertyValue
		)
		assert.equal(
			tableObjectFromDatabase.GetPropertyValue(
				tableObjectSecondPropertyName
			),
			tableObjectSecondUpdatedPropertyValue
		)
	})
})
*/
