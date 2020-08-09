import 'mocha';
import { assert } from 'chai';
import * as localforage from "localforage";
import { Dav, Init } from '../../lib/Dav';
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import * as DataManager from '../../lib/providers/DataManager';
import { Notification } from '../../lib/models/Notification';
import { TableObject, TableObjectUploadStatus, generateUUID } from '../../lib/models/TableObject';
import { DavEnvironment } from '../../lib/models/DavUser';
import {
	davClassLibraryTestUserXTestUserJwt,
	davClassLibraryTestAppId,
	testDataTableId,
	firstPropertyName,
	secondPropertyName,
	firstTestDataTableObject,
	secondTestDataTableObject,
	firstTestNotification,
	secondTestNotification,
	firstNotificationPropertyName,
	secondNotificationPropertyName
} from '../Constants';
import {
	GetTableObjectFromServer,
	DeleteTableObjectFromServer,
	GetSubscriptionFromServer,
	GetNotificationFromServer,
	DeleteNotificationFromServer
} from '../utils';

beforeEach(async () => {
	// Reset global variables
	Dav.skipSyncPushInTests = true
	Dav.jwt = null

	// Clear the database
	await localforage.clear()
})

describe("Sync function", () => {
	it("should download all table objects from the server", async () => {
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
		await DataManager.Sync()

		// Assert
		var tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstTestDataTableObject.Uuid)
		assert.equal(tableObjects[0].TableId, testDataTableId)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstTestDataTableObject.Properties[firstPropertyName].value)
		assert.equal(tableObjects[0].Properties[secondPropertyName].value, firstTestDataTableObject.Properties[secondPropertyName].value)

		assert.equal(tableObjects[1].Uuid, secondTestDataTableObject.Uuid)
		assert.equal(tableObjects[1].TableId, testDataTableId)
		assert.equal(tableObjects[1].Properties[firstPropertyName].value, secondTestDataTableObject.Properties[firstPropertyName].value)
		assert.equal(tableObjects[1].Properties[secondPropertyName].value, secondTestDataTableObject.Properties[secondPropertyName].value)
	})

	it("should remove the table objects that are not on the server", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let deletedTableObject = new TableObject()
		deletedTableObject.UploadStatus = TableObjectUploadStatus.UpToDate
		deletedTableObject.TableId = testDataTableId

		await DatabaseOperations.SetTableObject(deletedTableObject)

		// Act
		await DataManager.Sync()

		// Assert
		let deletedTableObjectFromDatabase = await DatabaseOperations.GetTableObject(deletedTableObject.Uuid, deletedTableObject.TableId)
		assert.isNull(deletedTableObjectFromDatabase)

		let tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstTestDataTableObject.Uuid)
		assert.equal(tableObjects[0].TableId, testDataTableId)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstTestDataTableObject.Properties[firstPropertyName].value)
		assert.equal(tableObjects[0].Properties[secondPropertyName].value, firstTestDataTableObject.Properties[secondPropertyName].value)

		assert.equal(tableObjects[1].Uuid, secondTestDataTableObject.Uuid)
		assert.equal(tableObjects[1].TableId, testDataTableId)
		assert.equal(tableObjects[1].Properties[firstPropertyName].value, secondTestDataTableObject.Properties[firstPropertyName].value)
		assert.equal(tableObjects[1].Properties[secondPropertyName].value, secondTestDataTableObject.Properties[secondPropertyName].value)
	})

	it("should update only the table objects with a new etag", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		await DataManager.Sync()

		// Change the etag so that it downloads the table object again
		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(secondTestDataTableObject.Uuid, secondTestDataTableObject.TableId)
		let oldEtag = secondTableObjectFromDatabase.Etag
		secondTableObjectFromDatabase.Properties[firstPropertyName].value = "blablabla"
		secondTableObjectFromDatabase.Etag = "blablabla"

		// Act
		await DataManager.Sync()

		// Assert
		let secondTableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(secondTestDataTableObject.Uuid, secondTestDataTableObject.TableId)
		assert.equal(oldEtag, secondTableObjectFromDatabase2.Etag)
		assert.equal(secondTestDataTableObject.Properties[firstPropertyName].value, secondTableObjectFromDatabase2.Properties[firstPropertyName].value)
	})
})

