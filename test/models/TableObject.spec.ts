import 'mocha'
import { assert } from 'chai'
import * as localforage from 'localforage'
import { Environment, TableObjectUploadStatus } from '../../lib/types'
import { testerXTestAppAccessToken } from '../constants'
import { Dav } from '../../lib/Dav'
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations'
import { TableObject } from '../../lib/models/TableObject'

beforeEach(async () => {
	// Reset global variables
	Dav.environment = Environment.Test
	Dav.skipSyncPushInTests = true
	Dav.isLoggedIn = false
	Dav.accessToken = null

	// Clear the database
	await localforage.clear()
})

describe("Constructor", () => {
	it("should assign all given properties", () => {
		// Arrange
		const uuid = "78a5a7a4-2f3f-47c3-8d6f-a8e63182f92a"
		const tableId = 123
		let isFile = true
		let firstPropertyName = "firstProperty"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "secondProperty"
		let secondPropertyValue = "Hallo Welt"
		let properties = {
			[firstPropertyName]: {
				value: firstPropertyValue
			},
			[secondPropertyName]: {
				value: secondPropertyValue
			}
		}
		let uploadStatus = TableObjectUploadStatus.Updated
		let etag = "siodgjiosgdhiosgsghiod"
		let belongsToUser = false
		let purchase = "oasidhasidashd"
		
		// Act
		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			IsFile: isFile,
			Properties: properties,
			UploadStatus: uploadStatus,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase
		})

		// Assert
		assert.equal(tableObject.Uuid, uuid)
		assert.equal(tableObject.TableId, tableId)
		assert.equal(tableObject.IsFile, isFile)
		assert.equal(tableObject.UploadStatus, uploadStatus)
		assert.equal(tableObject.Etag, etag)
		assert.equal(tableObject.BelongsToUser, belongsToUser)
		assert.equal(tableObject.Purchase, purchase)
		assert.equal(tableObject.GetPropertyValue(firstPropertyName), firstPropertyValue)
		assert.equal(tableObject.GetPropertyValue(secondPropertyName), secondPropertyValue)
	})

	it("should set default values for optional properties", () => {
		// Act
		let tableObject = new TableObject()

		// Assert
		assert.isNotNull(tableObject.Uuid)
		assert.equal(tableObject.TableId, 0)
		assert.isFalse(tableObject.IsFile)
		assert.isUndefined(tableObject.File)
		assert.equal(Object.keys(tableObject.Properties).length, 0)
		assert.equal(tableObject.UploadStatus, TableObjectUploadStatus.New)
		assert.isUndefined(tableObject.Etag)
		assert.isTrue(tableObject.BelongsToUser)
		assert.isUndefined(tableObject.Purchase)
	})
})

describe("SetUploadStatus function", () => {
	it("should set the UploadStatus of the table object and save it in the database", async () => {
		// Arrange
		let newUploadStatus = TableObjectUploadStatus.Removed

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.UploadStatus = TableObjectUploadStatus.New

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetUploadStatus(newUploadStatus)

		// Assert
		assert.equal(tableObject.UploadStatus, newUploadStatus)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.UploadStatus, newUploadStatus)
	})
})

describe("SetEtag function", () => {
	it("should set the Etag of the table object and save it in the database", async () => {
		// Arrange
		let newEtag = "asdasdasd"

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Etag = "testtest"

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetEtag(newEtag)

		// Assert
		assert.equal(tableObject.Etag, newEtag)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Etag, newEtag)
	})
})

