import { Dav } from "../Dav.js"
import { webPushPublicKey } from "../constants.js"
import {
	ApiResponse,
	ApiErrorResponse,
	WebPushSubscriptionUploadStatus,
	GenericUploadStatus
} from "../types.js"
import {
	generateUuid,
	urlBase64ToUint8Array,
	requestNotificationPermission,
	isSuccessStatusCode,
	convertNotificationResourceToNotification
} from "../utils.js"
import * as ErrorCodes from "../errorCodes.js"
import * as DatabaseOperations from "./DatabaseOperations.js"
import { WebPushSubscription } from "../models/WebPushSubscription.js"
import { Notification } from "../models/Notification.js"
import * as WebPushSubscriptionsController from "../controllers/WebPushSubscriptionsController.js"
import {
	listNotifications,
	createNotification,
	updateNotification,
	deleteNotification
} from "../controllers/NotificationsController.js"

var isSyncingWebPushSubscription = false
var isSyncingNotifications = false
var syncNotificationsAgain = false

export async function HasWebPushSubscription(): Promise<boolean> {
	let webPushSubscription = await DatabaseOperations.GetWebPushSubscription()
	return webPushSubscription != null
}

export async function CanSetupWebPushSubscription(): Promise<boolean> {
	// Check if the browser supports push
	if (!("serviceWorker" in navigator) && !("PushManager" in window)) {
		return false
	}

	// Check if user is logged in
	if (Dav.accessToken == null) return false

	return true
}

export async function SetupWebPushSubscription(): Promise<boolean> {
	if (!(await CanSetupWebPushSubscription())) return false

	// Ask for permission for sending notifications
	if (!requestNotificationPermission()) return false

	// Check if there is already a webPushSubscription
	if (await HasWebPushSubscription()) return true

	// Create the subscription
	const registration = await navigator.serviceWorker.getRegistration()
	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(webPushPublicKey)
	})

	const subscriptionJson = subscription.toJSON()

	let webPushSubscription = new WebPushSubscription(
		generateUuid(),
		subscriptionJson.endpoint,
		subscriptionJson.keys["p256dh"],
		subscriptionJson.keys["auth"],
		WebPushSubscriptionUploadStatus.New
	)

	// Save the WebPushSubscription in the database
	await DatabaseOperations.SetWebPushSubscription(webPushSubscription)

	// Start the upload of the WebPushSubscription
	WebPushSubscriptionSyncPush()

	return true
}

export async function WebPushSubscriptionSync() {
	if (Dav.accessToken == null || isSyncingWebPushSubscription) return
	isSyncingWebPushSubscription = true

	// Get the WebPushSubscription from the database
	let webPushSubscription = await DatabaseOperations.GetWebPushSubscription()
	if (
		webPushSubscription == null ||
		webPushSubscription.UploadStatus == WebPushSubscriptionUploadStatus.New
	) {
		isSyncingWebPushSubscription = false
		return
	}

	// Check if the web push subscription still exists on the server
	let webPushSubscriptionResponse =
		await WebPushSubscriptionsController.GetWebPushSubscription({
			uuid: webPushSubscription.Uuid
		})

	if (!isSuccessStatusCode(webPushSubscriptionResponse.status)) {
		let errors = (webPushSubscriptionResponse as ApiErrorResponse).errors

		if (errors != null) {
			let i = errors.findIndex(
				error => error.code == ErrorCodes.WebPushSubscriptionDoesNotExist
			)
			if (i != -1) {
				// Delete the web push subscription locally
				await DatabaseOperations.RemoveWebPushSubscription()
			}
		}
	}

	isSyncingWebPushSubscription = false
}

export async function WebPushSubscriptionSyncPush() {
	if (Dav.accessToken == null || isSyncingWebPushSubscription) return
	isSyncingWebPushSubscription = true

	// Get the WebPushSubscription from the database
	let webPushSubscription = await DatabaseOperations.GetWebPushSubscription()

	if (webPushSubscription == null) {
		isSyncingWebPushSubscription = false
		return
	}

	if (
		webPushSubscription.UploadStatus == WebPushSubscriptionUploadStatus.New
	) {
		// Create the WebPushSubscription on the server
		let createWebPushSubscriptionResponse =
			await WebPushSubscriptionsController.createWebPushSubscription(
				`uuid`,
				{
					uuid: webPushSubscription.Uuid,
					endpoint: webPushSubscription.Endpoint,
					p256dh: webPushSubscription.P256dh,
					auth: webPushSubscription.Auth
				}
			)

		if (!Array.isArray(createWebPushSubscriptionResponse)) {
			webPushSubscription.UploadStatus =
				WebPushSubscriptionUploadStatus.UpToDate
			await DatabaseOperations.SetWebPushSubscription(webPushSubscription)
		} else if (
			createWebPushSubscriptionResponse.includes("SESSION_DOES_NOT_EXIST")
		) {
			// Log the user out
			await Dav.Logout()
		}
	}

	isSyncingWebPushSubscription = false
}

