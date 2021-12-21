import { assert } from 'chai'
import localforage from 'localforage'
import {
	Environment,
	DatabaseSession,
	SessionUploadStatus,
	DatabaseUser,
	GenericUploadStatus,
	WebPushSubscriptionUploadStatus,
	TableObjectUploadStatus
} from '../../lib/types.js'
import { sessionKey, userKey, webPushSubscriptionKey } from '../../lib/constants.js'
import { generateUuid, getNotificationKey } from '../../lib/utils.js'
import { Dav } from '../../lib/Dav.js'
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations.js'
import { TableObject } from '../../lib/models/TableObject.js'
import { Notification } from '../../lib/models/Notification.js'
import { App } from '../../lib/models/App.js'
import { WebPushSubscription } from '../../lib/models/WebPushSubscription.js'

beforeEach(async () => {
	// Reset global variables
	Dav.environment = Environment.Test
	Dav.skipSyncPushInTests = true
	Dav.isLoggedIn = false
	Dav.accessToken = null

	// Clear the database
	await localforage.clear()
})

describe("SetSession function", () => {
	it("should save the session object", async () => {
		// Arrange
		let accessToken = "shiodghiosgdshiogd"
		let uploadStatus = SessionUploadStatus.Deleted

		let session: DatabaseSession = {
			AccessToken: accessToken,
			UploadStatus: uploadStatus
		}

		// Act
		await DatabaseOperations.SetSession(session)

		// Assert
		let sessionFromDatabase = await localforage.getItem(sessionKey) as DatabaseSession
		assert.isNotNull(sessionFromDatabase)
		assert.equal(sessionFromDatabase.AccessToken, accessToken)
		assert.equal(sessionFromDatabase.UploadStatus, uploadStatus)
	})
})

describe("GetSession function", () => {
	it("should return the session from the database", async () => {
		// Arrange
		let accessToken = "shiodghiosgdshiogd"
		let uploadStatus = SessionUploadStatus.Deleted

		let session: DatabaseSession = {
			AccessToken: accessToken,
			UploadStatus: uploadStatus
		}

		await DatabaseOperations.SetSession(session)

		// Act
		let sessionFromDatabase = await DatabaseOperations.GetSession()

		// Assert
		assert.isNotNull(sessionFromDatabase)
		assert.equal(sessionFromDatabase.AccessToken, accessToken)
		assert.equal(sessionFromDatabase.UploadStatus, uploadStatus)
	})
})

describe("RemoveSession function", () => {
	it("should remove the session from the database", async () => {
		// Arrange
		let session: DatabaseSession = {
			AccessToken: "asasdasdasdads",
			UploadStatus: SessionUploadStatus.UpToDate
		}

		await DatabaseOperations.SetSession(session)

		// Act
		await DatabaseOperations.RemoveSession()

		// Assert
		let sessionFromDatabase = await DatabaseOperations.GetSession()
		assert.isNull(sessionFromDatabase)
	})
})

describe("SetUser function", () => {
	it("should save the user in the database", async () => {
		// Arrange
		let user: DatabaseUser = {
			Id: 12,
			Email: "test@example.com",
			FirstName: "Dav",
			Confirmed: false,
			TotalStorage: 10000000,
			UsedStorage: 100000,
			StripeCustomerId: "iodsisdgisgd",
			Plan: 0,
			SubscriptionStatus: null,
			PeriodEnd: null,
			Dev: false,
			Provider: false,
			ProfileImage: null,
			ProfileImageEtag: null,
			Apps: [new App(
				15,
				"TestApp",
				"Hello World",
				false,
				"https://testapp.dav-apps.tech",
				null,
				null,
				2344234
			)]
		}

		// Act
		await DatabaseOperations.SetUser(user)

		// Assert
		let userFromDatabase = await localforage.getItem(userKey) as DatabaseUser
		assert.isNotNull(userFromDatabase)
		assert.equal(userFromDatabase.Id, user.Id)
		assert.equal(userFromDatabase.Email, user.Email)
		assert.equal(userFromDatabase.FirstName, user.FirstName)
		assert.equal(userFromDatabase.Confirmed, user.Confirmed)
		assert.equal(userFromDatabase.TotalStorage, user.TotalStorage)
		assert.equal(userFromDatabase.UsedStorage, user.UsedStorage)
		assert.equal(userFromDatabase.StripeCustomerId, user.StripeCustomerId)
		assert.equal(userFromDatabase.Plan, user.Plan)
		assert.equal(userFromDatabase.SubscriptionStatus, user.SubscriptionStatus)
		assert.equal(userFromDatabase.PeriodEnd, user.PeriodEnd)
		assert.equal(userFromDatabase.Dev, user.Dev)
		assert.equal(userFromDatabase.Provider, user.Provider)
		assert.equal(userFromDatabase.ProfileImage, user.ProfileImage)
		assert.equal(userFromDatabase.ProfileImageEtag, user.ProfileImageEtag)
		
		assert.equal(userFromDatabase.Apps.length, user.Apps.length)
		assert.equal(userFromDatabase.Apps[0].Id, user.Apps[0].Id)
		assert.equal(userFromDatabase.Apps[0].Name, user.Apps[0].Name)
		assert.equal(userFromDatabase.Apps[0].Description, user.Apps[0].Description)
		assert.equal(userFromDatabase.Apps[0].Published, user.Apps[0].Published)
		assert.equal(userFromDatabase.Apps[0].WebLink, user.Apps[0].WebLink)
		assert.equal(userFromDatabase.Apps[0].GooglePlayLink, user.Apps[0].GooglePlayLink)
		assert.equal(userFromDatabase.Apps[0].MicrosoftStoreLink, user.Apps[0].MicrosoftStoreLink)
		assert.equal(userFromDatabase.Apps[0].UsedStorage, user.Apps[0].UsedStorage)
	})
})

describe("GetUser function", () => {
	it("should return the user from the database", async () => {
		// Arrange
		let user: DatabaseUser = {
			Id: 12,
			Email: "test@example.com",
			FirstName: "Dav",
			Confirmed: false,
			TotalStorage: 10000000,
			UsedStorage: 100000,
			StripeCustomerId: "iodsisdgisgd",
			Plan: 0,
			SubscriptionStatus: null,
			PeriodEnd: null,
			Dev: false,
			Provider: false,
			ProfileImage: null,
			ProfileImageEtag: null,
			Apps: [new App(
				15,
				"TestApp",
				"Hello World",
				false,
				"https://testapp.dav-apps.tech",
				null,
				null,
				2344234
			)]
		}

		await localforage.setItem(userKey, user)

		// Act
		let userFromDatabase = await DatabaseOperations.GetUser()

		// Assert
		assert.isNotNull(userFromDatabase)
		assert.equal(userFromDatabase.Id, user.Id)
		assert.equal(userFromDatabase.Email, user.Email)
		assert.equal(userFromDatabase.FirstName, user.FirstName)
		assert.equal(userFromDatabase.Confirmed, user.Confirmed)
		assert.equal(userFromDatabase.TotalStorage, user.TotalStorage)
		assert.equal(userFromDatabase.UsedStorage, user.UsedStorage)
		assert.equal(userFromDatabase.StripeCustomerId, user.StripeCustomerId)
		assert.equal(userFromDatabase.Plan, user.Plan)
		assert.equal(userFromDatabase.SubscriptionStatus, user.SubscriptionStatus)
		assert.equal(userFromDatabase.PeriodEnd, user.PeriodEnd)
		assert.equal(userFromDatabase.Dev, user.Dev)
		assert.equal(userFromDatabase.Provider, user.Provider)
		assert.equal(userFromDatabase.ProfileImage, user.ProfileImage)
		assert.equal(userFromDatabase.ProfileImageEtag, user.ProfileImageEtag)
		
		assert.equal(userFromDatabase.Apps.length, user.Apps.length)
		assert.equal(userFromDatabase.Apps[0].Id, user.Apps[0].Id)
		assert.equal(userFromDatabase.Apps[0].Name, user.Apps[0].Name)
		assert.equal(userFromDatabase.Apps[0].Description, user.Apps[0].Description)
		assert.equal(userFromDatabase.Apps[0].Published, user.Apps[0].Published)
		assert.equal(userFromDatabase.Apps[0].WebLink, user.Apps[0].WebLink)
		assert.equal(userFromDatabase.Apps[0].GooglePlayLink, user.Apps[0].GooglePlayLink)
		assert.equal(userFromDatabase.Apps[0].MicrosoftStoreLink, user.Apps[0].MicrosoftStoreLink)
		assert.equal(userFromDatabase.Apps[0].UsedStorage, user.Apps[0].UsedStorage)
	})
})

describe("RemoveUser function", () => {
	it("should remove the user from the database", async () => {
		// Arrange
		let user: DatabaseUser = {
			Id: 12,
			Email: "test@example.com",
			FirstName: "Dav",
			Confirmed: false,
			TotalStorage: 10000000,
			UsedStorage: 100000,
			StripeCustomerId: "iodsisdgisgd",
			Plan: 0,
			SubscriptionStatus: null,
			PeriodEnd: null,
			Dev: false,
			Provider: false,
			ProfileImage: null,
			ProfileImageEtag: null,
			Apps: [new App(
				15,
				"TestApp",
				"Hello World",
				false,
				"https://testapp.dav-apps.tech",
				null,
				null,
				2344234
			)]
		}

		await DatabaseOperations.SetUser(user)

		// Act
		await DatabaseOperations.RemoveUser()

		// Assert
		let userFromDatabase = await DatabaseOperations.GetUser()
		assert.isNull(userFromDatabase)
	})
})

