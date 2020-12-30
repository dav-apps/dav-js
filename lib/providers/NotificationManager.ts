import { Dav } from '../Dav'
import {
	webPushPublicKey
} from '../constants'
import {
	Environment,
	GenericUploadStatus
} from '../types'
import {
	generateUuid,
	urlBase64ToUint8Array,
	requestNotificationPermission
} from '../utils'
import { WebPushSubscription } from '../models/WebPushSubscription'
import * as DatabaseOperations from './DatabaseOperations'

export async function SetupWebPushSubscription(): Promise<boolean> {
	if (
		Dav.jwt == null
		|| Dav.environment != Environment.Production
		|| !('serviceWorker' in navigator)
		|| !('PushManager' in window)
	) return false

	// Check if there is already a webPushSubscription
	let webPushSubscription = await DatabaseOperations.GetWebPushSubscription()

	if (
		webPushSubscription != null
		&& webPushSubscription.UploadStatus != GenericUploadStatus.Deleted
	) return true

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
		GenericUploadStatus.New
	)

	// Save the WebPushSubscription in the database
	await DatabaseOperations.SetWebPushSubscription(webPushSubscription)
	// TODO: Start web push subscription sync
	return true
}