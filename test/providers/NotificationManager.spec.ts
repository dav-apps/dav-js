import { assert } from "chai"
import localforage from "localforage"
import {
	ApiResponse,
	ApiErrorResponse,
	Environment,
	WebPushSubscriptionUploadStatus,
	GenericUploadStatus
} from "../../lib/types.js"
import { generateUuid } from "../../lib/utils.js"
import * as Constants from "../constants.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { Dav } from "../../lib/Dav.js"
import * as DatabaseOperations from "../../lib/providers/DatabaseOperations.js"
import {
	WebPushSubscriptionSync,
	WebPushSubscriptionSyncPush,
	NotificationSync,
	NotificationSyncPush
} from "../../lib/providers/NotificationManager.js"
import * as NotificationsController from "../../lib/controllers/NotificationsController.js"
import * as WebPushSubscriptionsController from "../../lib/controllers/WebPushSubscriptionsController.js"
import { WebPushSubscription } from "../../lib/models/WebPushSubscription.js"
import { Notification } from "../../lib/models/Notification.js"

var webPushSubscriptionsToDelete: string[] = []

beforeEach(async () => {
	// Reset global variables
	Dav.environment = Environment.Test
	Dav.skipSyncPushInTests = true
	Dav.isLoggedIn = false
	Dav.accessToken = null

	// Clear the database
	await localforage.clear()
})

afterEach(async () => {
	// Delete the webPushSubscriptions
	for (let uuid of webPushSubscriptionsToDelete) {
		let response =
			await WebPushSubscriptionsController.DeleteWebPushSubscription({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid
			})

		if (response.status != 204) {
			console.error("Error in deleting webPushSubscription:")
			console.error((response as ApiErrorResponse).errors)
		}
	}

	webPushSubscriptionsToDelete = []

	// Delete the notifications
	let notificationsResponse = await NotificationsController.GetNotifications({
		accessToken: Constants.testerXTestAppAccessToken
	})

	if (notificationsResponse.status != 200) {
		console.error("Error in getting notifications:")
		console.error((notificationsResponse as ApiErrorResponse).errors)
	} else {
		for (let notification of (
			notificationsResponse as ApiResponse<Notification[]>
		).data) {
			let response = await NotificationsController.DeleteNotification({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: notification.Uuid
			})

			if (response.status != 204) {
				console.error("Error in deleting notification:")
				console.error((response as ApiErrorResponse).errors)
			}
		}
	}
})

