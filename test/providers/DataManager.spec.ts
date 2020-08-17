import 'mocha'
import { assert } from 'chai'
import * as localforage from 'localforage'
import { Dav, Init, ApiResponse } from '../../lib/Dav'
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations'
import * as DataManager from '../../lib/providers/DataManager'
import { Notification } from '../../lib/models/Notification'
import { TableObject, TableObjectUploadStatus, generateUUID } from '../../lib/models/TableObject'
import { DavEnvironment } from '../../lib/models/DavUser'
import * as AppsController from '../../lib/providers/AppsController'
import {
	davClassLibraryTestUserXTestUserJwt,
	testUserXTestUserJwt,
	testUserXdavJwt,
	davClassLibraryTestAppId,
	testDataTableId,
	firstTestNotification,
	secondTestNotification,
	firstNotificationPropertyName,
	secondNotificationPropertyName
} from '../Constants'
import { Table } from '../../lib/models/Table'

let tables = []

beforeEach(async () => {
	// Reset global variables
	Dav.skipSyncPushInTests = true
	Dav.jwt = null

	// Clear the database
	await localforage.clear()
})

afterEach(async () => {
	// Delete all created tables
	for (let tableId of tables) {
		await AppsController.DeleteTable(testUserXdavJwt, tableId)
	}

	tables = []
})

describe("Sync function", () => {
	it("should download all table objects from the server", async () => {
		// Arrange
		// Create the test tables
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		
		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}
		
		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			firstUuid,
			firstTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName1]: firstPropertyValue1,
				[secondPropertyName1]: secondPropertyValue1
			}
		)

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			secondUuid,
			secondTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName2]: firstPropertyValue2,
				[secondPropertyName2]: secondPropertyValue2
			}
		)

		// Act
		await DataManager.Sync()

		// Assert
		let tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 2)
		assert.equal(tableObjects[0].Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(tableObjects[0].Properties[secondPropertyName1].value, secondPropertyValue1)

		assert.equal(tableObjects[1].Uuid, secondUuid)
		assert.equal(tableObjects[1].TableId, secondTableId)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 2)
		assert.equal(tableObjects[1].Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(tableObjects[1].Properties[secondPropertyName2].value, secondPropertyValue2)
	})

	it("should remove the table objects that are not on the server", async () => {
		// Arrange
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		
		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			firstUuid,
			firstTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName1]: firstPropertyValue1,
				[secondPropertyName1]: secondPropertyValue1
			}
		)

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			secondUuid,
			secondTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName2]: firstPropertyValue2,
				[secondPropertyName2]: secondPropertyValue2
			}
		)

		let localUuid = generateUUID()
		let firstLocalPropertyName = "local1"
		let firstLocalPropertyValue = "Hello World"
		let secondLocalPropertyName = "local2"
		let secondLocalPropertyValue = 1322

		let localTableObject = new TableObject(localUuid)
		localTableObject.TableId = secondTableId
		localTableObject.UploadStatus = TableObjectUploadStatus.UpToDate
		localTableObject.Properties = {
			[firstLocalPropertyName]: { value: firstLocalPropertyValue },
			[secondLocalPropertyName]: { value: secondLocalPropertyValue }
		}

		await DatabaseOperations.SetTableObject(localTableObject)

		// Act
		await DataManager.Sync()

		// Assert
		let tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 2)
		assert.equal(tableObjects[0].Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(tableObjects[0].Properties[secondPropertyName1].value, secondPropertyValue1)

		assert.equal(tableObjects[1].Uuid, secondUuid)
		assert.equal(tableObjects[1].TableId, secondTableId)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 2)
		assert.equal(tableObjects[1].Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(tableObjects[1].Properties[secondPropertyName2].value, secondPropertyValue2)
	})

	it("should update the properties of existing table objects", async () => {
		// Arrange (1)
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		
		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstPropertyValue1Updated = 95034
		let secondPropertyValue1Updated = false

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let firstPropertyValue2Updated = 839.234
		let secondPropertyValue2Updated = true

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			firstUuid,
			firstTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName1]: firstPropertyValue1,
				[secondPropertyName1]: secondPropertyValue1
			}
		)

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			secondUuid,
			secondTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName2]: firstPropertyValue2,
				[secondPropertyName2]: secondPropertyValue2
			}
		)

		// Act (1)
		await DataManager.Sync()

		// Assert (1)
		let tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 2)
		assert.equal(tableObjects[0].Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(tableObjects[0].Properties[secondPropertyName1].value, secondPropertyValue1)

		assert.equal(tableObjects[1].Uuid, secondUuid)
		assert.equal(tableObjects[1].TableId, secondTableId)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 2)
		assert.equal(tableObjects[1].Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(tableObjects[1].Properties[secondPropertyName2].value, secondPropertyValue2)

		// Arrange (2) - Update the table object properties on the server
		AppsController.UpdateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			firstUuid,
			{
				[firstPropertyName1]: firstPropertyValue1Updated,
				[secondPropertyName1]: secondPropertyValue1Updated
			}
		)

		AppsController.UpdateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			secondUuid,
			{
				[firstPropertyName2]: firstPropertyValue2Updated,
				[secondPropertyName2]: secondPropertyValue2Updated
			}
		)

		// Act (2)
		await DataManager.Sync()

		// Assert (2)
		tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 2)
		assert.equal(tableObjects[0].Properties[firstPropertyName1].value, firstPropertyValue1Updated)
		assert.equal(tableObjects[0].Properties[secondPropertyName1].value, secondPropertyValue1Updated)
	})
})

