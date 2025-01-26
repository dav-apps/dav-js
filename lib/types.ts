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

export type ErrorCode =
	| "ACTION_NOT_ALLOWED"
	| "SESSION_EXPIRED"
	| "PASSWORD_INCORRECT"
	| "USER_IS_ALREADY_CONFIRMED"
	| "USER_DOES_NOT_EXIST"
	| "SESSION_DOES_NOT_EXIST"
	| "TABLE_OBJECT_DOES_NOT_EXIST"
	| "FIRST_NAME_TOO_SHORT"
	| "FIRST_NAME_TOO_LONG"
	| "PASSWORD_TOO_SHORT"
	| "PASSWORD_TOO_LONG"
	| "NAME_TOO_SHORT"
	| "NAME_TOO_LONG"
	| "DESCRIPTION_TOO_SHORT"
	| "DESCRIPTION_TOO_LONG"
	| "EMAIL_INVALID"
	| "WEB_LINK_INVALID"
	| "GOOGLE_PLAY_LINK_INVALID"
	| "MICROSOFT_STORE_LINK_INVALID"
	| "EMAIL_ALREADY_IN_USE"

export interface List<T> {
	total: number
	items: T[]
}
//#endregion

//#region User types
export enum Plan {
	Free = "FREE",
	Plus = "PLUS",
	Pro = "PRO"
}

export enum SubscriptionStatus {
	Active = "ACTIVE",
	Ending = "ENDING"
}

export enum TableObjectPriceType {
	Purchase = "PURCHASE",
	Order = "ORDER"
}

export type Currency = "EUR" | "USD"
export type OrderStatus = "CREATED" | "PREPARATION" | "SHIPPED"

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

export interface AppUserSnapshotResource {
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

export interface TableObjectResource {
	uuid: string
	user: UserResource
	purchases: List<PurchaseResource>
}

export interface TableObjectPriceResource {
	price: number
	currency: Currency
	type: TableObjectPriceType
}

export interface ProviderResource {
	id: number
}

export interface UserProfileImageResource {
	url: string
	etag: string
}

export interface NotificationResource {
	uuid: string
	time: number
	interval: number
	title: string
	body: string
}

export interface CheckoutSessionResource {
	url: string
}

export interface CustomerPortalSessionResource {
	url: string
}

export interface PurchaseResource {
	uuid: string
	price: number
	currency: Currency
}

export interface OrderResource {
	uuid: string
	user: UserResource
	tableObject: TableObjectResource
	shippingAddress: ShippingAddressResource
	paymentIntentId: string
	price: number
	currency: Currency
	status: OrderStatus
}

export interface ShippingAddressResource {
	uuid: string
	name: string
	email: string
	phone: string
	city: string
	country: string
	line1: string
	line2: string
	postalCode: string
	state: string
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
