import 'mocha';
import { assert } from 'chai';
import * as localforage from "localforage";
import { extendPrototype } from 'localforage-startswith';
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import { Dav, userKey, notificationsKey, getTableObjectsKey, tableObjectsKey, Init } from '../../lib/Dav';
import { TableObject, TableObjectUploadStatus, generateUUID } from '../../lib/models/TableObject';
import { Notification } from '../../lib/models/Notification';
import { UploadStatus } from '../../lib/providers/DataManager';
import { DavEnvironment } from '../../lib/models/DavUser';

extendPrototype(localforage);

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

      // Tidy up
      await localforage.clear();
   });
});

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

      // Tidy up
      await localforage.clear();
   });
});

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
   });
});

describe("GetAllNotifications function", () => {
   it("should return all notifications", async () => {
      // Arrange
      let generatedNotifications = GenerateNotifications();
      for(let notification of generatedNotifications){
         await DatabaseOperations.SaveNotification(notification);
      }

      // Act
      let notifications = await DatabaseOperations.GetAllNotifications();
      assert.equal(notifications.length, generatedNotifications.length);

      // Assert
      let i = 0;
      for(let notification of notifications){
         assert.equal(notification.Uuid, generatedNotifications[i].Uuid);
         assert.equal(notification.Time, generatedNotifications[i].Time);
         assert.equal(notification.Interval, generatedNotifications[i].Interval);

         assert.equal(notification.Properties["title"], generatedNotifications[i].Properties["title"])
         assert.equal(notification.Properties["message"], generatedNotifications[i].Properties["message"])

         i++;
      }

      // Tidy up
      await localforage.clear();
   });

   function GenerateNotifications() : Array<Notification>{
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
});

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

      // Tidy up
      await localforage.clear();
   });

   it("should return null if the notification does not exist", async () => {
      // Arrange
      let uuid = generateUUID();

      // Act
      let notificationFromDatabase = await DatabaseOperations.GetNotification(uuid);

      // Assert
      assert.isNull(notificationFromDatabase);

      // Tidy up
      await localforage.clear();
   });
});

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

		// Tidy up
      await localforage.clear();
   });

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
		
		// Tidy up
      await localforage.clear();
   });
});

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

		// Tidy up
      await localforage.clear();
	});
});

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
});

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

		// Tidy up
      await localforage.clear();
	});
});

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

		// Tidy up
      await localforage.clear();
	});
});

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

		// Tidy up
      await localforage.clear();
	});
});

describe("CreateTableObject function", () => {
	async function saveTableObjectAndReturnUuidTest(separateKeyStorage: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;

		var uuid = "2569d0b8-61a2-4cf1-9bcd-682d55f99db9";
		var tableId = -13;
      var uploadStatus = TableObjectUploadStatus.Updated;
      var etag = "13212313qd13coi192cn";
      var firstPropertyName = "page1";
      var firstPropertyValue = "Hello World";
      var secondPropertyName = "page2";
      var secondPropertyValue = "Hallo Welt";

      var properties = {};
      properties[firstPropertyName] = firstPropertyValue;
      properties[secondPropertyName] = secondPropertyValue;

      var tableObject = new TableObject();
      tableObject.Uuid = uuid;
      tableObject.TableId = tableId;
      tableObject.UploadStatus = uploadStatus;
      tableObject.Etag = etag;
      tableObject.Properties = {
         [firstPropertyName]: firstPropertyValue,
         [secondPropertyName]: secondPropertyValue
      }

      // Act
		var savedUuid = await DatabaseOperations.CreateTableObject(tableObject);

		// Assert
      var savedObject = separateKeyStorage ? (await localforage.getItem(getTableObjectsKey(tableObject.TableId, tableObject.Uuid))) : (await localforage.getItem(tableObjectsKey) as object[])[0];

      assert.equal(uuid, savedUuid);
      assert.equal(uuid, savedObject["Uuid"]);
      assert.equal(tableId, savedObject["TableId"]);
      assert.equal(uploadStatus, savedObject["UploadStatus"]);
      assert.equal(etag, savedObject["Etag"]);

      assert.equal(properties[firstPropertyName], savedObject["Properties"][firstPropertyName]);
      assert.equal(properties[secondPropertyName], savedObject["Properties"][secondPropertyName]);

      // Tidy up
      await localforage.clear();
	}

	it("should save the table object and return the uuid", async () => await saveTableObjectAndReturnUuidTest(false));
	it("should save the table object and return the uuid with separateKeyStorage", async () => await saveTableObjectAndReturnUuidTest(true));

	it("should generate a new uuid if the uuid is already in use", async () => {
		// Arrange
		Dav.separateKeyStorage = false;

		var uuid = "3f0b11b9-78b1-4b63-b613-8a82945300eb";
		var tableId = 1;
		var firstTableObject = new TableObject();
		firstTableObject.Uuid = uuid;
		firstTableObject.TableId = tableId;
		var oldUuid = await DatabaseOperations.CreateTableObject(firstTableObject);
		assert.equal(uuid, oldUuid);

		var secondTableObject = new TableObject();
		secondTableObject.Uuid = uuid;
		secondTableObject.TableId = tableId;
		
		// Act
		var newUuid = await DatabaseOperations.CreateTableObject(secondTableObject);
		
		// Assert
		assert.notEqual(uuid, newUuid);

		// Tidy up
		await localforage.clear();
	});
});