describe("SetNotification function", () => {
	it("should save the notification in the database", async () => {
		// Arrange
		let notification = new Notification({
			Uuid: "766db568-a65a-48f9-8af6-c1dde7213239",
			Time: 1234567,
			Interval: 1234,
			Title: "Test notification",
			Body: "Hello World",
			UploadStatus: GenericUploadStatus.UpToDate
		})

		// Act
		await DatabaseOperations.SetNotification(notification)

		// Assert
		let notificationFromDatabase = await localforage.getItem(getNotificationKey(notification.Uuid)) as Notification
		assert.isNotNull(notificationFromDatabase)
		assert.equal(notificationFromDatabase.Uuid, notification.Uuid)
		assert.equal(notificationFromDatabase.Time, notification.Time)
		assert.equal(notificationFromDatabase.Interval, notification.Interval)
		assert.equal(notificationFromDatabase.Title, notification.Title)
		assert.equal(notificationFromDatabase.Body, notification.Body)
		assert.equal(notificationFromDatabase.UploadStatus, notification.UploadStatus)
	})
})

describe("GetAllNotifications function", () => {
	it("should return empty array if there are no notifications", async () => {
		// Act
		let notificationsFromDatabase = await DatabaseOperations.GetAllNotifications()

		// Assert
		assert.equal(notificationsFromDatabase.length, 0)
	})

	it("should return all notifications from the database", async () => {
		// Arrange
		let firstNotification = new Notification({
			Uuid: "766db568-a65a-48f9-8af6-c1dde7213239",
			Time: 1234567,
			Interval: 1234,
			Title: "Test notification",
			Body: "Hello World",
			UploadStatus: GenericUploadStatus.UpToDate
		})

		let secondNotification = new Notification({
			Uuid: "fe8406bb-86e6-404d-8dc6-4f22b298a88c",
			Time: 6324243,
			Interval: 0,
			Title: "Second notification for tests",
			Body: "You have a notification!",
			UploadStatus: GenericUploadStatus.New
		})

		await DatabaseOperations.SetNotification(firstNotification)
		await DatabaseOperations.SetNotification(secondNotification)

		// Act
		let notificationsFromDatabase = await DatabaseOperations.GetAllNotifications()

		// Assert
		assert.equal(notificationsFromDatabase.length, 2)
		
		assert.equal(notificationsFromDatabase[0].Uuid, firstNotification.Uuid)
		assert.equal(notificationsFromDatabase[0].Time, firstNotification.Time)
		assert.equal(notificationsFromDatabase[0].Interval, firstNotification.Interval)
		assert.equal(notificationsFromDatabase[0].Title, firstNotification.Title)
		assert.equal(notificationsFromDatabase[0].Body, firstNotification.Body)
		assert.equal(notificationsFromDatabase[0].UploadStatus, firstNotification.UploadStatus)

		assert.equal(notificationsFromDatabase[1].Uuid, secondNotification.Uuid)
		assert.equal(notificationsFromDatabase[1].Time, secondNotification.Time)
		assert.equal(notificationsFromDatabase[1].Interval, secondNotification.Interval)
		assert.equal(notificationsFromDatabase[1].Title, secondNotification.Title)
		assert.equal(notificationsFromDatabase[1].Body, secondNotification.Body)
		assert.equal(notificationsFromDatabase[1].UploadStatus, secondNotification.UploadStatus)
	})
})

describe("GetNotification function", () => {
	it("should return the notification from the database", async () => {
		// Arrange
		let notification = new Notification({
			Uuid: "766db568-a65a-48f9-8af6-c1dde7213239",
			Time: 1234567,
			Interval: 1234,
			Title: "Test notification",
			Body: "Hello World",
			UploadStatus: GenericUploadStatus.UpToDate
		})

		await DatabaseOperations.SetNotification(notification)

		// Act
		let notificationFromDatabase = await DatabaseOperations.GetNotification(notification.Uuid)

		// Assert
		assert.isNotNull(notificationFromDatabase)
		assert.equal(notificationFromDatabase.Uuid, notification.Uuid)
		assert.equal(notificationFromDatabase.Time, notification.Time)
		assert.equal(notificationFromDatabase.Interval, notification.Interval)
		assert.equal(notificationFromDatabase.Title, notification.Title)
		assert.equal(notificationFromDatabase.Body, notification.Body)
		assert.equal(notificationFromDatabase.UploadStatus, notification.UploadStatus)
	})

	it("should return null if the notification does not exist", async () => {
		// Act
		let notificationFromDatabase = await DatabaseOperations.GetNotification(generateUuid())

		// Assert
		assert.isNull(notificationFromDatabase)
	})
})

describe("NotificationExists function", () => {
	it("should return true if the notification is in the database", async () => {
		// Arrange
		let notification = new Notification({
			Uuid: "766db568-a65a-48f9-8af6-c1dde7213239",
			Time: 1234567,
			Interval: 1234,
			Title: "Test notification",
			Body: "Hello World",
			UploadStatus: GenericUploadStatus.UpToDate
		})

		await DatabaseOperations.SetNotification(notification)

		// Act
		let exists = await DatabaseOperations.NotificationExists(notification.Uuid)

		// Assert
		assert.isTrue(exists)
	})

	it("should return false if the notification is not in the database", async () => {
		// Act
		let exists = await DatabaseOperations.NotificationExists(generateUuid())

		// Assert
		assert.isFalse(exists)
	})
})

describe("RemoveNotification function", () => {
	it("should remove the notification from the database", async () => {
		// Arrange
		let notification = new Notification({
			Uuid: "766db568-a65a-48f9-8af6-c1dde7213239",
			Time: 1234567,
			Interval: 1234,
			Title: "Test notification",
			Body: "Hello World",
			UploadStatus: GenericUploadStatus.UpToDate
		})

		await DatabaseOperations.SetNotification(notification)

		// Act
		await DatabaseOperations.RemoveNotification(notification.Uuid)

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(notification.Uuid)
		assert.isNull(notificationFromDatabase)
	})
})

describe("RemoveAllNotifications function", () => {
	it("should remove all notifications from the database", async () => {
		// Arrange
		let firstNotification = new Notification({
			Uuid: "766db568-a65a-48f9-8af6-c1dde7213239",
			Time: 1234567,
			Interval: 1234,
			Title: "Test notification",
			Body: "Hello World",
			UploadStatus: GenericUploadStatus.UpToDate
		})

		let secondNotification = new Notification({
			Uuid: "fe8406bb-86e6-404d-8dc6-4f22b298a88c",
			Time: 6324243,
			Interval: 0,
			Title: "Second notification for tests",
			Body: "You have a notification!",
			UploadStatus: GenericUploadStatus.New
		})

		await DatabaseOperations.SetNotification(firstNotification)
		await DatabaseOperations.SetNotification(secondNotification)

		// Act
		await DatabaseOperations.RemoveAllNotifications()

		// Assert
		let notificationsFromDatabase = await DatabaseOperations.GetAllNotifications()
		assert.equal(notificationsFromDatabase.length, 0)
	})
})

describe("SetWebPushSubscription function", () => {
	it("should save the WebPushSubscription in the database", async () => {
		// Arrange
		let webPushSubscription = new WebPushSubscription(
			"6873a1f4-755a-4cac-8b66-e756ded28db0",
			"https://bla.example.com",
			"apfiihodaghasf",
			"ashgaddsadakjdasd",
			WebPushSubscriptionUploadStatus.New
		)

		// Act
		await DatabaseOperations.SetWebPushSubscription(webPushSubscription)

		// Assert
		let webPushSubscriptionFromDatabase = await localforage.getItem(webPushSubscriptionKey) as WebPushSubscription
		assert.isNotNull(webPushSubscriptionFromDatabase)
		assert.equal(webPushSubscriptionFromDatabase.Uuid, webPushSubscription.Uuid)
		assert.equal(webPushSubscriptionFromDatabase.Endpoint, webPushSubscription.Endpoint)
		assert.equal(webPushSubscriptionFromDatabase.P256dh, webPushSubscription.P256dh)
		assert.equal(webPushSubscriptionFromDatabase.Auth, webPushSubscription.Auth)
		assert.equal(webPushSubscriptionFromDatabase.UploadStatus, webPushSubscription.UploadStatus)
	})
})

describe("GetWebPushSubscription function", () => {
	it("should get the WebPushSubscription from the database", async () => {
		// Arrange
		let webPushSubscription = new WebPushSubscription(
			"6873a1f4-755a-4cac-8b66-e756ded28db0",
			"https://bla.example.com",
			"apfiihodaghasf",
			"ashgaddsadakjdasd",
			WebPushSubscriptionUploadStatus.New
		)

		await localforage.setItem(webPushSubscriptionKey, webPushSubscription)

		// Act
		let webPushSubscriptionFromDatabase = await DatabaseOperations.GetWebPushSubscription()

		// Assert
		assert.isNotNull(webPushSubscriptionFromDatabase)
		assert.equal(webPushSubscriptionFromDatabase.Uuid, webPushSubscription.Uuid)
		assert.equal(webPushSubscriptionFromDatabase.Endpoint, webPushSubscription.Endpoint)
		assert.equal(webPushSubscriptionFromDatabase.P256dh, webPushSubscription.P256dh)
		assert.equal(webPushSubscriptionFromDatabase.Auth, webPushSubscription.Auth)
		assert.equal(webPushSubscriptionFromDatabase.UploadStatus, webPushSubscription.UploadStatus)
	})

	it("should return null if the WebPushSubscription does not exist", async () => {
		// Act
		let webPushSubscriptionFromDatabase = await DatabaseOperations.GetWebPushSubscription()

		// Assert
		assert.isNull(webPushSubscriptionFromDatabase)
	})
})

