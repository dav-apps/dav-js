import 'mocha';
import { assert } from 'chai';
import * as localforage from "localforage";
import * as axios from 'axios';
import { Dav, Init } from '../../lib/Dav';
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import * as DataManager from '../../lib/providers/DataManager';
import { Notification } from '../../lib/models/Notification';
import { TableObject, TableObjectUploadStatus, ConvertIntToVisibility, generateUUID } from '../../lib/models/TableObject';
import { davClassLibraryTestUserXTestUserJwt, 
   davClassLibraryTestAppId, 
   davClassLibraryTestUserId, 
   testDataTableId, 
   firstPropertyName, 
   secondPropertyName, 
   firstTestDataTableObject, 
   secondTestDataTableObject,
   firstTestNotification,
   secondTestNotification, 
   firstNotificationPropertyName,
   secondNotificationPropertyName } from '../Constants';
import { DavEnvironment } from '../../lib/models/DavUser';

describe("Sync function", () => {
	async function downloadAllTableObjectsFromTheServerTest(separateKeyStorage: boolean){
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      // Act
      await DataManager.Sync();

      // Assert
		var tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true);
      assert.equal(2, tableObjects.length);
      assert.equal(testDataTableId, tableObjects[0].TableId);
      assert.equal(testDataTableId, tableObjects[1].TableId);
      assert.equal(firstTestDataTableObject.Uuid, tableObjects[0].Uuid);
      assert.equal(secondTestDataTableObject.Uuid, tableObjects[1].Uuid);
      assert.equal(firstTestDataTableObject.Properties[firstPropertyName], tableObjects[0].Properties[firstPropertyName]);
      assert.equal(firstTestDataTableObject.Properties[secondPropertyName], tableObjects[0].Properties[secondPropertyName]);
      assert.equal(secondTestDataTableObject.Properties[firstPropertyName], tableObjects[1].Properties[firstPropertyName]);
      assert.equal(secondTestDataTableObject.Properties[secondPropertyName], tableObjects[1].Properties[secondPropertyName]);

      // Tidy up
      await localforage.clear();
	}

	it("should download all table objects from the server", async () => await downloadAllTableObjectsFromTheServerTest(false));
	it("should download all table objects from the server with separateKeyStorage", async () => await downloadAllTableObjectsFromTheServerTest(true));

	async function removeTheTableObjectsThatAreNotOnTheServerTest(separateKeyStorage: boolean){
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      var deletedTableObject = new TableObject();
      deletedTableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
      deletedTableObject.TableId = testDataTableId;
      await DatabaseOperations.CreateTableObject(deletedTableObject);

      // Act
      await DataManager.Sync();

      // Assert
      var tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true);
      var deletedTableObjectFromDatabase = await DatabaseOperations.GetTableObject(deletedTableObject.Uuid);
      assert.isNull(deletedTableObjectFromDatabase);

      assert.equal(2, tableObjects.length);
      assert.equal(testDataTableId, tableObjects[0].TableId);
      assert.equal(testDataTableId, tableObjects[1].TableId);
      assert.equal(firstTestDataTableObject.Uuid, tableObjects[0].Uuid);
      assert.equal(secondTestDataTableObject.Uuid, tableObjects[1].Uuid);
      assert.equal(firstTestDataTableObject.Properties[firstPropertyName], tableObjects[0].Properties[firstPropertyName]);
      assert.equal(firstTestDataTableObject.Properties[secondPropertyName], tableObjects[0].Properties[secondPropertyName]);
      assert.equal(secondTestDataTableObject.Properties[firstPropertyName], tableObjects[1].Properties[firstPropertyName]);
      assert.equal(secondTestDataTableObject.Properties[secondPropertyName], tableObjects[1].Properties[secondPropertyName]);

      // Tidy up
      await localforage.clear();
	}

	it("should remove the table objects that are not on the server", async () => await removeTheTableObjectsThatAreNotOnTheServerTest(false));
	it("should remove the table objects that are not on the server with separateKeyStorage", async () => await removeTheTableObjectsThatAreNotOnTheServerTest(true));

	async function updateOnlyTheTableObjectsWithANewEtagTest(separateKeyStorage: boolean){
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      await DataManager.Sync();

      // Change the etag so that it downloads the table object again
      var secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(secondTestDataTableObject.Uuid);
      var oldEtag = secondTableObjectFromDatabase.Etag;
		secondTableObjectFromDatabase.Properties[firstPropertyName] = "blablabla";
      secondTableObjectFromDatabase.Etag = "blablabla";

      // Act
      await DataManager.Sync();

      // Assert
      var secondTableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(secondTestDataTableObject.Uuid);
      assert.equal(oldEtag, secondTableObjectFromDatabase2.Etag);
      assert.equal(secondTestDataTableObject.Properties[firstPropertyName], secondTableObjectFromDatabase2.Properties[firstPropertyName]);

      // Tidy up
      await localforage.clear();
	}

	it("should update only the table objects with a new etag", async () => await updateOnlyTheTableObjectsWithANewEtagTest(false));
	it("should update only the table objects with a new etag with separateKeyStorage", async () => await updateOnlyTheTableObjectsWithANewEtagTest(true));
});

