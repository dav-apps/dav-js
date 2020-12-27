//#region General types
export enum Environment{
	Development,
	Test,
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
//#endregion

//#region Response types
export interface ApiResponse<T> {
	status: number
	data: T
}

export interface ApiErrorResponse {
	status: number
	errors: ApiResponseError[]
}

export interface ApiResponseError {
	code: number
	message: string
}
//#endregion

//#region User types
export enum Plan{
	Free = 0,
	Plus = 1,
	Pro = 2
}

export enum SubscriptionStatus{
	Active = 0,
	Ending = 1
}
//#endregion

//#region TableObject & Property types
export type DatabaseTableObject = {
	Uuid: string
	TableId: number
	IsFile: boolean
	File: Blob
	Properties: TableObjectProperties | OldTableObjectProperties
	UploadStatus: number
	Etag: string
}

export type TableObjectProperties = {
	[name: string]: TableObjectProperty
}

export type OldTableObjectProperties = {
	[name: string]: string
}

export interface TableObjectProperty {
	value: string | boolean | number
	local?: boolean	// default: false
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
export interface NotificationOptions{
	icon: string,
	badge: string
}
//#endregion