describe("RemoveWebPushSubscription function", () => {
	it("should remove the WebPushSubscription from the database", async () => {
		// Arrange
		let webPushSubscription = new WebPushSubscription(
			"6873a1f4-755a-4cac-8b66-e756ded28db0",
			"https://bla.example.com",
			"apfiihodaghasf",
			"ashgaddsadakjdasd",
			WebPushSubscriptionUploadStatus.New
		)

		await localforage.setItem(webPushSubscriptionKey, webPushSubscription)

		// Act
		await DatabaseOperations.RemoveWebPushSubscription()

		// Assert
		let webPushSubscriptionFromDatabase = await DatabaseOperations.GetWebPushSubscription()
		assert.isNull(webPushSubscriptionFromDatabase)
	})
})

describe("SetTableObject function", () => {
	it("should save the table object in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 13
		let uploadStatus = TableObjectUploadStatus.Removed
		let etag = "asdasdasd"
		let belongsToUser = true
		let purchase = null
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Hallo Welt"

		let tableObject = new TableObject()
		tableObject.Uuid = uuid
		tableObject.TableId = tableId
		tableObject.UploadStatus = uploadStatus
		tableObject.Etag = etag
		tableObject.BelongsToUser = belongsToUser
		tableObject.Purchase = purchase
		tableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		// Act
		let createdTableObjectUuid = await DatabaseOperations.SetTableObject(tableObject)

		// Assert
		assert.equal(createdTableObjectUuid, uuid)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
		assert.equal(tableObjectFromDatabase.BelongsToUser, belongsToUser)
		assert.equal(tableObjectFromDatabase.Purchase, purchase)

		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
	})

	it("should save the table object with different value types in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 13
		let uploadStatus = TableObjectUploadStatus.Removed
		let etag = "asdasdasd"
		let belongsToUser = false
		let purchase = "sdfhiosdfhiosdfosdf"
		let firstPropertyName = "page1"
		let firstPropertyValue = 123
		let secondPropertyName = "page2"
		let secondPropertyValue = true

		let tableObject = new TableObject()
		tableObject.Uuid = uuid
		tableObject.TableId = tableId
		tableObject.UploadStatus = uploadStatus
		tableObject.Etag = etag
		tableObject.BelongsToUser = belongsToUser
		tableObject.Purchase = purchase
		tableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		// Act
		let createdTableObjectUuid = await DatabaseOperations.SetTableObject(tableObject)

		// Assert
		assert.equal(createdTableObjectUuid, uuid)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
		assert.equal(tableObjectFromDatabase.BelongsToUser, belongsToUser)
		assert.equal(tableObjectFromDatabase.Purchase, purchase)

		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
	})

	it("should overwrite existing table object in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 42

		let firstTableObject = new TableObject()
		firstTableObject.Uuid = uuid
		firstTableObject.TableId = tableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Deleted
		firstTableObject.Etag = "adsasdasd"
		firstTableObject.BelongsToUser = true
		firstTableObject.Purchase = null
		firstTableObject.Properties = {
			"test": { value: "Hallo Welt" }
		}

		await DatabaseOperations.SetTableObject(firstTableObject)

		let uploadStatus = TableObjectUploadStatus.New
		let etag = "Lorem ipsum dolor sit amet"
		let belongsToUser = false
		let purchase = "shiodfhoisdfsdf"
		let firstPropertyName = "page1"
		let firstPropertyValue = "Guten Tag"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Good day"

		let secondTableObject = new TableObject()
		secondTableObject.Uuid = uuid
		secondTableObject.TableId = tableId
		secondTableObject.UploadStatus = uploadStatus
		secondTableObject.Etag = etag
		secondTableObject.BelongsToUser = belongsToUser
		secondTableObject.Purchase = purchase
		secondTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		// Act
		let updatedTableObjectUuid = await DatabaseOperations.SetTableObject(secondTableObject)

		// Assert
		assert.equal(updatedTableObjectUuid, uuid)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
		assert.equal(tableObjectFromDatabase.BelongsToUser, belongsToUser)
		assert.equal(tableObjectFromDatabase.Purchase, purchase)

		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
	})

	it("should overwrite existing table object with different value types in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 42

		let firstTableObject = new TableObject()
		firstTableObject.Uuid = uuid
		firstTableObject.TableId = tableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Deleted
		firstTableObject.Etag = "adsasdasd"
		firstTableObject.BelongsToUser = false
		firstTableObject.Purchase = "dfhosidshodif"
		firstTableObject.Properties = {
			"test": { value: 9203 }
		}

		await DatabaseOperations.SetTableObject(firstTableObject)

		let uploadStatus = TableObjectUploadStatus.New
		let etag = "Lorem ipsum dolor sit amet"
		let belongsToUser = true
		let purchase = null
		let firstPropertyName = "page1"
		let firstPropertyValue = true
		let secondPropertyName = "page2"
		let secondPropertyValue = 1234.5678

		let secondTableObject = new TableObject()
		secondTableObject.Uuid = uuid
		secondTableObject.TableId = tableId
		secondTableObject.UploadStatus = uploadStatus
		secondTableObject.Etag = etag
		secondTableObject.BelongsToUser = belongsToUser
		secondTableObject.Purchase = purchase
		secondTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		// Act
		let updatedTableObjectUuid = await DatabaseOperations.SetTableObject(secondTableObject)
		
		// Assert
		assert.equal(updatedTableObjectUuid, uuid)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
		assert.equal(tableObjectFromDatabase.BelongsToUser, belongsToUser)
		assert.equal(tableObjectFromDatabase.Purchase, purchase)

		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
	})

	it("should adopt local properties of the existing table object, overwrite the table object in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 42

		let firstLocalPropertyName = "local1"
		let firstLocalPropertyValue = "Hello World"
		let secondLocalPropertyName = "local2"
		let secondLocalPropertyValue = "Hallo Welt"

		let firstPropertyName = "page1"
		let firstPropertyValue = "Good day"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Guten Tag"

		let uploadStatus = TableObjectUploadStatus.UpToDate
		let etag = "Lorem ipsum dolor sit amet"
		let belongsToUser = true
		let purchase = null

		let firstTableObject = new TableObject()
		firstTableObject.Uuid = uuid
		firstTableObject.TableId = tableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Deleted
		firstTableObject.Etag = "adsasdasd"
		firstTableObject.BelongsToUser = belongsToUser
		firstTableObject.Purchase = purchase
		firstTableObject.Properties = {
			[firstLocalPropertyName]: { value: firstLocalPropertyValue, local: true },
			[firstPropertyName]: { value: "asdadsasd" },
			[secondLocalPropertyName]: { value: secondLocalPropertyValue, local: true },
			[secondPropertyName]: { value: "iaosfobags" }
		}

		await DatabaseOperations.SetTableObject(firstTableObject)

		let secondTableObject = new TableObject()
		secondTableObject.Uuid = uuid
		secondTableObject.TableId = tableId
		secondTableObject.UploadStatus = uploadStatus
		secondTableObject.Etag = etag
		secondTableObject.BelongsToUser = belongsToUser
		secondTableObject.Purchase = purchase
		secondTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		// Act
		let updatedTableObjectUuid = await DatabaseOperations.SetTableObject(secondTableObject, false)

		// Assert
		assert.equal(updatedTableObjectUuid, uuid)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
		assert.equal(tableObjectFromDatabase.BelongsToUser, belongsToUser)
		assert.equal(tableObjectFromDatabase.Purchase, purchase)

		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 4)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[firstLocalPropertyName].value, firstLocalPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondLocalPropertyName].value, secondLocalPropertyValue)
		assert.isTrue(tableObjectFromDatabase.Properties[firstLocalPropertyName].local)
		assert.isTrue(tableObjectFromDatabase.Properties[secondLocalPropertyName].local)
	})

	it("should adopt local properties of the existing table object with different value types, overwrite the table object in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 42

		let firstLocalPropertyName = "local1"
		let firstLocalPropertyValue = 1234
		let secondLocalPropertyName = "local2"
		let secondLocalPropertyValue = true

		let firstPropertyName = "page1"
		let firstPropertyValue = 1982
		let secondPropertyName = "page2"
		let secondPropertyValue = 928.2425

		let uploadStatus = TableObjectUploadStatus.UpToDate
		let etag = "Lorem ipsum dolor sit amet"
		let belongsToUser = false
		let purchase = "hiosdhodfosdf"

		let firstTableObject = new TableObject()
		firstTableObject.Uuid = uuid
		firstTableObject.TableId = tableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Deleted
		firstTableObject.Etag = "adsasdasd"
		firstTableObject.BelongsToUser = belongsToUser
		firstTableObject.Purchase = purchase
		firstTableObject.Properties = {
			[firstLocalPropertyName]: { value: firstLocalPropertyValue, local: true },
			[firstPropertyName]: { value: 9874 },
			[secondLocalPropertyName]: { value: secondLocalPropertyValue, local: true },
			[secondPropertyName]: { value: 9872.9147 }
		}

		await DatabaseOperations.SetTableObject(firstTableObject)

		let secondTableObject = new TableObject()
		secondTableObject.Uuid = uuid
		secondTableObject.TableId = tableId
		secondTableObject.UploadStatus = uploadStatus
		secondTableObject.Etag = etag
		secondTableObject.BelongsToUser = belongsToUser
		secondTableObject.Purchase = purchase
		secondTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		// Act
		let updatedTableObjectUuid = await DatabaseOperations.SetTableObject(secondTableObject, false)

		// Assert
		assert.equal(updatedTableObjectUuid, uuid)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
		assert.equal(tableObjectFromDatabase.BelongsToUser, belongsToUser)
		assert.equal(tableObjectFromDatabase.Purchase, purchase)

		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 4)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[firstLocalPropertyName].value, firstLocalPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondLocalPropertyName].value, secondLocalPropertyValue)
		assert.isTrue(tableObjectFromDatabase.Properties[firstLocalPropertyName].local)
		assert.isTrue(tableObjectFromDatabase.Properties[secondLocalPropertyName].local)
	})
})