describe("WebPushSubscriptionSync function", () => {
	it("should do nothing if there is no WebPushSubscription locally", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		// Create a WebPushSubscription on the server
		let uuid = generateUuid()
		let endpoint = "https://dav-apps.tech"
		let p256dh = "asdasfasdasdasfpjoasf"
		let auth = "sghiodhiosdghdios"
		webPushSubscriptionsToDelete.push(uuid)

		await WebPushSubscriptionsController.CreateWebPushSubscription({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid,
			endpoint,
			p256dh,
			auth
		})

		// Act
		await WebPushSubscriptionSync()

		// Assert
		let webPushSubscriptionFromServerResponse =
			await WebPushSubscriptionsController.GetWebPushSubscription({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid
			})
		assert.equal(webPushSubscriptionFromServerResponse.status, 200)

		let webPushSubscriptionFromServer = (
			webPushSubscriptionFromServerResponse as ApiResponse<WebPushSubscription>
		).data
		assert.equal(webPushSubscriptionFromServer.Uuid, uuid)
		assert.equal(webPushSubscriptionFromServer.Endpoint, endpoint)
		assert.equal(webPushSubscriptionFromServer.P256dh, p256dh)
		assert.equal(webPushSubscriptionFromServer.Auth, auth)
	})

	it("should do nothing if the local WebPushSubscription is new", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		// Create a WebPushSubscription on the server
		let uuid = generateUuid()
		let endpoint = "https://dav-apps.tech"
		let p256dh = "asdasfasdasdasfpjoasf"
		let auth = "sghiodhiosdghdios"
		webPushSubscriptionsToDelete.push(uuid)

		await WebPushSubscriptionsController.CreateWebPushSubscription({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid,
			endpoint,
			p256dh,
			auth
		})

		// Create a WebPushSubscription in the database
		let webPushSubscription = new WebPushSubscription(
			generateUuid(),
			"https://endpoint.example.com",
			"oijafoiadfoadfoadf",
			"oiahsfoihasdoa",
			WebPushSubscriptionUploadStatus.New
		)
		await DatabaseOperations.SetWebPushSubscription(webPushSubscription)

		// Act
		await WebPushSubscriptionSync()

		// Assert
		let webPushSubscriptionFromDatabase =
			await DatabaseOperations.GetWebPushSubscription()
		assert.isNotNull(webPushSubscriptionFromDatabase)
		assert.equal(
			webPushSubscriptionFromDatabase.UploadStatus,
			WebPushSubscriptionUploadStatus.New
		)

		let webPushSubscriptionFromServerResponse =
			await WebPushSubscriptionsController.GetWebPushSubscription({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid
			})
		assert.equal(webPushSubscriptionFromServerResponse.status, 200)

		let webPushSubscriptionFromServer = (
			webPushSubscriptionFromServerResponse as ApiResponse<WebPushSubscription>
		).data
		assert.equal(webPushSubscriptionFromServer.Uuid, uuid)
		assert.equal(webPushSubscriptionFromServer.Endpoint, endpoint)
		assert.equal(webPushSubscriptionFromServer.P256dh, p256dh)
		assert.equal(webPushSubscriptionFromServer.Auth, auth)
	})

	it("should delete the local WebPushSubscription if it does not exist on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		// Create a WebPushSubscription in the database
		let webPushSubscription = new WebPushSubscription(
			generateUuid(),
			"https://endpoint.example.com",
			"oijafoiadfoadfoadf",
			"oiahsfoihasdoa",
			WebPushSubscriptionUploadStatus.UpToDate
		)
		await DatabaseOperations.SetWebPushSubscription(webPushSubscription)

		// Act
		await WebPushSubscriptionSync()

		// Assert
		let webPushSubscriptionFromDatabase =
			await DatabaseOperations.GetWebPushSubscription()
		assert.isNull(webPushSubscriptionFromDatabase)
	})
})

describe("WebPushSubscriptionSyncPush function", () => {
	it("should create new WebPushSubscription on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let webPushSubscription = new WebPushSubscription(
			generateUuid(),
			"https://endpoint.example.com",
			"oijafoiadfoadfoadf",
			"oiahsfoihasdoa",
			WebPushSubscriptionUploadStatus.New
		)
		await DatabaseOperations.SetWebPushSubscription(webPushSubscription)
		webPushSubscriptionsToDelete.push(webPushSubscription.Uuid)

		// Act
		await WebPushSubscriptionSyncPush()

		// Assert
		let webPushSubscriptionFromDatabase =
			await DatabaseOperations.GetWebPushSubscription()
		assert.isNotNull(webPushSubscriptionFromDatabase)
		assert.equal(
			webPushSubscriptionFromDatabase.UploadStatus,
			WebPushSubscriptionUploadStatus.UpToDate
		)

		let webPushSubscriptionFromServerResponse =
			await WebPushSubscriptionsController.GetWebPushSubscription({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: webPushSubscription.Uuid
			})
		assert.equal(webPushSubscriptionFromServerResponse.status, 200)

		let webPushSubscriptionFromServer = (
			webPushSubscriptionFromServerResponse as ApiResponse<WebPushSubscription>
		).data
		assert.equal(webPushSubscriptionFromServer.Uuid, webPushSubscription.Uuid)
		assert.equal(
			webPushSubscriptionFromServer.Endpoint,
			webPushSubscription.Endpoint
		)
		assert.equal(
			webPushSubscriptionFromServer.P256dh,
			webPushSubscription.P256dh
		)
		assert.equal(webPushSubscriptionFromServer.Auth, webPushSubscription.Auth)
	})

	it("should log the user out if the session does not exist", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = "kosdsgosdgiohssdg"

		let webPushSubscription = new WebPushSubscription(
			generateUuid(),
			"https://endpoint.example.com",
			"oijafoiadfoadfoadf",
			"oiahsfoihasdoa",
			WebPushSubscriptionUploadStatus.New
		)
		await DatabaseOperations.SetWebPushSubscription(webPushSubscription)

		// Act
		await WebPushSubscriptionSyncPush()

		// Assert
		let webPushSubscriptionFromDatabase =
			await DatabaseOperations.GetWebPushSubscription()
		assert.isNotNull(webPushSubscriptionFromDatabase)
		assert.equal(
			webPushSubscriptionFromDatabase.UploadStatus,
			WebPushSubscriptionUploadStatus.New
		)

		assert.isFalse(Dav.isLoggedIn)
		assert.isNull(Dav.accessToken)

		let webPushSubscriptionFromServerResponse =
			await WebPushSubscriptionsController.GetWebPushSubscription({
				accessToken: Constants.testerXTestAppAccessToken,
				uuid: webPushSubscription.Uuid
			})
		assert.equal(webPushSubscriptionFromServerResponse.status, 404)

		let webPushSubscriptionFromServerError = (
			webPushSubscriptionFromServerResponse as ApiErrorResponse
		).errors
		assert.equal(
			webPushSubscriptionFromServerError[0].code,
			ErrorCodes.WebPushSubscriptionDoesNotExist
		)
	})
})

