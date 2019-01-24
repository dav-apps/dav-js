import { assert } from 'chai';
import 'mocha';
var axios = require('axios');
import * as Dav from '../../lib/Dav';
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import * as DataManager from '../../lib/providers/DataManager';
import { Notification } from '../../lib/models/Notification';
import * as localforage from "localforage";
import { TableObject, TableObjectUploadStatus, ConvertIntToVisibility, ConvertObjectToMap, generateUUID } from '../../lib/models/TableObject';
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

function clearDatabase(){
   localforage.removeItem(Dav.userKey);
   localforage.removeItem(Dav.tableObjectsKey);
}

describe("Sync function", () => {
   it("should download all table objects from the server", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

      // Act
      await DataManager.Sync();

      // Assert
      var tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true);
      assert.equal(2, tableObjects.length);
      assert.equal(testDataTableId, tableObjects[0].TableId);
      assert.equal(testDataTableId, tableObjects[1].TableId);
      assert.equal(firstTestDataTableObject.Uuid, tableObjects[0].Uuid);
      assert.equal(secondTestDataTableObject.Uuid, tableObjects[1].Uuid);
      assert.equal(firstTestDataTableObject.Properties.get(firstPropertyName), tableObjects[0].Properties.get(firstPropertyName));
      assert.equal(firstTestDataTableObject.Properties.get(secondPropertyName), tableObjects[0].Properties.get(secondPropertyName));
      assert.equal(secondTestDataTableObject.Properties.get(firstPropertyName), tableObjects[1].Properties.get(firstPropertyName));
      assert.equal(secondTestDataTableObject.Properties.get(secondPropertyName), tableObjects[1].Properties.get(secondPropertyName));

      // Tidy up
      clearDatabase();
   });

   it("should remove the table objects that are not on the server", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

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
      assert.equal(firstTestDataTableObject.Properties.get(firstPropertyName), tableObjects[0].Properties.get(firstPropertyName));
      assert.equal(firstTestDataTableObject.Properties.get(secondPropertyName), tableObjects[0].Properties.get(secondPropertyName));
      assert.equal(secondTestDataTableObject.Properties.get(firstPropertyName), tableObjects[1].Properties.get(firstPropertyName));
      assert.equal(secondTestDataTableObject.Properties.get(secondPropertyName), tableObjects[1].Properties.get(secondPropertyName));

      // Tidy up
      clearDatabase();
   });

   it("should update only the table objects with a new etag", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

      await DataManager.Sync();

      // Change the etag so that it downloads the table object again
      var secondTableObjectFromDatabase = await DatabaseOperations.GetTableObject(secondTestDataTableObject.Uuid);
      var oldEtag = secondTableObjectFromDatabase.Etag;
      secondTableObjectFromDatabase.Properties.set(firstPropertyName, "blablabla");
      secondTableObjectFromDatabase.Etag = "blablabla";

      // Act
      await DataManager.Sync();

      // Assert
      var secondTableObjectFromDatabase2 = await DatabaseOperations.GetTableObject(secondTestDataTableObject.Uuid);
      assert.equal(oldEtag, secondTableObjectFromDatabase2.Etag);
      assert.equal(secondTestDataTableObject.Properties.get(firstPropertyName), secondTableObjectFromDatabase2.Properties.get(firstPropertyName));

      // Tidy up
      clearDatabase();
   });
});

describe("SyncPush function", () => {
   it("should upload created table objects", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

      var tableObject = new TableObject();
      tableObject.TableId = testDataTableId;
      tableObject.Properties = new Map([
         [firstPropertyName, "Testtest"],
         [secondPropertyName, "Test"]
      ]);
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await DataManager.SyncPush();

      // Assert
      // Get the table object from the server
      var tableObjectFromServer = await GetTableObjectFromServer(tableObject.Uuid);
      assert.isNotNull(tableObjectFromServer);
      assert.equal(tableObject.Properties.get(firstPropertyName), tableObjectFromServer.Properties.get(firstPropertyName));
      assert.equal(tableObject.Properties.get(secondPropertyName), tableObjectFromServer.Properties.get(secondPropertyName));
      
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.equal(TableObjectUploadStatus.UpToDate, tableObjectFromDatabase.UploadStatus);

      // Tidy up
      await DeleteTableObjectFromServer(tableObject.Uuid);
      clearDatabase();
   });

   it("should upload updated table objects", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

      await DataManager.Sync();
      var newPropertyValue = "testtest";

      var tableObject = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid);
      tableObject.Properties.set(firstPropertyName, newPropertyValue);
      tableObject.UploadStatus = TableObjectUploadStatus.Updated;
      await DatabaseOperations.UpdateTableObject(tableObject);
      
      // Act
      await DataManager.SyncPush();

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.equal(TableObjectUploadStatus.UpToDate, tableObjectFromDatabase.UploadStatus);

      var tableObjectFromServer = await GetTableObjectFromServer(tableObject.Uuid);
      assert.equal(newPropertyValue, tableObjectFromServer.Properties.get(firstPropertyName));

      // Tidy up
      tableObjectFromDatabase.Properties.set(firstPropertyName, firstTestDataTableObject.Properties.get(firstPropertyName));
      tableObjectFromDatabase.UploadStatus = TableObjectUploadStatus.Updated;
      await DatabaseOperations.UpdateTableObject(tableObjectFromDatabase);
      await DataManager.SyncPush();

      clearDatabase();
   });

   it("should upload deleted table objects", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

      var tableObject = new TableObject();
      tableObject.TableId = testDataTableId;
      tableObject.Properties = new Map([
         [firstPropertyName, "blabla"],
         [secondPropertyName, "testtest"]
      ]);
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
      clearDatabase();
   });

   it("should delete updated table objects that do not exist on the server", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

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
   });

   it("should delete deleted table objects that do not exist on the server", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

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
   });
});

