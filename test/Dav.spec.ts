import { assert } from 'chai'
import { Dav } from '../lib/Dav.js'
import * as DatabaseOperations from '../lib/providers/DatabaseOperations.js'
import { Environment, SessionUploadStatus } from '../lib/types.js'
import * as Constants from './constants.js'

describe("Dav class", () => {
	describe("Logout function", () => {
		it("should log the user out and set the session to Deleted", async () => {
			// Arrange
			new Dav({
				environment: Environment.Test,
				appId: Constants.testAppId
			})
	
			Dav.isLoggedIn = true
			Dav.accessToken = Constants.testerXTestAppAccessToken

			await DatabaseOperations.SetUser({
				Id: Constants.tester.id,
				Email: Constants.tester.email,
				FirstName: Constants.tester.firstName,
				Confirmed: Constants.tester.confirmed,
				TotalStorage: Constants.tester.totalStorage,
				UsedStorage: Constants.tester.usedStorage,
				Plan: Constants.tester.plan,
				Dev: Constants.tester.dev,
				Provider: Constants.tester.provider,
				ProfileImage: null,
				ProfileImageEtag: null,
				Apps: []
			})

			await DatabaseOperations.SetSession({
				AccessToken: Constants.testerXTestAppAccessToken,
				UploadStatus: SessionUploadStatus.UpToDate
			})

			// Act
			await Dav.Logout()

			// Assert
			assert.isNull(Dav.accessToken)
			assert.isFalse(Dav.isLoggedIn)

			let userFromDatabase = await DatabaseOperations.GetUser()
			assert.isNull(userFromDatabase)

			let sessionFromDatabase = await DatabaseOperations.GetSession()
			assert.isNotNull(sessionFromDatabase)
			assert.equal(sessionFromDatabase.AccessToken, Constants.testerXTestAppAccessToken)
			assert.equal(sessionFromDatabase.UploadStatus, SessionUploadStatus.Deleted)
		})
	})
})