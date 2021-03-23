import { Dav } from '../Dav'
import {
	webPushPublicKey
} from '../constants'
import {
	ApiResponse,
	ApiErrorResponse,
	Environment,
	WebPushSubscriptionUploadStatus,
	GenericUploadStatus
} from '../types'
import {
	generateUuid,
	urlBase64ToUint8Array,
	requestNotificationPermission
} from '../utils'
import * as ErrorCodes from '../errorCodes'
import * as DatabaseOperations from './DatabaseOperations'
import { WebPushSubscription } from '../models/WebPushSubscription'
import { Notification } from '../models/Notification'
import { CreateWebPushSubscription } from '../controllers/WebPushSubscriptionsController'
import {
	CreateNotification,
	GetNotifications,
	DeleteNotification,
	UpdateNotification
} from '../controllers/NotificationsController'

var isSyncingWebPushSubscription = false
var isSyncingNotifications = false
var syncNotificationsAgain = false

export async function SetupWebPushSubscription(): Promise<boolean> {
	if (
		Dav.accessToken == null
		|| Dav.environment != Environment.Production
		|| !('serviceWorker' in navigator)
		|| !('PushManager' in window)
	) return false

	// Check if there is already a webPushSubscription
	let webPushSubscription = await DatabaseOperations.GetWebPushSubscription()
	if (webPushSubscription != null) return true

	// Ask for permission for sending notifications
	if(!requestNotificationPermission()) return false
	
	// Create the subscription
	const registration = await navigator.serviceWorker.getRegistration()
	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(webPushPublicKey)
	})
	
	const subscriptionJson = subscription.toJSON()
	webPushSubscription = new WebPushSubscription(
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

export async function WebPushSubscriptionSyncPush() {
	if (Dav.accessToken == null || isSyncingWebPushSubscription) return
	isSyncingWebPushSubscription = true

	// Get the WebPushSubscription from the database
	let webPushSubscription = await DatabaseOperations.GetWebPushSubscription()
	if (webPushSubscription == null) {
		isSyncingWebPushSubscription = false
		return
	}

	if (webPushSubscription.UploadStatus == WebPushSubscriptionUploadStatus.New) {
		// Create the WebPushSubscription on the server
		let createResult = await CreateWebPushSubscriptionOnServer(webPushSubscription)

		if (createResult.success) {
			webPushSubscription.UploadStatus = WebPushSubscriptionUploadStatus.UpToDate
			await DatabaseOperations.SetWebPushSubscription(webPushSubscription)
		} else {
			let errors = (createResult.message as ApiErrorResponse).errors

			// Check if the session does not exist
			let i = errors.findIndex(error => error.code == ErrorCodes.SessionDoesNotExist)
			if (i != -1) {
				// Log the user out
				await Dav.Logout()
			}
		}
	}

	isSyncingWebPushSubscription = false
}

export async function NotificationSync() {
	if (Dav.accessToken == null || isSyncingNotifications) return
	isSyncingNotifications = true

	let removedNotifications = await DatabaseOperations.GetAllNotifications()

	// Get all notifications from the server
	let getNotificationsResponse = await GetNotifications()
	if (getNotificationsResponse.status != 200) return
	let notifications = (getNotificationsResponse as ApiResponse<Notification[]>).data
	
	for (let notification of notifications) {
		// Remove the notification from removedNotifications
		let i = removedNotifications.findIndex(n => n.Uuid == notification.Uuid)
		if(i != -1) removedNotifications.splice(i, 1)

		let currentNotification = await DatabaseOperations.GetNotification(notification.Uuid)

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

	let notifications: Notification[] = await DatabaseOperations.GetAllNotifications()
	let filteredNotifications = notifications.filter(notification => notification.UploadStatus != GenericUploadStatus.UpToDate).reverse()

	for (let notification of filteredNotifications) {
		switch (notification.UploadStatus) {
			case GenericUploadStatus.New:
				// Create the notification on the server
				let createResult = await CreateNotificationOnServer(notification)

				if (createResult.success) {
					notification.UploadStatus = GenericUploadStatus.UpToDate
					await DatabaseOperations.SetNotification(notification)
				} else if (createResult.message != null) {
					// Check the errors
					let errors = (createResult.message as ApiErrorResponse).errors

					// Check if the notification already exists
					let i = errors.findIndex(error => error.code == ErrorCodes.UuidAlreadyInUse)
					if (i != -1) {
						// Set the UploadStatus to UpToDate
						notification.UploadStatus = GenericUploadStatus.UpToDate
						await DatabaseOperations.SetNotification(notification)
					}

					// Check if title or body is missing
					i = errors.findIndex(error => error.code == ErrorCodes.TitleMissing || error.code == ErrorCodes.BodyMissing)
					if (i != -1) {
						// Delete the notification
						await DatabaseOperations.RemoveNotification(notification.Uuid)
					}
				}
				break
			case GenericUploadStatus.Updated:
				// Update the notification on the server
				let updateResult = await UpdateNotificationOnServer(notification)

				if (updateResult.success) {
					notification.UploadStatus = GenericUploadStatus.UpToDate
					await DatabaseOperations.SetNotification(notification)
				} else if (updateResult.message != null) {
					// Check the errors
					let errors = (updateResult.message as ApiErrorResponse).errors

					// Check if the notification does not exist
					let i = errors.findIndex(error => error.code == ErrorCodes.NotificationDoesNotExist)
					if (i != -1) {
						// Delete the notification
						await DatabaseOperations.RemoveNotification(notification.Uuid)
					}
				}
				break
			case GenericUploadStatus.Deleted:
				// Delete the notification on the server
				let deleteResult = await DeleteNotificationOnServer(notification)

				if (deleteResult.success) {
					// Delete the table object
					await DatabaseOperations.RemoveNotification(notification.Uuid)
				} else if (deleteResult.message != null) {
					// Check the errors
					let errors = (deleteResult.message as ApiErrorResponse).errors

					// Check if the notification does not exist
					let i = errors.findIndex(error =>
						error.code == ErrorCodes.NotificationDoesNotExist
						|| error.code == ErrorCodes.ActionNotAllowed
					)
					if (i != -1) {
						// Delete the notification
						await DatabaseOperations.RemoveNotification(notification.Uuid)
					}
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

//#region Utility functions
async function CreateWebPushSubscriptionOnServer(
	webPushSubscription: WebPushSubscription
): Promise<{success: boolean, message: WebPushSubscription | ApiErrorResponse}> {
	if (Dav.accessToken == null) return { success: false, message: null }
	
	const createWebPushSubscriptionResponse = await CreateWebPushSubscription({
		uuid: webPushSubscription.Uuid,
		endpoint: webPushSubscription.Endpoint,
		p256dh: webPushSubscription.P256dh,
		auth: webPushSubscription.Auth
	})

	if (createWebPushSubscriptionResponse.status == 201) {
		return {
			success: true,
			message: (createWebPushSubscriptionResponse as ApiResponse<WebPushSubscription>).data
		}
	} else {
		return {
			success: false,
			message: createWebPushSubscriptionResponse as ApiErrorResponse
		}
	}
}

async function CreateNotificationOnServer(
	notification: Notification
): Promise<{success: boolean, message: Notification | ApiErrorResponse}> {
	if (Dav.accessToken == null) return { success: false, message: null }
	
	let createNotificationResponse = await CreateNotification({
		uuid: notification.Uuid,
		time: notification.Time,
		interval: notification.Interval,
		title: notification.Title,
		body: notification.Body
	})

	if (createNotificationResponse.status == 201) {
		return {
			success: true,
			message: (createNotificationResponse as ApiResponse<Notification>).data
		}
	} else {
		return {
			success: false,
			message: createNotificationResponse as ApiErrorResponse
		}
	}
}

async function UpdateNotificationOnServer(
	notification: Notification
): Promise<{ success: boolean, message: Notification | ApiErrorResponse }>{
	if (Dav.accessToken == null) return { success: false, message: null }

	let updateNotificationResponse = await UpdateNotification({
		uuid: notification.Uuid,
		time: notification.Time,
		interval: notification.Interval,
		title: notification.Title,
		body: notification.Body
	})

	if (updateNotificationResponse.status == 200) {
		return {
			success: true,
			message: (updateNotificationResponse as ApiResponse<Notification>).data
		}
	} else {
		return {
			success: false,
			message: updateNotificationResponse as ApiErrorResponse
		}
	}
}

async function DeleteNotificationOnServer(
	notification: Notification
): Promise<{ success: boolean, message: {} | ApiErrorResponse}>{
	if (Dav.accessToken == null) return { success: false, message: null }

	let deleteNotificationResponse = await DeleteNotification({
		uuid: notification.Uuid
	})

	if (deleteNotificationResponse.status == 204) {
		return {
			success: true,
			message: {}
		}
	} else {
		return {
			success: false,
			message: deleteNotificationResponse as ApiErrorResponse
		}
	}
}
//#endregion