describe("SyncPush function", () => {
	it("should upload new table objects", async () => {
		// Arrange
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())

		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.New
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = TableObjectUploadStatus.New
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject
		])

		// Act
		await DataManager.SyncPush()

		// Assert - The TableObjects should be created on the server and the TableObjects in the database should have UploadStatus = UpToDate
		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstUuid, firstTableId)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondPropertyName1].value, secondPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(secondUuid, secondTableId)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(secondTableObjectFromDatabase.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName2].value, secondPropertyValue2)

		let firstTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, firstUuid)
		assert.equal(200, firstTableObjectFromServerResponse.status)

		let firstTableObjectFromServer = (firstTableObjectFromServerResponse as ApiResponse<TableObject>).data
		assert.equal(firstTableObjectFromServer.Uuid, firstUuid)
		assert.equal(firstTableObjectFromServer.TableId, firstTableId)
		assert.equal(Object.keys(firstTableObjectFromServer.Properties).length, 2)
		assert.equal(firstTableObjectFromServer.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromServer.Properties[secondPropertyName1].value, secondPropertyValue1)

		let secondTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, secondUuid)
		assert.equal(200, secondTableObjectFromServerResponse.status)

		let secondTableObjectFromServer = (secondTableObjectFromServerResponse as ApiResponse<TableObject>).data
		assert.equal(secondTableObjectFromServer.Uuid, secondUuid)
		assert.equal(secondTableObjectFromServer.TableId, secondTableId)
		assert.equal(Object.keys(secondTableObjectFromServer.Properties).length, 2)
		assert.equal(secondTableObjectFromServer.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromServer.Properties[secondPropertyName2].value, secondPropertyValue2)
	})

	it("should upload updated table objects", async () => {
		// Arrange (1) - Create table objects on the server
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())

		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstPropertyValue1Updated = 95034
		let secondPropertyValue1Updated = false

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let firstPropertyValue2Updated = 839.234
		let secondPropertyValue2Updated = true

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			firstUuid,
			firstTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName1]: firstPropertyValue1,
				[secondPropertyName1]: secondPropertyValue1
			}
		)

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			secondUuid,
			secondTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName2]: firstPropertyValue2,
				[secondPropertyName2]: secondPropertyValue2
			}
		)

		await DataManager.Sync()

		// Assert (1)
		let firstTableObjectFromDatabase1 = await DatabaseOperations.GetTableObject(firstUuid, firstTableId)
		assert.isNotNull(firstTableObjectFromDatabase1)
		assert.equal(firstTableObjectFromDatabase1.TableId, firstTableId)
		assert.equal(firstTableObjectFromDatabase1.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(firstTableObjectFromDatabase1.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase1.Properties[secondPropertyName1].value, secondPropertyValue1)

		let secondTableObjectFromDatabase1 = await DatabaseOperations.GetTableObject(secondUuid, secondTableId)
		assert.isNotNull(secondTableObjectFromDatabase1)
		assert.equal(secondTableObjectFromDatabase1.TableId, secondTableId)
		assert.equal(secondTableObjectFromDatabase1.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(secondTableObjectFromDatabase1.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase1.Properties[secondPropertyName2].value, secondPropertyValue2)

		// Arrange (2) - Update the table objects with updated properties and UploadStatus = Updated in the database
		firstTableObjectFromDatabase1.UploadStatus = TableObjectUploadStatus.Updated
		firstTableObjectFromDatabase1.Properties[firstPropertyName1].value = firstPropertyValue1Updated
		firstTableObjectFromDatabase1.Properties[secondPropertyName1].value = secondPropertyValue1Updated

		secondTableObjectFromDatabase1.UploadStatus = TableObjectUploadStatus.Updated
		secondTableObjectFromDatabase1.Properties[firstPropertyName2].value = firstPropertyValue2Updated
		secondTableObjectFromDatabase1.Properties[secondPropertyName2].value = secondPropertyValue2Updated

		await DatabaseOperations.SetTableObjects([
			firstTableObjectFromDatabase1,
			secondTableObjectFromDatabase1
		])

		// Act
		await DataManager.SyncPush()

		// Assert (2) - The TableObjects should be updated on the server and the TableObjects in the database should have UploadStatus = UpToDate
		let firstTableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(firstUuid, firstTableId)
		assert.equal(firstTableObjectFromDatabase2.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(firstTableObjectFromDatabase2.Properties[firstPropertyName1].value, firstPropertyValue1Updated)
		assert.equal(firstTableObjectFromDatabase2.Properties[secondPropertyName1].value, secondPropertyValue1Updated)

		let secondTableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(secondUuid, secondTableId)
		assert.equal(secondTableObjectFromDatabase2.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(secondTableObjectFromDatabase2.Properties[firstPropertyName2].value, firstPropertyValue2Updated)
		assert.equal(secondTableObjectFromDatabase2.Properties[secondPropertyName2].value, secondPropertyValue2Updated)

		let firstTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, firstUuid)
		assert.equal(200, firstTableObjectFromServerResponse.status)

		let firstTableObjectFromServer = (firstTableObjectFromServerResponse as ApiResponse<TableObject>).data
		assert.equal(firstTableObjectFromServer.Uuid, firstUuid)
		assert.equal(firstTableObjectFromServer.TableId, firstTableId)
		assert.equal(Object.keys(firstTableObjectFromServer.Properties).length, 2)
		assert.equal(firstTableObjectFromServer.Properties[firstPropertyName1].value, firstPropertyValue1Updated)
		assert.equal(firstTableObjectFromServer.Properties[secondPropertyName1].value, secondPropertyValue1Updated)

		let secondTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, secondUuid)
		assert.equal(200, secondTableObjectFromServerResponse.status)

		let secondTableObjectFromServer = (secondTableObjectFromServerResponse as ApiResponse<TableObject>).data
		assert.equal(secondTableObjectFromServer.Uuid, secondUuid)
		assert.equal(secondTableObjectFromServer.TableId, secondTableId)
		assert.equal(Object.keys(secondTableObjectFromServer.Properties).length, 2)
		assert.equal(secondTableObjectFromServer.Properties[firstPropertyName2].value, firstPropertyValue2Updated)
		assert.equal(secondTableObjectFromServer.Properties[secondPropertyName2].value, secondPropertyValue2Updated)
	})

	it("should upload deleted table objects", async () => {
		// Arrange (1) - Create table objects on the server
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())

		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			firstUuid,
			firstTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName1]: firstPropertyValue1,
				[secondPropertyName1]: secondPropertyValue1
			}
		)

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			secondUuid,
			secondTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName2]: firstPropertyValue2,
				[secondPropertyName2]: secondPropertyValue2
			}
		)

		await DataManager.Sync()

		// Assert (1)
		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstUuid, firstTableId)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.TableId, firstTableId)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondPropertyName1].value, secondPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(secondUuid, secondTableId)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.TableId, secondTableId)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(secondTableObjectFromDatabase.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName2].value, secondPropertyValue2)

		// Arrange (2) - Update the table objects with UploadStatus = Deleted in the database
		firstTableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Deleted
		secondTableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Deleted

		await DatabaseOperations.SetTableObjects([
			firstTableObjectFromDatabase,
			secondTableObjectFromDatabase
		])

		// Act
		await DataManager.SyncPush()

		// Assert (2) - The TableObjects should be deleted in the database and on the server
		let tableObjectsFromDatabase = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjectsFromDatabase.length, 0)

		let firstTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, firstUuid)
		assert.equal(firstTableObjectFromServerResponse.status, 404)

		let secondTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, secondUuid)
		assert.equal(secondTableObjectFromServerResponse.status, 404)
	})

	it("should upload removed table objects", async () => {
		// Arrange (1)
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())

		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create table objects as testUser on the server
		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.New
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = TableObjectUploadStatus.New
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		await AppsController.CreateTableObject(
			testUserXTestUserJwt,
			firstUuid,
			firstTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName1]: firstPropertyValue1,
				[secondPropertyName1]: secondPropertyValue1
			}
		)

		await AppsController.CreateTableObject(
			testUserXTestUserJwt,
			secondUuid,
			secondTableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName2]: firstPropertyValue2,
				[secondPropertyName2]: secondPropertyValue2
			}
		)

		// Create TableObjectUserAccess as davClassLibraryTestUser
		await AppsController.AddTableObject(davClassLibraryTestUserXTestUserJwt, firstUuid)
		await AppsController.AddTableObject(davClassLibraryTestUserXTestUserJwt, secondUuid)

		// Act (1)
		await DataManager.Sync()

		// Assert (1)
		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstUuid, firstTableId)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.Uuid, firstUuid)
		assert.equal(firstTableObjectFromDatabase.TableId, firstTableId)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondPropertyName1].value, secondPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(secondUuid, secondTableId)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.Uuid, secondUuid)
		assert.equal(secondTableObjectFromDatabase.TableId, secondTableId)
		assert.equal(secondTableObjectFromDatabase.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName2].value, secondPropertyValue2)

		// Arrange (2) - Update the table objects with UploadStatus = Removed in the database
		firstTableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Removed
		secondTableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Removed

		await DatabaseOperations.SetTableObjects([
			firstTableObjectFromDatabase,
			secondTableObjectFromDatabase
		])

		// Act (2)
		await DataManager.SyncPush()

		// Assert (2) - The table objects should be removed from the database and they should exist on the server, but davClassLibraryTestUser should not be able to access them
		let tableObjectsFromDatabase = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjectsFromDatabase.length, 0)

		let firstTableObjectFromServerResponse1 = await AppsController.GetTableObject(testUserXTestUserJwt, firstUuid)
		assert.equal(firstTableObjectFromServerResponse1.status, 200)

		let secondTableObjectFromServerResponse1 = await AppsController.GetTableObject(testUserXTestUserJwt, secondUuid)
		assert.equal(secondTableObjectFromServerResponse1.status, 200)

		let firstTableObjectFromServerResponse2 = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, firstUuid)
		assert.equal(firstTableObjectFromServerResponse2.status, 403)
		
		let secondTableObjectFromServerResponse2 = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, secondUuid)
		assert.equal(secondTableObjectFromServerResponse2.status, 403)
	})

	it("should remove updated table objects that do not exist on the server", async () => {
		// Arrange
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())

		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Updated
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = TableObjectUploadStatus.Updated
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject
		])

		// Act
		await DataManager.SyncPush()

		// Assert - The table objects should be removed
		let tableObjectsFromDatabase = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjectsFromDatabase.length, 0)

		let firstTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, firstUuid)
		assert.equal(firstTableObjectFromServerResponse.status, 404)

		let secondTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, secondUuid)
		assert.equal(secondTableObjectFromServerResponse.status, 404)
	})

	it("should remove deleted table objects that do not exist on the server", async () => {
		// Arrange
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())

		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Deleted
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = TableObjectUploadStatus.Deleted
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject
		])

		// Act
		await DataManager.SyncPush()

		// Assert - The table objects should be removed
		let tableObjectsFromDatabase = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjectsFromDatabase.length, 0)

		let firstTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, firstUuid)
		assert.equal(firstTableObjectFromServerResponse.status, 404)

		let secondTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, secondUuid)
		assert.equal(secondTableObjectFromServerResponse.status, 404)
	})

	it("should remove removed table objects that do not exist on the server", async () => {
		// Arrange
		let createFirstTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		let createSecondTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())

		if (
			createFirstTableResult.status != 201
			|| createSecondTableResult.status != 201
		) {
			assert.fail("Error in creating a test table")
		}

		let firstTableId = (createFirstTableResult as ApiResponse<Table>).data.Id
		let secondTableId = (createSecondTableResult as ApiResponse<Table>).data.Id

		tables.push(firstTableId, secondTableId)

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [firstTableId, secondTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let firstUuid = generateUUID()
		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 1234
		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = true

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Updated
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondUuid = generateUUID()
		let firstPropertyName2 = "test"
		let firstPropertyValue2 = 12.345
		let secondPropertyName2 = "blabla"
		let secondPropertyValue2 = false

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = TableObjectUploadStatus.Updated
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject
		])

		// Act
		await DataManager.SyncPush()

		// Assert - The table objects should be removed
		let tableObjectsFromDatabase = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjectsFromDatabase.length, 0)

		let firstTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, firstUuid)
		assert.equal(firstTableObjectFromServerResponse.status, 404)

		let secondTableObjectFromServerResponse = await AppsController.GetTableObject(davClassLibraryTestUserXTestUserJwt, secondUuid)
		assert.equal(secondTableObjectFromServerResponse.status, 404)
	})
})