describe("SetTableObjects function", () => {
	it("should save the table objects in the database and return the uuids", async () => {
		// Arrange
		let uuid1 = generateUuid()
		let uuid2 = generateUuid()
		let uuid3 = generateUuid()
		let tableId1 = 14
		let tableId2 = 23
		let tableId3 = 124
		let uploadStatus1 = TableObjectUploadStatus.New
		let uploadStatus2 = TableObjectUploadStatus.Updated
		let uploadStatus3 = TableObjectUploadStatus.UpToDate
		let etag1 = "asdasd"
		let etag2 = "werwerwer"
		let etag3 = "ojsdfnsdfons"
		let belongsToUser1 = true
		let belongsToUser2 = false
		let belongsToUser3 = false
		let purchase1 = null
		let purchase2 = null
		let purchase3 = "hiodfhosdhosdf"

		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = "Hello World"
		let firstPropertyName2 = "test1"
		let firstPropertyValue2 = "Lorem ipsum"
		let firstPropertyName3 = "bla1"
		let firstPropertyValue3 = "asdasdasd"

		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = "Hallo Welt"
		let secondPropertyName2 = "test2"
		let secondPropertyValue2 = "dolor sit amet"
		let secondPropertyName3 = "bla2"
		let secondPropertyValue3 = "pgondognodg"

		let firstTableObject = new TableObject()
		firstTableObject.Uuid = uuid1
		firstTableObject.TableId = tableId1
		firstTableObject.UploadStatus = uploadStatus1
		firstTableObject.Etag = etag1
		firstTableObject.BelongsToUser = belongsToUser1
		firstTableObject.Purchase = purchase1
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondTableObject = new TableObject()
		secondTableObject.Uuid = uuid2
		secondTableObject.TableId = tableId2
		secondTableObject.UploadStatus = uploadStatus2
		secondTableObject.Etag = etag2
		secondTableObject.BelongsToUser = belongsToUser2
		secondTableObject.Purchase = purchase2
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		let thirdTableObject = new TableObject()
		thirdTableObject.Uuid = uuid3
		thirdTableObject.TableId = tableId3
		thirdTableObject.UploadStatus = uploadStatus3
		thirdTableObject.Etag = etag3
		thirdTableObject.BelongsToUser = belongsToUser3
		thirdTableObject.Purchase = purchase3
		thirdTableObject.Properties = {
			[firstPropertyName3]: { value: firstPropertyValue3 },
			[secondPropertyName3]: { value: secondPropertyValue3 }
		}

		// Act
		let createdTableObjectUuids = await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject
		])

		// Assert
		assert.equal(createdTableObjectUuids.length, 3)
		assert.equal(createdTableObjectUuids[0], uuid1)
		assert.equal(createdTableObjectUuids[1], uuid2)
		assert.equal(createdTableObjectUuids[2], uuid3)

		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid1, tableId1)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.TableId, tableId1)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, uploadStatus1)
		assert.equal(firstTableObjectFromDatabase.Etag, etag1)
		assert.equal(firstTableObjectFromDatabase.BelongsToUser, belongsToUser1)
		assert.equal(firstTableObjectFromDatabase.Purchase, purchase1)

		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 2)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondPropertyName1].value, secondPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid2, tableId2)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.TableId, tableId2)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, uploadStatus2)
		assert.equal(secondTableObjectFromDatabase.Etag, etag2)
		assert.equal(secondTableObjectFromDatabase.BelongsToUser, belongsToUser2)
		assert.equal(secondTableObjectFromDatabase.Purchase, purchase2)

		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 2)
		assert.equal(secondTableObjectFromDatabase.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName2].value, secondPropertyValue2)

		let thirdTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid3, tableId3)
		assert.isNotNull(thirdTableObjectFromDatabase)
		assert.equal(thirdTableObjectFromDatabase.TableId, tableId3)
		assert.equal(thirdTableObjectFromDatabase.UploadStatus, uploadStatus3)
		assert.equal(thirdTableObjectFromDatabase.Etag, etag3)
		assert.equal(thirdTableObjectFromDatabase.BelongsToUser, belongsToUser3)
		assert.equal(thirdTableObjectFromDatabase.Purchase, purchase3)

		assert.equal(Object.keys(thirdTableObjectFromDatabase.Properties).length, 2)
		assert.equal(thirdTableObjectFromDatabase.Properties[firstPropertyName3].value, firstPropertyValue3)
		assert.equal(thirdTableObjectFromDatabase.Properties[secondPropertyName3].value, secondPropertyValue3)
	})

	it("should save the table objects with different value types in the database and return the uuids", async () => {
		// Arrange
		let uuid1 = generateUuid()
		let uuid2 = generateUuid()
		let uuid3 = generateUuid()
		let tableId1 = 14
		let tableId2 = 23
		let tableId3 = 124
		let uploadStatus1 = TableObjectUploadStatus.New
		let uploadStatus2 = TableObjectUploadStatus.Updated
		let uploadStatus3 = TableObjectUploadStatus.UpToDate
		let etag1 = "asdasd"
		let etag2 = "werwerwer"
		let etag3 = "ojsdfnsdfons"
		let belongsToUser1 = true
		let belongsToUser2 = false
		let belongsToUser3 = false
		let purchase1 = null
		let purchase2 = null
		let purchase3 = "hiodfhosdhosdf"

		let firstPropertyName1 = "page1"
		let firstPropertyValue1 = 123
		let firstPropertyName2 = "test1"
		let firstPropertyValue2 = 456.789
		let firstPropertyName3 = "bla1"
		let firstPropertyValue3 = true

		let secondPropertyName1 = "page2"
		let secondPropertyValue1 = 562
		let secondPropertyName2 = "test2"
		let secondPropertyValue2 = 93758
		let secondPropertyName3 = "bla2"
		let secondPropertyValue3 = false

		let firstTableObject = new TableObject()
		firstTableObject.Uuid = uuid1
		firstTableObject.TableId = tableId1
		firstTableObject.UploadStatus = uploadStatus1
		firstTableObject.Etag = etag1
		firstTableObject.BelongsToUser = belongsToUser1
		firstTableObject.Purchase = purchase1
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondTableObject = new TableObject()
		secondTableObject.Uuid = uuid2
		secondTableObject.TableId = tableId2
		secondTableObject.UploadStatus = uploadStatus2
		secondTableObject.Etag = etag2
		secondTableObject.BelongsToUser = belongsToUser2
		secondTableObject.Purchase = purchase2
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		let thirdTableObject = new TableObject()
		thirdTableObject.Uuid = uuid3
		thirdTableObject.TableId = tableId3
		thirdTableObject.UploadStatus = uploadStatus3
		thirdTableObject.Etag = etag3
		thirdTableObject.BelongsToUser = belongsToUser3
		thirdTableObject.Purchase = purchase3
		thirdTableObject.Properties = {
			[firstPropertyName3]: { value: firstPropertyValue3 },
			[secondPropertyName3]: { value: secondPropertyValue3 }
		}

		// Act
		let createdTableObjectUuids = await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject
		])

		// Assert
		assert.equal(createdTableObjectUuids.length, 3)
		assert.equal(createdTableObjectUuids[0], uuid1)
		assert.equal(createdTableObjectUuids[1], uuid2)
		assert.equal(createdTableObjectUuids[2], uuid3)

		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid1, tableId1)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.TableId, tableId1)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, uploadStatus1)
		assert.equal(firstTableObjectFromDatabase.Etag, etag1)
		assert.equal(firstTableObjectFromDatabase.BelongsToUser, belongsToUser1)
		assert.equal(firstTableObjectFromDatabase.Purchase, purchase1)

		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 2)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondPropertyName1].value, secondPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid2, tableId2)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.TableId, tableId2)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, uploadStatus2)
		assert.equal(secondTableObjectFromDatabase.Etag, etag2)
		assert.equal(secondTableObjectFromDatabase.BelongsToUser, belongsToUser2)
		assert.equal(secondTableObjectFromDatabase.Purchase, purchase2)

		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 2)
		assert.equal(secondTableObjectFromDatabase.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName2].value, secondPropertyValue2)

		let thirdTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid3, tableId3)
		assert.isNotNull(thirdTableObjectFromDatabase)
		assert.equal(thirdTableObjectFromDatabase.TableId, tableId3)
		assert.equal(thirdTableObjectFromDatabase.UploadStatus, uploadStatus3)
		assert.equal(thirdTableObjectFromDatabase.Etag, etag3)
		assert.equal(thirdTableObjectFromDatabase.BelongsToUser, belongsToUser3)
		assert.equal(thirdTableObjectFromDatabase.Purchase, purchase3)

		assert.equal(Object.keys(thirdTableObjectFromDatabase.Properties).length, 2)
		assert.equal(thirdTableObjectFromDatabase.Properties[firstPropertyName3].value, firstPropertyValue3)
		assert.equal(thirdTableObjectFromDatabase.Properties[secondPropertyName3].value, secondPropertyValue3)
	})

	it("should overwrite existing table objects in the database and return the uuids", async () => {
		// Arrange
		let uuid1 = generateUuid()
		let uuid2 = generateUuid()
		let tableId1 = 13
		let tableId2 = 42

		let tableObject1 = new TableObject()
		tableObject1.Uuid = uuid1
		tableObject1.TableId = tableId1
		tableObject1.UploadStatus = TableObjectUploadStatus.Updated
		tableObject1.Etag = "asdasdasd"
		tableObject1.BelongsToUser = true
		tableObject1.Purchase = null
		tableObject1.Properties = {
			"test": { value: "Hello World" }
		}

		let tableObject2 = new TableObject()
		tableObject2.Uuid = uuid2
		tableObject2.TableId = tableId2
		tableObject2.UploadStatus = TableObjectUploadStatus.UpToDate
		tableObject2.Etag = "sdofndgsdg"
		tableObject2.BelongsToUser = false
		tableObject2.Purchase = "shiodfhosdf"
		tableObject2.Properties = {
			"bla": { value: "Lorem ipsum dolor sit amet" }
		}

		await DatabaseOperations.SetTableObjects([
			tableObject1,
			tableObject2
		])

		let newUploadStatus1 = TableObjectUploadStatus.New
		let newUploadStatus2 = TableObjectUploadStatus.Deleted
		let newEtag1 = "oijsegioasf"
		let newEtag2 = "oinsdgjdsoknsdf"
		let newBelongsToUser1 = false
		let newBelongsToUser2 = true
		let newPurchase1 = "sidufsuihfs"
		let newPurchase2 = null
		let firstNewPropertyName1 = "page1"
		let firstNewPropertyValue1 = "Good day"
		let firstNewPropertyName2 = "test1"
		let firstNewPropertyValue2 = "Hallo Welt"
		let secondNewPropertyName1 = "page2"
		let secondNewPropertyValue1 = "Guten Tag"
		let secondNewPropertyName2 = "test2"
		let secondNewPropertyValue2 = "Hello World"

		let newTableObject1 = new TableObject()
		newTableObject1.Uuid = uuid1
		newTableObject1.TableId = tableId1
		newTableObject1.UploadStatus = newUploadStatus1
		newTableObject1.Etag = newEtag1
		newTableObject1.BelongsToUser = newBelongsToUser1
		newTableObject1.Purchase = newPurchase1
		newTableObject1.Properties = {
			[firstNewPropertyName1]: { value: firstNewPropertyValue1 },
			[secondNewPropertyName1]: { value: secondNewPropertyValue1 }
		}

		let newTableObject2 = new TableObject()
		newTableObject2.Uuid = uuid2
		newTableObject2.TableId = tableId2
		newTableObject2.UploadStatus = newUploadStatus2
		newTableObject2.Etag = newEtag2
		newTableObject2.BelongsToUser = newBelongsToUser2
		newTableObject2.Purchase = newPurchase2
		newTableObject2.Properties = {
			[firstNewPropertyName2]: { value: firstNewPropertyValue2 },
			[secondNewPropertyName2]: { value: secondNewPropertyValue2 }
		}

		// Act
		let updatedTableObjectUuids = await DatabaseOperations.SetTableObjects([
			newTableObject1,
			newTableObject2
		])

		// Assert
		assert.equal(updatedTableObjectUuids.length, 2)
		assert.equal(updatedTableObjectUuids[0], uuid1)
		assert.equal(updatedTableObjectUuids[1], uuid2)

		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid1, tableId1)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.TableId, tableId1)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, newUploadStatus1)
		assert.equal(firstTableObjectFromDatabase.Etag, newEtag1)
		assert.equal(firstTableObjectFromDatabase.BelongsToUser, newBelongsToUser1)
		assert.equal(firstTableObjectFromDatabase.Purchase, newPurchase1)

		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 2)
		assert.equal(firstTableObjectFromDatabase.Properties[firstNewPropertyName1].value, firstNewPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondNewPropertyName1].value, secondNewPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid2, tableId2)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.TableId, tableId2)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, newUploadStatus2)
		assert.equal(secondTableObjectFromDatabase.Etag, newEtag2)
		assert.equal(secondTableObjectFromDatabase.BelongsToUser, newBelongsToUser2)
		assert.equal(secondTableObjectFromDatabase.Purchase, newPurchase2)

		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 2)
		assert.equal(secondTableObjectFromDatabase.Properties[firstNewPropertyName2].value, firstNewPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondNewPropertyName2].value, secondNewPropertyValue2)
	})

	it("should overwrite existing table objects with different value types in the database and return the uuids", async () => {
		// Arrange
		let uuid1 = generateUuid()
		let uuid2 = generateUuid()
		let tableId1 = 13
		let tableId2 = 42

		let tableObject1 = new TableObject()
		tableObject1.Uuid = uuid1
		tableObject1.TableId = tableId1
		tableObject1.UploadStatus = TableObjectUploadStatus.Updated
		tableObject1.Etag = "asdasdasd"
		tableObject1.BelongsToUser = true
		tableObject1.Purchase = null
		tableObject1.Properties = {
			"test": { value: 93885 }
		}

		let tableObject2 = new TableObject()
		tableObject2.Uuid = uuid2
		tableObject2.TableId = tableId2
		tableObject2.UploadStatus = TableObjectUploadStatus.UpToDate
		tableObject2.Etag = "sdofndgsdg"
		tableObject2.BelongsToUser = false
		tableObject2.Purchase = "oishdhoisdfhoisdf"
		tableObject2.Properties = {
			"bla": { value: 9289.2324 }
		}

		await DatabaseOperations.SetTableObjects([
			tableObject1,
			tableObject2
		])

		let newUploadStatus1 = TableObjectUploadStatus.New
		let newUploadStatus2 = TableObjectUploadStatus.Deleted
		let newEtag1 = "oijsegioasf"
		let newEtag2 = "oinsdgjdsoknsdf"
		let newBelongsToUser1 = false
		let newBelongsToUser2 = true
		let newPurchase1 = "hiosfdfshiodshiodf"
		let newPurchase2 = null
		let firstNewPropertyName1 = "page1"
		let firstNewPropertyValue1 = 123
		let firstNewPropertyName2 = "test1"
		let firstNewPropertyValue2 = 97523.234243
		let secondNewPropertyName1 = "page2"
		let secondNewPropertyValue1 = 984014
		let secondNewPropertyName2 = "test2"
		let secondNewPropertyValue2 = 92734.123

		let newTableObject1 = new TableObject()
		newTableObject1.Uuid = uuid1
		newTableObject1.TableId = tableId1
		newTableObject1.UploadStatus = newUploadStatus1
		newTableObject1.Etag = newEtag1
		newTableObject1.BelongsToUser = newBelongsToUser1
		newTableObject1.Purchase = newPurchase1
		newTableObject1.Properties = {
			[firstNewPropertyName1]: { value: firstNewPropertyValue1 },
			[secondNewPropertyName1]: { value: secondNewPropertyValue1 }
		}

		let newTableObject2 = new TableObject()
		newTableObject2.Uuid = uuid2
		newTableObject2.TableId = tableId2
		newTableObject2.UploadStatus = newUploadStatus2
		newTableObject2.Etag = newEtag2
		newTableObject2.BelongsToUser = newBelongsToUser2
		newTableObject2.Purchase = newPurchase2
		newTableObject2.Properties = {
			[firstNewPropertyName2]: { value: firstNewPropertyValue2 },
			[secondNewPropertyName2]: { value: secondNewPropertyValue2 }
		}

		// Act
		let updatedTableObjectUuids = await DatabaseOperations.SetTableObjects([
			newTableObject1,
			newTableObject2
		])

		// Assert
		assert.equal(updatedTableObjectUuids.length, 2)
		assert.equal(updatedTableObjectUuids[0], uuid1)
		assert.equal(updatedTableObjectUuids[1], uuid2)

		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid1, tableId1)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.TableId, tableId1)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, newUploadStatus1)
		assert.equal(firstTableObjectFromDatabase.Etag, newEtag1)
		assert.equal(firstTableObjectFromDatabase.BelongsToUser, newBelongsToUser1)
		assert.equal(firstTableObjectFromDatabase.Purchase, newPurchase1)

		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 2)
		assert.equal(firstTableObjectFromDatabase.Properties[firstNewPropertyName1].value, firstNewPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondNewPropertyName1].value, secondNewPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid2, tableId2)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.TableId, tableId2)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, newUploadStatus2)
		assert.equal(secondTableObjectFromDatabase.Etag, newEtag2)
		assert.equal(secondTableObjectFromDatabase.BelongsToUser, newBelongsToUser2)
		assert.equal(secondTableObjectFromDatabase.Purchase, newPurchase2)

		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 2)
		assert.equal(secondTableObjectFromDatabase.Properties[firstNewPropertyName2].value, firstNewPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondNewPropertyName2].value, secondNewPropertyValue2)
	})

	it("should adopt local properties of the existing table objects, overwrite the table objects in the database and return the uuids", async () => {
		// Arrange
		let uuid1 = generateUuid()
		let uuid2 = generateUuid()
		let tableId1 = 13
		let tableId2 = 42

		let newUploadStatus1 = TableObjectUploadStatus.New
		let newUploadStatus2 = TableObjectUploadStatus.Deleted
		let newEtag1 = "oijsegioasf"
		let newEtag2 = "oinsdgjdsoknsdf"
		let newBelongsToUser1 = false
		let newBelongsToUser2 = true
		let newPurchase1 = "isohsdfshodf"
		let newPurchase2 = null

		let firstLocalPropertyName1 = "local1"
		let firstLocalPropertyValue1 = "Hello World"
		let firstLocalPropertyName2 = "page1"
		let firstLocalPropertyValue2 = "Good day"

		let secondLocalPropertyName1 = "local2"
		let secondLocalPropertyValue1 = "Hallo Welt"
		let secondLocalPropertyName2 = "page2"
		let secondLocalPropertyValue2 = "Guten Tag"

		let firstPropertyName1 = "bla1"
		let firstPropertyValue1 = "asdasdasd"
		let firstPropertyName2 = "test1"
		let firstPropertyValue2 = "Lorem ipsum"

		let secondPropertyName1 = "bla2"
		let secondPropertyValue1 = "googjogpjae"
		let secondPropertyName2 = "test2"
		let secondPropertyValue2 = "dolor sit amet"

		let tableObject1 = new TableObject()
		tableObject1.Uuid = uuid1
		tableObject1.TableId = tableId1
		tableObject1.UploadStatus = TableObjectUploadStatus.UpToDate
		tableObject1.Etag = "oijhrsguisadfo"
		tableObject1.BelongsToUser = true
		tableObject1.Purchase = "ohisdfhosdfhosdf"
		tableObject1.Properties = {
			[firstLocalPropertyName1]: { value: firstLocalPropertyValue1, local: true },
			[firstPropertyName1]: { value: "asasdasd" },
			[secondLocalPropertyName1]: { value: secondLocalPropertyValue1, local: true },
			[secondPropertyName1]: { value: "ibdasibdgsibsdgo" }
		}

		let tableObject2 = new TableObject()
		tableObject2.Uuid = uuid2
		tableObject2.TableId = tableId2
		tableObject2.UploadStatus = TableObjectUploadStatus.UpToDate
		tableObject2.Etag = "oihsg9asdpmasd"
		tableObject2.BelongsToUser = false
		tableObject2.Purchase = "osdhiosdhiosdfhiosdf"
		tableObject2.Properties = {
			[firstLocalPropertyName2]: { value: firstLocalPropertyValue2, local: true },
			[firstPropertyName2]: { value: "asdasdasdp" },
			[secondLocalPropertyName2]: { value: secondLocalPropertyValue2, local: true },
			[secondPropertyName2]: { value: "aobadj asa3" }
		}

		await DatabaseOperations.SetTableObjects([
			tableObject1,
			tableObject2
		])

		let newTableObject1 = new TableObject()
		newTableObject1.Uuid = uuid1
		newTableObject1.TableId = tableId1
		newTableObject1.UploadStatus = newUploadStatus1
		newTableObject1.Etag = newEtag1
		newTableObject1.BelongsToUser = newBelongsToUser1
		newTableObject1.Purchase = newPurchase1
		newTableObject1.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let newTableObject2 = new TableObject()
		newTableObject2.Uuid = uuid2
		newTableObject2.TableId = tableId2
		newTableObject2.UploadStatus = newUploadStatus2
		newTableObject2.Etag = newEtag2
		newTableObject2.BelongsToUser = newBelongsToUser2
		newTableObject2.Purchase = newPurchase2
		newTableObject2.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		// Act
		let updatedTableObjectUuids = await DatabaseOperations.SetTableObjects([
			newTableObject1,
			newTableObject2
		], false)

		// Assert
		assert.equal(updatedTableObjectUuids.length, 2)
		assert.equal(updatedTableObjectUuids[0], uuid1)
		assert.equal(updatedTableObjectUuids[1], uuid2)

		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid1, tableId1)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.Uuid, uuid1)
		assert.equal(firstTableObjectFromDatabase.TableId, tableId1)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, newUploadStatus1)
		assert.equal(firstTableObjectFromDatabase.Etag, newEtag1)
		assert.equal(firstTableObjectFromDatabase.BelongsToUser, newBelongsToUser1)
		assert.equal(firstTableObjectFromDatabase.Purchase, newPurchase1)

		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 4)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondPropertyName1].value, secondPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[firstLocalPropertyName1].value, firstLocalPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondLocalPropertyName1].value, secondLocalPropertyValue1)
		assert.isTrue(firstTableObjectFromDatabase.Properties[firstLocalPropertyName1].local)
		assert.isTrue(firstTableObjectFromDatabase.Properties[secondLocalPropertyName1].local)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid2, tableId2)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.Uuid, uuid2)
		assert.equal(secondTableObjectFromDatabase.TableId, tableId2)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, newUploadStatus2)
		assert.equal(secondTableObjectFromDatabase.Etag, newEtag2)
		assert.equal(secondTableObjectFromDatabase.BelongsToUser, newBelongsToUser2)
		assert.equal(secondTableObjectFromDatabase.Purchase, newPurchase2)

		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 4)
		assert.equal(secondTableObjectFromDatabase.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName2].value, secondPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[firstLocalPropertyName2].value, firstLocalPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondLocalPropertyName2].value, secondLocalPropertyValue2)
		assert.isTrue(secondTableObjectFromDatabase.Properties[firstLocalPropertyName2].local)
		assert.isTrue(secondTableObjectFromDatabase.Properties[secondLocalPropertyName2].local)
	})

	it("should adopt local properties of the existing table objects with different value types, overwrite the table objects in the database and return the uuids", async () => {
		// Arrange
		let uuid1 = generateUuid()
		let uuid2 = generateUuid()
		let tableId1 = 13
		let tableId2 = 42

		let newUploadStatus1 = TableObjectUploadStatus.New
		let newUploadStatus2 = TableObjectUploadStatus.Deleted
		let newEtag1 = "oijsegioasf"
		let newEtag2 = "oinsdgjdsoknsdf"
		let newBelongsToUser1 = false
		let newBelongsToUser2 = true
		let newPurchase1 = "isohsdfshodf"
		let newPurchase2 = null

		let firstLocalPropertyName1 = "local1"
		let firstLocalPropertyValue1 = false
		let firstLocalPropertyName2 = "page1"
		let firstLocalPropertyValue2 = true

		let secondLocalPropertyName1 = "local2"
		let secondLocalPropertyValue1 = 123
		let secondLocalPropertyName2 = "page2"
		let secondLocalPropertyValue2 = 135

		let firstPropertyName1 = "bla1"
		let firstPropertyValue1 = 93753
		let firstPropertyName2 = "test1"
		let firstPropertyValue2 = 29234

		let secondPropertyName1 = "bla2"
		let secondPropertyValue1 = 90252
		let secondPropertyName2 = "test2"
		let secondPropertyValue2 = 72619

		let tableObject1 = new TableObject()
		tableObject1.Uuid = uuid1
		tableObject1.TableId = tableId1
		tableObject1.UploadStatus = TableObjectUploadStatus.UpToDate
		tableObject1.Etag = "oijhrsguisadfo"
		tableObject1.BelongsToUser = true
		tableObject1.Purchase = "ohisdfhosdfhosdf"
		tableObject1.Properties = {
			[firstLocalPropertyName1]: { value: firstLocalPropertyValue1, local: true },
			[firstPropertyName1]: { value: 3672884 },
			[secondLocalPropertyName1]: { value: secondLocalPropertyValue1, local: true },
			[secondPropertyName1]: { value: 9235982 }
		}

		let tableObject2 = new TableObject()
		tableObject2.Uuid = uuid2
		tableObject2.TableId = tableId2
		tableObject2.UploadStatus = TableObjectUploadStatus.UpToDate
		tableObject2.Etag = "oihsg9asdpmasd"
		tableObject2.BelongsToUser = false
		tableObject2.Purchase = "osdhiosdhiosdfhiosdf"
		tableObject2.Properties = {
			[firstLocalPropertyName2]: { value: firstLocalPropertyValue2, local: true },
			[firstPropertyName2]: { value: 2394782 },
			[secondLocalPropertyName2]: { value: secondLocalPropertyValue2, local: true },
			[secondPropertyName2]: { value: 120840 }
		}

		await DatabaseOperations.SetTableObjects([
			tableObject1,
			tableObject2
		])

		let newTableObject1 = new TableObject()
		newTableObject1.Uuid = uuid1
		newTableObject1.TableId = tableId1
		newTableObject1.UploadStatus = newUploadStatus1
		newTableObject1.Etag = newEtag1
		newTableObject1.BelongsToUser = newBelongsToUser1
		newTableObject1.Purchase = newPurchase1
		newTableObject1.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let newTableObject2 = new TableObject()
		newTableObject2.Uuid = uuid2
		newTableObject2.TableId = tableId2
		newTableObject2.UploadStatus = newUploadStatus2
		newTableObject2.Etag = newEtag2
		newTableObject2.BelongsToUser = newBelongsToUser2
		newTableObject2.Purchase = newPurchase2
		newTableObject2.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		// Act
		let updatedTableObjectUuids = await DatabaseOperations.SetTableObjects([
			newTableObject1,
			newTableObject2
		], false)

		// Assert
		assert.equal(updatedTableObjectUuids.length, 2)
		assert.equal(updatedTableObjectUuids[0], uuid1)
		assert.equal(updatedTableObjectUuids[1], uuid2)

		let firstTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid1, tableId1)
		assert.isNotNull(firstTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.Uuid, uuid1)
		assert.equal(firstTableObjectFromDatabase.TableId, tableId1)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, newUploadStatus1)
		assert.equal(firstTableObjectFromDatabase.Etag, newEtag1)
		assert.equal(firstTableObjectFromDatabase.BelongsToUser, newBelongsToUser1)
		assert.equal(firstTableObjectFromDatabase.Purchase, newPurchase1)

		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 4)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondPropertyName1].value, secondPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[firstLocalPropertyName1].value, firstLocalPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondLocalPropertyName1].value, secondLocalPropertyValue1)
		assert.isTrue(firstTableObjectFromDatabase.Properties[firstLocalPropertyName1].local)
		assert.isTrue(firstTableObjectFromDatabase.Properties[secondLocalPropertyName1].local)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid2, tableId2)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.Uuid, uuid2)
		assert.equal(secondTableObjectFromDatabase.TableId, tableId2)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, newUploadStatus2)
		assert.equal(secondTableObjectFromDatabase.Etag, newEtag2)
		assert.equal(secondTableObjectFromDatabase.BelongsToUser, newBelongsToUser2)
		assert.equal(secondTableObjectFromDatabase.Purchase, newPurchase2)

		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 4)
		assert.equal(secondTableObjectFromDatabase.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName2].value, secondPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[firstLocalPropertyName2].value, firstLocalPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondLocalPropertyName2].value, secondLocalPropertyValue2)
		assert.isTrue(secondTableObjectFromDatabase.Properties[firstLocalPropertyName2].local)
		assert.isTrue(secondTableObjectFromDatabase.Properties[secondLocalPropertyName2].local)
	})
})

