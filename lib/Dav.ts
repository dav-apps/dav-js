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
	static server: boolean = false
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
	static accessToken: string
	static skipSyncPushInTests: boolean = true

	private static isSyncing = false

	constructor(params?: {
		environment?: Environment,
		server?: boolean,
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
			if (params.server != null) Dav.server = params.server
			if (params.appId != null) Dav.appId = params.appId
			if (params.tableIds != null) Dav.tableIds = params.tableIds
			if (params.parallelTableIds != null) Dav.parallelTableIds = params.parallelTableIds
			if (params.notificationOptions != null) Dav.notificationOptions = params.notificationOptions
			if (params.callbacks != null) Dav.callbacks = params.callbacks
		}

		// Set the other static variables
		Dav.apiBaseUrl = Dav.environment == Environment.Production ? apiBaseUrlProduction : apiBaseUrlDevelopment
		Dav.websiteUrl = Dav.environment == Environment.Production ? websiteUrlProduction : websiteUrlDevelopment
		if(Dav.server) return

		// Init the service worker
		SyncManager.InitServiceWorker()

		Dav.StartSync()
	}

	private static async StartSync() {
		if (this.isSyncing) return
		this.isSyncing = true

		// Get the access token from the database
		let session = await DatabaseOperations.GetSession()

		if (
			session == null
			|| session.AccessToken == null
			|| session.UploadStatus == SessionUploadStatus.Deleted
		) {
			await SyncManager.SessionSyncPush()
			this.isSyncing = false
			return
		}
		Dav.accessToken = session.AccessToken

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

	static async Login(accessToken: string) {
		// Save the access token in the database
		await DatabaseOperations.SetSession({ AccessToken: accessToken, UploadStatus: SessionUploadStatus.UpToDate })
		this.StartSync()
	}

	static async Logout() {
		Dav.accessToken = null

		// Remove the user
		await DatabaseOperations.RemoveUser()

		// Set the session UploadStatus to Deleted
		let session = await DatabaseOperations.GetSession()
		session.UploadStatus = SessionUploadStatus.Deleted
		await DatabaseOperations.SetSession(session)

		// Start deleting the session on the server
		SyncManager.SessionSyncPush()
	}

	static ShowLoginPage(apiKey: string, callbackUrl: string) {
		window.location.href = `${Dav.websiteUrl}/login?type=session&apiKey=${apiKey}&appId=${Dav.appId}&redirectUrl=${encodeURIComponent(callbackUrl)}`
	}

	static ShowSignupPage(apiKey: string, callbackUrl: string) {
		window.location.href = `${Dav.websiteUrl}/signup?type=session&apiKey=${apiKey}&appId=${Dav.appId}&redirectUrl=${encodeURIComponent(callbackUrl)}`
	}

	static ShowUserPage(anker: string = "", newTab: boolean = false) {
		let url = Dav.GetUserPageLink(anker)

		if (newTab) {
			window.open(url, "blank")
		} else {
			window.location.href = url
		}
	}

	static GetUserPageLink(anker: string = "") {
		return `${Dav.websiteUrl}/login?redirect=user${anker ? encodeURIComponent(`#${anker}`) : ''}`
	}
}