describe("SyncPush function", () => {
	async function uploadCreatedTableObjectsTest(separateKeyStorage: boolean){
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      var tableObject = new TableObject();
      tableObject.TableId = testDataTableId;
		tableObject.Properties = {
			[firstPropertyName]: "Testtest",
			[secondPropertyName]: "Test"
		}
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await DataManager.SyncPush();

      // Assert
      // Get the table object from the server
      var tableObjectFromServer = await GetTableObjectFromServer(tableObject.Uuid);
      assert.isNotNull(tableObjectFromServer);
      assert.equal(tableObject.Properties[firstPropertyName], tableObjectFromServer.Properties[firstPropertyName]);
      assert.equal(tableObject.Properties[secondPropertyName], tableObjectFromServer.Properties[secondPropertyName]);
      
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.equal(TableObjectUploadStatus.UpToDate, tableObjectFromDatabase.UploadStatus);

      // Tidy up
      await DeleteTableObjectFromServer(tableObject.Uuid);
      await localforage.clear();
	}

	it("should upload created table objects", async () => await uploadCreatedTableObjectsTest(false));
	it("should upload created table objects with separateKeyStorage", async () => await uploadCreatedTableObjectsTest(true));

	async function uploadUpdatedTableObjectsTest(separateKeyStorage: boolean){
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      await DataManager.Sync();
      var newPropertyValue = "testtest";

      var tableObject = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid);
		tableObject.Properties[firstPropertyName] = newPropertyValue;
      tableObject.UploadStatus = TableObjectUploadStatus.Updated;
      await DatabaseOperations.UpdateTableObject(tableObject);
      
      // Act
      await DataManager.SyncPush();

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.equal(TableObjectUploadStatus.UpToDate, tableObjectFromDatabase.UploadStatus);

      var tableObjectFromServer = await GetTableObjectFromServer(tableObject.Uuid);
      assert.equal(newPropertyValue, tableObjectFromServer.Properties[firstPropertyName]);

      // Tidy up
		tableObjectFromDatabase.Properties[firstPropertyName] = firstTestDataTableObject.Properties[firstPropertyName];
      tableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Updated;
      await DatabaseOperations.UpdateTableObject(tableObjectFromDatabase);
      await DataManager.SyncPush();

      await localforage.clear();
	}

	it("should upload updated table objects", async () => await uploadUpdatedTableObjectsTest(false));
	it("should upload updated table objects with separateKeyStorage", async () => await uploadUpdatedTableObjectsTest(true));

	async function uploadDeletedTableObjectsTest(separateKeyStorage: boolean){
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      var tableObject = new TableObject();
      tableObject.TableId = testDataTableId;
		tableObject.Properties = {
			[firstPropertyName]: "blabla",
			[secondPropertyName]: "testtest"
		}
      await DatabaseOperations.CreateTableObject(tableObject);

      await DataManager.SyncPush();

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      tableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Deleted;
      await DatabaseOperations.UpdateTableObject(tableObjectFromDatabase);

      // Act
      await DataManager.SyncPush();

      // Assert
      var tableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNull(tableObjectFromDatabase2);

      var tableObjectFromServer = await GetTableObjectFromServer(tableObject.Uuid);
      assert.isNull(tableObjectFromServer);

      // Tidy up
      await localforage.clear();
	}

	it("should upload deleted table objects", async () => uploadDeletedTableObjectsTest(false));
	it("should upload deleted table objects with separateKeyStorage", async () => uploadDeletedTableObjectsTest(true));

	async function deleteUpdatedTableObjectsThatDoNotExistOnTheServerTest(separateKeyStorage: boolean){
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      // Save a table object with upload status updated in the database and run SyncPush
      var tableObject = new TableObject();
      tableObject.TableId = testDataTableId;
      tableObject.UploadStatus = TableObjectUploadStatus.Updated;

      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await DataManager.SyncPush();

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNull(tableObjectFromDatabase);
	}

	it("should delete updated table objects that do not exist on the server", async () => deleteUpdatedTableObjectsThatDoNotExistOnTheServerTest(false));
	it("should delete updated table objects that do not exist on the server with separateKeyStorage", async () => deleteUpdatedTableObjectsThatDoNotExistOnTheServerTest(true));

	async function deleteDeletedTableObjectsThatDoNotExistOnTheServerTest(separateKeyStorage: boolean){
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      // Save a table object with upload status deleted in the database and run SyncPush
      var tableObject = new TableObject();
      tableObject.TableId = testDataTableId;
      tableObject.UploadStatus = TableObjectUploadStatus.Deleted;

      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await DataManager.SyncPush();

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNull(tableObjectFromDatabase);
	}

	it("should delete deleted table objects that do not exist on the server", async () => deleteDeletedTableObjectsThatDoNotExistOnTheServerTest(false));
	it("should delete deleted table objects that do not exist on the server with separateKeyStorage", async () => deleteDeletedTableObjectsThatDoNotExistOnTheServerTest(true));
});

