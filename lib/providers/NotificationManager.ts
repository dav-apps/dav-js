import { Dav } from '../Dav'
import {
	webPushPublicKey
} from '../constants'
import {
	ApiResponse,
	ApiErrorResponse,
	Environment,
	WebPushSubscriptionUploadStatus
} from '../types'
import {
	generateUuid,
	urlBase64ToUint8Array,
	requestNotificationPermission
} from '../utils'
import * as ErrorCodes from '../errorCodes'
import { WebPushSubscription } from '../models/WebPushSubscription'
import * as DatabaseOperations from './DatabaseOperations'
import { CreateWebPushSubscription } from '../controllers/WebPushSubscriptionsController'

var isSyncingWebPushSubscription = false

export async function SetupWebPushSubscription(): Promise<boolean> {
	if (
		Dav.jwt == null
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
	if (Dav.jwt == null || isSyncingWebPushSubscription) return
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

//#region Utility functions
async function CreateWebPushSubscriptionOnServer(
	webPushSubscription: WebPushSubscription
): Promise<{success: boolean, message: WebPushSubscription | ApiErrorResponse}> {
	if (Dav.jwt == null) return { success: false, message: null }
	
	const createWebPushSubscriptionResponse = await CreateWebPushSubscription({
		jwt: Dav.jwt,
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
//#endregion