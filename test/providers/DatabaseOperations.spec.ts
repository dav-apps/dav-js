import 'mocha'
import { assert } from 'chai'
import * as localforage from 'localforage'
import { extendPrototype } from 'localforage-startswith'
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations'
import {
	Dav,
	Init,
	userKey,
	notificationsKey,
	getTableObjectKey
} from '../../lib/Dav'
import {
	TableObject,
	TableObjectUploadStatus,
	generateUUID,
	DatabaseTableObject
} from '../../lib/models/TableObject'
import { Notification } from '../../lib/models/Notification'
import { UploadStatus } from '../../lib/providers/DataManager'
import { DavEnvironment } from '../../lib/models/DavUser'
import { SetTableObjectsArray } from '../utils'

extendPrototype(localforage);

beforeEach(async () => {
	// Reset global variables
	Dav.skipSyncPushInTests = true
	Dav.jwt = null

	// Clear the database
	await localforage.clear()
})

describe("SetUser function", () => {
	it("should save the user object", async () => {
		// Arrange
		var user = {
			email: "testemail@example.com",
			username: "testuser",
			jwt: "blabla"
		}

		// Act
		DatabaseOperations.SetUser(user);

		// Assert
		var savedUser = await localforage.getItem(userKey);
		assert.equal(user.email, savedUser["email"]);
		assert.equal(user.username, savedUser["username"]);
		assert.equal(user.jwt, savedUser["jwt"]);
	})
})

describe("GetUser function", () => {
	it("should return the saved user object", async () => {
		// Arrange
		var user = {
			email: "example@example.com",
			username: "tester",
			jwt: "jwtjwt"
		}
		await localforage.setItem(userKey, user);

		// Act
		var savedUser = await DatabaseOperations.GetUser();

		// Assert
		assert.equal(user.email, savedUser["email"]);
		assert.equal(user.username, savedUser["username"]);
		assert.equal(user.jwt, savedUser["jwt"]);
	})
})

describe("RemoveUser function", () => {
	it("should remove the saved user object", async () => {
		// Arrange
		var user = {
			email: "blabla",
			username: "blabla",
			jwt: "blabla"
		}

		await localforage.setItem(userKey, user);

		// Act
		await DatabaseOperations.RemoveUser();

		// Assert
		let userFromDatabase = await DatabaseOperations.GetUser();
		assert.isNull(userFromDatabase);
	})
})

describe("GetAllNotifications function", () => {
	it("should return all notifications", async () => {
		// Arrange
		let generatedNotifications = GenerateNotifications();
		for (let notification of generatedNotifications) {
			await DatabaseOperations.SaveNotification(notification);
		}

		// Act
		let notifications = await DatabaseOperations.GetAllNotifications();
		assert.equal(notifications.length, generatedNotifications.length);

		// Assert
		let i = 0;
		for (let notification of notifications) {
			assert.equal(notification.Uuid, generatedNotifications[i].Uuid);
			assert.equal(notification.Time, generatedNotifications[i].Time);
			assert.equal(notification.Interval, generatedNotifications[i].Interval);

			assert.equal(notification.Properties["title"], generatedNotifications[i].Properties["title"])
			assert.equal(notification.Properties["message"], generatedNotifications[i].Properties["message"])

			i++;
		}
	})

	function GenerateNotifications(): Array<Notification> {
		let notifications: Array<Notification> = [];

		let notification1Properties = {
			title: "Hello World",
			message: "You have a notification"
		}
		let notification1 = new Notification(new Date().getTime() / 1000, 0, notification1Properties, null, UploadStatus.UpToDate);
		let notification2Properties = {
			title: "Good day",
			message: "Today is pleasant weather with -20°C"
		}
		let notification2 = new Notification(new Date().getTime() / 1200, 0, notification2Properties, null, UploadStatus.UpToDate);

		notifications.push(notification1, notification2);
		return notifications;
	}
})

describe("GetNotification function", () => {
	it("should return the appropriate notification", async () => {
		// Arrange
		let uuid = generateUUID();
		let time = new Date().getTime() / 1000;
		let interval = 3600
		let properties = {
			title: "Hello World",
			message: "You have a notification!"
		}
		let uploadStatus = UploadStatus.UpToDate;

		let notification = new Notification(time, interval, properties, uuid, uploadStatus);
		await notification.Save();

		// Act
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);

		// Assert
		assert.isNotNull(notificationFromDatabase);
		assert.equal(time, notificationFromDatabase.Time);
		assert.equal(interval, notificationFromDatabase.Interval);
		assert.equal(properties.title, notificationFromDatabase.Properties["title"]);
		assert.equal(properties.message, notificationFromDatabase.Properties["message"]);
		assert.equal(uploadStatus, notificationFromDatabase.Status);
	})

	it("should return null if the notification does not exist", async () => {
		// Arrange
		let uuid = generateUUID();

		// Act
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);

		// Assert
		assert.isNull(notificationFromDatabase);
	})
})

describe("SaveNotification function", () => {
	it("should save the notification in the database", async () => {
		// Arrange
		let uuid = generateUUID();
		let time = new Date().getTime() / 1000;
		let interval = 3600;
		let properties = {
			title: "Hello World",
			message: "You have a notification!"
		}
		let uploadStatus = UploadStatus.UpToDate;

		let notification = new Notification(time, interval, properties, uuid, uploadStatus);

		// Act
		await DatabaseOperations.SaveNotification(notification);

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
		assert.isNotNull(notificationFromDatabase);
		assert.equal(time, notificationFromDatabase.Time);
		assert.equal(interval, notificationFromDatabase.Interval);
		assert.equal(properties.title, notificationFromDatabase.Properties["title"]);
		assert.equal(properties.message, notificationFromDatabase.Properties["message"]);
		assert.equal(uploadStatus, notificationFromDatabase.Status);
	})

	it("should replace the notification with the same uuid in the database", async () => {
		// Arrange
		let uuid = generateUUID();
		let time = new Date().getTime() / 1000;
		let newTime = new Date().getTime() / 1400;
		let interval = 3600;
		let newInterval = 1000;
		let properties = {
			title: "Hello World",
			message: "You have a notification"
		}
		let newProperties = {
			title: "Hallo Welt",
			message: "Du hast eine Benachrichtigung"
		}
		let uploadStatus = UploadStatus.UpToDate;
		let notification = new Notification(time, interval, properties, uuid, uploadStatus);
		let newNotification = new Notification(newTime, newInterval, newProperties, uuid, uploadStatus);

		await DatabaseOperations.SaveNotification(notification);

		// Act
		await DatabaseOperations.SaveNotification(newNotification);

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
		assert.isNotNull(notificationFromDatabase);
		assert.equal(newTime, notificationFromDatabase.Time);
		assert.equal(newInterval, notificationFromDatabase.Interval);
		assert.equal(newProperties.title, notificationFromDatabase.Properties["title"]);
		assert.equal(newProperties.message, notificationFromDatabase.Properties["message"]);
		assert.equal(uploadStatus, notificationFromDatabase.Status);
	})
})

