import 'mocha';
import { assert } from 'chai';
import { Dav, Init } from '../../lib/Dav';
import * as localforage from "localforage";
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import { TableObject, TableObjectVisibility, TableObjectUploadStatus } from '../../lib/models/TableObject';
import { DavEnvironment } from '../../lib/models/DavUser';
import { SyncPush } from '../../lib/providers/DataManager';
import { GetTableObjectFromServer, DeleteTableObjectFromServer } from '../utils';
import { davClassLibraryTestAppId, testDataTableId, davClassLibraryTestUserXTestUserJwt } from '../Constants';

describe("SetVisibility function", () => {
	async function setTheVisibilityOfTheTableObjectAndSaveItInTheDatabaseTest(separateKeyStorage: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;
      var tableObject = new TableObject();
      tableObject.TableId = 12;
      var oldVisibility = tableObject.Visibility;
      var newVisibility = TableObjectVisibility.Protected;

      // Act
      await tableObject.SetVisibility(newVisibility);

      // Assert
      assert.equal(newVisibility, tableObject.Visibility);
      assert.notEqual(oldVisibility, newVisibility);

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(newVisibility, tableObjectFromDatabase.Visibility);

      // Tidy up
      await localforage.clear();
	}

	it("should set the visibility of the table object and save it in the database", async () => await setTheVisibilityOfTheTableObjectAndSaveItInTheDatabaseTest(false));
	it("should set the visibility of the table object and save it in the database with separateKeyStorage", async () => await setTheVisibilityOfTheTableObjectAndSaveItInTheDatabaseTest(true));
});

describe("SetUploadStatus function", () => {
	async function setTheUploadStatusOfTheTableObjectAndSaveItInTheDatabaseTest(separateKeyStorage: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;
      var tableObject = new TableObject();
      tableObject.TableId = 13;
      var newUploadStatus = TableObjectUploadStatus.Updated;
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.SetUploadStatus(newUploadStatus);

      // Assert
      assert.equal(newUploadStatus, tableObject.UploadStatus);

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(newUploadStatus, tableObjectFromDatabase.UploadStatus);

      // Tidy up
      await localforage.clear();
	}

	it("should set the UploadStatus of the table object and save it in the database", async () => await setTheUploadStatusOfTheTableObjectAndSaveItInTheDatabaseTest(false));
	it("should set the UploadStatus of the table object and save it in the database with separateKeyStorage", async () => await setTheUploadStatusOfTheTableObjectAndSaveItInTheDatabaseTest(true));
});

describe("SetEtag function", () => {
	async function setTheEtagOfTheTableObjectAndSaveItInTheDatabaseTest(separateKeyStorage: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;
      let tableObject = new TableObject();
      tableObject.TableId = 12;
      tableObject.Etag = "blablabla";
      let newEtag = "hehehehehehe";
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.SetEtag(newEtag);

      // Assert
		assert.equal(tableObject.Etag, newEtag);
		
		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId);
		assert.isNotNull(tableObjectFromDatabase);
		assert.equal(tableObjectFromDatabase.Etag, newEtag);
	}

	it("should set the Etag of the table object and save it in the database", async () => await setTheEtagOfTheTableObjectAndSaveItInTheDatabaseTest(false));
	it("should set the Etag of the table object and save it in the database with separateKeyStorage", async () => await setTheEtagOfTheTableObjectAndSaveItInTheDatabaseTest(true));
});

describe("SetPropertyValue function", () => {
	async function setThePropertyValueOfTheTableObjectAndSaveItInTheDatabaseTest(separateKeyStorage: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;
      var propertyName = "page1";
      var oldPropertyValue = "test";
      var newPropertyValue = "testtest";

      var tableObject = new TableObject();
      tableObject.TableId = 15;
      tableObject.Properties = {
         [propertyName]: oldPropertyValue
      }
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.SetPropertyValue(propertyName, newPropertyValue);

      // Assert
      assert.equal(newPropertyValue, tableObject.Properties[propertyName]);

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(newPropertyValue, tableObjectFromDatabase.Properties[propertyName]);

      // Tidy up
      await localforage.clear();
	}

	it("should set the property value of the table object and save it in the database", async () => setThePropertyValueOfTheTableObjectAndSaveItInTheDatabaseTest(false));
	it("should set the property value of the table object and save it in the database with separateKeyStorage", async () => setThePropertyValueOfTheTableObjectAndSaveItInTheDatabaseTest(true));
});