describe("UpdateLocalTableObject function", () => {
	async function getTheTableObjectFromTheServerAndUpdateItLocallyTest(separateKeyStorage: boolean){
		// Arrange
      // Get all table objects from the server
      let callbackCalled = false;
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {
            callbackCalled = true;
         },
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;
      await DataManager.Sync();

      // Update the table object in the database
		let tableObject = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid);
		tableObject.Properties[firstPropertyName] = "blabla";
		tableObject.Properties[secondPropertyName] = "testtest";
      await DatabaseOperations.UpdateTableObject(tableObject);

      // Act
      await DataManager.UpdateLocalTableObject(firstTestDataTableObject.Uuid);
      
      // Assert
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid);
      
      // The table object should be the same as before
      assert.equal(tableObjectFromDatabase.Properties[firstPropertyName], firstTestDataTableObject.Properties[firstPropertyName]);
      assert.equal(tableObjectFromDatabase.Properties[secondPropertyName], firstTestDataTableObject.Properties[secondPropertyName]);
      assert.isTrue(callbackCalled);

      // Tidy up
      await localforage.clear();
	}

	it("should get the table object from the server and update it locally", async () => await getTheTableObjectFromTheServerAndUpdateItLocallyTest(false));
	it("should get the table object from the server and update it locally with separateKeyStorage", async () => await getTheTableObjectFromTheServerAndUpdateItLocallyTest(true));
});

