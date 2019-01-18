import { assert } from 'chai';
import 'mocha';
var axios = require('axios');
import * as Dav from '../../lib/Dav';
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import * as DataManager from '../../lib/providers/DataManager';
import * as localforage from "localforage";
import { TableObject, TableObjectUploadStatus, ConvertIntToVisibility, ConvertObjectToMap } from '../../lib/models/TableObject';
import { davClassLibraryTestUserXTestUserJwt, davClassLibraryTestAppId, davClassLibraryTestUserId, testDataTableId, firstPropertyName, secondPropertyName, firstTestDataTableObject, secondTestDataTableObject } from '../Constants';

function clearDatabase(){
   localforage.removeItem(Dav.userKey);
   localforage.removeItem(Dav.tableObjectsKey);
}

describe("Sync function", () => {
   it("should download all table objects from the server", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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
      DeleteTableObjectFromServer(tableObject.Uuid);
      clearDatabase();
   });

   it("should upload updated table objects", async () => {
      // Arrange
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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

   async function DeleteTableObjectFromServer(uuid: string){
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
});

describe("UpdateLocalTableObject function", () => {
   it("should get the table object from the server and update it locally", async () => {
      // Arrange
      // Get all table objects from the server
      let callbackCalled = false;
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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
      Dav.Initialize(false, davClassLibraryTestAppId, [testDataTableId], {
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