describe("GetAllTableObjects function", () => {
	it("should return table objects that are not deleted", async () => {
		// Arrange
		let firstUuid = generateUuid()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstBelongsToUser = false
		let firstPurchase = "sdfpjsdpsdfjpsdf"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject({
			Uuid: firstUuid,
			TableId: firstTableId,
			UploadStatus: firstUploadStatus,
			Etag: firstEtag,
			BelongsToUser: firstBelongsToUser,
			Purchase: firstPurchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue }
			}
		})

		let secondUuid = generateUuid()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondBelongsToUser = true
		let secondPurchase = null
		let secondPropertyName = "test2"
		let secondPropertyValue = 12345.123

		let secondTableObject = new TableObject({
			Uuid: secondUuid,
			TableId: secondTableId,
			UploadStatus: secondUploadStatus,
			Etag: secondEtag,
			BelongsToUser: secondBelongsToUser,
			Purchase: secondPurchase,
			Properties: {
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let thirdUuid = generateUuid()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdBelongsToUser = false
		let thirdPurchase = null
		let thirdPropertyName = "test3"
		let thirdPropertyValue = true

		let thirdTableObject = new TableObject({
			Uuid: thirdUuid,
			TableId: thirdTableId,
			UploadStatus: thirdUploadStatus,
			Etag: thirdEtag,
			BelongsToUser: thirdBelongsToUser,
			Purchase: thirdPurchase,
			Properties: {
				[thirdPropertyName]: { value: thirdPropertyValue }
			}
		})

		let fourthUuid = generateUuid()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthBelongsToUser = true
		let fourthPurchase = "hkosfdhiosfdhiosfd"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = 9402

		let fourthTableObject = new TableObject({
			Uuid: fourthUuid,
			TableId: fourthTableId,
			UploadStatus: fourthUploadStatus,
			Etag: fourthEtag,
			BelongsToUser: fourthBelongsToUser,
			Purchase: fourthPurchase,
			Properties: {
				[fourthPropertyName]: { value: fourthPropertyValue }
			}
		})

		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject,
			fourthTableObject
		])

		// Act
		let tableObjects = await DatabaseOperations.GetAllTableObjects()

		// Assert
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(tableObjects[0].UploadStatus, firstUploadStatus)
		assert.equal(tableObjects[0].Etag, firstEtag)
		assert.equal(tableObjects[0].BelongsToUser, firstBelongsToUser)
		assert.equal(tableObjects[0].Purchase, firstPurchase)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, thirdUuid)
		assert.equal(tableObjects[1].TableId, thirdTableId)
		assert.equal(tableObjects[1].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[1].Etag, thirdEtag)
		assert.equal(tableObjects[1].BelongsToUser, thirdBelongsToUser)
		assert.equal(tableObjects[1].Purchase, thirdPurchase)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[thirdPropertyName].value, thirdPropertyValue)
	})

	it("should return all table objects", async () => {
		// Arrange
		let firstUuid = generateUuid()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstBelongsToUser = false
		let firstPurchase = "sdfpjsdpsdfjpsdf"
		let firstPropertyName = "test1"
		let firstPropertyValue = 12345

		let firstTableObject = new TableObject({
			Uuid: firstUuid,
			TableId: firstTableId,
			UploadStatus: firstUploadStatus,
			Etag: firstEtag,
			BelongsToUser: firstBelongsToUser,
			Purchase: firstPurchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue }
			}
		})

		let secondUuid = generateUuid()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondBelongsToUser = true
		let secondPurchase = null
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject({
			Uuid: secondUuid,
			TableId: secondTableId,
			UploadStatus: secondUploadStatus,
			Etag: secondEtag,
			BelongsToUser: secondBelongsToUser,
			Purchase: secondPurchase,
			Properties: {
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let thirdUuid = generateUuid()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdBelongsToUser = false
		let thirdPurchase = null
		let thirdPropertyName = "test3"
		let thirdPropertyValue = false

		let thirdTableObject = new TableObject({
			Uuid: thirdUuid,
			TableId: thirdTableId,
			UploadStatus: thirdUploadStatus,
			Etag: thirdEtag,
			BelongsToUser: thirdBelongsToUser,
			Purchase: thirdPurchase,
			Properties: {
				[thirdPropertyName]: { value: thirdPropertyValue }
			}
		})

		let fourthUuid = generateUuid()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthBelongsToUser = false
		let fourthPurchase = "hkosfdhiosfdhiosfd"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = 9183.12

		let fourthTableObject = new TableObject({
			Uuid: fourthUuid,
			TableId: fourthTableId,
			UploadStatus: fourthUploadStatus,
			Etag: fourthEtag,
			BelongsToUser: fourthBelongsToUser,
			Purchase: fourthPurchase,
			Properties: {
				[fourthPropertyName]: { value: fourthPropertyValue }
			}
		})

		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject,
			fourthTableObject
		])

		// Act
		let tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)

		// Assert
		assert.equal(tableObjects.length, 4)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(tableObjects[0].UploadStatus, firstUploadStatus)
		assert.equal(tableObjects[0].Etag, firstEtag)
		assert.equal(tableObjects[0].BelongsToUser, firstBelongsToUser)
		assert.equal(tableObjects[0].Purchase, firstPurchase)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, secondUuid)
		assert.equal(tableObjects[1].TableId, secondTableId)
		assert.equal(tableObjects[1].UploadStatus, secondUploadStatus)
		assert.equal(tableObjects[1].Etag, secondEtag)
		assert.equal(tableObjects[1].BelongsToUser, secondBelongsToUser)
		assert.equal(tableObjects[1].Purchase, secondPurchase)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[secondPropertyName].value, secondPropertyValue)

		assert.equal(tableObjects[2].Uuid, thirdUuid)
		assert.equal(tableObjects[2].TableId, thirdTableId)
		assert.equal(tableObjects[2].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[2].Etag, thirdEtag)
		assert.equal(tableObjects[2].BelongsToUser, thirdBelongsToUser)
		assert.equal(tableObjects[2].Purchase, thirdPurchase)
		assert.equal(Object.keys(tableObjects[2].Properties).length, 1)
		assert.equal(tableObjects[2].Properties[thirdPropertyName].value, thirdPropertyValue)

		assert.equal(tableObjects[3].Uuid, fourthUuid)
		assert.equal(tableObjects[3].TableId, fourthTableId)
		assert.equal(tableObjects[3].UploadStatus, fourthUploadStatus)
		assert.equal(tableObjects[3].Etag, fourthEtag)
		assert.equal(tableObjects[3].BelongsToUser, fourthBelongsToUser)
		assert.equal(tableObjects[3].Purchase, fourthPurchase)
		assert.equal(Object.keys(tableObjects[3].Properties).length, 1)
		assert.equal(tableObjects[3].Properties[fourthPropertyName].value, fourthPropertyValue)
	})

	it("should return all table objects of a table that are not deleted", async () => {
		// Arrange
		let firstUuid = generateUuid()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstBelongsToUser = false
		let firstPurchase = "sdfpjsdpsdfjpsdf"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject({
			Uuid: firstUuid,
			TableId: firstTableId,
			UploadStatus: firstUploadStatus,
			Etag: firstEtag,
			BelongsToUser: firstBelongsToUser,
			Purchase: firstPurchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue }
			}
		})

		let secondUuid = generateUuid()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondBelongsToUser = true
		let secondPurchase = null
		let secondPropertyName = "test2"
		let secondPropertyValue = 124

		let secondTableObject = new TableObject({
			Uuid: secondUuid,
			TableId: secondTableId,
			UploadStatus: secondUploadStatus,
			Etag: secondEtag,
			BelongsToUser: secondBelongsToUser,
			Purchase: secondPurchase,
			Properties: {
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let thirdUuid = generateUuid()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdBelongsToUser = false
		let thirdPurchase = null
		let thirdPropertyName = "test3"
		let thirdPropertyValue = true

		let thirdTableObject = new TableObject({
			Uuid: thirdUuid,
			TableId: thirdTableId,
			UploadStatus: thirdUploadStatus,
			Etag: thirdEtag,
			BelongsToUser: thirdBelongsToUser,
			Purchase: thirdPurchase,
			Properties: {
				[thirdPropertyName]: { value: thirdPropertyValue }
			}
		})

		let fourthUuid = generateUuid()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthBelongsToUser = false
		let fourthPurchase = "hkosfdhiosfdhiosfd"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = 98234.234

		let fourthTableObject = new TableObject({
			Uuid: fourthUuid,
			TableId: fourthTableId,
			UploadStatus: fourthUploadStatus,
			Etag: fourthEtag,
			BelongsToUser: fourthBelongsToUser,
			Purchase: fourthPurchase,
			Properties: {
				[fourthPropertyName]: { value: fourthPropertyValue }
			}
		})

		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject,
			fourthTableObject
		])

		// Act
		let tableObjects = await DatabaseOperations.GetAllTableObjects(firstTableId)

		// Assert
		assert.equal(tableObjects.length, 1)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(tableObjects[0].UploadStatus, firstUploadStatus)
		assert.equal(tableObjects[0].Etag, firstEtag)
		assert.equal(tableObjects[0].BelongsToUser, firstBelongsToUser)
		assert.equal(tableObjects[0].Purchase, firstPurchase)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)
	})

	it("should return all table objects of a table", async () => {
		// Arrange
		let firstUuid = generateUuid()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstBelongsToUser = false
		let firstPurchase = "sdfpjsdpsdfjpsdf"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject({
			Uuid: firstUuid,
			TableId: firstTableId,
			UploadStatus: firstUploadStatus,
			Etag: firstEtag,
			BelongsToUser: firstBelongsToUser,
			Purchase: firstPurchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue }
			}
		})

		let secondUuid = generateUuid()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondBelongsToUser = true
		let secondPurchase = null
		let secondPropertyName = "test2"
		let secondPropertyValue = 987

		let secondTableObject = new TableObject({
			Uuid: secondUuid,
			TableId: secondTableId,
			UploadStatus: secondUploadStatus,
			Etag: secondEtag,
			BelongsToUser: secondBelongsToUser,
			Purchase: secondPurchase,
			Properties: {
				[secondPropertyName]: { value: secondPropertyValue }
			}
		})

		let thirdUuid = generateUuid()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdBelongsToUser = false
		let thirdPurchase = null
		let thirdPropertyName = "test3"
		let thirdPropertyValue = false

		let thirdTableObject = new TableObject({
			Uuid: thirdUuid,
			TableId: thirdTableId,
			UploadStatus: thirdUploadStatus,
			Etag: thirdEtag,
			BelongsToUser: thirdBelongsToUser,
			Purchase: thirdPurchase,
			Properties: {
				[thirdPropertyName]: { value: thirdPropertyValue }
			}
		})

		let fourthUuid = generateUuid()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthBelongsToUser = false
		let fourthPurchase = "hkosfdhiosfdhiosfd"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = 12.43

		let fourthTableObject = new TableObject({
			Uuid: fourthUuid,
			TableId: fourthTableId,
			UploadStatus: fourthUploadStatus,
			Etag: fourthEtag,
			BelongsToUser: fourthBelongsToUser,
			Purchase: fourthPurchase,
			Properties: {
				[fourthPropertyName]: { value: fourthPropertyValue }
			}
		})

		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject,
			fourthTableObject
		])

		// Act
		let tableObjects = await DatabaseOperations.GetAllTableObjects(thirdTableId, true)

		// Assert
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, thirdUuid)
		assert.equal(tableObjects[0].TableId, thirdTableId)
		assert.equal(tableObjects[0].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[0].Etag, thirdEtag)
		assert.equal(tableObjects[0].BelongsToUser, thirdBelongsToUser)
		assert.equal(tableObjects[0].Purchase, thirdPurchase)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[thirdPropertyName].value, thirdPropertyValue)

		assert.equal(tableObjects[1].Uuid, fourthUuid)
		assert.equal(tableObjects[1].TableId, fourthTableId)
		assert.equal(tableObjects[1].UploadStatus, fourthUploadStatus)
		assert.equal(tableObjects[1].Etag, fourthEtag)
		assert.equal(tableObjects[1].BelongsToUser, fourthBelongsToUser)
		assert.equal(tableObjects[1].Purchase, fourthPurchase)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[fourthPropertyName].value, fourthPropertyValue)
	})
})