describe("CreateTableObjects function", () => {
	async function saveMultipleTableObjectsTest(separateKeyStorage: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;

		var firstTableObject = new TableObject();
		var firstUuid = "a6408375-1748-4765-96f1-cc4ba86ba3d1";
		var firstTableId = 1;
      var firstEtag = "asdasdpoasjd0asdaud";
      
      firstTableObject.TableId = firstTableId;
      firstTableObject.Uuid = firstUuid;
      firstTableObject.Etag = firstEtag;

		var secondTableObject = new TableObject();
		var secondUuid = "fbf66639-bcca-433c-bd55-34d2717138f3";
		var secondTableId = 2;
      var secondEtag = "ad02qewjs";

      secondTableObject.TableId = secondTableId;
      secondTableObject.Uuid = secondUuid;
      secondTableObject.Etag = secondEtag;

      var tableObjects = [firstTableObject, secondTableObject];

      // Act
      var uuids = await DatabaseOperations.CreateTableObjects(tableObjects);

      // Assert
      assert.equal(tableObjects.length, uuids.length);
      assert.equal(firstUuid, uuids[0]);
		assert.equal(secondUuid, uuids[1]);

      var tableObjectsFromDatabase = separateKeyStorage ? await getTableObjects(getTableObjectsKey()) : await localforage.getItem(tableObjectsKey) as object[];
		
      assert.equal(firstTableId, tableObjectsFromDatabase[0]["TableId"]);
      assert.equal(secondTableId, tableObjectsFromDatabase[1]["TableId"]);
      assert.equal(firstEtag, tableObjectsFromDatabase[0]["Etag"]);
      assert.equal(secondEtag, tableObjectsFromDatabase[1]["Etag"]);

      // Tidy up
      await localforage.clear();
	}

	it("should save multiple table objects", async () => await saveMultipleTableObjectsTest(false));
	it("should save multiple table objects with separateKeyStorage", async () => await saveMultipleTableObjectsTest(true));

   it("should generate new uuids for table objects with a uuid that is already in use", async () => {
		// Arrange
		Dav.separateKeyStorage = false;

      var firstTableObject = new TableObject();
		var uuid = "a6408375-1748-4765-96f1-cc4ba86ba3d1";
		var firstTableId = -123;
      var firstEtag = "asdasdpoasjd0asdaud";
      
      firstTableObject.TableId = firstTableId;
      firstTableObject.Uuid = uuid;
      firstTableObject.Etag = firstEtag;

		var secondTableObject = new TableObject();
		var secondTableId = -212;
      var secondEtag = "ad02qewjs";

      secondTableObject.TableId = secondTableId;
      secondTableObject.Uuid = uuid;
      secondTableObject.Etag = secondEtag;

      var tableObjects = [firstTableObject, secondTableObject];

      // Act
      var uuids = await DatabaseOperations.CreateTableObjects(tableObjects);

      // Assert
      assert.notEqual(uuids[0], uuids[1]);
      assert.equal(uuid, uuids[0]);

      var tableObjectsFromDatabase = await localforage.getItem(tableObjectsKey) as object[];

      assert.equal(firstTableId, tableObjectsFromDatabase[0]["TableId"]);
      assert.equal(secondTableId, tableObjectsFromDatabase[1]["TableId"]);
      assert.equal(firstEtag, tableObjectsFromDatabase[0]["Etag"]);
      assert.equal(secondEtag, tableObjectsFromDatabase[1]["Etag"]);

      // Tidy up
      await localforage.clear();
   });
});

