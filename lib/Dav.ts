import { Environment, NotificationOptions, SessionUploadStatus } from './types'
import {
	apiBaseUrlDevelopment,
	apiBaseUrlProduction,
	websiteUrlDevelopment,
	websiteUrlProduction
} from './constants'
import * as DatabaseOperations from './providers/DatabaseOperations'
import * as SyncManager from './providers/SyncManager'
import * as NotificationManager from './providers/NotificationManager'

export class Dav {
	static environment: Environment = Environment.Development
	static appId: number = 0
	static tableIds: number[] = []
	static parallelTableIds: number[] = []
	static notificationOptions: NotificationOptions = { icon: null, badge: null }
	static callbacks: {
		UpdateAllOfTable?: Function,
		UpdateTableObject?: Function,
		DeleteTableObject?: Function,
		UserDownloadFinished?: Function,
		SyncFinished?: Function
	} = {}

	static apiBaseUrl: string = apiBaseUrlDevelopment
	static websiteUrl: string = websiteUrlDevelopment
	static jwt: string
	static skipSyncPushInTests: boolean = true

	private static isSyncing = false

	constructor(params?: {
		environment?: Environment,
		appId?: number,
		tableIds?: number[],
		parallelTableIds?: number[],
		notificationOptions?: NotificationOptions,
		callbacks?: {
			UpdateAllOfTable?: Function,
			UpdateTableObject?: Function,
			DeleteTableObject?: Function,
			UserDownloadFinished?: Function,
			SyncFinished?: Function
		}
	}) {
		if (params != null) {
			if (params.environment != null) Dav.environment = params.environment
			if (params.appId != null) Dav.appId = params.appId
			if (params.tableIds != null) Dav.tableIds = params.tableIds
			if (params.parallelTableIds != null) Dav.parallelTableIds = params.parallelTableIds
			if (params.notificationOptions != null) Dav.notificationOptions = params.notificationOptions
			if (params.callbacks != null) Dav.callbacks = params.callbacks
		}

		// Set the other static variables
		Dav.apiBaseUrl = Dav.environment == Environment.Production ? apiBaseUrlProduction : apiBaseUrlDevelopment
		Dav.websiteUrl = Dav.environment == Environment.Production ? websiteUrlProduction : websiteUrlDevelopment

		// Init the service worker
		SyncManager.InitServiceWorker()

		Dav.StartSync()
	}

	private static async StartSync() {
		if (this.isSyncing) return
		this.isSyncing = true

		// Get the jwt from the database
		let session = await DatabaseOperations.GetSession()
		if (session.Jwt == null || session.UploadStatus == SessionUploadStatus.Deleted) {
			SyncManager.SessionSyncPush()
			this.isSyncing = false
			return
		}
		Dav.jwt = session.Jwt

		// Sync the user
		if (!await SyncManager.SyncUser()) {
			this.isSyncing = false
			return
		}

		// Sync the table objects
		let syncSuccess = await SyncManager.Sync()
		let syncPushSuccess = await SyncManager.SyncPush()
		if (!syncSuccess || !syncPushSuccess) {
			this.isSyncing = false
			return
		}

		await SyncManager.StartWebsocketConnection()
		SyncManager.DownloadFiles()

		// Sync the web push subscription and notifications
		await NotificationManager.WebPushSubscriptionSyncPush()
		await NotificationManager.NotificationSync()
		await NotificationManager.NotificationSyncPush()

		Dav.callbacks.SyncFinished()
		this.isSyncing = false
	}

	static async Login(jwt: string) {
		// Save the jwt in the database
		await DatabaseOperations.SetSession({Jwt: jwt, UploadStatus: SessionUploadStatus.UpToDate})
		this.StartSync()
	}

	static async Logout() {
		Dav.jwt = null

		// Set the session UploadStatus to Deleted
		let session = await DatabaseOperations.GetSession()
		session.UploadStatus = SessionUploadStatus.Deleted
		await DatabaseOperations.SetSession(session)

		// Start deleting the session on the server
		SyncManager.SessionSyncPush()
	}
}