describe("SetPropertyValues function", () => {
	async function setThePropertyValuesOfTheTableObjectAndSaveItInTheDatabaseTest(separateKeyStorage: boolean){
		// Arrange
		Dav.separateKeyStorage = separateKeyStorage;
      var firstPropertyName = "page1";
      var oldFirstPropertyValue = "test";
      var newFirstPropertyValue = "testtest";
      var secondPropertyName = "page2";
      var oldSecondPropertyValue = "bla";
      var newSecondPropertyValue = "blubb";

      var tableObject = new TableObject();
      tableObject.TableId = 15;
      tableObject.Properties = {
         [firstPropertyName]: oldFirstPropertyValue,
         [secondPropertyName]: oldSecondPropertyValue
      }
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.SetPropertyValues([
         { name: firstPropertyName, value: newFirstPropertyValue },
         { name: secondPropertyName, value: newSecondPropertyValue }
      ]);

      // Assert
      assert.equal(newFirstPropertyValue, tableObject.Properties[firstPropertyName]);
      assert.equal(newSecondPropertyValue, tableObject.Properties[secondPropertyName]);

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid, tableObject.TableId);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(newFirstPropertyValue, tableObjectFromDatabase.Properties[firstPropertyName]);
      assert.equal(newSecondPropertyValue, tableObjectFromDatabase.Properties[secondPropertyName]);

      // Tidy up
      await localforage.clear();
	}

	it("should set the property values of the table object and save it in the database", async () => await setThePropertyValuesOfTheTableObjectAndSaveItInTheDatabaseTest(false));
	it("should set the property values of the table object and save it in the database with separateKeyStorage", async () => await setThePropertyValuesOfTheTableObjectAndSaveItInTheDatabaseTest(true));
});

describe("GetPropertyValue function", () => {
   it("should return the value of the property", () => {
      // Arrange
      var propertyName = "page1";
      var propertyValue = "testtest";

      var tableObject = new TableObject();
      tableObject.Properties = {
         [propertyName]: propertyValue
      }

      // Act
      var value = tableObject.GetPropertyValue(propertyName);

      // Assert
      assert.equal(propertyValue, value);
   });

   it("should return null if the property does not exist", () => {
      // Arrange
      var tableObject = new TableObject();

      // Act
      var value = tableObject.GetPropertyValue("page1");

      // Assert
      assert.isNull(value);
   });
});

describe("RemoveProperty function", () => {
   it("should remove the property from the table object if the user is not logged in", async () => {
		// Arrange
		Dav.jwt = null;
		var propertyName = "page1";
      var propertyValue = "test";
      
      var tableObject = new TableObject();
      tableObject.Properties = {
         [propertyName]: propertyValue
      }

      // Act
      await tableObject.RemoveProperty(propertyName);

      // Assert
      assert.isUndefined(tableObject.Properties[propertyName]);

      // Tidy up
      await localforage.clear();
	});
	
	async function removeThePropertyOnTheServerIfTheUserIsLoggedInTest(separateKeyStorage: boolean){
		// Arrange
		Init(DavEnvironment.Test, davClassLibraryTestAppId, [testDataTableId], [], separateKeyStorage, {icon: "", badge: ""}, {
			UpdateAllOfTable: () => {},
			UpdateTableObject: () => {},
			DeleteTableObject: () => {},
			UserDownloadFinished: () => {},
			SyncFinished: () => {}
		});
		Dav.jwt = davClassLibraryTestUserXTestUserJwt;
		var propertyName = "page1";
		var propertyValue = "Hello World";

		var tableObject = new TableObject();
		var uuid = tableObject.Uuid;
		tableObject.TableId = testDataTableId;
		tableObject.Properties = {
			[propertyName]: propertyValue
		}
		await DatabaseOperations.CreateTableObject(tableObject);

		// Upload the table object to the server
		await SyncPush();

		// Check if the table object has the property on the server
		let tableObjectFromServer1 = await GetTableObjectFromServer(uuid);
		assert.equal(tableObjectFromServer1.Properties[propertyName], propertyValue);

		let tableObjectFromDatabase = await DatabaseOperations.GetTableObject(uuid);

		// Act
		await tableObjectFromDatabase.RemoveProperty(propertyName);

		// Assert
		// Check if the property of the table object was removed on the server
		let tableObjectFromServer2 = await GetTableObjectFromServer(uuid);
		assert.isUndefined(tableObjectFromServer2.Properties[propertyName]);

		// Tidy up
		await DeleteTableObjectFromServer(uuid)
		await localforage.clear();
	}

	it("should remove the property on the server if the user is logged in", async () => await removeThePropertyOnTheServerIfTheUserIsLoggedInTest(false));
	it("should remove the property on the server if the user is logged in with separateKeyStorage", async () => await removeThePropertyOnTheServerIfTheUserIsLoggedInTest(true));
});