describe("DeleteNotification function", () => {
	it("should remove the notification from the database", async () => {
		// Arrange
		let properties = {
			title: "Hello World",
			message: "You have a notification"
		}
		let uuid = generateUUID();
		let notification = new Notification(1000000, 3600, properties, uuid, UploadStatus.UpToDate);
		await notification.Save();

		// Make sure the notification was saved
		assert.isNotNull(await DatabaseOperations.GetNotification(uuid));

		// Act
		await DatabaseOperations.DeleteNotification(uuid);

		// Assert
		assert.isNull(await DatabaseOperations.GetNotification(uuid));
	})
})

describe("RemoveAllNotifications function", () => {
	it("should remove all notifications from the database", async () => {
		// Arrange
		let notifications = [
			new Notification(1231231, 5000, {
				title: "Hello World",
				message: "This is a notification"
			}),
			new Notification(121885, 2000, {
				title: "Notification",
				message: "Hello World"
			})
		]

		await localforage.setItem(notificationsKey, notifications);
		assert.equal(2, (await DatabaseOperations.GetAllNotifications()).length);

		// Act
		await DatabaseOperations.RemoveAllNotifications();

		// Assert
		let allNotifications = await DatabaseOperations.GetAllNotifications();
		assert.equal(0, allNotifications.length);
	});
})

describe("SetSubscription function", () => {
	it("should save the subscription in the database", async () => {
		// Arrange
		let uuid = generateUUID();
		let endpoint = "https://apis.google.com/example"
		let p256dh = "asdoajsdoashd"
		let auth = "asdasdasd"
		let status = UploadStatus.UpToDate;
		let subscription = {
			uuid,
			endpoint,
			p256dh,
			auth,
			status
		}

		// Act
		await DatabaseOperations.SetSubscription(subscription);

		// Assert
		let subscriptionFromDatabase = await DatabaseOperations.GetSubscription();
		assert.isNotNull(subscriptionFromDatabase);
		assert.equal(uuid, subscriptionFromDatabase.uuid);
		assert.equal(endpoint, subscriptionFromDatabase.endpoint);
		assert.equal(p256dh, subscriptionFromDatabase.p256dh);
		assert.equal(auth, subscriptionFromDatabase.auth);
		assert.equal(status, subscriptionFromDatabase.status);
	})
})

describe("GetSubscription function", () => {
	it("should return the subscription", async () => {
		// Arrange
		let uuid = generateUUID();
		let endpoint = "https://apis.google.com/example"
		let p256dh = "asdoajsdoashd"
		let auth = "asdasdasd"
		let status = UploadStatus.UpToDate;
		let subscription = {
			uuid,
			endpoint,
			p256dh,
			auth,
			status
		}
		await DatabaseOperations.SetSubscription(subscription);

		// Act
		let subscriptionFromDatabase = await DatabaseOperations.GetSubscription();

		// Assert
		assert.isNotNull(subscriptionFromDatabase);
		assert.equal(uuid, subscriptionFromDatabase.uuid);
		assert.equal(endpoint, subscriptionFromDatabase.endpoint);
		assert.equal(p256dh, subscriptionFromDatabase.p256dh);
		assert.equal(auth, subscriptionFromDatabase.auth);
		assert.equal(status, subscriptionFromDatabase.status);
	})
})

describe("RemoveSubscription function", () => {
	it("should remove the subscription from the database", async () => {
		// Arrange
		let uuid = generateUUID();
		let endpoint = "https://apis.google.com/example"
		let p256dh = "asdoajsdoashd"
		let auth = "asdasdasd"
		let status = UploadStatus.UpToDate;
		let subscription = {
			uuid,
			endpoint,
			p256dh,
			auth,
			status
		}
		await DatabaseOperations.SetSubscription(subscription);
		assert.isNotNull(await DatabaseOperations.GetSubscription());

		// Act
		await DatabaseOperations.RemoveSubscription();

		// Assert
		assert.isNull(await DatabaseOperations.GetSubscription());
	})
})