describe("SetPropertyValue function", () => {
	it("should set the property value of the table object and save it in the database if the property does not exist", async () => {
		// Arrange
		let propertyName = "test"
		let propertyValue = "Lorem ipsum"

		let tableObject = new TableObject()
		tableObject.TableId = 13

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValue({
			name: propertyName,
			value: propertyValue
		})

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.equal(tableObject.Properties[propertyName].value, propertyValue)
		assert.isUndefined(tableObject.Properties[propertyName].local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].value, propertyValue)
		assert.isUndefined(tableObjectFromDatabase.Properties[propertyName].local)
	})

	it("should set the property value of the table object with different value types and save it in the database if the property does not exist", async () => {
		// Arrange
		let propertyName = "test"
		let propertyValue = 123

		let tableObject = new TableObject()
		tableObject.TableId = 13

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValue({
			name: propertyName,
			value: propertyValue
		})

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.equal(tableObject.Properties[propertyName].value, propertyValue)
		assert.isUndefined(tableObject.Properties[propertyName].local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].value, propertyValue)
		assert.isUndefined(tableObjectFromDatabase.Properties[propertyName].local)
	})

	it("should set the property value of the table object and save it in the database if the property already exists", async () => {
		// Arrange
		let propertyName = "test"
		let propertyValue = "Lorem ipsum"

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[propertyName]: { value: "Hello World" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValue({
			name: propertyName,
			value: propertyValue
		})

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.equal(tableObject.Properties[propertyName].value, propertyValue)
		assert.isUndefined(tableObject.Properties[propertyName].local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].value, propertyValue)
		assert.isUndefined(tableObjectFromDatabase.Properties[propertyName].local)
	})

	it("should set the property value of the table object with different value types and save it in the database if the property already exists", async () => {
		// Arrange
		let propertyName = "test"
		let propertyValue = true

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[propertyName]: { value: false }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValue({
			name: propertyName,
			value: propertyValue
		})

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.equal(tableObject.Properties[propertyName].value, propertyValue)
		assert.isUndefined(tableObject.Properties[propertyName].local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].value, propertyValue)
		assert.isUndefined(tableObjectFromDatabase.Properties[propertyName].local)
	})

	it("should set the property value of the table object with options and save it in the database if the property does not exist", async () => {
		// Arrange
		let propertyName = "test"
		let propertyValue = "Hello World"
		let local = true

		let tableObject = new TableObject()
		tableObject.TableId = 13

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValue({
			name: propertyName,
			value: propertyValue,
			options: {
				local
			}
		})

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.equal(tableObject.Properties[propertyName].value, propertyValue)
		assert.equal(tableObject.Properties[propertyName].local, local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].value, propertyValue)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].local, local)
	})

	it("should set the property value of the table object with options and with different value types and save it in the database if the property does not exist", async () => {
		// Arrange
		let propertyName = "test"
		let propertyValue = 8264
		let local = true

		let tableObject = new TableObject()
		tableObject.TableId = 13

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValue({
			name: propertyName,
			value: propertyValue,
			options: {
				local
			}
		})

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.equal(tableObject.Properties[propertyName].value, propertyValue)
		assert.equal(tableObject.Properties[propertyName].local, local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].value, propertyValue)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].local, local)
	})

	it("should set the property value of the table object with options and save it in the database if the property already exists", async () => {
		// Arrange
		let propertyName = "test"
		let propertyValue = "Lorem ipsum"
		let local = true

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[propertyName]: { value: "Hello World", local: !local }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValue({
			name: propertyName,
			value: propertyValue,
			options: {
				local
			}
		})

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.equal(tableObject.Properties[propertyName].value, propertyValue)
		assert.equal(tableObject.Properties[propertyName].local, local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].value, propertyValue)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].local, local)
	})

	it("should set the property value of the table object with options and with different value types and save it in the database if the property already exists", async () => {
		// Arrange
		let propertyName = "test"
		let propertyValue = false
		let local = true

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[propertyName]: { value: true, local: !local }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValue({
			name: propertyName,
			value: propertyValue,
			options: {
				local
			}
		})

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.equal(tableObject.Properties[propertyName].value, propertyValue)
		assert.equal(tableObject.Properties[propertyName].local, local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].value, propertyValue)
		assert.equal(tableObjectFromDatabase.Properties[propertyName].local, local)
	})
})