describe("UpdateLocalTableObject function", () => {
   it("should get the table object from the server and update it locally", async () => {
      // Arrange
      // Get all table objects from the server
      let callbackCalled = false;
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {
            callbackCalled = true;
         },
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;
      await DataManager.Sync();

      // Update the table object in the database
      let tableObject = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid);
      tableObject.Properties.set(firstPropertyName, "blabla");
      tableObject.Properties.set(secondPropertyName, "testtest");
      await DatabaseOperations.UpdateTableObject(tableObject);

      // Act
      await DataManager.UpdateLocalTableObject(firstTestDataTableObject.Uuid);
      
      // Assert
      let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid);
      
      // The table object should be the same as before
      assert.equal(tableObjectFromDatabase.Properties.get(firstPropertyName), firstTestDataTableObject.Properties.get(firstPropertyName));
      assert.equal(tableObjectFromDatabase.Properties.get(secondPropertyName), firstTestDataTableObject.Properties.get(secondPropertyName));
      assert.isTrue(callbackCalled);

      // Tidy up
      clearDatabase();
   });
});

describe("DeleteLocalTableObject function", () => {
   it("should delete the table object locally", async () => {
      // Assert
      // Get all table objects from the server
      let callbackCalled = false;
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {
            callbackCalled = true;
         },
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;
      await DataManager.Sync();

      // Act
      await DataManager.DeleteLocalTableObject(firstTestDataTableObject.Uuid);

      // Assert
      let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(firstTestDataTableObject.Uuid);
      assert.isNull(tableObjectFromDatabase);
      assert.isTrue(callbackCalled);

      // Tidy up
      clearDatabase();
   });
});

describe("UnsubscribePushNotifications function", () => {
   it("should delete the subscription locally and on the server", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

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
      clearDatabase();
   });

   it("should not save the notification if the user is not logged in", async () => {
      // Arrange
      Dav.globals.jwt = null;
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

describe("DeleteNotification function", () => {
   it("should remove the notification from the database and from the server", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

      // Create the notification
      let time = new Date().getTime() / 1000;
      let interval = 5000;
      let properties = {
         title: "Hello World",
         message: "You have a new notification"
      }

      let uuid = await DataManager.CreateNotification(time, interval, properties);

      // Act
      await DataManager.DeleteNotification(uuid);

      // Assert
      let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);
      assert.isNull(notificationFromDatabase);

      let notificationFromServer = await GetNotificationFromServer(uuid);
      assert.isNull(notificationFromServer);
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

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
      clearDatabase();
   });

   it("should remove the notifications that are not on the server", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
      Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

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
      clearDatabase();
   });
});

describe("SyncPushNotifications function", () => {
	it("should upload created notifications", async () => {
		// Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
		Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;
		
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
		clearDatabase();
	});

	it("should upload deleted notifications", async () => {
		// Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
		Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

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
      clearDatabase();
	});

	it("should delete deleted notifications that do not exist on the server", async () => {
		// Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], [], {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
         DeleteTableObject: () => {},
         ReceiveNotification: () => {}
      });
		Dav.globals.jwt = davClassLibraryTestUserXTestUserJwt;

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
async function GetTableObjectFromServer(uuid: string): Promise<TableObject>{
   try{
      var response = await axios.get(Dav.globals.apiBaseUrl + "apps/object/" + uuid, {
         headers: {'Authorization': davClassLibraryTestUserXTestUserJwt}
      });

      var tableObject = new TableObject();
      tableObject.TableId = response.data.table_id;
      tableObject.IsFile = response.data.file;
      tableObject.Etag = response.data.etag;
      tableObject.Uuid = response.data.uuid;
      tableObject.Visibility = ConvertIntToVisibility(response.data.visibility);
      tableObject.Properties = ConvertObjectToMap(response.data.properties);

      return tableObject;
   }catch(error){
      return null;
   }
}

async function DeleteTableObjectFromServer(uuid: string) : Promise<{ ok: Boolean, message: string }>{
   try{
      var response = await axios({
         method: 'delete',
         url: Dav.globals.apiBaseUrl + "apps/object/" + uuid,
         headers: { 'Authorization': davClassLibraryTestUserXTestUserJwt }
      });

      return {ok: true, message: response.data};
   }catch(error){
      return {ok: false, message: error.response.data};
   }
}

async function GetSubscriptionFromServer(uuid: string) : Promise<{ uuid: string, endpoint: string, p256dh: string, auth: string }>{
   try{
      var response = await axios.get(Dav.globals.apiBaseUrl + "apps/subscription/" + uuid, {
         headers: {'Authorization': davClassLibraryTestUserXTestUserJwt}
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
      var response = await axios.get(Dav.globals.apiBaseUrl + "apps/notification/" + uuid, {
         headers: {'Authorization': davClassLibraryTestUserXTestUserJwt}
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
      var response = await axios({
         method: 'delete',
         url: Dav.globals.apiBaseUrl + "apps/notification/" + uuid,
         headers: { 'Authorization': davClassLibraryTestUserXTestUserJwt }
      });

      return {ok: true, message: response.data};
   }catch(error){
      return {ok: false, message: error.response.data};
   }
}
//#endregion