describe("SetTableObject function", () => {
	it("should save the table object in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 13
		let uploadStatus = TableObjectUploadStatus.Removed
		let etag = "asdasdasd"
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Hallo Welt"

		let tableObject = new TableObject()
		tableObject.Uuid = uuid
		tableObject.TableId = tableId
		tableObject.UploadStatus = uploadStatus
		tableObject.Etag = etag
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

		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
	})

	it("should overwrite existing table object in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 42

		let firstTableObject = new TableObject()
		firstTableObject.Uuid = uuid
		firstTableObject.TableId = tableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Deleted
		firstTableObject.Etag = "adsasdasd"
		firstTableObject.Properties = {
			"test": { value: "Hallo Welt" }
		}

		await DatabaseOperations.SetTableObject(firstTableObject)

		let uploadStatus = TableObjectUploadStatus.New
		let etag = "Lorem ipsum dolor sit amet"
		let firstPropertyName = "page1"
		let firstPropertyValue = "Guten Tag"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Good day"

		let secondTableObject = new TableObject()
		secondTableObject.Uuid = uuid
		secondTableObject.TableId = tableId
		secondTableObject.UploadStatus = uploadStatus
		secondTableObject.Etag = etag
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

		assert.equal(Object.keys(tableObjectFromDatabase.Properties).length, 2)
		assert.equal(tableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(tableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)
	})

	it("should adopt local properties of the existing table object, overwrite the table object in the database and return the uuid", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 42

		let firstLocalPropertyName = "local1"
		let firstLocalPropertyValue = "Hello World"
		let secondLocalPropertyName = "local2"
		let secondLocalPropertyValue = "Hallo Welt"

		let firstPropertyName = "page1"
		let firstPropertyValue = "Good day"
		let secondPropertyName = "page2"
		let secondPropertyValue = "Guten Tag"

		let uploadStatus = TableObjectUploadStatus.NoUpload
		let etag = "Lorem ipsum dolor sit amet"

		let firstTableObject = new TableObject()
		firstTableObject.Uuid = uuid
		firstTableObject.TableId = tableId
		firstTableObject.UploadStatus = TableObjectUploadStatus.Deleted
		firstTableObject.Etag = "adsasdasd"
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
		let uuid1 = generateUUID()
		let uuid2 = generateUUID()
		let uuid3 = generateUUID()
		let tableId1 = 14
		let tableId2 = 23
		let tableId3 = 124
		let uploadStatus1 = TableObjectUploadStatus.New
		let uploadStatus2 = TableObjectUploadStatus.NoUpload
		let uploadStatus3 = TableObjectUploadStatus.UpToDate
		let etag1 = "asdasd"
		let etag2 = "werwerwer"
		let etag3 = "ojsdfnsdfons"

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
		firstTableObject.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let secondTableObject = new TableObject()
		secondTableObject.Uuid = uuid2
		secondTableObject.TableId = tableId2
		secondTableObject.UploadStatus = uploadStatus2
		secondTableObject.Etag = etag2
		secondTableObject.Properties = {
			[firstPropertyName2]: { value: firstPropertyValue2 },
			[secondPropertyName2]: { value: secondPropertyValue2 }
		}

		let thirdTableObject = new TableObject()
		thirdTableObject.Uuid = uuid3
		thirdTableObject.TableId = tableId3
		thirdTableObject.UploadStatus = uploadStatus3
		thirdTableObject.Etag = etag3
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

		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 2)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName1].value, firstPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondPropertyName1].value, secondPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid2, tableId2)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.TableId, tableId2)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, uploadStatus2)
		assert.equal(secondTableObjectFromDatabase.Etag, etag2)

		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 2)
		assert.equal(secondTableObjectFromDatabase.Properties[firstPropertyName2].value, firstPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName2].value, secondPropertyValue2)

		let thirdTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid3, tableId3)
		assert.isNotNull(thirdTableObjectFromDatabase)
		assert.equal(thirdTableObjectFromDatabase.TableId, tableId3)
		assert.equal(thirdTableObjectFromDatabase.UploadStatus, uploadStatus3)
		assert.equal(thirdTableObjectFromDatabase.Etag, etag3)

		assert.equal(Object.keys(thirdTableObjectFromDatabase.Properties).length, 2)
		assert.equal(thirdTableObjectFromDatabase.Properties[firstPropertyName3].value, firstPropertyValue3)
		assert.equal(thirdTableObjectFromDatabase.Properties[secondPropertyName3].value, secondPropertyValue3)
	})

	it("should overwrite existing table objects in the database and return the uuids", async () => {
		// Arrange
		let uuid1 = generateUUID()
		let uuid2 = generateUUID()
		let tableId1 = 13
		let tableId2 = 42

		let tableObject1 = new TableObject()
		tableObject1.Uuid = uuid1
		tableObject1.TableId = tableId1
		tableObject1.UploadStatus = TableObjectUploadStatus.Updated
		tableObject1.Etag = "asdasdasd"
		tableObject1.Properties = {
			"test": { value: "Hello World" }
		}

		let tableObject2 = new TableObject()
		tableObject2.Uuid = uuid2
		tableObject2.TableId = tableId2
		tableObject2.UploadStatus = TableObjectUploadStatus.UpToDate
		tableObject2.Etag = "sdofndgsdg"
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
		newTableObject1.Properties = {
			[firstNewPropertyName1]: { value: firstNewPropertyValue1 },
			[secondNewPropertyName1]: { value: secondNewPropertyValue1 }
		}

		let newTableObject2 = new TableObject()
		newTableObject2.Uuid = uuid2
		newTableObject2.TableId = tableId2
		newTableObject2.UploadStatus = newUploadStatus2
		newTableObject2.Etag = newEtag2
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

		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 2)
		assert.equal(firstTableObjectFromDatabase.Properties[firstNewPropertyName1].value, firstNewPropertyValue1)
		assert.equal(firstTableObjectFromDatabase.Properties[secondNewPropertyName1].value, secondNewPropertyValue1)

		let secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid2, tableId2)
		assert.isNotNull(secondTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.TableId, tableId2)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, newUploadStatus2)
		assert.equal(secondTableObjectFromDatabase.Etag, newEtag2)

		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 2)
		assert.equal(secondTableObjectFromDatabase.Properties[firstNewPropertyName2].value, firstNewPropertyValue2)
		assert.equal(secondTableObjectFromDatabase.Properties[secondNewPropertyName2].value, secondNewPropertyValue2)
	})

	it("should adopt local properties of the existing table objects, overwrite the table objects in the database and return the uuids", async () => {
		// Arrange
		// Arrange
		let uuid1 = generateUUID()
		let uuid2 = generateUUID()
		let tableId1 = 13
		let tableId2 = 42

		let newUploadStatus1 = TableObjectUploadStatus.New
		let newUploadStatus2 = TableObjectUploadStatus.Deleted
		let newEtag1 = "oijsegioasf"
		let newEtag2 = "oinsdgjdsoknsdf"

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
		newTableObject1.Properties = {
			[firstPropertyName1]: { value: firstPropertyValue1 },
			[secondPropertyName1]: { value: secondPropertyValue1 }
		}

		let newTableObject2 = new TableObject()
		newTableObject2.Uuid = uuid2
		newTableObject2.TableId = tableId2
		newTableObject2.UploadStatus = newUploadStatus2
		newTableObject2.Etag = newEtag2
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
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		let fourthUuid = generateUUID()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = "asdjiohsdgu2q98h"

		let fourthTableObject = new TableObject(fourthUuid)
		fourthTableObject.TableId = fourthTableId
		fourthTableObject.UploadStatus = fourthUploadStatus
		fourthTableObject.Etag = fourthEtag
		fourthTableObject.Properties = {
			[fourthPropertyName]: { value: fourthPropertyValue }
		}

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
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, thirdUuid)
		assert.equal(tableObjects[1].TableId, thirdTableId)
		assert.equal(tableObjects[1].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[1].Etag, thirdEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[thirdPropertyName].value, thirdPropertyValue)
	})

	it("should return table objects from tableObjectsArray and separateKeyStorage that are not deleted", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		let fourthUuid = generateUUID()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = "asdjiohsdgu2q98h"

		let fourthTableObject = new TableObject(fourthUuid)
		fourthTableObject.TableId = fourthTableId
		fourthTableObject.UploadStatus = fourthUploadStatus
		fourthTableObject.Etag = fourthEtag
		fourthTableObject.Properties = {
			[fourthPropertyName]: { value: fourthPropertyValue }
		}

		let fifthUuid = generateUUID()
		let fifthTableId = firstTableId
		let fifthUploadStatus = TableObjectUploadStatus.New
		let fifthEtag = "asduhaoghsd"
		let fifthPropertyName = "test5"
		let fifthPropertyValue = "ogsoibsf80wniocs<"

		let fifthTableObject = new TableObject(fifthUuid)
		fifthTableObject.TableId = fifthTableId
		fifthTableObject.UploadStatus = fifthUploadStatus
		fifthTableObject.Etag = fifthEtag
		fifthTableObject.Properties = {
			[fifthPropertyName]: { value: fifthPropertyValue }
		}

		let sixthUuid = generateUUID()
		let sixthTableId = fifthTableId
		let sixthUploadStatus = TableObjectUploadStatus.Deleted
		let sixthEtag = "oh9hioasdfkbjabgf"
		let sixthPropertyName = "test6"
		let sixthPropertyValue = "asiohagbi9sfh0aw"

		let sixthTableObject = new TableObject(sixthUuid)
		sixthTableObject.TableId = sixthTableId
		sixthTableObject.UploadStatus = sixthUploadStatus
		sixthTableObject.Etag = sixthEtag
		sixthTableObject.Properties = {
			[sixthPropertyName]: { value: sixthPropertyValue }
		}

		let seventhUuid = generateUUID()
		let seventhTableId = thirdTableId
		let seventhUploadStatus = TableObjectUploadStatus.NoUpload
		let seventhEtag = "asdnoabguasfsd"
		let seventhPropertyName = "test7"
		let seventhPropertyValue = "u9139rhafpdfbn90q"

		let seventhTableObject = new TableObject(seventhUuid)
		seventhTableObject.TableId = seventhTableId
		seventhTableObject.UploadStatus = seventhUploadStatus
		seventhTableObject.Etag = seventhEtag
		seventhTableObject.Properties = {
			[seventhPropertyName]: { value: seventhPropertyValue }
		}

		let eighthUuid = generateUUID()
		let eighthTableId = seventhTableId
		let eighthUploadStatus = TableObjectUploadStatus.Removed
		let eighthEtag = "9098wrw0efhsdfjpsdf"
		let eighthPropertyName = "test8"
		let eighthPropertyValue = "uoasopff98wz3nqwöf"

		let eighthTableObject = new TableObject(eighthUuid)
		eighthTableObject.TableId = eighthTableId
		eighthTableObject.UploadStatus = eighthUploadStatus
		eighthTableObject.Etag = eighthEtag
		eighthTableObject.Properties = {
			[eighthPropertyName]: { value: eighthPropertyValue }
		}

		// Create the first four table objects in separateKeyStorage
		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject,
			fourthTableObject
		])

		// Create the last four table objects in tableObjectsArray
		await SetTableObjectsArray([
			fifthTableObject,
			sixthTableObject,
			seventhTableObject,
			eighthTableObject
		])

		// Act
		let tableObjects = await DatabaseOperations.GetAllTableObjects()

		// Assert
		assert.equal(tableObjects.length, 4)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(tableObjects[0].UploadStatus, firstUploadStatus)
		assert.equal(tableObjects[0].Etag, firstEtag)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, thirdUuid)
		assert.equal(tableObjects[1].TableId, thirdTableId)
		assert.equal(tableObjects[1].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[1].Etag, thirdEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[thirdPropertyName].value, thirdPropertyValue)

		assert.equal(tableObjects[2].Uuid, fifthUuid)
		assert.equal(tableObjects[2].TableId, fifthTableId)
		assert.equal(tableObjects[2].UploadStatus, fifthUploadStatus)
		assert.equal(tableObjects[2].Etag, fifthEtag)
		assert.equal(Object.keys(tableObjects[2].Properties).length, 1)
		assert.equal(tableObjects[2].Properties[fifthPropertyName].value, fifthPropertyValue)

		assert.equal(tableObjects[3].Uuid, seventhUuid)
		assert.equal(tableObjects[3].TableId, seventhTableId)
		assert.equal(tableObjects[3].UploadStatus, seventhUploadStatus)
		assert.equal(tableObjects[3].Etag, seventhEtag)
		assert.equal(Object.keys(tableObjects[3].Properties).length, 1)
		assert.equal(tableObjects[3].Properties[seventhPropertyName].value, seventhPropertyValue)
	})

	it("should return all table objects", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		let fourthUuid = generateUUID()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = "asdjiohsdgu2q98h"

		let fourthTableObject = new TableObject(fourthUuid)
		fourthTableObject.TableId = fourthTableId
		fourthTableObject.UploadStatus = fourthUploadStatus
		fourthTableObject.Etag = fourthEtag
		fourthTableObject.Properties = {
			[fourthPropertyName]: { value: fourthPropertyValue }
		}

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
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, secondUuid)
		assert.equal(tableObjects[1].TableId, secondTableId)
		assert.equal(tableObjects[1].UploadStatus, secondUploadStatus)
		assert.equal(tableObjects[1].Etag, secondEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[secondPropertyName].value, secondPropertyValue)

		assert.equal(tableObjects[2].Uuid, thirdUuid)
		assert.equal(tableObjects[2].TableId, thirdTableId)
		assert.equal(tableObjects[2].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[2].Etag, thirdEtag)
		assert.equal(Object.keys(tableObjects[2].Properties).length, 1)
		assert.equal(tableObjects[2].Properties[thirdPropertyName].value, thirdPropertyValue)

		assert.equal(tableObjects[3].Uuid, fourthUuid)
		assert.equal(tableObjects[3].TableId, fourthTableId)
		assert.equal(tableObjects[3].UploadStatus, fourthUploadStatus)
		assert.equal(tableObjects[3].Etag, fourthEtag)
		assert.equal(Object.keys(tableObjects[3].Properties).length, 1)
		assert.equal(tableObjects[3].Properties[fourthPropertyName].value, fourthPropertyValue)
	})

	it("should return all table objects from tableObjectsArray and separateKeyStorage", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		let fourthUuid = generateUUID()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = "asdjiohsdgu2q98h"

		let fourthTableObject = new TableObject(fourthUuid)
		fourthTableObject.TableId = fourthTableId
		fourthTableObject.UploadStatus = fourthUploadStatus
		fourthTableObject.Etag = fourthEtag
		fourthTableObject.Properties = {
			[fourthPropertyName]: { value: fourthPropertyValue }
		}

		let fifthUuid = generateUUID()
		let fifthTableId = firstTableId
		let fifthUploadStatus = TableObjectUploadStatus.New
		let fifthEtag = "asduhaoghsd"
		let fifthPropertyName = "test5"
		let fifthPropertyValue = "ogsoibsf80wniocs<"

		let fifthTableObject = new TableObject(fifthUuid)
		fifthTableObject.TableId = fifthTableId
		fifthTableObject.UploadStatus = fifthUploadStatus
		fifthTableObject.Etag = fifthEtag
		fifthTableObject.Properties = {
			[fifthPropertyName]: { value: fifthPropertyValue }
		}

		let sixthUuid = generateUUID()
		let sixthTableId = fifthTableId
		let sixthUploadStatus = TableObjectUploadStatus.Deleted
		let sixthEtag = "oh9hioasdfkbjabgf"
		let sixthPropertyName = "test6"
		let sixthPropertyValue = "asiohagbi9sfh0aw"

		let sixthTableObject = new TableObject(sixthUuid)
		sixthTableObject.TableId = sixthTableId
		sixthTableObject.UploadStatus = sixthUploadStatus
		sixthTableObject.Etag = sixthEtag
		sixthTableObject.Properties = {
			[sixthPropertyName]: { value: sixthPropertyValue }
		}

		let seventhUuid = generateUUID()
		let seventhTableId = thirdTableId
		let seventhUploadStatus = TableObjectUploadStatus.NoUpload
		let seventhEtag = "asdnoabguasfsd"
		let seventhPropertyName = "test7"
		let seventhPropertyValue = "u9139rhafpdfbn90q"

		let seventhTableObject = new TableObject(seventhUuid)
		seventhTableObject.TableId = seventhTableId
		seventhTableObject.UploadStatus = seventhUploadStatus
		seventhTableObject.Etag = seventhEtag
		seventhTableObject.Properties = {
			[seventhPropertyName]: { value: seventhPropertyValue }
		}

		let eighthUuid = generateUUID()
		let eighthTableId = seventhTableId
		let eighthUploadStatus = TableObjectUploadStatus.Removed
		let eighthEtag = "9098wrw0efhsdfjpsdf"
		let eighthPropertyName = "test8"
		let eighthPropertyValue = "uoasopff98wz3nqwöf"

		let eighthTableObject = new TableObject(eighthUuid)
		eighthTableObject.TableId = eighthTableId
		eighthTableObject.UploadStatus = eighthUploadStatus
		eighthTableObject.Etag = eighthEtag
		eighthTableObject.Properties = {
			[eighthPropertyName]: { value: eighthPropertyValue }
		}

		// Create the first four table objects in separateKeyStorage
		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject,
			fourthTableObject
		])

		// Create the last four table objects in tableObjectsArray
		await SetTableObjectsArray([
			fifthTableObject,
			sixthTableObject,
			seventhTableObject,
			eighthTableObject
		])

		// Act
		let tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)

		// Assert
		assert.equal(tableObjects.length, 8)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(tableObjects[0].UploadStatus, firstUploadStatus)
		assert.equal(tableObjects[0].Etag, firstEtag)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, secondUuid)
		assert.equal(tableObjects[1].TableId, secondTableId)
		assert.equal(tableObjects[1].UploadStatus, secondUploadStatus)
		assert.equal(tableObjects[1].Etag, secondEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[secondPropertyName].value, secondPropertyValue)

		assert.equal(tableObjects[2].Uuid, thirdUuid)
		assert.equal(tableObjects[2].TableId, thirdTableId)
		assert.equal(tableObjects[2].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[2].Etag, thirdEtag)
		assert.equal(Object.keys(tableObjects[2].Properties).length, 1)
		assert.equal(tableObjects[2].Properties[thirdPropertyName].value, thirdPropertyValue)

		assert.equal(tableObjects[3].Uuid, fourthUuid)
		assert.equal(tableObjects[3].TableId, fourthTableId)
		assert.equal(tableObjects[3].UploadStatus, fourthUploadStatus)
		assert.equal(tableObjects[3].Etag, fourthEtag)
		assert.equal(Object.keys(tableObjects[3].Properties).length, 1)
		assert.equal(tableObjects[3].Properties[fourthPropertyName].value, fourthPropertyValue)

		assert.equal(tableObjects[4].Uuid, fifthUuid)
		assert.equal(tableObjects[4].TableId, fifthTableId)
		assert.equal(tableObjects[4].UploadStatus, fifthUploadStatus)
		assert.equal(tableObjects[4].Etag, fifthEtag)
		assert.equal(Object.keys(tableObjects[4].Properties).length, 1)
		assert.equal(tableObjects[4].Properties[fifthPropertyName].value, fifthPropertyValue)

		assert.equal(tableObjects[5].Uuid, sixthUuid)
		assert.equal(tableObjects[5].TableId, sixthTableId)
		assert.equal(tableObjects[5].UploadStatus, sixthUploadStatus)
		assert.equal(tableObjects[5].Etag, sixthEtag)
		assert.equal(Object.keys(tableObjects[5].Properties).length, 1)
		assert.equal(tableObjects[5].Properties[sixthPropertyName].value, sixthPropertyValue)

		assert.equal(tableObjects[6].Uuid, seventhUuid)
		assert.equal(tableObjects[6].TableId, seventhTableId)
		assert.equal(tableObjects[6].UploadStatus, seventhUploadStatus)
		assert.equal(tableObjects[6].Etag, seventhEtag)
		assert.equal(Object.keys(tableObjects[6].Properties).length, 1)
		assert.equal(tableObjects[6].Properties[seventhPropertyName].value, seventhPropertyValue)

		assert.equal(tableObjects[7].Uuid, eighthUuid)
		assert.equal(tableObjects[7].TableId, eighthTableId)
		assert.equal(tableObjects[7].UploadStatus, eighthUploadStatus)
		assert.equal(tableObjects[7].Etag, eighthEtag)
		assert.equal(Object.keys(tableObjects[7].Properties).length, 1)
		assert.equal(tableObjects[7].Properties[eighthPropertyName].value, eighthPropertyValue)
	})

	it("should return all table objects of a table that are not deleted", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		let fourthUuid = generateUUID()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = "asdjiohsdgu2q98h"

		let fourthTableObject = new TableObject(fourthUuid)
		fourthTableObject.TableId = fourthTableId
		fourthTableObject.UploadStatus = fourthUploadStatus
		fourthTableObject.Etag = fourthEtag
		fourthTableObject.Properties = {
			[fourthPropertyName]: { value: fourthPropertyValue }
		}

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
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)
	})

	it("should return all table objects of a table that are not deleted from tableObjectsArray and separateKeyStorage", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		let fourthUuid = generateUUID()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = "asdjiohsdgu2q98h"

		let fourthTableObject = new TableObject(fourthUuid)
		fourthTableObject.TableId = fourthTableId
		fourthTableObject.UploadStatus = fourthUploadStatus
		fourthTableObject.Etag = fourthEtag
		fourthTableObject.Properties = {
			[fourthPropertyName]: { value: fourthPropertyValue }
		}

		let fifthUuid = generateUUID()
		let fifthTableId = firstTableId
		let fifthUploadStatus = TableObjectUploadStatus.New
		let fifthEtag = "asduhaoghsd"
		let fifthPropertyName = "test5"
		let fifthPropertyValue = "ogsoibsf80wniocs<"

		let fifthTableObject = new TableObject(fifthUuid)
		fifthTableObject.TableId = fifthTableId
		fifthTableObject.UploadStatus = fifthUploadStatus
		fifthTableObject.Etag = fifthEtag
		fifthTableObject.Properties = {
			[fifthPropertyName]: { value: fifthPropertyValue }
		}

		let sixthUuid = generateUUID()
		let sixthTableId = fifthTableId
		let sixthUploadStatus = TableObjectUploadStatus.Deleted
		let sixthEtag = "oh9hioasdfkbjabgf"
		let sixthPropertyName = "test6"
		let sixthPropertyValue = "asiohagbi9sfh0aw"

		let sixthTableObject = new TableObject(sixthUuid)
		sixthTableObject.TableId = sixthTableId
		sixthTableObject.UploadStatus = sixthUploadStatus
		sixthTableObject.Etag = sixthEtag
		sixthTableObject.Properties = {
			[sixthPropertyName]: { value: sixthPropertyValue }
		}

		let seventhUuid = generateUUID()
		let seventhTableId = thirdTableId
		let seventhUploadStatus = TableObjectUploadStatus.NoUpload
		let seventhEtag = "asdnoabguasfsd"
		let seventhPropertyName = "test7"
		let seventhPropertyValue = "u9139rhafpdfbn90q"

		let seventhTableObject = new TableObject(seventhUuid)
		seventhTableObject.TableId = seventhTableId
		seventhTableObject.UploadStatus = seventhUploadStatus
		seventhTableObject.Etag = seventhEtag
		seventhTableObject.Properties = {
			[seventhPropertyName]: { value: seventhPropertyValue }
		}

		let eighthUuid = generateUUID()
		let eighthTableId = seventhTableId
		let eighthUploadStatus = TableObjectUploadStatus.Removed
		let eighthEtag = "9098wrw0efhsdfjpsdf"
		let eighthPropertyName = "test8"
		let eighthPropertyValue = "uoasopff98wz3nqwöf"

		let eighthTableObject = new TableObject(eighthUuid)
		eighthTableObject.TableId = eighthTableId
		eighthTableObject.UploadStatus = eighthUploadStatus
		eighthTableObject.Etag = eighthEtag
		eighthTableObject.Properties = {
			[eighthPropertyName]: { value: eighthPropertyValue }
		}

		// Create the first four table objects in separateKeyStorage
		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject,
			fourthTableObject
		])

		// Create the last four table objects in tableObjectsArray
		await SetTableObjectsArray([
			fifthTableObject,
			sixthTableObject,
			seventhTableObject,
			eighthTableObject
		])

		// Act
		let tableObjects = await DatabaseOperations.GetAllTableObjects(firstTableId)

		// Assert
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(tableObjects[0].UploadStatus, firstUploadStatus)
		assert.equal(tableObjects[0].Etag, firstEtag)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, fifthUuid)
		assert.equal(tableObjects[1].TableId, fifthTableId)
		assert.equal(tableObjects[1].UploadStatus, fifthUploadStatus)
		assert.equal(tableObjects[1].Etag, fifthEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[fifthPropertyName].value, fifthPropertyValue)
	})

	it("should return all table objects of a table", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		let fourthUuid = generateUUID()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = "asdjiohsdgu2q98h"

		let fourthTableObject = new TableObject(fourthUuid)
		fourthTableObject.TableId = fourthTableId
		fourthTableObject.UploadStatus = fourthUploadStatus
		fourthTableObject.Etag = fourthEtag
		fourthTableObject.Properties = {
			[fourthPropertyName]: { value: fourthPropertyValue }
		}

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
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[thirdPropertyName].value, thirdPropertyValue)

		assert.equal(tableObjects[1].Uuid, fourthUuid)
		assert.equal(tableObjects[1].TableId, fourthTableId)
		assert.equal(tableObjects[1].UploadStatus, fourthUploadStatus)
		assert.equal(tableObjects[1].Etag, fourthEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[fourthPropertyName].value, fourthPropertyValue)
	})

	it("should return all table objects of a table from tableObjectsArray and separateKeyStorage", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		let fourthUuid = generateUUID()
		let fourthTableId = thirdTableId
		let fourthUploadStatus = TableObjectUploadStatus.Removed
		let fourthEtag = "9oqiweqwue091231"
		let fourthPropertyName = "test4"
		let fourthPropertyValue = "asdjiohsdgu2q98h"

		let fourthTableObject = new TableObject(fourthUuid)
		fourthTableObject.TableId = fourthTableId
		fourthTableObject.UploadStatus = fourthUploadStatus
		fourthTableObject.Etag = fourthEtag
		fourthTableObject.Properties = {
			[fourthPropertyName]: { value: fourthPropertyValue }
		}

		let fifthUuid = generateUUID()
		let fifthTableId = firstTableId
		let fifthUploadStatus = TableObjectUploadStatus.New
		let fifthEtag = "asduhaoghsd"
		let fifthPropertyName = "test5"
		let fifthPropertyValue = "ogsoibsf80wniocs<"

		let fifthTableObject = new TableObject(fifthUuid)
		fifthTableObject.TableId = fifthTableId
		fifthTableObject.UploadStatus = fifthUploadStatus
		fifthTableObject.Etag = fifthEtag
		fifthTableObject.Properties = {
			[fifthPropertyName]: { value: fifthPropertyValue }
		}

		let sixthUuid = generateUUID()
		let sixthTableId = fifthTableId
		let sixthUploadStatus = TableObjectUploadStatus.Deleted
		let sixthEtag = "oh9hioasdfkbjabgf"
		let sixthPropertyName = "test6"
		let sixthPropertyValue = "asiohagbi9sfh0aw"

		let sixthTableObject = new TableObject(sixthUuid)
		sixthTableObject.TableId = sixthTableId
		sixthTableObject.UploadStatus = sixthUploadStatus
		sixthTableObject.Etag = sixthEtag
		sixthTableObject.Properties = {
			[sixthPropertyName]: { value: sixthPropertyValue }
		}

		let seventhUuid = generateUUID()
		let seventhTableId = thirdTableId
		let seventhUploadStatus = TableObjectUploadStatus.NoUpload
		let seventhEtag = "asdnoabguasfsd"
		let seventhPropertyName = "test7"
		let seventhPropertyValue = "u9139rhafpdfbn90q"

		let seventhTableObject = new TableObject(seventhUuid)
		seventhTableObject.TableId = seventhTableId
		seventhTableObject.UploadStatus = seventhUploadStatus
		seventhTableObject.Etag = seventhEtag
		seventhTableObject.Properties = {
			[seventhPropertyName]: { value: seventhPropertyValue }
		}

		let eighthUuid = generateUUID()
		let eighthTableId = seventhTableId
		let eighthUploadStatus = TableObjectUploadStatus.Removed
		let eighthEtag = "9098wrw0efhsdfjpsdf"
		let eighthPropertyName = "test8"
		let eighthPropertyValue = "uoasopff98wz3nqwöf"

		let eighthTableObject = new TableObject(eighthUuid)
		eighthTableObject.TableId = eighthTableId
		eighthTableObject.UploadStatus = eighthUploadStatus
		eighthTableObject.Etag = eighthEtag
		eighthTableObject.Properties = {
			[eighthPropertyName]: { value: eighthPropertyValue }
		}

		// Create the first four table objects in separateKeyStorage
		await DatabaseOperations.SetTableObjects([
			firstTableObject,
			secondTableObject,
			thirdTableObject,
			fourthTableObject
		])

		// Create the last four table objects in tableObjectsArray
		await SetTableObjectsArray([
			fifthTableObject,
			sixthTableObject,
			seventhTableObject,
			eighthTableObject
		])

		// Act
		let tableObjects = await DatabaseOperations.GetAllTableObjects(thirdTableId, true)

		// Assert
		assert.equal(tableObjects.length, 4)

		assert.equal(tableObjects[0].Uuid, thirdUuid)
		assert.equal(tableObjects[0].TableId, thirdTableId)
		assert.equal(tableObjects[0].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[0].Etag, thirdEtag)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[thirdPropertyName].value, thirdPropertyValue)

		assert.equal(tableObjects[1].Uuid, fourthUuid)
		assert.equal(tableObjects[1].TableId, fourthTableId)
		assert.equal(tableObjects[1].UploadStatus, fourthUploadStatus)
		assert.equal(tableObjects[1].Etag, fourthEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[fourthPropertyName].value, fourthPropertyValue)

		assert.equal(tableObjects[2].Uuid, seventhUuid)
		assert.equal(tableObjects[2].TableId, seventhTableId)
		assert.equal(tableObjects[2].UploadStatus, seventhUploadStatus)
		assert.equal(tableObjects[2].Etag, seventhEtag)
		assert.equal(Object.keys(tableObjects[2].Properties).length, 1)
		assert.equal(tableObjects[2].Properties[seventhPropertyName].value, seventhPropertyValue)

		assert.equal(tableObjects[3].Uuid, eighthUuid)
		assert.equal(tableObjects[3].TableId, eighthTableId)
		assert.equal(tableObjects[3].UploadStatus, eighthUploadStatus)
		assert.equal(tableObjects[3].Etag, eighthEtag)
		assert.equal(Object.keys(tableObjects[3].Properties).length, 1)
		assert.equal(tableObjects[3].Properties[eighthPropertyName].value, eighthPropertyValue)
	})
})