describe("SetPropertyValues function", () => {
	it("should set the property values of the table object and save it in the database if the properties do not exist", async () => {
		// Arrange
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Hallo Welt"
		let thirdPropertyName = "page3"
		let thirdPropertyValue = "Bonjour le monde"

		let tableObject = new TableObject()
		tableObject.TableId = 13

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValues([
			{
				name: firstPropertyName,
				value: firstPropertyValue
			},
			{
				name: secondPropertyName,
				value: secondPropertyValue
			},
			{
				name: thirdPropertyName,
				value: thirdPropertyValue
			}
		])

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 3)
		assert.equal(tableObject.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObject.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObject.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.isUndefined(tableObject.Properties[firstPropertyName].local)
		assert.isUndefined(tableObject.Properties[secondPropertyName].local)
		assert.isUndefined(tableObject.Properties[thirdPropertyName].local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 3)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.isUndefined(tableObjectFromDatabase.Properties[firstPropertyName].local)
		assert.isUndefined(tableObjectFromDatabase.Properties[secondPropertyName].local)
		assert.isUndefined(tableObjectFromDatabase.Properties[thirdPropertyName].local)
	})

	it("should set the property values of the table object with different value types and save it in the database if the properties do not exist", async () => {
		// Arrange
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 123
		let thirdPropertyName = "page3"
		let thirdPropertyValue = false

		let tableObject = new TableObject()
		tableObject.TableId = 13

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValues([
			{
				name: firstPropertyName,
				value: firstPropertyValue
			},
			{
				name: secondPropertyName,
				value: secondPropertyValue
			},
			{
				name: thirdPropertyName,
				value: thirdPropertyValue
			}
		])

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 3)
		assert.equal(tableObject.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObject.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObject.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.isUndefined(tableObject.Properties[firstPropertyName].local)
		assert.isUndefined(tableObject.Properties[secondPropertyName].local)
		assert.isUndefined(tableObject.Properties[thirdPropertyName].local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 3)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.isUndefined(tableObjectFromDatabase.Properties[firstPropertyName].local)
		assert.isUndefined(tableObjectFromDatabase.Properties[secondPropertyName].local)
		assert.isUndefined(tableObjectFromDatabase.Properties[thirdPropertyName].local)
	})

	it("should set the property values of the table object and save it in the database if the properties already exist", async () => {
		// Arrange
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Hallo Welt"
		let thirdPropertyName = "page3"
		let thirdPropertyValue = "Bonjour le monde"

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[firstPropertyName]: { value: "test test" },
			[secondPropertyName]: { value: "bla bla" },
			[thirdPropertyName]: { value: "Lorem ipsum" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValues([
			{
				name: firstPropertyName,
				value: firstPropertyValue
			},
			{
				name: secondPropertyName,
				value: secondPropertyValue
			},
			{
				name: thirdPropertyName,
				value: thirdPropertyValue
			}
		])

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 3)
		assert.equal(tableObject.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObject.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObject.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.isUndefined(tableObject.Properties[firstPropertyName].local)
		assert.isUndefined(tableObject.Properties[secondPropertyName].local)
		assert.isUndefined(tableObject.Properties[thirdPropertyName].local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 3)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.isUndefined(tableObjectFromDatabase.Properties[firstPropertyName].local)
		assert.isUndefined(tableObjectFromDatabase.Properties[secondPropertyName].local)
		assert.isUndefined(tableObjectFromDatabase.Properties[thirdPropertyName].local)
	})

	it("should set the property value of the table object with different value types and save it in the database if the properties already exist", async () => {
		// Arrange
		let firstPropertyName = "page1"
		let firstPropertyValue = 123
		let secondPropertyName = "page2"
		let secondPropertyValue = true
		let thirdPropertyName = "page3"
		let thirdPropertyValue = "Bonjour le monde"

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[firstPropertyName]: { value: 93753 },
			[secondPropertyName]: { value: false },
			[thirdPropertyName]: { value: "Lorem ipsum" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValues([
			{
				name: firstPropertyName,
				value: firstPropertyValue
			},
			{
				name: secondPropertyName,
				value: secondPropertyValue
			},
			{
				name: thirdPropertyName,
				value: thirdPropertyValue
			}
		])

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 3)
		assert.equal(tableObject.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObject.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObject.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.isUndefined(tableObject.Properties[firstPropertyName].local)
		assert.isUndefined(tableObject.Properties[secondPropertyName].local)
		assert.isUndefined(tableObject.Properties[thirdPropertyName].local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 3)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.isUndefined(tableObjectFromDatabase.Properties[firstPropertyName].local)
		assert.isUndefined(tableObjectFromDatabase.Properties[secondPropertyName].local)
		assert.isUndefined(tableObjectFromDatabase.Properties[thirdPropertyName].local)
	})

	it("should set the property values of the table object with options and save it in the database if the properties do not exist", async () => {
		// Arrange
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Hallo Welt"
		let thirdPropertyName = "page3"
		let thirdPropertyValue = "Bonjour le monde"
		let local = true

		let tableObject = new TableObject()
		tableObject.TableId = 13

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValues([
			{
				name: firstPropertyName,
				value: firstPropertyValue,
				options: {
					local
				}
			},
			{
				name: secondPropertyName,
				value: secondPropertyValue,
				options: {
					local
				}
			},
			{
				name: thirdPropertyName,
				value: thirdPropertyValue,
				options: {
					local
				}
			}
		])

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 3)
		assert.equal(tableObject.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObject.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObject.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.equal(tableObject.Properties[firstPropertyName].local, local)
		assert.equal(tableObject.Properties[secondPropertyName].local, local)
		assert.equal(tableObject.Properties[thirdPropertyName].local, local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 3)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].local, local)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].local, local)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].local, local)
	})

	it("should set the property value of the table object with options and with different value types and save it in the database if the properties do not exist", async () => {
		// Arrange
		let firstPropertyName = "page1"
		let firstPropertyValue = 38382.23
		let secondPropertyName = "page2"
		let secondPropertyValue = "Hallo Welt"
		let thirdPropertyName = "page3"
		let thirdPropertyValue = false
		let local = true

		let tableObject = new TableObject()
		tableObject.TableId = 13

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValues([
			{
				name: firstPropertyName,
				value: firstPropertyValue,
				options: {
					local
				}
			},
			{
				name: secondPropertyName,
				value: secondPropertyValue,
				options: {
					local
				}
			},
			{
				name: thirdPropertyName,
				value: thirdPropertyValue,
				options: {
					local
				}
			}
		])

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 3)
		assert.equal(tableObject.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObject.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObject.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.equal(tableObject.Properties[firstPropertyName].local, local)
		assert.equal(tableObject.Properties[secondPropertyName].local, local)
		assert.equal(tableObject.Properties[thirdPropertyName].local, local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 3)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].local, local)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].local, local)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].local, local)
	})

	it("should set the property values of the table object with options and save it in the database if the properties already exist", async () => {
		// Arrange
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Hallo Welt"
		let thirdPropertyName = "page3"
		let thirdPropertyValue = "Bonjour le monde"
		let local = true

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[firstPropertyName]: { value: "test test", local: !local },
			[secondPropertyName]: { value: "bla bla", local: !local },
			[thirdPropertyName]: { value: "Lorem ipsum", local: !local }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValues([
			{
				name: firstPropertyName,
				value: firstPropertyValue,
				options: {
					local
				}
			},
			{
				name: secondPropertyName,
				value: secondPropertyValue,
				options: {
					local
				}
			},
			{
				name: thirdPropertyName,
				value: thirdPropertyValue,
				options: {
					local
				}
			}
		])

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 3)
		assert.equal(tableObject.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObject.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObject.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.equal(tableObject.Properties[firstPropertyName].local, local)
		assert.equal(tableObject.Properties[secondPropertyName].local, local)
		assert.equal(tableObject.Properties[thirdPropertyName].local, local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 3)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].local, local)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].local, local)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].local, local)
	})

	it("should set the property value of the table object with options and with different value types and save it in the database if the properties already exist", async () => {
		// Arrange
		let firstPropertyName = "page1"
		let firstPropertyValue = 123.456
		let secondPropertyName = "page2"
		let secondPropertyValue = true
		let thirdPropertyName = "page3"
		let thirdPropertyValue = "Bonjour le monde"
		let local = true

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[firstPropertyName]: { value: 789.123, local: !local },
			[secondPropertyName]: { value: false, local: !local },
			[thirdPropertyName]: { value: "Lorem ipsum", local: !local }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.SetPropertyValues([
			{
				name: firstPropertyName,
				value: firstPropertyValue,
				options: {
					local
				}
			},
			{
				name: secondPropertyName,
				value: secondPropertyValue,
				options: {
					local
				}
			},
			{
				name: thirdPropertyName,
				value: thirdPropertyValue,
				options: {
					local
				}
			}
		])

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 3)
		assert.equal(tableObject.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObject.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObject.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.equal(tableObject.Properties[firstPropertyName].local, local)
		assert.equal(tableObject.Properties[secondPropertyName].local, local)
		assert.equal(tableObject.Properties[thirdPropertyName].local, local)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 3)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].local, local)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].local, local)
		assert.equal(tableObjectFromDatabase.Properties[thirdPropertyName].local, local)
	})
})