describe("GetTableObject function", () => {
	it("should return the table object", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 14
		let uploadStatus = TableObjectUploadStatus.New
		let etag = "asdonsdgonasdpnasd"
		let belongsToUser = false
		let purchase = "kldsdfosdfhiosdsfd"
		let firstPropertyName = "test"
		let firstPropertyValue = 124

		new Dav({
			environment: Environment.Test,
			appId: 1,
			tableIds: [tableId]
		})

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			UploadStatus: uploadStatus,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue }
			}
		})

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)

		// Assert
		assert.isNotNull(tableObjectFromDatabase)

		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
		assert.equal(tableObjectFromDatabase.BelongsToUser, belongsToUser)
		assert.equal(tableObjectFromDatabase.Purchase, purchase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
	})

	it("should return the table object without tableId", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 14
		let uploadStatus = TableObjectUploadStatus.New
		let etag = "asdonsdgonasdpnasd"
		let belongsToUser = true
		let purchase = null
		let firstPropertyName = "test"
		let firstPropertyValue = 124

		new Dav({
			environment: Environment.Test,
			appId: 1,
			tableIds: [tableId]
		})

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			UploadStatus: uploadStatus,
			Etag: etag,
			BelongsToUser: belongsToUser,
			Purchase: purchase,
			Properties: {
				[firstPropertyName]: { value: firstPropertyValue }
			}
		})

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)

		// Assert
		assert.isNotNull(tableObjectFromDatabase)

		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
		assert.equal(tableObjectFromDatabase.BelongsToUser, belongsToUser)
		assert.equal(tableObjectFromDatabase.Purchase, purchase)
		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 1)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
	})

	it("should return null if the table object does not exist", async () => {
		// Arrange
		let uuid = generateUuid()

		// Act
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)

		// Assert
		assert.isNull(tableObjectFromDatabase)
	})
})