describe("GetTableObject function", () => {
	async function returnAppropriateTableObjectTest(separateKeyStorage: boolean, withTableId: boolean){
      // Arrange
      var tableId = 126;

      Init(DavEnvironment.Test, 1, [tableId], [], separateKeyStorage, {icon: "", badge: ""}, {
			UpdateAllOfTable: () => {},
			UpdateTableObject: () => {},
			DeleteTableObject: () => {},
			SyncFinished: () => {}
		});

		var uuid = "ccd8b4d1-5501-4cf9-b05b-17a433fbb042";
      var etag = "0usadkasdpna";
      var uploadStatus = TableObjectUploadStatus.NoUpload;

      var firstPropertyName = "page1";
      var firstPropertyValue = "Hello World";
      var secondPropertyName = "page2";
      var secondPropertyValue = "Hallo Welt";

      var properties = {};
      properties[firstPropertyName] = firstPropertyValue;
      properties[secondPropertyName] = secondPropertyValue;

      var tableObject = new TableObject();
      tableObject.Uuid = uuid;
      tableObject.TableId = tableId;
      tableObject.Etag = etag;
		tableObject.UploadStatus = uploadStatus;
		tableObject.Properties = {
			[firstPropertyName]: firstPropertyValue,
			[secondPropertyName]: secondPropertyValue
		}

		await DatabaseOperations.CreateTableObject(tableObject)

      // Act
		var tableObjectFromDatabase = withTableId ? await DatabaseOperations.GetTableObject(uuid, tableObject.TableId) : await DatabaseOperations.GetTableObject(uuid);

      // Assert
      assert.equal(uuid, tableObjectFromDatabase.Uuid);
      assert.equal(tableId, tableObjectFromDatabase.TableId);
      assert.equal(etag, tableObjectFromDatabase.Etag);
      assert.equal(uploadStatus, tableObjectFromDatabase.UploadStatus);
      assert.equal(properties[firstPropertyName], tableObjectFromDatabase.Properties[firstPropertyName]);
      assert.equal(properties[secondPropertyName], tableObjectFromDatabase.Properties[secondPropertyName]);

      // Tidy up
      await localforage.clear();
	}

	it("should return the appropriate table object", async () => await returnAppropriateTableObjectTest(false, false));
	it("should return the appropriate table object with separateKeyStorage", async () => await returnAppropriateTableObjectTest(true, false));
	it("should return the appropriate table object with separateKeyStorage and tableId", async () => await returnAppropriateTableObjectTest(true, true));
	
	async function returnNullIfTableObjectDoesNotExistTest(separateKeyStorage: boolean, withTableId: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;

		var uuid = "4c4286d8-5acb-49b6-b6ef-b0d3d7de9425";

		// Act
		var tableObjectFromDatabase = withTableId ? await DatabaseOperations.GetTableObject(uuid, 1) : await DatabaseOperations.GetTableObject(uuid);

		// Assert
		assert.isNull(tableObjectFromDatabase);
	}

	it("should return null if the table object does not exist", async () => await returnNullIfTableObjectDoesNotExistTest(false, false));
	it("should return null if the table object does not exist with separateKeyStorage", async () => await returnNullIfTableObjectDoesNotExistTest(true, false));
	it("should return null if the table object does not exist with separateKeyStorage and tableId", async () => await returnNullIfTableObjectDoesNotExistTest(true, true));
});

