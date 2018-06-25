import * as Dav from '../lib/Dav';
import { assert } from 'chai';
import 'mocha';

describe("Initialize function", () => {
   it("should set globals variables to the appropriate values", () => {
      // Arrange
      var production = true;
      var appId = -23;
      var tableIds = [12, 213];
      var callbacks = {
         UpdateAll: () => {},
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {}
      }

      // Act
      Dav.Initialize(production, appId, tableIds, callbacks);

      // Assert
      assert.equal(production, Dav.globals.production);
      assert.equal(appId, Dav.globals.appId)
   });
});

describe("Globals", () => {
   it("should return different values for apiBaseUrl and websiteUrl in different environments", () => {
      // Arrange
      var production = true;
      var appId = 12;
      var tableIds = [12, 123];
      var callbacks = {
         UpdateAll: () => {},
         UpdateAllOfTable: () => {},
         UpdateTableObject: () => {}
      }

      // Act
      Dav.Initialize(production, appId, tableIds, callbacks);
      var firstWebsiteUrl = Dav.globals.websiteUrl;
      var firstApiBaseUrl = Dav.globals.apiBaseUrl;

      production = false;

      Dav.Initialize(production, appId, tableIds, callbacks);
      var secondWebsiteUrl = Dav.globals.websiteUrl;
      var secondApiBaseUrl = Dav.globals.apiBaseUrl;

      // Assert
      assert.notEqual(firstWebsiteUrl, secondWebsiteUrl);
      assert.notEqual(secondWebsiteUrl, secondApiBaseUrl);
   });

   it("should call callback methods", () => {
      // Arrange
      var production = false;
      var appId = 13;
      var tableIds = [133, 121];

      var callingTableId = 12;
      var callingTableObjectUUid = "tableObjectUuid";

      var updateAllCalled = false;
      var updateAllOfTableCalled = false;
      var updatedTableId = -1;
      var updateTableObjectCalled = false;
      var updatedTableObjectUuid = "";

      var callbacks = {
         UpdateAll: () => {
            updateAllCalled = true;
         },
         UpdateAllOfTable: (tableId: number) => {
            updateAllOfTableCalled = true;
            updatedTableId = tableId;
         },
         UpdateTableObject: (tableObjectUuid: string) => {
            updateTableObjectCalled = true;
            updatedTableObjectUuid = tableObjectUuid;
         }
      }

      Dav.Initialize(production, appId, tableIds, callbacks);

      // Act
      Dav.globals.callbacks.UpdateAll();
      Dav.globals.callbacks.UpdateAllOfTable(callingTableId);
      Dav.globals.callbacks.UpdateTableObject(callingTableObjectUUid);

      // Assert
      assert.isTrue(updateAllCalled);
      assert.isTrue(updateAllOfTableCalled);
      assert.isTrue(updateTableObjectCalled);
      assert.equal(callingTableId, updatedTableId);
      assert.equal(callingTableObjectUUid, updatedTableObjectUuid);
   });
});