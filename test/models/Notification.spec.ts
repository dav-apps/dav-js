import { assert } from "chai"
import localforage from "localforage"
import { Environment, GenericUploadStatus } from "../../lib/types.js"
import { testerXTestAppAccessToken } from "../constants.js"
import { Dav } from "../../lib/Dav.js"
import * as DatabaseOperations from "../../lib/providers/DatabaseOperations.js"
import { Notification } from "../../lib/models/Notification.js"

beforeEach(async () => {
	// Reset global variables
	Dav.environment = Environment.Test
	Dav.skipSyncPushInTests = true
	Dav.isLoggedIn = false
	Dav.accessToken = null

	// Clear the database
	await localforage.clear()
})

describe("Constructor", () => {
	it("should assign all given properties", async () => {
		// Arrange
		let uuid = "0fb8273f-6c03-4434-a865-8c5ee6cf63ef"
		let time = 123456
		let interval = 1234
		let title = "Test notification"
		let body = "Hello World"
		let uploadStatus = GenericUploadStatus.Updated

		// Act
		let notification = new Notification({
			Uuid: uuid,
			Time: time,
			Interval: interval,
			Title: title,
			Body: body,
			UploadStatus: uploadStatus
		})

		// Assert
		assert.equal(notification.Uuid, uuid)
		assert.equal(notification.Time, time)
		assert.equal(notification.Interval, interval)
		assert.equal(notification.Title, title)
		assert.equal(notification.Body, body)
		assert.equal(notification.UploadStatus, uploadStatus)
	})

	it("should set default values for optional properties", () => {
		// Arrange
		let time = 123456
		let interval = 1234
		let title = "Test notification"
		let body = "Hello World"

		// Act
		let notification = new Notification({
			Time: time,
			Interval: interval,
			Title: title,
			Body: body
		})

		// Assert
		assert.isNotNull(notification.Uuid)
		assert.equal(notification.Time, time)
		assert.equal(notification.Interval, interval)
		assert.equal(notification.Title, title)
		assert.equal(notification.Body, body)
		assert.equal(notification.UploadStatus, GenericUploadStatus.New)
	})
})

describe("Delete function", () => {
	it("should delete the notification", async () => {
		// Arrange
		let notification = new Notification({
			Time: 12345,
			Interval: 0,
			Title: "Test notification",
			Body: "Hello World"
		})

		await DatabaseOperations.SetNotification(notification)

		// Act
		await notification.Delete()

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(
			notification.Uuid
		)
		assert.isNull(notificationFromDatabase)
	})

	it("should set the UploadStatus of the notification to Deleted if the user is logged in", async () => {
		// Arrange
		Dav.isLoggedIn = true
		Dav.accessToken = testerXTestAppAccessToken

		let notification = new Notification({
			Time: 12345,
			Interval: 0,
			Title: "Test notification",
			Body: "Hello World"
		})

		await DatabaseOperations.SetNotification(notification)

		// Act
		await notification.Delete()

		// Assert
		assert.equal(notification.UploadStatus, GenericUploadStatus.Deleted)

		let notificationFromDatabase = await DatabaseOperations.GetNotification(
			notification.Uuid
		)
		assert.isNotNull(notificationFromDatabase)
		assert.equal(
			notificationFromDatabase.UploadStatus,
			GenericUploadStatus.Deleted
		)
	})
})

describe("DeleteImmediately function", async () => {
	// Arrange
	let notification = new Notification({
		Time: 12345,
		Interval: 0,
		Title: "Test notification",
		Body: "Hello World"
	})

	await DatabaseOperations.SetNotification(notification)

	// Act
	await notification.DeleteImmediately()

	// Assert
	let notificationFromDatabase = await DatabaseOperations.GetNotification(
		notification.Uuid
	)
	assert.isNotNaN(notificationFromDatabase)
})