describe("DeleteLocalTableObject function", () => {
	async function deleteTheTableObjectLocallyTest(separateKeyStorage: boolean){
		// Assert
      // Get all table objects from the server
      let callbackCalled = false;
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {
            callbackCalled = true;
         },
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;
      await DataManager.Sync();

      // Act
      await DataManager.DeleteLocalTableObject(firstTestDataTableObject.Uuid);

      // Assert
      let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid);
      assert.isNull(tableObjectFromDatabase);
      assert.isTrue(callbackCalled);

      // Tidy up
      await localforage.clear();
	}

	it("should delete the table object locally", async () => deleteTheTableObjectLocallyTest(false));
	it("should delete the table object locally with separateKeyStorage", async () => deleteTheTableObjectLocallyTest(true));
});

describe("UnsubscribePushNotifications function", () => {
   it("should delete the subscription locally and on the server", async () => {
      // Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;
      let uuid = generateUUID();

      // Create the subscription
      await DatabaseOperations.SetSubscription({
         uuid,
         endpoint: "https://example.com/",
         p256dh: "blablabla",
         auth: "asdaosdasdj",
         status: DataManager.UploadStatus.New
      });

      // Upload the subscription to the server
      await DataManager.UpdateSubscriptionOnServer();

      // Act
      await DataManager.UnsubscribePushNotifications();

      // Assert
      // The subscription should be deleted locally and on the server
      let subscriptionFromDatabase = await DatabaseOperations.GetSubscription();
      assert.isNull(subscriptionFromDatabase);

      let subscriptionFromServer = await GetSubscriptionFromServer(uuid);
      assert.isNull(subscriptionFromServer);
   });
});

describe("CreateNotification function", () => {
   it("should save the notification in the database", async () => {
      // Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      let time = new Date().getTime() / 1000;
      let interval = 5000;
      let properties = {
         title: "Hello World",
         message: "You have a new notification"
      }

      // Act
      let uuid = await DataManager.CreateNotification(time, interval, properties);

      // Assert
      let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
      assert.isNotNull(notificationFromDatabase);
      assert.equal(time, notificationFromDatabase.Time);
      assert.equal(interval, notificationFromDatabase.Interval);
      assert.equal(properties.title, notificationFromDatabase.Properties["title"]);
      assert.equal(properties.message, notificationFromDatabase.Properties["message"]);

      // Delete the notification on the server
      await DeleteNotificationFromServer(uuid);

      // Tidy up
      await localforage.clear();
   });

   it("should not save the notification if the user is not logged in", async () => {
      // Arrange
      Dav.jwt = null;
      let time = new Date().getTime() / 1000;
      let interval = 5000;
      let properties = {
         title: "Hello World",
         message: "You have a new notification"
      }

      // Act
      let uuid = await DataManager.CreateNotification(time, interval, properties);

      // Assert
      let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
      assert.isNull(notificationFromDatabase);
   });
});

describe("GetNotification function", () => {
	it("should return the values of the notification", async () => {
		// Arrange
		Dav.jwt = davClassLibraryTestUserXTestUserJwt;

		// Create a notification
		let uuid = generateUUID();
		let time = 12312312;
		let interval = 12321
		let properties = {
			title: "Hello World",
			message: "This is a test notification"
		}
		let notification = new Notification(time, interval, properties, uuid, DataManager.UploadStatus.UpToDate);
		await notification.Save();

		// Act
		let notificationFromDatabase = await DataManager.GetNotification(uuid);
		
		// Assert
		assert.equal(time, notificationFromDatabase.time)
		assert.equal(interval, notificationFromDatabase.interval);
		assert.equal(properties.title, notificationFromDatabase.properties["title"]);
		assert.equal(properties.message, notificationFromDatabase.properties["message"]);
	});

	it("should return null if the notification does not exist", async () => {
		// Arrange
		let uuid = generateUUID();

		// Act
		let notificationFromDatabase = await DataManager.GetNotification(uuid);

		// Assert
		assert.isNull(notificationFromDatabase);
	});
});

