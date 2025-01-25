import { Dav } from "../Dav.js"
import {
	ApiResponse,
	Environment,
	TableObjectProperties,
	TableObjectUploadStatus,
	TableObjectFileDownloadStatus,
	Property
} from "../types.js"
import { generateUuid } from "../utils.js"
import { User } from "./User.js"
import * as SyncManager from "../providers/SyncManager.js"
import * as DatabaseOperations from "../providers/DatabaseOperations.js"
import { GetTableObjectFile } from "../controllers/TableObjectsController.js"

export class TableObject {
	public Uuid: string = generateUuid()
	public TableId: number = 0
	public IsFile: boolean = false
	public File: Blob
	public Properties: TableObjectProperties = {}
	public UploadStatus: TableObjectUploadStatus = TableObjectUploadStatus.New
	public Etag: string
	public BelongsToUser: boolean = true
	public Purchase: string
	public User: User

	constructor(params?: {
		Uuid?: string
		TableId?: number
		IsFile?: boolean
		File?: Blob
		Properties?: TableObjectProperties
		UploadStatus?: TableObjectUploadStatus
		Etag?: string
		BelongsToUser?: boolean
		Purchase?: string
		User?: User
	}) {
		if (params != null) {
			if (params.Uuid != null) this.Uuid = params.Uuid
			if (params.TableId != null) this.TableId = params.TableId
			if (params.IsFile != null) this.IsFile = params.IsFile
			if (params.File != null) this.File = params.File
			if (params.Properties != null) this.Properties = params.Properties
			if (params.UploadStatus != null)
				this.UploadStatus = params.UploadStatus
			if (params.Etag != null) this.Etag = params.Etag
			if (params.BelongsToUser != null)
				this.BelongsToUser = params.BelongsToUser
			if (params.Purchase != null) this.Purchase = params.Purchase
			if (params.User != null) this.User = params.User
		}
	}

	async SetUploadStatus(uploadStatus: TableObjectUploadStatus): Promise<void> {
		this.UploadStatus = uploadStatus
		await this.Save(false)
	}

	async SetEtag(etag: string): Promise<void> {
		this.Etag = etag
		await this.Save(false)
	}

	async SetPropertyValue(property: Property): Promise<void> {
		if (this.SetProperty(property)) {
			await this.Save()
		}
	}

	async SetPropertyValues(properties: Property[]): Promise<void> {
		var propertiesChanged = false

		for (let property of properties) {
			if (this.SetProperty(property)) {
				propertiesChanged = true
			}
		}

		if (propertiesChanged) {
			await this.Save()
		}
	}

	/**
	 * Updates this.Properties with the property if necessary, and returns true if the this.Properties has changed
	 * @param property
	 */
	private SetProperty(property: Property): boolean {
		if (this.Properties[property.name] == null) {
			// Add the property
			this.Properties[property.name] = { value: property.value }

			if (property.options) {
				this.Properties[property.name].local = property.options.local
			}
		} else if (this.Properties[property.name].value == property.value) {
			if (!property.options) return false
			if (this.Properties[property.name].local == property.options.local)
				return false
			this.Properties[property.name].local = property.options.local
		} else {
			this.Properties[property.name].value = property.value

			if (property.options) {
				this.Properties[property.name].local = property.options.local
			}
		}

		return true
	}

	GetPropertyValue(name: string): string | boolean | number {
		var property = this.Properties[name]
		return property ? property.value : null
	}

	async RemoveProperty(name: string): Promise<void> {
		if (this.Properties[name] == null) return

		if (!Dav.isLoggedIn || this.Properties[name].local) {
			delete this.Properties[name]
		} else {
			// Set the value to null if the user is logged in
			this.Properties[name].value = null
		}

		await this.Save(Dav.environment == Environment.Test)
	}

	async Delete(): Promise<void> {
		if (Dav.isLoggedIn) {
			this.UploadStatus = TableObjectUploadStatus.Deleted
			await this.Save()
		} else {
			await this.DeleteImmediately()
		}
	}

	async DeleteImmediately(): Promise<void> {
		await DatabaseOperations.RemoveTableObject(this.Uuid, this.TableId)
	}

	async Remove(): Promise<void> {
		if (Dav.isLoggedIn) {
			this.UploadStatus = TableObjectUploadStatus.Removed
			await this.Save()
		} else {
			await this.DeleteImmediately()
		}
	}

	async SetFile(file: Blob, fileExt: string) {
		if (!this.IsFile || file == this.File) return

		if (this.UploadStatus == TableObjectUploadStatus.UpToDate) {
			this.UploadStatus = TableObjectUploadStatus.Updated
		}

		this.File = file
		await this.SetPropertyValue({ name: "ext", value: fileExt })
	}

	GetFileDownloadStatus(): TableObjectFileDownloadStatus {
		if (!this.IsFile) return TableObjectFileDownloadStatus.NoFileOrNotLoggedIn
		if (this.File != null) return TableObjectFileDownloadStatus.Downloaded
		if (!Dav.isLoggedIn)
			return TableObjectFileDownloadStatus.NoFileOrNotLoggedIn

		if (SyncManager.downloadingFileUuid == this.Uuid)
			return TableObjectFileDownloadStatus.Downloading
		return TableObjectFileDownloadStatus.NotDownloaded
	}

	async DownloadFile(): Promise<boolean> {
		if (
			this.GetFileDownloadStatus() !=
			TableObjectFileDownloadStatus.NotDownloaded
		) {
			return false
		}

		if (SyncManager.downloadingFileUuid != null) return false
		SyncManager.setDownloadingFileUuid(this.Uuid)

		let response = await GetTableObjectFile({ uuid: this.Uuid })

		if (response.status == 200) {
			this.File = (response as ApiResponse<Blob>).data
			await this.Save(false)

			SyncManager.setDownloadingFileUuid(null)
			return true
		}

		SyncManager.setDownloadingFileUuid(null)
		return false
	}

	private async Save(triggerSyncPush: boolean = true) {
		if (
			this.UploadStatus == TableObjectUploadStatus.UpToDate &&
			triggerSyncPush &&
			(await DatabaseOperations.TableObjectExists(this.Uuid))
		) {
			this.UploadStatus = TableObjectUploadStatus.Updated
		}

		await DatabaseOperations.SetTableObject(this)

		if (
			Dav.environment == Environment.Test &&
			triggerSyncPush &&
			!Dav.skipSyncPushInTests
		) {
			await SyncManager.SyncPush()
		} else if (Dav.environment != Environment.Test && triggerSyncPush) {
			SyncManager.SyncPush()
		}
	}
}

export function ConvertObjectToTableObject(obj: {
	Uuid: string
	TableId: number
	IsFile: boolean
	File: Blob
	Properties: TableObjectProperties
	UploadStatus: number
	Etag: string
}): TableObject {
	return new TableObject({
		Uuid: obj.Uuid,
		TableId: obj.TableId,
		IsFile: obj.IsFile,
		File: obj.File,
		Properties: obj.Properties,
		UploadStatus: obj.UploadStatus,
		Etag: obj.Etag
	})
}