describe("DownloadTableObject function", () => {
	it("should download table object", async () => {
		let createTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		if (createTableResult.status != 201) {
			assert.fail("Error in creating a test table")
		}

		let tableId = (createTableResult as ApiResponse<Table>).data.Id
		tables.push(tableId)

		let updateTableObjectCallbackCalled = false

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => {
				updateTableObjectCallbackCalled = true
			},
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a table object on the server
		let uuid = generateUUID()
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 1234

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		await AppsController.CreateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			uuid,
			tableId,
			davClassLibraryTestAppId,
			{
				[firstPropertyName]: firstPropertyValue,
				[secondPropertyName]: secondPropertyValue
			}
		)

		// Act
		await DataManager.DownloadTableObject(uuid)

		// Assert
		assert.isTrue(updateTableObjectCallbackCalled)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
	})
})

describe("UpdateLocalTableObject function", () => {
	it("should update the local table object", async () => {
		// Arrange
		let createTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		if (createTableResult.status != 201) {
			assert.fail("Error in creating a test table")
		}

		let tableId = (createTableResult as ApiResponse<Table>).data.Id
		tables.push(tableId)

		let updateTableObjectCallbackCalled = false

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => {
				updateTableObjectCallbackCalled = true
			},
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a table object in the database and upload it
		let uuid = generateUUID()
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 1234

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		await DatabaseOperations.SetTableObject(tableObject)
		await DataManager.Sync()

		// Assert (1)
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)

		// Update the table object on the server
		let firstPropertyValueUpdated = "Hallo Welt"
		let secondPropertyValueUpdated = 5678

		await AppsController.UpdateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			uuid,
			{
				[firstPropertyName]: firstPropertyValueUpdated,
				[secondPropertyName]: secondPropertyValueUpdated
			}
		)

		// Act
		await DataManager.UpdateLocalTableObject(uuid)

		// Assert (2)
		assert.isTrue(updateTableObjectCallbackCalled)

		let tableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(uuid)
		assert.isNotNull(tableObjectFromDatabase2)
		assert.equal(tableObjectFromDatabase2.Uuid, uuid)
		assert.equal(tableObjectFromDatabase2.TableId, tableId)
		assert.equal(tableObjectFromDatabase2.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(Object.keys(tableObjectFromDatabase2.Properties).length, 2)
		assert.equal(tableObjectFromDatabase2.Properties[firstPropertyName].value, firstPropertyValueUpdated)
		assert.equal(tableObjectFromDatabase2.Properties[secondPropertyName].value, secondPropertyValueUpdated)
	})

	it("should update the local table object without removing local properties", async () => {
		// Arrange
		let createTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		if (createTableResult.status != 201) {
			assert.fail("Error in creating a test table")
		}

		let tableId = (createTableResult as ApiResponse<Table>).data.Id
		tables.push(tableId)

		let updateTableObjectCallbackCalled = false

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => {
				updateTableObjectCallbackCalled = true
			},
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a table object with local properties in the database and upload it
		let uuid = generateUUID()
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 1234
		let firstLocalPropertyName = "local1"
		let firstLocalPropertyValue = 123
		let secondLocalPropertyName = "local2"
		let secondLocalPropertyValue = false

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue },
			[firstLocalPropertyName]: { value: firstLocalPropertyValue },
			[secondLocalPropertyName]: { value: secondLocalPropertyValue }
		}

		await DatabaseOperations.SetTableObject(tableObject)
		await DataManager.Sync()

		// Assert (1)
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 4)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[firstLocalPropertyName].value, firstLocalPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondLocalPropertyName].value, secondLocalPropertyValue)

		// Update the table object on the server
		let firstPropertyValueUpdated = "Hallo Welt"
		let secondPropertyValueUpdated = 5678

		await AppsController.UpdateTableObject(
			davClassLibraryTestUserXTestUserJwt,
			uuid,
			{
				[firstPropertyName]: firstPropertyValueUpdated,
				[secondPropertyName]: secondPropertyValueUpdated
			}
		)

		// Act
		await DataManager.UpdateLocalTableObject(uuid)

		// Assert (2)
		assert.isTrue(updateTableObjectCallbackCalled)

		let tableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(uuid)
		assert.isNotNull(tableObjectFromDatabase2)
		assert.equal(tableObjectFromDatabase2.Uuid, uuid)
		assert.equal(tableObjectFromDatabase2.TableId, tableId)
		assert.equal(tableObjectFromDatabase2.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(Object.keys(tableObjectFromDatabase2.Properties).length, 4)
		assert.equal(tableObjectFromDatabase2.Properties[firstPropertyName].value, firstPropertyValueUpdated)
		assert.equal(tableObjectFromDatabase2.Properties[secondPropertyName].value, secondPropertyValueUpdated)
		assert.equal(tableObjectFromDatabase2.Properties[firstLocalPropertyName].value, firstLocalPropertyValue)
		assert.equal(tableObjectFromDatabase2.Properties[secondLocalPropertyName].value, secondLocalPropertyValue)
	})
})