describe("TableObjectExists function", () => {
	it("should return true if the table object exists", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 123

		new Dav({
			environment: Environment.Test,
			appId: 1,
			tableIds: [tableId]
		})

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId
		})

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		let tableObjectExists = await DatabaseOperations.TableObjectExists(uuid, tableId)

		// Assert
		assert.isTrue(tableObjectExists)
	})

	it("should return true if the table object exists without tableId", async () => {
		// Arrange
		let uuid = generateUuid()
		let tableId = 123

		new Dav({
			environment: Environment.Test,
			appId: 1,
			tableIds: [tableId]
		})

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId
		})

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		let tableObjectExists = await DatabaseOperations.TableObjectExists(uuid)

		// Assert
		assert.isTrue(tableObjectExists)
	})

	it("should return false if the table object does not exist", async () => {
		// Arrange
		let uuid = generateUuid()

		// Act
		let tableObjectExists = await DatabaseOperations.TableObjectExists(uuid)

		// Assert
		assert.isFalse(tableObjectExists)
	})
})

describe("RemoveTableObject function", () => {
	it("should remove the table object from the database", async () => {
		// Arrage
		let uuid = generateUuid()
		let tableId = 13

		new Dav({
			environment: Environment.Test,
			appId: 1,
			tableIds: [tableId]
		})

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			Properties: {
				"test": { value: "blablabla" }
			}
		})

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DatabaseOperations.RemoveTableObject(uuid, tableId)

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNull(tableObjectFromDatabase)
	})

	it("should remove the table object from the database without tableId", async () => {
		// Arrage
		let uuid = generateUuid()
		let tableId = 13

		new Dav({
			environment: Environment.Test,
			appId: 1,
			tableIds: [tableId]
		})

		let tableObject = new TableObject({
			Uuid: uuid,
			TableId: tableId,
			Properties: {
				"test": { value: "blablabla" }
			}
		})

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DatabaseOperations.RemoveTableObject(uuid)

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNull(tableObjectFromDatabase)
	})
})