describe("GetTableObject function", () => {
	it("should return the table object", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 14
		let uploadStatus = TableObjectUploadStatus.NoUpload
		let etag = "asdonsdgonasdpnasd"

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.UploadStatus = uploadStatus
		tableObject.Etag = etag

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)

		// Assert
		assert.isNotNull(tableObjectFromDatabase)

		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
	})

	it("should return the table object from tableObjectsArray", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 14
		let uploadStatus = TableObjectUploadStatus.NoUpload
		let etag = "asdonsdgonasdpnasd"

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.UploadStatus = uploadStatus
		tableObject.Etag = etag

		await SetTableObjectsArray([
			tableObject
		])

		// Act
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)

		// Assert
		assert.isNotNull(tableObjectFromDatabase)

		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
	})

	it("should return the table object without tableId", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 14
		let uploadStatus = TableObjectUploadStatus.NoUpload
		let etag = "asdonsdgonasdpnasd"

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.UploadStatus = uploadStatus
		tableObject.Etag = etag

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)

		// Assert
		assert.isNotNull(tableObjectFromDatabase)

		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
	})

	it("should return the table object without tableId from tableObjectsArray", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 14
		let uploadStatus = TableObjectUploadStatus.NoUpload
		let etag = "asdonsdgonasdpnasd"

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.UploadStatus = uploadStatus
		tableObject.Etag = etag

		await SetTableObjectsArray([
			tableObject
		])

		// Act
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)

		// Assert
		assert.isNotNull(tableObjectFromDatabase)

		assert.equal(tableObjectFromDatabase.Uuid, uuid)
		assert.equal(tableObjectFromDatabase.TableId, tableId)
		assert.equal(tableObjectFromDatabase.UploadStatus, uploadStatus)
		assert.equal(tableObjectFromDatabase.Etag, etag)
	})

	it("should return null if the table object does not exist", async () => {
		// Arrange
		let uuid = generateUUID()

		// Act
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid)

		// Assert
		assert.isNull(tableObjectFromDatabase)
	})
})