describe("DeleteLocalTableObject function", () => {
	it("should remove the table object from the database", async () => {
		// Arrange
		let createTableResult = await AppsController.CreateTable(testUserXTestUserJwt, davClassLibraryTestAppId, generateUUID())
		if (createTableResult.status != 201) {
			assert.fail("Error in creating a test table")
		}

		let tableId = (createTableResult as ApiResponse<Table>).data.Id
		tables.push(tableId)

		let deleteTableObjectCallbackCalled = false

		Init(DavEnvironment.Test, davClassLibraryTestAppId, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => {
				deleteTableObjectCallbackCalled = true
			},
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a table object in the database and upload it
		let uuid = generateUUID()
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 1234

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.UploadStatus = TableObjectUploadStatus.UpToDate
		tableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Assert (1)
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)

		// Act
		await DataManager.DeleteLocalTableObject(uuid)

		// Assert
		assert.isTrue(deleteTableObjectCallbackCalled)

		let tableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(uuid)
		assert.isNull(tableObjectFromDatabase2)
	})
})

describe("UnsubscribePushNotifications function", () => {
	it("should delete the subscription locally and on the server", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt
		let uuid = generateUUID()

		// Create the subscription
		await DatabaseOperations.SetSubscription({
			uuid,
			endpoint: "https://example.com/",
			p256dh: "blablabla",
			auth: "asdaosdasdj",
			status: DataManager.UploadStatus.New
		})

		// Upload the subscription to the server
		await DataManager.UpdateSubscriptionOnServer()

		// Act
		await DataManager.UnsubscribePushNotifications()

		// Assert
		// The subscription should be deleted locally and on the server
		let subscriptionFromDatabase = await DatabaseOperations.GetSubscription()
		assert.isNull(subscriptionFromDatabase)

		let subscriptionFromServer = await AppsController.GetSubscription(davClassLibraryTestUserXTestUserJwt, uuid)
		assert.isNull(subscriptionFromServer)
	})
})