describe("GetPropertyValue function", () => {
	it("should return the value of the property", () => {
		// Arrange
		let propertyName = "page1"
		let propertyValue = "Hello World"

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[propertyName]: { value: propertyValue }
		}

		// Act
		let value = tableObject.GetPropertyValue(propertyName)

		// Assert
		assert.equal(value, propertyValue)
	})

	it("should return null if the property does not exist", () => {
		// Arrange
		var tableObject = new TableObject();

		// Act
		var value = tableObject.GetPropertyValue("page1");

		// Assert
		assert.isNull(value);
	})
})

describe("RemoveProperty function", () => {
	it("should remove the property of the table object and save it in the database", async () => {
		// Arrange
		let propertyName = "test"

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[propertyName]: { value: "Hello World" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.RemoveProperty(propertyName)

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 0)
		assert.isUndefined(tableObject.Properties[propertyName])

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 0)
		assert.isUndefined(tableObjectFromDatabase.Properties[propertyName])
	})

	it("should set the value of the property to null and save it in the database if the user is logged in", async () => {
		// Arrange
		Dav.isLoggedIn = true
		Dav.accessToken = testerXTestAppAccessToken

		let propertyName = "test"

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[propertyName]: { value: "Hello World" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.RemoveProperty(propertyName)

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 1)
		assert.isNull(tableObject.Properties[propertyName].value)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.isNull(tableObjectFromDatabase.Properties[propertyName].value)
	})

	it("should remove the property of the table object and save it in the database if the user is logged in and the property is local", async () => {
		// Arrange
		Dav.isLoggedIn = true
		Dav.accessToken = testerXTestAppAccessToken

		let propertyName = "test"

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			[propertyName]: { value: "Hello World", local: true }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.RemoveProperty(propertyName)

		// Assert
		assert.equal(Object.keys(tableObject.Properties).length, 0)
		assert.isUndefined(tableObject.Properties[propertyName])

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 0)
		assert.isUndefined(tableObjectFromDatabase.Properties[propertyName])
	})
})