describe("SyncPush function", () => {
	it("should upload new table objects", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		});
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let tableObject = new TableObject()
		tableObject.TableId = testDataTableId
		tableObject.Properties = {
			[firstPropertyName]: { value: "Testtest" },
			[secondPropertyName]: { value: "Test" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DataManager.SyncPush()

		// Assert
		let tableObjectFromServer = await GetTableObjectFromServer(tableObject.Uuid)
		assert.isNotNull(tableObjectFromServer)

		assert.equal(testDataTableId, tableObjectFromServer.TableId)
		assert.equal(tableObject.Properties[firstPropertyName].value, tableObjectFromServer.Properties[firstPropertyName].value)
		assert.equal(tableObject.Properties[secondPropertyName].value, tableObjectFromServer.Properties[secondPropertyName].value)

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid)
		assert.equal(TableObjectUploadStatus.UpToDate, tableObjectFromDatabase.UploadStatus)

		// Tidy up
		await DeleteTableObjectFromServer(tableObject.Uuid)
	})

	it("should upload updated table objects", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		await DataManager.Sync()

		let newPropertyValue = "testtest"

		let tableObject = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid)
		tableObject.Properties[firstPropertyName].value = newPropertyValue
		tableObject.UploadStatus = TableObjectUploadStatus.Updated

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DataManager.SyncPush()

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid)
		assert.equal(tableObjectFromDatabase.UploadStatus, TableObjectUploadStatus.UpToDate)

		let tableObjectFromServer = await GetTableObjectFromServer(tableObject.Uuid)
		assert.equal(tableObjectFromServer.Properties[firstPropertyName].value, newPropertyValue)

		// Tidy up
		tableObjectFromDatabase.Properties[firstPropertyName] = firstTestDataTableObject.Properties[firstPropertyName]
		tableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Updated
		await DatabaseOperations.SetTableObject(tableObjectFromDatabase)
		await DataManager.SyncPush()
	})

	it("should upload deleted table objects", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		let tableObject = new TableObject()
		tableObject.TableId = testDataTableId
		tableObject.Properties = {
			[firstPropertyName]: { value: "blabla" },
			[secondPropertyName]: { value: "testtest" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		await DataManager.SyncPush()

		var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		tableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Deleted

		await DatabaseOperations.SetTableObject(tableObjectFromDatabase)

		// Act
		await DataManager.SyncPush()

		// Assert
		let tableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNull(tableObjectFromDatabase2)

		let tableObjectFromServer = await GetTableObjectFromServer(tableObject.Uuid)
		assert.isNull(tableObjectFromServer)
	})

	it("should delete updated table objects that do not exist on the server", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Save a table object with upload status updated in the database and run SyncPush
		let tableObject = new TableObject()
		tableObject.TableId = testDataTableId
		tableObject.UploadStatus = TableObjectUploadStatus.Updated

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DataManager.SyncPush()

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNull(tableObjectFromDatabase)
	})

	it("should delete deleted table objects that do not exist on the server", async () => {
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt

		// Save a table object with upload status deleted in the database and run SyncPush
		var tableObject = new TableObject()
		tableObject.TableId = testDataTableId
		tableObject.UploadStatus = TableObjectUploadStatus.Deleted

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DataManager.SyncPush()

		// Assert
		var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId)
		assert.isNull(tableObjectFromDatabase)
	})
})

describe("DownloadTableObject function", () => {
	it("should download table object", async () => {
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
		await DataManager.DownloadTableObject(firstTestDataTableObject.Uuid)

		// Assert
		var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid, firstTestDataTableObject.TableId)
		assert.isNotNull(tableObjectFromDatabase)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstTestDataTableObject.Properties[firstPropertyName].value)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, firstTestDataTableObject.Properties[secondPropertyName].value)
	})

	it("should not download table object that does not exist", async () => {
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

		// Act
		await DataManager.DownloadTableObject(uuid)

		// Assert
		var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)
		assert.isNull(tableObjectFromDatabase)
	})
})

describe("UpdateLocalTableObject function", () => {
	it("should get the table object from the server and update it locally", async () => {
		// Arrange
		// Get all table objects from the server
		let callbackCalled = false
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => {
				callbackCalled = true
			},
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt
		await DataManager.Sync()

		// Update the table object in the database
		let tableObject = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid, firstTestDataTableObject.TableId)
		tableObject.Properties[firstPropertyName].value = "blabla"
		tableObject.Properties[secondPropertyName].value = "testtest"
		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DataManager.UpdateLocalTableObject(firstTestDataTableObject.Uuid)

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid, firstTestDataTableObject.TableId)

		// The table object should be the same as before
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstTestDataTableObject.Properties[firstPropertyName].value)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, firstTestDataTableObject.Properties[secondPropertyName].value)
		assert.isTrue(callbackCalled)
	})
})

describe("DeleteLocalTableObject function", () => {
	it("should delete the table object locally", async () => {
		// Assert
		// Get all table objects from the server
		let callbackCalled = false
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => {
				callbackCalled = true
			},
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})
		Dav.jwt = davClassLibraryTestUserXTestUserJwt
		await DataManager.Sync()

		// Act
		await DataManager.DeleteLocalTableObject(firstTestDataTableObject.Uuid)

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid, firstTestDataTableObject.TableId)
		assert.isNull(tableObjectFromDatabase)
		assert.isTrue(callbackCalled)
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

		let subscriptionFromServer = await GetSubscriptionFromServer(uuid)
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
		await DeleteNotificationFromServer(uuid)
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
		await DeleteNotificationFromServer(uuid);
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
		let notificationFromServer = await GetNotificationFromServer(uuid)
		assert.isNotNull(notificationFromServer)
		assert.equal(notificationFromServer.time, time)
		assert.equal(notificationFromServer.interval, interval)
		assert.equal(notificationFromServer.properties["title"], firstPropertyValue)
		assert.equal(notificationFromServer.properties["message"], secondPropertyValue)

		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid)
		assert.equal(notificationFromDatabase.Status, DataManager.UploadStatus.UpToDate)

		// Tidy up
		await DeleteNotificationFromServer(uuid)
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
		let notificationFromServer = await GetNotificationFromServer(firstTestNotification.Uuid)
		assert.equal(notificationFromServer.time, newTime)
		assert.equal(notificationFromServer.interval, newInterval)
		assert.equal(notificationFromServer.properties["title"], newProperties.title)
		assert.equal(notificationFromServer.properties["message"], newProperties.message)

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

		let notificationFromServer = await GetNotificationFromServer(uuid)
		assert.isNull(notificationFromServer)
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