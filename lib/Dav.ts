import {
	Environment,
	NotificationOptions,
	SessionUploadStatus,
	Plan,
	SubscriptionStatus
} from './types'
import {
	apiBaseUrlDevelopment,
	apiBaseUrlProduction,
	websiteUrlDevelopment,
	websiteUrlProduction,
	defaultProfileImageUrl
} from './constants'
import * as DatabaseOperations from './providers/DatabaseOperations'
import * as SyncManager from './providers/SyncManager'
import * as NotificationManager from './providers/NotificationManager'
import { App } from './models/App'

export class Dav {
	static isLoggedIn: boolean = false
	static user: {
		Id: number,
		Email: string,
		FirstName: string,
		Confirmed: boolean,
		TotalStorage: number,
		UsedStorage: number,
		StripeCustomerId: string,
		Plan: Plan,
		SubscriptionStatus: SubscriptionStatus,
		PeriodEnd: Date,
		Dev: boolean,
		Provider: boolean,
		ProfileImage: string,
		Apps: App[]
	} = {
			Id: 0,
			Email: "",
			FirstName: "",
			Confirmed: false,
			TotalStorage: 0,
			UsedStorage: 0,
			StripeCustomerId: null,
			Plan: Plan.Free,
			SubscriptionStatus: SubscriptionStatus.Active,
			PeriodEnd: null,
			Dev: false,
			Provider: false,
			ProfileImage: defaultProfileImageUrl,
			Apps: []
		}

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
		UserLoaded?: Function,
		UserDownloaded?: Function,
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
			UserLoaded?: Function,
			UserDownloaded?: Function,
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
		if (Dav.server || Dav.environment == Environment.Test) return

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
			if (Dav.callbacks.UserLoaded) Dav.callbacks.UserLoaded()
			await SyncManager.SessionSyncPush()
			this.isSyncing = false
			return
		}
		Dav.isLoggedIn = true
		Dav.accessToken = session.AccessToken

		// Load the user
		await SyncManager.LoadUser()

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

		if (Dav.callbacks.SyncFinished) Dav.callbacks.SyncFinished()
		this.isSyncing = false
	}

	static async Login(accessToken: string) {
		// Save the access token in the database
		await DatabaseOperations.SetSession({ AccessToken: accessToken, UploadStatus: SessionUploadStatus.UpToDate })
		this.StartSync()
	}

	static async Logout() {
		Dav.accessToken = null
		Dav.isLoggedIn = false

		// Remove the user
		await DatabaseOperations.RemoveUser()

		// Set the session UploadStatus to Deleted
		let session = await DatabaseOperations.GetSession()
		if (session == null) return

		session.UploadStatus = SessionUploadStatus.Deleted
		await DatabaseOperations.SetSession(session)

		// Start deleting the session on the server
		if (this.environment != Environment.Test) {
			SyncManager.SessionSyncPush()
		}
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