describe("UpdateNotification function", () => {
	it("should update the notification in the database", async () => {
      // Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
		Dav.jwt = davClassLibraryTestUserXTestUserJwt;

		// Create a notification
		let uuid = generateUUID();
		let newTime = 1231262343;
		let newInterval = 123123;
		let newProperties = {
			title: "new title",
			message: "new message"
		}
		let notification = new Notification(12312667, 12, {title: "test", message: "test"}, uuid, DataManager.UploadStatus.New);
		await notification.Save();

		// Act
      await DataManager.UpdateNotification(uuid, newTime, newInterval, newProperties);

		// Assert
		// The notification should have the new values in the database
      let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
		assert.equal(newTime, notificationFromDatabase.Time);
		assert.equal(newInterval, notificationFromDatabase.Interval);
		assert.equal(newProperties.title, notificationFromDatabase.Properties["title"]);
		assert.equal(newProperties.message, notificationFromDatabase.Properties["message"]);

		// Tidy up
		// Delete the notification on the server
		await DeleteNotificationFromServer(uuid);
	});
});

describe("DeleteNotification function", () => {
   it("should remove the notification from the database", async () => {
      // Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      // Create the notification
      let time = new Date().getTime() / 1000;
      let interval = 5000;
      let properties = {
         title: "Hello World",
         message: "You have a new notification"
      }

		let notification = new Notification(time, interval, properties, null, DataManager.UploadStatus.New);
		await notification.Save();

      // Act
      await DataManager.DeleteNotification(notification.Uuid);

      // Assert
      let notificationFromDatabase = await DatabaseOperations.GetNotification(notification.Uuid);
		assert.isNull(notificationFromDatabase);
   });
});

describe("DeleteNotificationImmediately function", () => {
   it("should remove the notification from the database", async () => {
      // Arrange
      let uuid = generateUUID();
      let notification = new Notification(123123, 3600, {title: "test"}, uuid);
      await notification.Save();

      // Make sure the notification was saved
      let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
      assert.isNotNull(notificationFromDatabase);

      // Act
      await DataManager.DeleteNotificationImmediately(uuid);

      // Assert
      let notificationFromDatabase2 = await DatabaseOperations.GetNotification(uuid);
      assert.isNull(notificationFromDatabase2);
   });
});

describe("SyncNotifications function", () => {
   it("should download all notifications from the server", async () => {
      // Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      // Act
      await DataManager.SyncNotifications();

      // Assert
      let notifications = await DatabaseOperations.GetAllNotifications();
      assert.equal(2, notifications.length);

      assert.equal(firstTestNotification.Uuid, notifications[0].Uuid);
      assert.equal(firstTestNotification.Time, notifications[0].Time);
      assert.equal(firstTestNotification.Interval, notifications[0].Interval);
      assert.equal(firstTestNotification.Properties[firstNotificationPropertyName], notifications[0].Properties[firstNotificationPropertyName]);
      assert.equal(firstTestNotification.Properties[secondNotificationPropertyName], notifications[0].Properties[secondNotificationPropertyName]);

      assert.equal(secondTestNotification.Uuid, notifications[1].Uuid);
      assert.equal(secondTestNotification.Time, notifications[1].Time);
      assert.equal(secondTestNotification.Interval, notifications[1].Interval);
      assert.equal(secondTestNotification.Properties[firstNotificationPropertyName], notifications[1].Properties[firstNotificationPropertyName]);
      assert.equal(secondTestNotification.Properties[secondNotificationPropertyName], notifications[1].Properties[secondNotificationPropertyName]);

      // Tidy up
      await localforage.clear();
   });

   it("should remove the notifications that are not on the server", async () => {
      // Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = davClassLibraryTestUserXTestUserJwt;

      // Create a notification locally
      let deletedNotificationUuid = generateUUID();
      let deletedNotification = new Notification(123123, 30000, {
         title: "test",
         message: "testtest"
      }, deletedNotificationUuid, DataManager.UploadStatus.UpToDate);
      await deletedNotification.Save();

      // Act
      await DataManager.SyncNotifications();

      // Assert
      let deletedNotificationFromDatabase = await DatabaseOperations.GetNotification(deletedNotificationUuid);
      assert.isNull(deletedNotificationFromDatabase);

      let notifications = await DatabaseOperations.GetAllNotifications();
      assert.equal(2, notifications.length);

      assert.equal(firstTestNotification.Uuid, notifications[0].Uuid);
      assert.equal(firstTestNotification.Time, notifications[0].Time);
      assert.equal(firstTestNotification.Interval, notifications[0].Interval);
      assert.equal(firstTestNotification.Properties[firstNotificationPropertyName], notifications[0].Properties[firstNotificationPropertyName]);
      assert.equal(firstTestNotification.Properties[secondNotificationPropertyName], notifications[0].Properties[secondNotificationPropertyName]);

      assert.equal(secondTestNotification.Uuid, notifications[1].Uuid);
      assert.equal(secondTestNotification.Time, notifications[1].Time);
      assert.equal(secondTestNotification.Interval, notifications[1].Interval);
      assert.equal(secondTestNotification.Properties[firstNotificationPropertyName], notifications[1].Properties[firstNotificationPropertyName]);
      assert.equal(secondTestNotification.Properties[secondNotificationPropertyName], notifications[1].Properties[secondNotificationPropertyName]);

      // Tidy up
      await localforage.clear();
   });
});