describe("CreateNotification function", () => {
	it("should save the notification in the database", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let time = new Date().getTime() / 1000
		let interval = 5000
		let properties = {
			title: "Hello World",
			message: "You have a new notification"
		}

		// Act
		let uuid = await DataManager.CreateNotification(time, interval, properties)

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		assert.isNotNull(notificationFromDatabase)
		assert.equal(time, notificationFromDatabase.Time)
		assert.equal(interval, notificationFromDatabase.Interval)
		assert.equal(properties.title, notificationFromDatabase.Properties["title"])
		assert.equal(properties.message, notificationFromDatabase.Properties["message"])

		// Delete the notification on the server
		await AppsController.DeleteNotification(davClassLibraryTestUserXTestUserJwt, uuid)
	})

	it("should not save the notification if the user is not logged in", async () => {
		// Arrange
		let time = new Date().getTime() / 1000
		let interval = 5000
		let properties = {
			title: "Hello World",
			message: "You have a new notification"
		}

		// Act
		let uuid = await DataManager.CreateNotification(time, interval, properties)

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		assert.isNull(notificationFromDatabase)
	})
})

describe("GetNotification function", () => {
	it("should return the values of the notification", async () => {
		// Arrange
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a notification
		let uuid = generateUUID()
		let time = 12312312
		let interval = 12321
		let properties = {
			title: "Hello World",
			message: "This is a test notification"
		}
		let notification = new Notification(time, interval, properties, uuid, DataManager.UploadStatus.UpToDate)
		await notification.Save()

		// Act
		let notificationFromDatabase = await DataManager.GetNotification(uuid)

		// Assert
		assert.equal(time, notificationFromDatabase.time)
		assert.equal(interval, notificationFromDatabase.interval);
		assert.equal(properties.title, notificationFromDatabase.properties["title"])
		assert.equal(properties.message, notificationFromDatabase.properties["message"])
	})

	it("should return null if the notification does not exist", async () => {
		// Arrange
		let uuid = generateUUID()

		// Act
		let notificationFromDatabase = await DataManager.GetNotification(uuid)

		// Assert
		assert.isNull(notificationFromDatabase)
	})
})