describe("Delete function", () => {
	it("should delete the table object", async () => {
		// Arrange
		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			"test": { value: "test" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.Delete()

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNull(tableObjectFromDatabase)
	})

	it("should set the UploadStatus of the table object to Deleted if the user is logged in", async () => {
		// Arrange
		Dav.isLoggedIn = true
		Dav.accessToken = testerXTestAppAccessToken

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			"test": { value: "test" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.Delete()

		// Assert
		assert.equal(tableObject.UploadStatus, TableObjectUploadStatus.Deleted)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.Deleted)
	})
})

describe("DeleteImmediately function", () => {
	it("should remove the table object from the database", async () => {
		// Arrange
		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			"test": { value: "test" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.DeleteImmediately()

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNull(tableObjectFromDatabase)
	})
})

describe("Remove function", () => {
	it("should delete the table object", async () => {
		// Arrange
		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			"test": { value: "test" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.Remove()

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNull(tableObjectFromDatabase)
	})

	it("should set the UploadStatus of the table object to Removed if the user is logged in", async () => {
		// Arrange
		Dav.isLoggedIn = true
		Dav.accessToken = testerXTestAppAccessToken

		let tableObject = new TableObject()
		tableObject.TableId = 13
		tableObject.Properties = {
			"test": { value: "test" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await tableObject.Remove()

		// Assert
		assert.equal(tableObject.UploadStatus, TableObjectUploadStatus.Removed)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.Removed)
	})
})