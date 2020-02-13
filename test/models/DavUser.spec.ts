import 'mocha';
import { assert } from 'chai';
import * as localforage from "localforage";
import { Dav } from '../../lib/Dav';
import { DavUser } from '../../lib/models/DavUser';
import * as DatabaseOperations from '../../lib/providers/DatabaseOperations';
import * as Constants from '../Constants';

const davClassLibraryTestUserXTestUserJwt = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImRhdmNsYXNzbGlicmFyeXRlc3RAZGF2LWFwcHMudGVjaCIsInVzZXJuYW1lIjoiZGF2Q2xhc3NMaWJyYXJ5VGVzdFVzZXIiLCJ1c2VyX2lkIjo1LCJkZXZfaWQiOjIsImV4cCI6Mzc1NTM4OTc0MjZ9.44FwShkIvYL-4Kbm8Ryc7RXbIIWgtWz3CinUKzw9mPE";

describe("Login function", () => {
   it("should log the user in and download the user information with valid JWT", (done: Function) => {
      // Arrange
		Dav.appId = Constants.davClassLibraryTestAppId;
		
		var user = new DavUser(async () => {
			// Act
			await user.Login(davClassLibraryTestUserXTestUserJwt);

			// Assert
			var userFromDatabase = await DatabaseOperations.GetUser();
			assert.isTrue(user.IsLoggedIn);
			assert.equal(user.Id, userFromDatabase["id"]);
			assert.equal(user.Email, userFromDatabase["email"]);
			assert.equal(user.Username, userFromDatabase["username"]);
			assert.equal(user.TotalStorage, userFromDatabase["totalStorage"]);
			assert.equal(user.UsedStorage, userFromDatabase["usedStorage"]);
			assert.equal(user.Plan, userFromDatabase["plan"]);
			assert.equal(user.Avatar, userFromDatabase["avatar"]);
			assert.equal(user.AvatarEtag, userFromDatabase["avatarEtag"]);
			assert.equal(user.Confirmed, userFromDatabase["confirmed"]);
			assert.equal(user.SubscriptionStatus, userFromDatabase["subscriptionStatus"]);
			assert.equal(user.StripeCustomerId, userFromDatabase["stripeCustomerId"]);
			assert.equal(user.Dev, userFromDatabase["dev"]);
			assert.equal(user.Provider, userFromDatabase["provider"]);
			assert.equal(user.JWT, userFromDatabase["jwt"]);
			assert.equal(user.JWT, davClassLibraryTestUserXTestUserJwt);

			// Tidy up
         localforage.clear();
         done();
		});
   });

   it("should not log the user in with invalid JWT", (done: Function) => {
      // Arrange
      Dav.appId = Constants.davClassLibraryTestAppId;

		var user = new DavUser(async () => {
			// Act
			await user.Login(davClassLibraryTestUserXTestUserJwt + "adasdasd");

			// Assert
			var userFromDatabase = await DatabaseOperations.GetUser();
			assert.isNull(userFromDatabase);
			assert.isFalse(user.IsLoggedIn);

			// Tidy up
			await localforage.clear();
			done();
		});
   });
});

describe("Logout function", () => {
   it("should remove all user data", (done: Function) => {
      // Arrange
		Dav.appId = Constants.davClassLibraryTestAppId;
		
      var user = new DavUser(async () => {
         await user.Login(davClassLibraryTestUserXTestUserJwt);
         assert.isTrue(user.IsLoggedIn);

         // Act
         await user.Logout();

         // Assert
			assert.isFalse(user.IsLoggedIn);
			assert.equal(user.Id, 0);
         assert.isEmpty(user.Email);
			assert.isEmpty(user.Username);
			assert.equal(user.TotalStorage, 0);
			assert.equal(user.UsedStorage, 0);
			assert.equal(user.Plan, 0);
         assert.isEmpty(user.Avatar);
			assert.isEmpty(user.AvatarEtag);
			assert.isFalse(user.Confirmed);
			assert.equal(user.SubscriptionStatus, 0);
			assert.isNull(user.PeriodEnd);
			assert.isEmpty(user.StripeCustomerId);
			assert.isFalse(user.Dev);
			assert.isFalse(user.Provider);
			assert.isEmpty(user.Apps);
         assert.isEmpty(user.JWT);
			assert.isEmpty(Dav.jwt);

         // Tidy up
         await localforage.clear();
         done();
      });
   });
});