describe("NotificationSync function", () => {
	it("should download all notifications from the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstNotificationUuid = generateUuid()
		let firstNotificationTime = 122345
		let firstNotificationInterval = 0
		let firstNotificationTitle = "Test notification"
		let firstNotificationBody = "Hello World"

		let secondNotificationUuid = generateUuid()
		let secondNotificationTime = 1806755643
		let secondNotificationInterval = 864000
		let secondNotificationTitle = "Hello World"
		let secondNotificationBody = "This is a test notification"

		await NotificationsController.CreateNotification({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: firstNotificationUuid,
			time: firstNotificationTime,
			interval: firstNotificationInterval,
			title: firstNotificationTitle,
			body: firstNotificationBody
		})

		await NotificationsController.CreateNotification({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: secondNotificationUuid,
			time: secondNotificationTime,
			interval: secondNotificationInterval,
			title: secondNotificationTitle,
			body: secondNotificationBody
		})

		// Act
		await NotificationSync()

		// Assert
		let allNotifications = await DatabaseOperations.GetAllNotifications()
		assert.equal(allNotifications.length, 2)

		let firstNotificationFromDatabase =
			await DatabaseOperations.GetNotification(firstNotificationUuid)
		assert.isNotNull(firstNotificationFromDatabase)
		assert.equal(firstNotificationFromDatabase.Uuid, firstNotificationUuid)
		assert.equal(firstNotificationFromDatabase.Time, firstNotificationTime)
		assert.equal(
			firstNotificationFromDatabase.Interval,
			firstNotificationInterval
		)
		assert.equal(firstNotificationFromDatabase.Title, firstNotificationTitle)
		assert.equal(firstNotificationFromDatabase.Body, firstNotificationBody)

		let secondNotificationFromDatabase =
			await DatabaseOperations.GetNotification(secondNotificationUuid)
		assert.isNotNull(secondNotificationFromDatabase)
		assert.equal(secondNotificationFromDatabase.Uuid, secondNotificationUuid)
		assert.equal(secondNotificationFromDatabase.Time, secondNotificationTime)
		assert.equal(
			secondNotificationFromDatabase.Interval,
			secondNotificationInterval
		)
		assert.equal(
			secondNotificationFromDatabase.Title,
			secondNotificationTitle
		)
		assert.equal(secondNotificationFromDatabase.Body, secondNotificationBody)
	})

	it("should remove the notifications that are not on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstNotificationUuid = generateUuid()
		let firstNotificationTime = 122345
		let firstNotificationInterval = 0
		let firstNotificationTitle = "Test notification"
		let firstNotificationBody = "Hello World"

		let secondNotificationUuid = generateUuid()
		let secondNotificationTime = 1806755643
		let secondNotificationInterval = 864000
		let secondNotificationTitle = "Hello World"
		let secondNotificationBody = "This is a test notification"

		let localNotification = new Notification({
			Uuid: generateUuid(),
			Time: 1806754189,
			Interval: 82934,
			Title: "Local notification",
			Body: "Hello World",
			UploadStatus: GenericUploadStatus.UpToDate
		})

		await NotificationsController.CreateNotification({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: firstNotificationUuid,
			time: firstNotificationTime,
			interval: firstNotificationInterval,
			title: firstNotificationTitle,
			body: firstNotificationBody
		})

		await NotificationsController.CreateNotification({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: secondNotificationUuid,
			time: secondNotificationTime,
			interval: secondNotificationInterval,
			title: secondNotificationTitle,
			body: secondNotificationBody
		})

		await DatabaseOperations.SetNotification(localNotification)

		// Act
		await NotificationSync()

		// Assert
		let allNotifications = await DatabaseOperations.GetAllNotifications()
		assert.equal(allNotifications.length, 2)

		let firstNotificationFromDatabase =
			await DatabaseOperations.GetNotification(firstNotificationUuid)
		assert.isNotNull(firstNotificationFromDatabase)
		assert.equal(firstNotificationFromDatabase.Uuid, firstNotificationUuid)
		assert.equal(firstNotificationFromDatabase.Time, firstNotificationTime)
		assert.equal(
			firstNotificationFromDatabase.Interval,
			firstNotificationInterval
		)
		assert.equal(firstNotificationFromDatabase.Title, firstNotificationTitle)
		assert.equal(firstNotificationFromDatabase.Body, firstNotificationBody)

		let secondNotificationFromDatabase =
			await DatabaseOperations.GetNotification(secondNotificationUuid)
		assert.isNotNull(secondNotificationFromDatabase)
		assert.equal(secondNotificationFromDatabase.Uuid, secondNotificationUuid)
		assert.equal(secondNotificationFromDatabase.Time, secondNotificationTime)
		assert.equal(
			secondNotificationFromDatabase.Interval,
			secondNotificationInterval
		)
		assert.equal(
			secondNotificationFromDatabase.Title,
			secondNotificationTitle
		)
		assert.equal(secondNotificationFromDatabase.Body, secondNotificationBody)

		let localNotificationFromDatabase =
			await DatabaseOperations.GetNotification(localNotification.Uuid)
		assert.isNull(localNotificationFromDatabase)
	})
})