describe("TableObjectExists function", () => {
	it("should return true if the table object exists", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 123

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		let tableObjectExists = await DatabaseOperations.TableObjectExists(uuid, tableId)

		// Assert
		assert.isTrue(tableObjectExists)
	})

	it("should return true if the table object exists from tableObjectsArray", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 123

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId

		await SetTableObjectsArray([
			tableObject
		])

		// Act
		let tableObjectExists = await DatabaseOperations.TableObjectExists(uuid, tableId)

		// Assert
		assert.isTrue(tableObjectExists)
	})

	it("should return true if the table object exists without tableId", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 123

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		let tableObjectExists = await DatabaseOperations.TableObjectExists(uuid)

		// Assert
		assert.isTrue(tableObjectExists)
	})

	it("should return true if the table object exists without tableId from tableObjectsArray", async () => {
		// Arrange
		let uuid = generateUUID()
		let tableId = 123

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId

		await SetTableObjectsArray([
			tableObject
		])

		// Act
		let tableObjectExists = await DatabaseOperations.TableObjectExists(uuid)

		// Assert
		assert.isTrue(tableObjectExists)
	})

	it("should return false if the table object does not exist", async () => {
		// Arrange
		let uuid = generateUUID()

		// Act
		let tableObjectExists = await DatabaseOperations.TableObjectExists(uuid)

		// Assert
		assert.isFalse(tableObjectExists)
	})
})