describe("GetAllTableObjects function", () => {
	async function returnTableObjectWithSpecifiedTableAndWithoutDeletedOnesTest(separateKeyStorage: boolean){
		// GetAllTableObjects(2, false);
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;

		var generatedTableObjects = GenerateTableObjects();
      await DatabaseOperations.CreateTableObjects(generatedTableObjects.tableObjects);

      // Act
      var tableObjects = await DatabaseOperations.GetAllTableObjects(generatedTableObjects.firstTableId, false);  // Should return only the first table object

      // Assert
      assert.equal(1, tableObjects.length);

      assert.equal(generatedTableObjects.firstUuid, tableObjects[0].Uuid);
      assert.equal(generatedTableObjects.firstTableId, tableObjects[0].TableId);
      assert.equal(generatedTableObjects.firstEtag, tableObjects[0].Etag);
      assert.equal(generatedTableObjects.firstUploadStatus, tableObjects[0].UploadStatus);

      // Tidy up
      await localforage.clear();
	}

	it("should return table objects with specified table and without deleted ones", async () => await returnTableObjectWithSpecifiedTableAndWithoutDeletedOnesTest(false));
	it("should return table objects with specified table and without deleted ones with separateKeyStorage", async () => await returnTableObjectWithSpecifiedTableAndWithoutDeletedOnesTest(true));

	async function returnTableObjectsWithoutSpecofoedTableAndWithDeletedOnesTest(separateKeyStorage: boolean){
		// GetAllTableObjects(-1, true);
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;

      var generatedTableObjects = GenerateTableObjects();
      await DatabaseOperations.CreateTableObjects(generatedTableObjects.tableObjects);

      // Act
      var tableObjects = await DatabaseOperations.GetAllTableObjects(-1, true);  // Should return all four table objects

      // Assert
      assert.equal(4, tableObjects.length);

      assert.equal(generatedTableObjects.firstUuid, tableObjects[0].Uuid);
      assert.equal(generatedTableObjects.firstTableId, tableObjects[0].TableId);
      assert.equal(generatedTableObjects.firstEtag, tableObjects[0].Etag);
      assert.equal(generatedTableObjects.firstUploadStatus, tableObjects[0].UploadStatus);

      assert.equal(generatedTableObjects.secondUuid, tableObjects[1].Uuid);
      assert.equal(generatedTableObjects.secondTableId, tableObjects[1].TableId);
      assert.equal(generatedTableObjects.secondEtag, tableObjects[1].Etag);
      assert.equal(generatedTableObjects.secondUploadStatus, tableObjects[1].UploadStatus);

      assert.equal(generatedTableObjects.thirdUuid, tableObjects[2].Uuid);
      assert.equal(generatedTableObjects.thirdTableId, tableObjects[2].TableId);
      assert.equal(generatedTableObjects.thirdEtag, tableObjects[2].Etag);
      assert.equal(generatedTableObjects.thirdUploadStatus, tableObjects[2].UploadStatus);

      assert.equal(generatedTableObjects.fourthUuid, tableObjects[3].Uuid);
      assert.equal(generatedTableObjects.fourthTableId, tableObjects[3].TableId);
      assert.equal(generatedTableObjects.fourthEtag, tableObjects[3].Etag);
      assert.equal(generatedTableObjects.fourthUploadStatus, tableObjects[3].UploadStatus);

      // Tidy up
      await localforage.clear();
	}

	it("should return table objects without specified table and with deleted ones", async () => await returnTableObjectsWithoutSpecofoedTableAndWithDeletedOnesTest(false));
	it("should return table objects without specified table and with deleted ones with separateKeyStorage", async () => await returnTableObjectsWithoutSpecofoedTableAndWithDeletedOnesTest(true));

	async function returnTableObjectsWithoutSpecifiedTableAndWithoutDeletedOnesTest(separateKeyStorage: boolean){
		// GetAllTableObjects(-1, false);
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;

      var generatedTableObjects = GenerateTableObjects();
      await DatabaseOperations.CreateTableObjects(generatedTableObjects.tableObjects);

      // Act
      var tableObjects = await DatabaseOperations.GetAllTableObjects(-1, false);    // Should return first and second table object
      
      // Assert
      assert.equal(2, tableObjects.length);

      assert.equal(generatedTableObjects.firstUuid, tableObjects[0].Uuid);
      assert.equal(generatedTableObjects.firstTableId, tableObjects[0].TableId);
      assert.equal(generatedTableObjects.firstEtag, tableObjects[0].Etag);
      assert.equal(generatedTableObjects.firstUploadStatus, tableObjects[0].UploadStatus);

      assert.equal(generatedTableObjects.secondUuid, tableObjects[1].Uuid);
      assert.equal(generatedTableObjects.secondTableId, tableObjects[1].TableId);
      assert.equal(generatedTableObjects.secondEtag, tableObjects[1].Etag);
      assert.equal(generatedTableObjects.secondUploadStatus, tableObjects[1].UploadStatus);

      // Tidy up
      await localforage.clear();
	}

	it("should return table objects without specified table and without deleted ones", async () => await returnTableObjectsWithoutSpecifiedTableAndWithoutDeletedOnesTest(false));
	it("should return table objects without specified table and without deleted ones with separateKeyStorage", async () => await returnTableObjectsWithoutSpecifiedTableAndWithoutDeletedOnesTest(true));

	async function returnTableObjectsWithSpecifiedTableAndWithDeletedOnesTest(separateKeyStorage: boolean){
		// GetAllTableObjects(2, true);
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;

      var generatedTableObjects = GenerateTableObjects();
      await DatabaseOperations.CreateTableObjects(generatedTableObjects.tableObjects);

      // Act
      var tableObjects = await DatabaseOperations.GetAllTableObjects(2, true);   // Should return first and third table object

      // Assert
      assert.equal(2, tableObjects.length);

      assert.equal(generatedTableObjects.firstUuid, tableObjects[0].Uuid);
      assert.equal(generatedTableObjects.firstTableId, tableObjects[0].TableId);
      assert.equal(generatedTableObjects.firstEtag, tableObjects[0].Etag);
      assert.equal(generatedTableObjects.firstUploadStatus, tableObjects[0].UploadStatus);

      assert.equal(generatedTableObjects.thirdUuid, tableObjects[1].Uuid);
      assert.equal(generatedTableObjects.thirdTableId, tableObjects[1].TableId);
      assert.equal(generatedTableObjects.thirdEtag, tableObjects[1].Etag);
      assert.equal(generatedTableObjects.thirdUploadStatus, tableObjects[1].UploadStatus);
	}

	it("should return table objects with specified table and with deleted ones", async () => await returnTableObjectsWithSpecifiedTableAndWithDeletedOnesTest(false));
	it("should return table objects with specified table and with deleted ones with separateKeyStorage", async () => await returnTableObjectsWithSpecifiedTableAndWithDeletedOnesTest(true));

   function GenerateTableObjects(): {tableObjects: TableObject[],
                                    firstUuid: string,
                                    secondUuid: string,
                                    thirdUuid: string,
                                    fourthUuid: string,
                                    firstTableId: number,
                                    secondTableId: number,
                                    thirdTableId: number,
                                    fourthTableId: number,
                                    firstEtag: string,
                                    secondEtag: string,
                                    thirdEtag: string,
                                    fourthEtag: string,
                                    firstUploadStatus: TableObjectUploadStatus,
                                    secondUploadStatus: TableObjectUploadStatus,
                                    thirdUploadStatus: TableObjectUploadStatus,
                                    fourthUploadStatus: TableObjectUploadStatus}{
      /*
      *  
      *  1. tableId: 2     deleted: false
      *  2. tableId: 4     deleted: false
      *  3. tableId: 2     deleted: true
      *  4. tableId: 4     deleted: true
      * 
      */
      var firstUuid = generateUUID();
      var firstTableId = 2;
      var firstEtag = "asdas0dads";
      var firstUploadStatus = TableObjectUploadStatus.UpToDate;
      
      var firstTableObject = new TableObject();
      firstTableObject.Uuid = firstUuid;
      firstTableObject.TableId = firstTableId;
      firstTableObject.Etag = firstEtag;
      firstTableObject.UploadStatus = firstUploadStatus;

      var secondUuid = generateUUID();
      var secondTableId = 4;
      var secondEtag = "aswojerdjasdj3";
      var secondUploadStatus = TableObjectUploadStatus.UpToDate;

      var secondTableObject = new TableObject();
      secondTableObject.Uuid = secondUuid;
      secondTableObject.TableId = secondTableId;
      secondTableObject.Etag = secondEtag;
      secondTableObject.UploadStatus = secondUploadStatus;

      var thirdUuid = generateUUID();
      var thirdTableId = firstTableId;
      var thirdEtag = "asd0h923ajnksd";
      var thirdUploadStatus = TableObjectUploadStatus.Deleted;

      var thirdTableObject = new TableObject();
      thirdTableObject.Uuid = thirdUuid;
      thirdTableObject.TableId = thirdTableId;
      thirdTableObject.Etag = thirdEtag;
      thirdTableObject.UploadStatus = thirdUploadStatus;

      var fourthUuid = generateUUID();
      var fourthTableId = secondTableId;
      var fourthEtag = "asodnasdasnd";
      var fourthUploadStatus = TableObjectUploadStatus.Deleted;

      var fourthTableObject = new TableObject();
      fourthTableObject.Uuid = fourthUuid;
      fourthTableObject.TableId = fourthTableId;
      fourthTableObject.Etag = fourthEtag;
      fourthTableObject.UploadStatus = fourthUploadStatus;

      return {
         tableObjects: [firstTableObject, secondTableObject, thirdTableObject, fourthTableObject],
         firstUuid,
         secondUuid,
         thirdUuid,
         fourthUuid,
         firstTableId,
         secondTableId,
         thirdTableId,
         fourthTableId,
         firstEtag,
         secondEtag,
         thirdEtag,
         fourthEtag,
         firstUploadStatus,
         secondUploadStatus,
         thirdUploadStatus,
         fourthUploadStatus
      }
   }
});