describe("UpdateNotification function", () => {
	it("should update the notification in the database", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a notification
		let uuid = generateUUID()
		let newTime = 1231262343
		let newInterval = 123123
		let newProperties = {
			title: "new title",
			message: "new message"
		}
		let notification = new Notification(12312667, 12, { title: "test", message: "test" }, uuid, DataManager.UploadStatus.New)
		await notification.Save()

		// Act
		await DataManager.UpdateNotification(uuid, newTime, newInterval, newProperties)

		// Assert
		// The notification should have the new values in the database
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		assert.equal(newTime, notificationFromDatabase.Time)
		assert.equal(newInterval, notificationFromDatabase.Interval)
		assert.equal(newProperties.title, notificationFromDatabase.Properties["title"])
		assert.equal(newProperties.message, notificationFromDatabase.Properties["message"])

		// Tidy up
		// Delete the notification on the server
		await AppsController.DeleteNotification(davClassLibraryTestUserXTestUserJwt, uuid)
	})
})

describe("DeleteNotification function", () => {
	it("should remove the notification from the database", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create the notification
		let time = new Date().getTime() / 1000
		let interval = 5000
		let properties = {
			title: "Hello World",
			message: "You have a new notification"
		}

		let notification = new Notification(time, interval, properties, null, DataManager.UploadStatus.New)
		await notification.Save()

		// Act
		await DataManager.DeleteNotification(notification.Uuid)

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(notification.Uuid)
		assert.isNull(notificationFromDatabase)
	})
})

describe("DeleteNotificationImmediately function", () => {
	it("should remove the notification from the database", async () => {
		// Arrange
		let uuid = generateUUID()
		let notification = new Notification(123123, 3600, { title: "test" }, uuid)
		await notification.Save()

		// Make sure the notification was saved
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		assert.isNotNull(notificationFromDatabase)

		// Act
		await DataManager.DeleteNotificationImmediately(uuid)

		// Assert
		let notificationFromDatabase2 = await DatabaseOperations.GetNotification(uuid)
		assert.isNull(notificationFromDatabase2)
	});
});