export async function NotificationSync() {
	if (Dav.accessToken == null || isSyncingNotifications) return
	isSyncingNotifications = true

	let removedNotifications = await DatabaseOperations.GetAllNotifications()

	// Get all notifications from the server
	let listNotificationsResponse = await listNotifications(
		`
			uuid
			time
			interval
			title
			body
		`
	)

	if (Array.isArray(listNotificationsResponse)) return

	for (let item of listNotificationsResponse.items) {
		let notification = convertNotificationResourceToNotification(item)

		// Remove the notification from removedNotifications
		let i = removedNotifications.findIndex(n => n.Uuid == notification.Uuid)
		if (i != -1) removedNotifications.splice(i, 1)

		let currentNotification = await DatabaseOperations.GetNotification(
			notification.Uuid
		)

		if (currentNotification != null) {
			if (currentNotification.UploadStatus == GenericUploadStatus.UpToDate) {
				// Replace the old notification
				await DatabaseOperations.SetNotification(notification)
			}
		} else {
			// Save the notification
			await DatabaseOperations.SetNotification(notification)
		}
	}

	// Delete the notifications in removedNotifications
	for (let notification of removedNotifications) {
		if (notification.UploadStatus == GenericUploadStatus.New) continue
		await DatabaseOperations.RemoveNotification(notification.Uuid)
	}

	isSyncingNotifications = false
}

export async function NotificationSyncPush() {
	if (Dav.accessToken == null) return
	if (isSyncingNotifications) {
		syncNotificationsAgain = true
		return
	}
	isSyncingNotifications = true

	let notifications: Notification[] =
		await DatabaseOperations.GetAllNotifications()
	let filteredNotifications = notifications
		.filter(
			notification =>
				notification.UploadStatus != GenericUploadStatus.UpToDate
		)
		.reverse()

	for (let notification of filteredNotifications) {
		switch (notification.UploadStatus) {
			case GenericUploadStatus.New:
				// Create the notification on the server
				let createNotificationResponse = await createNotification(
					`
						uuid
						time
						interval
						title
						body
					`,
					{
						time: notification.Time,
						interval: notification.Interval,
						title: notification.Title,
						body: notification.Body
					}
				)

				if (!Array.isArray(createNotificationResponse)) {
					notification.UploadStatus = GenericUploadStatus.UpToDate
					await DatabaseOperations.SetNotification(notification)
				} else if (
					createNotificationResponse.includes("UUID_ALREADY_IN_USE")
				) {
					// Set the UploadStatus to UpToDate
					notification.UploadStatus = GenericUploadStatus.UpToDate
					await DatabaseOperations.SetNotification(notification)
				}

				break
			case GenericUploadStatus.Updated:
				// Update the notification on the server
				let updateNotificationResponse = await updateNotification(
					`
						uuid
						time
						interval
						title
						body
					`,
					{
						uuid: notification.Uuid,
						time: notification.Time,
						interval: notification.Interval,
						title: notification.Title,
						body: notification.Body
					}
				)

				if (!Array.isArray(updateNotificationResponse)) {
					notification.UploadStatus = GenericUploadStatus.UpToDate
					await DatabaseOperations.SetNotification(notification)
				} else if (
					updateNotificationResponse.includes(
						"NOTIFICATION_DOES_NOT_EXIST"
					)
				) {
					// Delete the notification
					await DatabaseOperations.RemoveNotification(notification.Uuid)
				}

				break
			case GenericUploadStatus.Deleted:
				// Delete the notification on the server
				let deleteNotificationResponse = await deleteNotification(`uuid`, {
					uuid: notification.Uuid
				})

				if (!Array.isArray(deleteNotificationResponse)) {
					// Delete the table object
					await DatabaseOperations.RemoveNotification(notification.Uuid)
				} else if (
					deleteNotificationResponse.includes(
						"NOTIFICATION_DOES_NOT_EXIST"
					) ||
					deleteNotificationResponse.includes("ACTION_NOT_ALLOWED")
				) {
					// Delete the notification
					await DatabaseOperations.RemoveNotification(notification.Uuid)
				}

				break
		}
	}

	isSyncingNotifications = false

	if (syncNotificationsAgain) {
		syncNotificationsAgain = false
		await NotificationSyncPush()
	}
}