describe("TableObjectExists function", () => {
	async function returnTrueIfTheTableObjectExistsTest(separateKeyStorage: boolean, withTableId: boolean){
		// Arrange
		let tableId = 2;

		Init(DavEnvironment.Test, 1, [tableId], [], separateKeyStorage, {icon: "", badge: ""}, {
			UpdateAllOfTable: () => {},
			UpdateTableObject: () => {},
			DeleteTableObject: () => {},
			SyncFinished: () => {}
		});

		var tableObject = new TableObject();
		tableObject.TableId = tableId;
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      var exists = withTableId ? await DatabaseOperations.TableObjectExists(tableObject.Uuid, tableObject.TableId) : await DatabaseOperations.TableObjectExists(tableObject.Uuid)

      // Assert
      assert.isTrue(exists);

      // Tidy up
      await localforage.clear();
	}

	it("should return true if the table object exists", async () => await returnTrueIfTheTableObjectExistsTest(false, false));
	it("should return true if the table object exists with separateKeyStorage", async () => await returnTrueIfTheTableObjectExistsTest(true, false));
	it("should return true if the table object exists with separateKeyStorage and tableId", async () => await returnTrueIfTheTableObjectExistsTest(true, true));

	async function returnFalseIfTheTableObjectDoesNotExistTest(separateKeyStorage: boolean, withTableId: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;
      var uuid = generateUUID();

      // Act
      var exists = withTableId ? await DatabaseOperations.TableObjectExists(uuid, 1) : await DatabaseOperations.TableObjectExists(uuid);

      // Assert
      assert.isFalse(exists);

      // Tidy up
      await localforage.clear();
	}

	it("should return false if the table object does not exist", async () => await returnFalseIfTheTableObjectDoesNotExistTest(false, false));
	it("should return false if the table object does not exist with separateKeyStorage", async () => await returnFalseIfTheTableObjectDoesNotExistTest(true, false));
	it("should return false if the table object does not exist with separateKeyStorage and tableId", async () => await returnFalseIfTheTableObjectDoesNotExistTest(true, true));
});