describe("SyncNotifications function", () => {
	it("should download all notifications from the server", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Act
		await DataManager.SyncNotifications()

		// Assert
		let notifications = await DatabaseOperations.GetAllNotifications()
		assert.equal(notifications.length, 2)

		assert.equal(notifications[0].Uuid, firstTestNotification.Uuid)
		assert.equal(notifications[0].Time, firstTestNotification.Time)
		assert.equal(notifications[0].Interval, firstTestNotification.Interval)
		assert.equal(notifications[0].Properties[firstNotificationPropertyName], firstTestNotification.Properties[firstNotificationPropertyName])
		assert.equal(notifications[0].Properties[secondNotificationPropertyName], firstTestNotification.Properties[secondNotificationPropertyName])

		assert.equal(notifications[1].Uuid, secondTestNotification.Uuid)
		assert.equal(notifications[1].Time, secondTestNotification.Time)
		assert.equal(notifications[1].Interval, secondTestNotification.Interval)
		assert.equal(notifications[1].Properties[firstNotificationPropertyName], secondTestNotification.Properties[firstNotificationPropertyName])
		assert.equal(notifications[1].Properties[secondNotificationPropertyName], secondTestNotification.Properties[secondNotificationPropertyName])
	})

	it("should remove the notifications that are not on the server", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a notification locally
		let deletedNotificationUuid = generateUUID()
		let deletedNotification = new Notification(123123, 30000, {
			title: "test",
			message: "testtest"
		}, deletedNotificationUuid, DataManager.UploadStatus.UpToDate)
		await deletedNotification.Save()

		// Act
		await DataManager.SyncNotifications()

		// Assert
		let deletedNotificationFromDatabase = await DatabaseOperations.GetNotification(deletedNotificationUuid)
		assert.isNull(deletedNotificationFromDatabase)

		let notifications = await DatabaseOperations.GetAllNotifications()
		assert.equal(notifications.length, 2)

		assert.equal(notifications[0].Uuid, firstTestNotification.Uuid)
		assert.equal(notifications[0].Time, firstTestNotification.Time)
		assert.equal(notifications[0].Interval, firstTestNotification.Interval)
		assert.equal(notifications[0].Properties[firstNotificationPropertyName], firstTestNotification.Properties[firstNotificationPropertyName])
		assert.equal(notifications[0].Properties[secondNotificationPropertyName], firstTestNotification.Properties[secondNotificationPropertyName])

		assert.equal(notifications[1].Uuid, secondTestNotification.Uuid)
		assert.equal(notifications[1].Time, secondTestNotification.Time)
		assert.equal(notifications[1].Interval, secondTestNotification.Interval)
		assert.equal(notifications[1].Properties[firstNotificationPropertyName], secondTestNotification.Properties[firstNotificationPropertyName])
		assert.equal(notifications[1].Properties[secondNotificationPropertyName], secondTestNotification.Properties[secondNotificationPropertyName])
	})
})