describe("NotificationSyncPush function", () => {
	it("should create notifications on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let notification = new Notification({
			Uuid: generateUuid(),
			Time: 1806754189,
			Interval: 82934,
			Title: "Local notification",
			Body: "Hello World",
			UploadStatus: GenericUploadStatus.New
		})

		await DatabaseOperations.SetNotification(notification)

		// Act
		await NotificationSyncPush()

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(
			notification.Uuid
		)
		assert.equal(
			notificationFromDatabase.UploadStatus,
			GenericUploadStatus.UpToDate
		)

		let notificationsFromServerResponse =
			await NotificationsController.GetNotifications({
				accessToken: Constants.testerXTestAppAccessToken
			})
		assert.equal(notificationsFromServerResponse.status, 200)

		let notificationsFromServer = (
			notificationsFromServerResponse as ApiResponse<Notification[]>
		).data
		assert.equal(notificationsFromServer.length, 1)
		assert.equal(notificationsFromServer[0].Uuid, notification.Uuid)
		assert.equal(notificationsFromServer[0].Time, notification.Time)
		assert.equal(notificationsFromServer[0].Interval, notification.Interval)
		assert.equal(notificationsFromServer[0].Title, notification.Title)
		assert.equal(notificationsFromServer[0].Body, notification.Body)
	})

	it("should update notifications on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let notificationUuid = generateUuid()
		let notificationTime = 1235232
		let notificationInterval = 23422
		let notificationTitle = "Hello World"
		let notificationBody = "This is a test notification"

		let updatedNotificationTime = 579334
		let updatedNotificationInterval = 0
		let updatedNotificationTitle = "Updated notification"
		let updatedNotificationBody = "This notification was updated"

		await NotificationsController.CreateNotification({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: notificationUuid,
			time: notificationTime,
			interval: notificationInterval,
			title: notificationTitle,
			body: notificationBody
		})

		await DatabaseOperations.SetNotification(
			new Notification({
				Uuid: notificationUuid,
				Time: updatedNotificationTime,
				Interval: updatedNotificationInterval,
				Title: updatedNotificationTitle,
				Body: updatedNotificationBody,
				UploadStatus: GenericUploadStatus.Updated
			})
		)

		// Act
		await NotificationSyncPush()

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(
			notificationUuid
		)
		assert.isNotNull(notificationFromDatabase)
		assert.equal(notificationFromDatabase.Uuid, notificationUuid)
		assert.equal(notificationFromDatabase.Time, updatedNotificationTime)
		assert.equal(
			notificationFromDatabase.Interval,
			updatedNotificationInterval
		)
		assert.equal(notificationFromDatabase.Title, updatedNotificationTitle)
		assert.equal(notificationFromDatabase.Body, updatedNotificationBody)
		assert.equal(
			notificationFromDatabase.UploadStatus,
			GenericUploadStatus.UpToDate
		)

		let notificationsFromServerResponse =
			await NotificationsController.GetNotifications({
				accessToken: Constants.testerXTestAppAccessToken
			})
		assert.equal(notificationsFromServerResponse.status, 200)

		let notificationsFromServer = (
			notificationsFromServerResponse as ApiResponse<Notification[]>
		).data
		assert.equal(notificationsFromServer.length, 1)
		assert.equal(notificationsFromServer[0].Uuid, notificationUuid)
		assert.equal(notificationsFromServer[0].Time, updatedNotificationTime)
		assert.equal(
			notificationsFromServer[0].Interval,
			updatedNotificationInterval
		)
		assert.equal(notificationsFromServer[0].Title, updatedNotificationTitle)
		assert.equal(notificationsFromServer[0].Body, updatedNotificationBody)
	})

	it("should delete notifications on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let notificationUuid = generateUuid()
		let notificationTime = 1235232
		let notificationInterval = 23422
		let notificationTitle = "Hello World"
		let notificationBody = "This is a test notification"

		await NotificationsController.CreateNotification({
			accessToken: Constants.testerXTestAppAccessToken,
			uuid: notificationUuid,
			time: notificationTime,
			interval: notificationInterval,
			title: notificationTitle,
			body: notificationBody
		})

		await DatabaseOperations.SetNotification(
			new Notification({
				Uuid: notificationUuid,
				Time: notificationTime,
				Interval: notificationInterval,
				Title: notificationTitle,
				Body: notificationBody,
				UploadStatus: GenericUploadStatus.Deleted
			})
		)

		// Act
		await NotificationSyncPush()

		// Assert
		let notificationFromDatabase = await DatabaseOperations.GetNotification(
			notificationUuid
		)
		assert.isNull(notificationFromDatabase)

		let notificationsFromServerResponse =
			await NotificationsController.GetNotifications({
				accessToken: Constants.testerXTestAppAccessToken
			})
		assert.equal(notificationsFromServerResponse.status, 200)

		let notificationsFromServer = (
			notificationsFromServerResponse as ApiResponse<Notification[]>
		).data
		assert.equal(notificationsFromServer.length, 0)
	})

	it("should delete updated and deleted notifications that do not exist on the server", async () => {
		// Arrange
		new Dav({
			environment: Environment.Test,
			appId: Constants.testAppId
		})

		Dav.isLoggedIn = true
		Dav.accessToken = Constants.testerXTestAppAccessToken

		let firstNotificationUuid = generateUuid()
		let secondNotificationUuid = generateUuid()

		await DatabaseOperations.SetNotification(
			new Notification({
				Uuid: firstNotificationUuid,
				Time: 122345,
				Interval: 0,
				Title: "Test notification",
				Body: "Hello World",
				UploadStatus: GenericUploadStatus.Updated
			})
		)

		await DatabaseOperations.SetNotification(
			new Notification({
				Uuid: secondNotificationUuid,
				Time: 1806755643,
				Interval: 864000,
				Title: "Hello World",
				Body: "This is a test notification",
				UploadStatus: GenericUploadStatus.Deleted
			})
		)

		// Act
		await NotificationSyncPush()

		// Assert
		let notificationsFromDatabase =
			await DatabaseOperations.GetAllNotifications()
		assert.equal(notificationsFromDatabase.length, 0)
	})
})