describe("UpdateTableObject function", () => {
	async function updateTheTableObjectTest(separateKeyStorage: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;
      var firstPropertyName = "page1";
      var firstPropertyValue = "Guten Tag";
      var secondPropertyName = "page2";
      var secondPropertyValue = "Good day";
      var updatedFirstPropertyValue = "Hello World";
      var updatedSecondPropertyValue = "Hallo Welt";
      var tableId = 123;
      
      var tableObject = new TableObject();
      tableObject.TableId = tableId;
      tableObject.Properties = {
         [firstPropertyName]: firstPropertyValue,
         [secondPropertyName]: secondPropertyValue
      }
      await DatabaseOperations.CreateTableObject(tableObject);

      tableObject.Properties[firstPropertyName] = updatedFirstPropertyValue;
      tableObject.Properties[secondPropertyName] = updatedSecondPropertyValue;

      // Act
      await DatabaseOperations.UpdateTableObject(tableObject);

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId);
      assert.equal(tableId, tableObjectFromDatabase.TableId);
      assert.equal(updatedFirstPropertyValue, tableObjectFromDatabase.Properties[firstPropertyName]);
      assert.equal(updatedSecondPropertyValue, tableObjectFromDatabase.Properties[secondPropertyName]);

      // Tidy up
      await localforage.clear();
	}
	
	it("should update the table object", async () => await updateTheTableObjectTest(false));
	it("should update the table object with separateKeyStorage", async () => await updateTheTableObjectTest(true));
});