describe("SyncPushNotifications function", () => {
	it("should upload created notifications", async () => {
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
		Dav.jwt = davClassLibraryTestUserXTestUserJwt;
		
		let uuid = generateUUID();
		let time = 123123;
		let interval = 6000;
		let firstPropertyValue = "Hello World";
		let secondPropertyValue = "This is a test notification";

		let notification = new Notification(time, interval, {
			title: firstPropertyValue,
			message: secondPropertyValue
		}, uuid, DataManager.UploadStatus.New);
		await notification.Save();

		// Act
		await DataManager.SyncPushNotifications();

		// Assert
		// Get the notification from the server
		let notificationFromServer = await GetNotificationFromServer(uuid);
		assert.isNotNull(notificationFromServer);
		assert.equal(time, notificationFromServer.time);
		assert.equal(interval, notificationFromServer.interval);
		assert.equal(firstPropertyValue, notificationFromServer.properties["title"]);
		assert.equal(secondPropertyValue, notificationFromServer.properties["message"]);

		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
		assert.equal(DataManager.UploadStatus.UpToDate, notificationFromDatabase.Status);

		// Tidy up
		await DeleteNotificationFromServer(uuid);
		await localforage.clear();
   });
   
   it("should upload updated notifications", async () => {
      // Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
		Dav.jwt = davClassLibraryTestUserXTestUserJwt;
		
		let newTime = 1123213;
		let newInterval = 21312;
		let newProperties = {
			title: "New title",
			message: "New message"
		}

      // Download all notifications
      await DataManager.SyncNotifications();

		// Update one existing notification
		let notification = await DatabaseOperations.GetNotification(firstTestNotification.Uuid);
		notification.Time = newTime;
		notification.Interval = newInterval;
		notification.Properties = newProperties;
		notification.Status = DataManager.UploadStatus.Updated;
		await notification.Save();
      
      // Act
		await DataManager.SyncPushNotifications();

		// Assert
		// The local notification should be updated and the status should be UpToDate
		let notificationFromDatabase = await DatabaseOperations.GetNotification(firstTestNotification.Uuid);
		assert.equal(newTime, notificationFromDatabase.Time);
		assert.equal(newInterval, notificationFromDatabase.Interval);
		assert.equal(newProperties.title, notificationFromDatabase.Properties["title"]);
		assert.equal(newProperties.message, notificationFromDatabase.Properties["message"]);
		assert.equal(DataManager.UploadStatus.UpToDate, notificationFromDatabase.Status);
		
		// The notification on the server should be updated
		let notificationFromServer = await GetNotificationFromServer(firstTestNotification.Uuid);
		assert.equal(newTime, notificationFromServer.time);
		assert.equal(newInterval, notificationFromServer.interval);
		assert.equal(newProperties.title, notificationFromServer.properties["title"]);
		assert.equal(newProperties.message, notificationFromServer.properties["message"]);

		// Tidy up
		notificationFromDatabase.Time = firstTestNotification.Time;
		notificationFromDatabase.Interval = firstTestNotification.Interval;
		notificationFromDatabase.Properties = firstTestNotification.Properties;
		notificationFromDatabase.Status = DataManager.UploadStatus.Updated;
		await notificationFromDatabase.Save();
		await DataManager.SyncPushNotifications();
   });

	it("should upload deleted notifications", async () => {
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
		Dav.jwt = davClassLibraryTestUserXTestUserJwt;

		// Create a notification and save in on the server
		let uuid = generateUUID();
		let notification = new Notification(1212121, 5000, {
			title: "Hello World",
			message: "This is a test notification"
		}, uuid, DataManager.UploadStatus.New);
		await notification.Save();
		await DataManager.SyncPushNotifications();

		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
		notificationFromDatabase.Status = DataManager.UploadStatus.Deleted;
		await notificationFromDatabase.Save();

		// Act
		await DataManager.SyncPushNotifications();

		// Assert
		// The notification should be deleted on the server and locally
		let notificationFromDatabase2 = await DatabaseOperations.GetNotification(uuid);
		assert.isNull(notificationFromDatabase2);

		let notificationFromServer = await GetNotificationFromServer(uuid);
		assert.isNull(notificationFromServer);

		// Tidy up
      await localforage.clear();
	});

	it("should delete updated notification that do not exist on the server", async () => {
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
		Dav.jwt = davClassLibraryTestUserXTestUserJwt;

		// Create a notification with Status = Updated
		let uuid = generateUUID();
		let notification = new Notification(112312, 232, {title: "test"}, uuid, DataManager.UploadStatus.Updated);
		await notification.Save();

		// Act
		await DataManager.SyncPushNotifications();

		// Assert
		// The notification should be deleted
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
		assert.isNull(notificationFromDatabase);
	});

	it("should delete deleted notifications that do not exist on the server", async () => {
		// Arrange
      Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], false, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         SyncFinished: () => {}
      });
		Dav.jwt = davClassLibraryTestUserXTestUserJwt;

		// Create a notification with Status = Deleted
		let uuid = generateUUID();
		let notification = new Notification(1212121, 5000, {
			title: "Hello World",
			message: "This is a test notification"
		}, uuid, DataManager.UploadStatus.Deleted);
		await notification.Save();

		// Act
		await DataManager.SyncPushNotifications();

		// Assert
		// The notification should be deleted locally
		let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
		assert.isNull(notificationFromDatabase);
	});
});

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
     	let tableIds = [1, 2, 3, 4];
     	let parallelTableIds = [];
     	let tableIdPages = new Map<number, number>();
     	tableIdPages.set(1, 2);
     	tableIdPages.set(2, 2);
     	tableIdPages.set(3, 2);
     	tableIdPages.set(4, 2);

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages);

		// Assert
		assert.deepEqual([1, 1, 2, 2, 3, 3, 4, 4], sortedTableIds);
	});
	
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
     	let tableIds = [1, 2, 3, 4];
     	let parallelTableIds = [2];
     	let tableIdPages = new Map<number, number>();
     	tableIdPages.set(1, 2);
     	tableIdPages.set(2, 2);
     	tableIdPages.set(3, 2);
     	tableIdPages.set(4, 2);

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages);

		// Assert
		assert.deepEqual([1, 1, 2, 2, 3, 3, 4, 4], sortedTableIds);
	});

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
     	let tableIds = [1, 2, 3, 4];
     	let parallelTableIds = [2, 3];
     	let tableIdPages = new Map<number, number>();
     	tableIdPages.set(1, 2);
     	tableIdPages.set(2, 2);
     	tableIdPages.set(3, 2);
     	tableIdPages.set(4, 2);

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages);

		// Assert
		assert.deepEqual([1, 1, 2, 3, 2, 3, 4, 4], sortedTableIds);
	});

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
     	let tableIds = [1, 2, 3, 4];
     	let parallelTableIds = [1, 4];
     	let tableIdPages = new Map<number, number>();
     	tableIdPages.set(1, 2);
     	tableIdPages.set(2, 2);
     	tableIdPages.set(3, 2);
     	tableIdPages.set(4, 2);

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages);

		// Assert
		assert.deepEqual([1, 2, 2, 3, 3, 4, 1, 4], sortedTableIds);
	});

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
     	let tableIds = [1, 2, 3, 4];
     	let parallelTableIds = [1, 4];
     	let tableIdPages = new Map<number, number>();
     	tableIdPages.set(1, 3);
     	tableIdPages.set(2, 1);
     	tableIdPages.set(3, 2);
     	tableIdPages.set(4, 4);

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages);

		// Assert
		assert.deepEqual([1, 2, 3, 3, 4, 1, 4, 1, 4, 4], sortedTableIds);
	});

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
     	let tableIds = [1, 2, 3, 4];
     	let parallelTableIds = [1, 2];
     	let tableIdPages = new Map<number, number>();
     	tableIdPages.set(1, 2);
     	tableIdPages.set(2, 4);
     	tableIdPages.set(3, 3);
     	tableIdPages.set(4, 2);

		// Act
		let sortedTableIds = DataManager.SortTableIds(tableIds, parallelTableIds, tableIdPages);

		// Assert
		assert.deepEqual([1, 2, 1, 2, 2, 2, 3, 3, 3, 4, 4], sortedTableIds);
	});
});

