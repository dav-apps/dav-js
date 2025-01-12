import { App } from "./models/App.js"

//#region Generic types
export enum Environment {
	Test,
	Development,
	Staging,
	Production
}

export enum GenericUploadStatus {
	// The object was created on the server
	UpToDate = 0,
	// The object was created, but it's still not saved on the server
	New = 1,
	// The object was created on the server, but some values changed
	Updated = 2,
	// The object in on the server, but it was deleted locally and has to be deleted on the server
	Deleted = 3
}

export enum SessionUploadStatus {
	UpToDate = 0,
	Deleted = 1
}

export interface DatabaseSession {
	AccessToken: string
	UploadStatus: SessionUploadStatus
}

export type Currency = "eur" | "usd"
//#endregion

//#region Response types
export interface ApiResponse<T> {
	status: number
	data?: T
}

export interface ApiErrorResponse {
	status: number
	errors: ApiResponseError[]
}

export interface ApiErrorResponse2 {
	status: number
	error?: ApiResponseError2
}

export interface ApiResponseError {
	code: number
	message: string
}

export interface ApiResponseError2 {
	code: string
	message: string
}

export type ErrorCode = "SESSION_ENDED" | "SESSION_DOES_NOT_EXIST"

export interface List<T> {
	total: number
	items: T[]
}
//#endregion

//#region User types
export enum Plan {
	Free = 0,
	Plus = 1,
	Pro = 2
}

export enum SubscriptionStatus {
	Active = 0,
	Ending = 1
}

export interface DatabaseUser {
	Id: number
	Email: string
	FirstName: string
	Confirmed: boolean
	TotalStorage: number
	UsedStorage: number
	StripeCustomerId?: string
	Plan: Plan
	SubscriptionStatus?: SubscriptionStatus
	PeriodEnd?: Date
	Dev: boolean
	Provider: boolean
	ProfileImage: Blob
	ProfileImageEtag: string
	Apps: App[]
}
//#endregion

//#region API response types
export interface UserResource {
	id: number
	email: string
	firstName: string
	confirmed: boolean
	totalStorage: number
	usedStorage: number
	stripeCustomerId: string
	plan: Plan
	subscriptionStatus: SubscriptionStatus
	periodEnd: string
	dev: DevResource
	provider: ProviderResource
	profileImage: UserProfileImageResource
	apps: List<AppResource>
}

export interface UserSnapshotResource {
	time: Date
	dailyActive: number
	weeklyActive: number
	monthlyActive: number
	yearlyActive: number
	freePlan: number
	plusPlan: number
	proPlan: number
	emailConfirmed: number
	emailUnconfirmed: number
}

export interface DevResource {
	id: number
	apps: List<AppResource>
}

export interface AppResource {
	id: number
	name: string
	description: string
	webLink: string
	googlePlayLink: string
	microsoftStoreLink: string
	published: boolean
	tables: List<TableResource>
}

export interface TableResource {
	id: number
	name: string
}

export interface ProviderResource {
	id: number
}

export interface UserProfileImageResource {
	url: string
	etag: string
}
//#endregion

//#region TableObject & Property types
export interface DatabaseTableObject {
	Uuid: string
	TableId: number
	IsFile: boolean
	File: Blob
	Properties: TableObjectProperties | OldTableObjectProperties
	UploadStatus: number
	Etag: string
	BelongsToUser: boolean
	Purchase: string
}

export interface TableObjectProperties {
	[name: string]: TableObjectProperty
}

export interface OldTableObjectProperties {
	[name: string]: string
}

export interface TableObjectProperty {
	value: string | boolean | number
	local?: boolean // default: false
}

export interface Property {
	name: string
	value: string | boolean | number
	options?: {
		local: boolean
	}
}

export enum TableObjectUploadStatus {
	UpToDate = 0,
	New = 1,
	Updated = 2,
	Deleted = 3,
	Removed = 4
}

export enum TableObjectFileDownloadStatus {
	NoFileOrNotLoggedIn = 0,
	NotDownloaded = 1,
	Downloading = 2,
	Downloaded = 3
}
//#endregion

//#region Notification types
export interface DatabaseNotification {
	Uuid: string
	Time: number
	Interval: number
	Title: string
	Body: string
	UploadStatus: number
}

export interface NotificationOptions {
	icon: string
	badge: string
}

export enum WebPushSubscriptionUploadStatus {
	UpToDate = 0,
	New = 1
}
//#endregion