describe("SyncPushNotifications function", () => {
	it("should upload created notifications", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let uuid = generateUUID()
		let time = 123123
		let interval = 6000
		let firstPropertyValue = "Hello World"
		let secondPropertyValue = "This is a test notification"

		let notification = new Notification(time, interval, {
			title: firstPropertyValue,
			message: secondPropertyValue
		}, uuid, DataManager.UploadStatus.New)
		await notification.Save()

		// Act
		await DataManager.SyncPushNotifications()

		// Assert
		// Get the notification from the server
		let response = await AppsController.GetNotification(davClassLibraryTestUserXTestUserJwt, uuid)
		assert.equal(200, response.status)
		assert.isNotNull((response as ApiResponse<Notification>).data)
		let notificationFromServer = (response as ApiResponse<Notification>).data
		assert.isNotNull(notificationFromServer)
		assert.equal(notificationFromServer.Time, time)
		assert.equal(notificationFromServer.Interval, interval)
		assert.equal(notificationFromServer.Properties["title"], firstPropertyValue)
		assert.equal(notificationFromServer.Properties["message"], secondPropertyValue)

		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		assert.equal(notificationFromDatabase.Status, DataManager.UploadStatus.UpToDate)

		// Tidy up
		await AppsController.DeleteNotification(davClassLibraryTestUserXTestUserJwt, uuid)
	})

	it("should upload updated notifications", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let newTime = 1123213
		let newInterval = 21312
		let newProperties = {
			title: "New title",
			message: "New message"
		}

		// Download all notifications
		await DataManager.SyncNotifications()

		// Update one existing notification
		let notification = await DatabaseOperations.GetNotification(firstTestNotification.Uuid)
		notification.Time = newTime
		notification.Interval = newInterval
		notification.Properties = newProperties
		notification.Status = DataManager.UploadStatus.Updated
		await notification.Save()

		// Act
		await DataManager.SyncPushNotifications()

		// Assert
		// The local notification should be updated and the status should be UpToDate
		let notificationFromDatabase = await DatabaseOperations.GetNotification(firstTestNotification.Uuid)
		assert.equal(notificationFromDatabase.Time, newTime)
		assert.equal(notificationFromDatabase.Interval, newInterval)
		assert.equal(notificationFromDatabase.Properties["title"], newProperties.title)
		assert.equal(notificationFromDatabase.Properties["message"], newProperties.message)
		assert.equal(notificationFromDatabase.Status, DataManager.UploadStatus.UpToDate)

		// The notification on the server should be updated
		let response = await AppsController.GetNotification(davClassLibraryTestUserXTestUserJwt, firstTestNotification.Uuid)
		assert.equal(200, response.status)
		assert.isNotNull((response as ApiResponse<Notification>).data)
		let notificationFromServer = (response as ApiResponse<Notification>).data
		assert.equal(notificationFromServer.Time, newTime)
		assert.equal(notificationFromServer.Interval, newInterval)
		assert.equal(notificationFromServer.Properties["title"], newProperties.title)
		assert.equal(notificationFromServer.Properties["message"], newProperties.message)

		// Tidy up
		notificationFromDatabase.Time = firstTestNotification.Time
		notificationFromDatabase.Interval = firstTestNotification.Interval
		notificationFromDatabase.Properties = firstTestNotification.Properties
		notificationFromDatabase.Status = DataManager.UploadStatus.Updated
		await notificationFromDatabase.Save()
		await DataManager.SyncPushNotifications()
	})

	it("should upload deleted notifications", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a notification and save in on the server
		let uuid = generateUUID()
		let notification = new Notification(1212121, 5000, {
			title: "Hello World",
			message: "This is a test notification"
		}, uuid, DataManager.UploadStatus.New)
		await notification.Save()
		await DataManager.SyncPushNotifications()

		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		notificationFromDatabase.Status = DataManager.UploadStatus.Deleted
		await notificationFromDatabase.Save()

		// Act
		await DataManager.SyncPushNotifications()

		// Assert
		// The notification should be deleted on the server and locally
		let notificationFromDatabase2 = await DatabaseOperations.GetNotification(uuid)
		assert.isNull(notificationFromDatabase2)

		let response = await AppsController.GetNotification(davClassLibraryTestUserXTestUserJwt, uuid)
		assert.equal(404, response.status)
	})

	it("should delete updated notification that do not exist on the server", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a notification with Status = Updated
		let uuid = generateUUID()
		let notification = new Notification(112312, 232, { title: "test" }, uuid, DataManager.UploadStatus.Updated)
		await notification.Save()

		// Act
		await DataManager.SyncPushNotifications()

		// Assert
		// The notification should be deleted
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		assert.isNull(notificationFromDatabase)
	})

	it("should delete deleted notifications that do not exist on the server", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Create a notification with Status = Deleted
		let uuid = generateUUID()
		let notification = new Notification(1212121, 5000, {
			title: "Hello World",
			message: "This is a test notification"
		}, uuid, DataManager.UploadStatus.Deleted)
		await notification.Save()

		// Act
		await DataManager.SyncPushNotifications()

		// Assert
		// The notification should be deleted locally
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		assert.isNull(notificationFromDatabase)
	})
})

describe("SortTableIds function", () => {
	it("should return the correct array when there are no parallel table ids", () => {
      /*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:    
            pages:               2, 2, 2, 2

         Output:
            [1, 1, 2, 2, 3, 3, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = []
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 2)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 1, 2, 2, 3, 3, 4, 4], sortedTableIds)
	})

	it("should return the correct array when there is one parallel table id", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:    	2
            pages:               2, 2, 2, 2

         Output:
            [1, 1, 2, 2, 3, 3, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [2]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 2)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 1, 2, 2, 3, 3, 4, 4], sortedTableIds)
	})

	it("should return the correct array when the parallel table ids are side by side", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:    	2, 3
            pages:               2, 2, 2, 2

         Output:
            [1, 1, 2, 3, 2, 3, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [2, 3]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 2)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 1, 2, 3, 2, 3, 4, 4], sortedTableIds)
	})

	it("should return the correct array when the parallel table ids are not side by side", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1,			4
            pages:               2, 2, 2, 2

         Output:
            [1, 2, 2, 3, 3, 4, 1, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [1, 4]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 2)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 2, 2, 3, 3, 4, 1, 4], sortedTableIds)
	})

	it("should return the correct array when there are different pages and the parallel table ids are not side by side", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1,			4
            pages:               3, 1, 2, 4

         Output:
            [1, 2, 3, 3, 4, 1, 4, 1, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [1, 4]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 3)
		tableIdPages.set(2, 1)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 4)

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 2, 3, 3, 4, 1, 4, 1, 4, 4], sortedTableIds)
	})

	it("should return the correct array when there are different pages and the parallel table ids are side by side", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1, 2
            pages:               2, 4, 3, 2

         Output:
            [1, 2, 1, 2, 2, 2, 3, 3, 3, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [1, 2]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 4)
		tableIdPages.set(3, 3)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 2, 1, 2, 2, 2, 3, 3, 3, 4, 4], sortedTableIds)
	})
})