//#region Helper methods
export async function GetTableObjectFromServer(uuid: string): Promise<TableObject>{
   try{
		var response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/object/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});

      var tableObject = new TableObject();
      tableObject.TableId = response.data.table_id;
      tableObject.IsFile = response.data.file;
      tableObject.Etag = response.data.etag;
      tableObject.Uuid = response.data.uuid;
      tableObject.Visibility = ConvertIntToVisibility(response.data.visibility);
      tableObject.Properties = response.data.properties;

      return tableObject;
   }catch(error){
      return null;
   }
}

export async function DeleteTableObjectFromServer(uuid: string) : Promise<{ ok: Boolean, message: string }>{
   try{
		var response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/apps/object/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});

      return {ok: true, message: response.data};
   }catch(error){
      return {ok: false, message: error.response.data};
   }
}

async function GetSubscriptionFromServer(uuid: string) : Promise<{ uuid: string, endpoint: string, p256dh: string, auth: string }>{
   try{
		var response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/subscription/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});

      return {
         uuid: response.data.uuid,
         endpoint: response.data.endpoint,
         p256dh: response.data.p256dh,
         auth: response.data.auth
      }
   }catch(error){
      return null;
   }
}

async function GetNotificationFromServer(uuid: string) : Promise<{ uuid: string, time: number, interval: number, properties: object }>{
   try{
		var response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/notification/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});

      return {
         uuid: response.data.uuid,
         time: response.data.time,
         interval: response.data.interval,
         properties: response.data.properties
      }
   }catch(error){
      return null;
   }
}

async function DeleteNotificationFromServer(uuid: string) : Promise<{ ok: Boolean, message: string }>{
   try{
		var response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/apps/notification/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});
		
      return {ok: true, message: response.data};
   }catch(error){
      return {ok: false, message: error.response.data};
   }
}
//#endregion