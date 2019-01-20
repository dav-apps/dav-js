import { assert } from 'chai';
import 'mocha';
import * as localforage from "localforage";
import * as Dav from '../../lib/Dav';
import { DavUser } from '../../lib/models/DavUser';
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import * as Constants from '../Constants';

const davClassLibraryTestUserXTestUserJwt = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImRhdmNsYXNzbGlicmFyeXRlc3RAZGF2LWFwcHMudGVjaCIsInVzZXJuYW1lIjoiZGF2Q2xhc3NMaWJyYXJ5VGVzdFVzZXIiLCJ1c2VyX2lkIjoxMiwiZGV2X2lkIjoyLCJleHAiOjM3NTI5MTgzODQxfQ.lO-iq5UHk25wnysbrEw1PirgGBhz-rFqrK6iRGkcFnU";

function clearDatabase(){
   localforage.removeItem(Dav.userKey);
   localforage.removeItem(Dav.tableObjectsKey);
}

describe("Login function", () => {
   it("should log the user in and download the user information with valid JWT", (done: Function) => {
      // Arrange
		Dav.globals.appId = Constants.davClassLibraryTestAppId;
		
		var user = new DavUser(async () => {
			// Act
			await user.Login(davClassLibraryTestUserXTestUserJwt);

			// Assert
			var userFromDatabase = await DatabaseOperations.GetUser();
			assert.isTrue(user.IsLoggedIn);
			assert.equal(user.Email, userFromDatabase["email"]);
			assert.equal(user.Username, userFromDatabase["username"]);
			assert.equal(user.TotalStorage, userFromDatabase["totalStorage"]);
			assert.equal(user.UsedStorage, userFromDatabase["usedStorage"]);
			assert.equal(user.Plan, userFromDatabase["plan"]);
			assert.equal(user.Avatar, userFromDatabase["avatar"]);
			assert.equal(user.AvatarEtag, userFromDatabase["avatarEtag"]);
			assert.equal(user.JWT, userFromDatabase["jwt"]);
			assert.equal(user.JWT, davClassLibraryTestUserXTestUserJwt);

			// Tidy up
			clearDatabase();
			done();
		});
   });

   it("should not log the user in with invalid JWT", (done: Function) => {
      // Arrange
      Dav.globals.appId = Constants.davClassLibraryTestAppId;

		var user = new DavUser(async () => {
			// Act
			await user.Login(davClassLibraryTestUserXTestUserJwt + "adasdasd");

			// Assert
			var userFromDatabase = await DatabaseOperations.GetUser();
			assert.isNull(userFromDatabase);
			assert.isFalse(user.IsLoggedIn);

			// Tidy up
			clearDatabase();
			done();
		});
   });
});

describe("Logout function", () => {
   it("should remove all user data", (done: Function) => {
      // Arrange
		Dav.globals.appId = Constants.davClassLibraryTestAppId;
		
      var user = new DavUser(async () => {
         await user.Login(davClassLibraryTestUserXTestUserJwt);
         assert.isTrue(user.IsLoggedIn);

         // Act
         await user.Logout();

         // Assert
         assert.isFalse(user.IsLoggedIn);
         assert.isEmpty(user.Email);
			assert.isEmpty(user.Username);
			assert.equal(user.TotalStorage, 0);
			assert.equal(user.UsedStorage, 0);
			assert.equal(user.Plan, 0);
         assert.isEmpty(user.Avatar);
         assert.isEmpty(user.AvatarEtag);
         assert.isEmpty(user.JWT);
			assert.isEmpty(Dav.globals.jwt);

         // Tidy up
         clearDatabase();
         done();
      });
   });
});