describe("Delete function", () => {
	async function setTheUploadStatusOfTheTableObjectToDeletedIfTheUserIsLoggedInTest(separateKeyStorage: boolean){
		// Arrange
		let tableId = 34;

      Init(DavEnvironment.Test, 1, [tableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
			DeleteTableObject: () => {},
			UserDownloadFinished: () => {},
         SyncFinished: () => {}
      });
      Dav.jwt = "asdasd";

      var tableObject = new TableObject();
      tableObject.TableId = tableId;
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.Delete();

      // Assert
      assert.equal(TableObjectUploadStatus.Deleted, tableObject.UploadStatus);

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(TableObjectUploadStatus.Deleted, tableObjectFromDatabase.UploadStatus);

      // Tidy up
      await localforage.clear();
	}

	it("should set the UploadStatus of the table object to Deleted if the user is logged in", async () => await setTheUploadStatusOfTheTableObjectToDeletedIfTheUserIsLoggedInTest(false));
	it("should set the UploadStatus of the table object to Deleted if the user is logged in with separateKeyStorage", async () => await setTheUploadStatusOfTheTableObjectToDeletedIfTheUserIsLoggedInTest(true));

	async function deleteTheTableObjectImmediatelyIfTheUserIsNotLoggedInTest(separateKeyStorage: boolean){
		// Arrange
		let tableId = 23;

		Init(DavEnvironment.Test, 1, [tableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
			DeleteTableObject: () => {},
			UserDownloadFinished: () => {},
         SyncFinished: () => {}
		});
		
		Dav.jwt = null;

		var tableObject = new TableObject();
		tableObject.TableId = tableId;
		await DatabaseOperations.CreateTableObject(tableObject);

		// Act
		await tableObject.Delete();

		// Assert
		var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
		assert.isNull(tableObjectFromDatabase);
	}

	it("should delete the table object immediately if the user is not logged in", async () => await deleteTheTableObjectImmediatelyIfTheUserIsNotLoggedInTest(false));
	it("should delete the table object immediately if the user is not logged in with separateKeyStorage", async () => await deleteTheTableObjectImmediatelyIfTheUserIsNotLoggedInTest(true));
});

describe("DeleteImmediately function", () => {
	async function deleteTheTableObjectImmediatelyTest(separateKeyStorage: boolean){
		// Arrange
		let tableId = 12;

      Init(DavEnvironment.Test, 1, [tableId], [], separateKeyStorage, {icon: "", badge: ""}, {
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {},
			DeleteTableObject: () => {},
			UserDownloadFinished: () => {},
         SyncFinished: () => {}
      });

      var tableObject = new TableObject();
      tableObject.TableId = tableId;
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.DeleteImmediately();

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNull(tableObjectFromDatabase);
	}

	it("should delete the table object immediately", async () => await deleteTheTableObjectImmediatelyTest(false));
	it("should delete the table object immediately with separateKeyStorage", async () => await deleteTheTableObjectImmediatelyTest(true));
});