import { assert } from 'chai';
import 'mocha';
import * as Dav from '../../lib/Dav';
import * as localforage from "localforage";
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import { TableObject, TableObjectVisibility, TableObjectUploadStatus } from '../../lib/models/TableObject';

function clearDatabase(){
   localforage.removeItem(Dav.userKey);
   localforage.removeItem(Dav.tableObjectsKey);
}

describe("SetVisibility function", () => {
   it("should set the visibility of the table object and save it in the database", async () => {
      // Arrange
      var tableObject = new TableObject();
      tableObject.TableId = 12;
      var oldVisibility = tableObject.Visibility;
      var newVisibility = TableObjectVisibility.Protected;

      // Act
      await tableObject.SetVisibility(newVisibility);

      // Assert
      assert.equal(newVisibility, tableObject.Visibility);
      assert.notEqual(oldVisibility, newVisibility);

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(newVisibility, tableObjectFromDatabase.Visibility);

      // Tidy up
      clearDatabase();
   });
});

describe("SetUploadStatus function", () => {
   it("should set the UploadStatus of the table object and save it in the database", async () => {
      // Arrange
      var tableObject = new TableObject();
      tableObject.TableId = 13;
      var newUploadStatus = TableObjectUploadStatus.Updated;
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.SetUploadStatus(newUploadStatus);

      // Assert
      assert.equal(newUploadStatus, tableObject.UploadStatus);

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(newUploadStatus, tableObjectFromDatabase.UploadStatus);

      // Tidy up
      clearDatabase();
   });
});

describe("SetPropertyValue function", () => {
   it("should set the property value of the table object and save it in the database", async () => {
      // Arrange
      var propertyName = "page1";
      var oldPropertyValue = "test";
      var newPropertyValue = "testtest";

      var tableObject = new TableObject();
      tableObject.TableId = 15;
      tableObject.Properties = new Map([
         [propertyName, oldPropertyValue]
      ]);
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.SetPropertyValue(propertyName, newPropertyValue);

      // Assert
      assert.equal(newPropertyValue, tableObject.Properties.get(propertyName));

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(newPropertyValue, tableObjectFromDatabase.Properties.get(propertyName));

      // Tidy up
      clearDatabase();
   });
});

describe("SetPropertyValues function", () => {
   it("should set the property values of the table object and save it in the database", async () => {
      // Arrange
      var firstPropertyName = "page1";
      var oldFirstPropertyValue = "test";
      var newFirstPropertyValue = "testtest";
      var secondPropertyName = "page2";
      var oldSecondPropertyValue = "bla";
      var newSecondPropertyValue = "blubb";

      var tableObject = new TableObject();
      tableObject.TableId = 15;
      tableObject.Properties = new Map([
         [firstPropertyName, oldFirstPropertyValue],
         [secondPropertyName, oldSecondPropertyValue]
      ]);
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.SetPropertyValues([
         { name: firstPropertyName, value: newFirstPropertyValue },
         { name: secondPropertyName, value: newSecondPropertyValue }
      ]);

      // Assert
      assert.equal(newFirstPropertyValue, tableObject.Properties.get(firstPropertyName));
      assert.equal(newSecondPropertyValue, tableObject.Properties.get(secondPropertyName));

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(newFirstPropertyValue, tableObjectFromDatabase.Properties.get(firstPropertyName));
      assert.equal(newSecondPropertyValue, tableObjectFromDatabase.Properties.get(secondPropertyName));

      // Tidy up
      clearDatabase();
   });
});

describe("GetPropertyValue function", () => {
   it("should return the value of the property", () => {
      // Arrange
      var propertyName = "page1";
      var propertyValue = "testtest";

      var tableObject = new TableObject();
      tableObject.Properties = new Map([
         [propertyName, propertyValue]
      ]);

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
   it("should remove the property from the table object", async () => {
      // Arrange
      var propertyName = "page1";
      var propertyValue = "test";
      
      var tableObject = new TableObject();
      tableObject.Properties = new Map([
         [propertyName, propertyValue]
      ]);

      // Act
      await tableObject.RemoveProperty(propertyName);

      // Assert
      assert.isUndefined(tableObject.Properties.get(propertyName));

      // Tidy up
      clearDatabase();
   });
});

describe("Delete function", () => {
   it("should set the UploadStatus of the table object to Deleted", async () => {
      // Arrange
      var tableObject = new TableObject();
      tableObject.TableId = 34;
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.Delete();

      // Assert
      assert.equal(TableObjectUploadStatus.Deleted, tableObject.UploadStatus);

      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNotNull(tableObjectFromDatabase);
      assert.equal(TableObjectUploadStatus.Deleted, tableObjectFromDatabase.UploadStatus);

      // Tidy up
      clearDatabase();
   });
});

describe("DeleteImmediately function", () => {
   it("should delete the table object immediately", async () => {
      // Arrange
      var tableObject = new TableObject();
      tableObject.TableId = 12;
      await DatabaseOperations.CreateTableObject(tableObject);

      // Act
      await tableObject.DeleteImmediately();

      // Assert
      var tableObjectFromDatabase = await DatabaseOperations.GetTableObject(tableObject.Uuid);
      assert.isNull(tableObjectFromDatabase);
   });
});