describe("DeleteTableObject function", () => {
	async function setTheUploadStatusOfTheTableObjectToDeletedTest(separateKeyStorage: boolean, withTableId: boolean){
		// Arrange
		let tableId = 5;

		Init(DavEnvironment.Test, 1, [tableId], [], separateKeyStorage, {icon: "", badge: ""}, {
			UpdateAllOfTable: () => {},
			UpdateTableObject: () => {},
			DeleteTableObject: () => {},
			SyncFinished: () => {}
		});

		var tableObject = new TableObject();
		tableObject.TableId = tableId;
      tableObject.UploadStatus = TableObjectUploadStatus.NoUpload;
      await DatabaseOperations.CreateTableObject(tableObject);

		// Act
		if(withTableId) await DatabaseOperations.DeleteTableObject(tableObject.Uuid, tableObject.TableId);
		else await DatabaseOperations.DeleteTableObject(tableObject.Uuid);

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.equal(TableObjectUploadStatus.Deleted, tableObjectFromDatabase.UploadStatus);

      // Tidy up
      await localforage.clear();
	}

	it("should set the upload status of the table object to Deleted", async () => await setTheUploadStatusOfTheTableObjectToDeletedTest(false, false));
	it("should set the upload status of the table object to Deleted with separateKeyStorage", async () => await setTheUploadStatusOfTheTableObjectToDeletedTest(true, false));
	it("should set the upload status of the table object to Deleted with separateKeyStorage and tableId", async () => await setTheUploadStatusOfTheTableObjectToDeletedTest(true, true));
});

describe("DeleteTableObjectImmediately function", () => {
	async function removeTheTableObjectFromTheDatabaseTest(separateKeyStorage: boolean, withTableId: boolean){
		// Arrange
		let tableId = 5;

		Init(DavEnvironment.Test, 1, [tableId], [], separateKeyStorage, {icon: "", badge: ""}, {
			UpdateAllOfTable: () => {},
			UpdateTableObject: () => {},
			DeleteTableObject: () => {},
			SyncFinished: () => {}
		});

		var tableObject = new TableObject();
		tableObject.TableId = tableId;
      await DatabaseOperations.CreateTableObject(tableObject);

		// Act
		if(withTableId) await DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid, tableObject.TableId);
		else await DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId);
      assert.isNull(tableObjectFromDatabase);

      // Tidy up
      await localforage.clear();
	}

	it("should remove the table object from the database", async () => await removeTheTableObjectFromTheDatabaseTest(false, false));
	it("should remove the table object from the database with separateKeyStorage", async () => await removeTheTableObjectFromTheDatabaseTest(true, false));
	it("should remove the table object from the database with separateKeyStorage and tableId", async () => await removeTheTableObjectFromTheDatabaseTest(true, true));
});

async function getTableObjects(key: string) : Promise<object[]>{
	let result = await localforage.startsWith(key);
	return Object.keys(result).map(key => result[key]);
}