describe("RemoveTableObject function", () => {
	it("should remove the table object from the database", async () => {
		// Arrage
		let uuid = generateUUID()
		let tableId = 13

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.Properties = {
			"test": { value: "blablabla" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DatabaseOperations.RemoveTableObject(uuid, tableId)

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNull(tableObjectFromDatabase)
	})

	it("should remove the table object from the database and save all other table objects from tableObjectsArray as separateKeyStorage", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = 25
		let secondUploadStatus = TableObjectUploadStatus.Updated
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 631
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		Init(DavEnvironment.Test, 1, [firstTableId, secondTableId, thirdTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		await SetTableObjectsArray([
			firstTableObject,
			secondTableObject,
			thirdTableObject
		])

		// Act
		await DatabaseOperations.RemoveTableObject(secondUuid, secondTableId)

		// Assert
		let tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(tableObjects[0].UploadStatus, firstUploadStatus)
		assert.equal(tableObjects[0].Etag, firstEtag)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, thirdUuid)
		assert.equal(tableObjects[1].TableId, thirdTableId)
		assert.equal(tableObjects[1].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[1].Etag, thirdEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[thirdPropertyName].value, thirdPropertyValue)
	})

	it("should remove the table object from the database without tableId", async () => {
		// Arrage
		let uuid = generateUUID()
		let tableId = 13

		Init(DavEnvironment.Test, 1, [tableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.Properties = {
			"test": { value: "blablabla" }
		}

		await DatabaseOperations.SetTableObject(tableObject)

		// Act
		await DatabaseOperations.RemoveTableObject(uuid)

		// Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid, tableId)
		assert.isNull(tableObjectFromDatabase)
	})

	it("should remove the table object from the database without tableId and save all other table objects from tableObjectsArray as separateKeyStorage", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = 25
		let secondUploadStatus = TableObjectUploadStatus.Updated
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 631
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		Init(DavEnvironment.Test, 1, [firstTableId, secondTableId, thirdTableId], [], { icon: "", badge: "" }, {
			UpdateAllOfTable: () => { },
			UpdateTableObject: () => { },
			DeleteTableObject: () => { },
			UserDownloadFinished: () => { },
			SyncFinished: () => { }
		})

		await SetTableObjectsArray([
			firstTableObject,
			secondTableObject,
			thirdTableObject
		])

		// Act
		await DatabaseOperations.RemoveTableObject(secondUuid)

		// Assert
		let tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true)
		assert.equal(tableObjects.length, 2)

		assert.equal(tableObjects[0].Uuid, firstUuid)
		assert.equal(tableObjects[0].TableId, firstTableId)
		assert.equal(tableObjects[0].UploadStatus, firstUploadStatus)
		assert.equal(tableObjects[0].Etag, firstEtag)
		assert.equal(Object.keys(tableObjects[0].Properties).length, 1)
		assert.equal(tableObjects[0].Properties[firstPropertyName].value, firstPropertyValue)

		assert.equal(tableObjects[1].Uuid, thirdUuid)
		assert.equal(tableObjects[1].TableId, thirdTableId)
		assert.equal(tableObjects[1].UploadStatus, thirdUploadStatus)
		assert.equal(tableObjects[1].Etag, thirdEtag)
		assert.equal(Object.keys(tableObjects[1].Properties).length, 1)
		assert.equal(tableObjects[1].Properties[thirdPropertyName].value, thirdPropertyValue)
	})
})

describe("ConvertDatabaseFormat function", () => {
	it("should save all table objects from tableObjectsArray as separateKeyStorage and remove the tableObjectsArray", async () => {
		// Arrange
		let firstUuid = generateUUID()
		let firstTableId = 13
		let firstUploadStatus = TableObjectUploadStatus.New
		let firstEtag = "asdasdasdasd"
		let firstPropertyName = "test1"
		let firstPropertyValue = "jaodnaosd"

		let firstTableObject = new TableObject(firstUuid)
		firstTableObject.TableId = firstTableId
		firstTableObject.UploadStatus = firstUploadStatus
		firstTableObject.Etag = firstEtag
		firstTableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue }
		}

		let secondUuid = generateUUID()
		let secondTableId = firstTableId
		let secondUploadStatus = TableObjectUploadStatus.Deleted
		let secondEtag = "j0s0dghsidf"
		let secondPropertyName = "test2"
		let secondPropertyValue = "0werhoeifndck"

		let secondTableObject = new TableObject(secondUuid)
		secondTableObject.TableId = secondTableId
		secondTableObject.UploadStatus = secondUploadStatus
		secondTableObject.Etag = secondEtag
		secondTableObject.Properties = {
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let thirdUuid = generateUUID()
		let thirdTableId = 25
		let thirdUploadStatus = TableObjectUploadStatus.UpToDate
		let thirdEtag = "ionsdgjbsdf"
		let thirdPropertyName = "test3"
		let thirdPropertyValue = "asdobagobasf"

		let thirdTableObject = new TableObject(thirdUuid)
		thirdTableObject.TableId = thirdTableId
		thirdTableObject.UploadStatus = thirdUploadStatus
		thirdTableObject.Etag = thirdEtag
		thirdTableObject.Properties = {
			[thirdPropertyName]: { value: thirdPropertyValue }
		}

		// Save the table objects in tableObjectsArray
		await SetTableObjectsArray([
			firstTableObject,
			secondTableObject,
			thirdTableObject
		])

		// Act
		await DatabaseOperations.ConvertDatabaseFormat()

		// Assert
		let firstDatabaseTableObjectFromDatabase = await localforage.getItem(getTableObjectKey(firstTableId, firstUuid)) as DatabaseTableObject
		assert.isNotNull(firstDatabaseTableObjectFromDatabase)

		let firstTableObjectFromDatabase = DatabaseOperations.ConvertDatabaseTableObjectToTableObject(firstDatabaseTableObjectFromDatabase)
		assert.equal(firstTableObjectFromDatabase.Uuid, firstUuid)
		assert.equal(firstTableObjectFromDatabase.TableId, firstTableId)
		assert.equal(firstTableObjectFromDatabase.UploadStatus, firstUploadStatus)
		assert.equal(firstTableObjectFromDatabase.Etag, firstEtag)
		assert.equal(Object.keys(firstTableObjectFromDatabase.Properties).length, 1)
		assert.equal(firstTableObjectFromDatabase.Properties[firstPropertyName].value, firstPropertyValue)

		let secondDatabaseTableObjectFromDatabase = await localforage.getItem(getTableObjectKey(secondTableId, secondUuid)) as DatabaseTableObject
		assert.isNotNull(secondDatabaseTableObjectFromDatabase)

		let secondTableObjectFromDatabase = DatabaseOperations.ConvertDatabaseTableObjectToTableObject(secondDatabaseTableObjectFromDatabase)
		assert.equal(secondTableObjectFromDatabase.Uuid, secondUuid)
		assert.equal(secondTableObjectFromDatabase.TableId, secondTableId)
		assert.equal(secondTableObjectFromDatabase.UploadStatus, secondUploadStatus)
		assert.equal(secondTableObjectFromDatabase.Etag, secondEtag)
		assert.equal(Object.keys(secondTableObjectFromDatabase.Properties).length, 1)
		assert.equal(secondTableObjectFromDatabase.Properties[secondPropertyName].value, secondPropertyValue)

		let thirdDatabaseTableObjectFromDatabase = await localforage.getItem(getTableObjectKey(thirdTableId, thirdUuid)) as DatabaseTableObject
		assert.isNotNull(thirdDatabaseTableObjectFromDatabase)

		let thirdTableObjectFromDatabase = DatabaseOperations.ConvertDatabaseTableObjectToTableObject(thirdDatabaseTableObjectFromDatabase)
		assert.equal(thirdTableObjectFromDatabase.Uuid, thirdUuid)
		assert.equal(thirdTableObjectFromDatabase.TableId, thirdTableId)
		assert.equal(thirdTableObjectFromDatabase.UploadStatus, thirdUploadStatus)
		assert.equal(thirdTableObjectFromDatabase.Etag, thirdEtag)
		assert.equal(Object.keys(thirdTableObjectFromDatabase.Properties).length, 1)
		assert.equal(thirdTableObjectFromDatabase.Properties[thirdPropertyName].value, thirdPropertyValue)
	})
})