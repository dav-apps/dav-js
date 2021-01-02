import * as axios from 'axios'
import { Dav } from '../Dav'
import {
	Environment,
	TableObjectProperties,
	TableObjectUploadStatus,
	TableObjectFileDownloadStatus,
	Property
} from '../types'
import { generateUuid } from '../utils'
import * as SyncManager from '../providers/SyncManager'
import * as DatabaseOperations from '../providers/DatabaseOperations'

export class TableObject {
	public Uuid: string
	public TableId: number
	public IsFile: boolean = false
	public File: Blob
	public Properties: TableObjectProperties = {}
	public UploadStatus: TableObjectUploadStatus = TableObjectUploadStatus.New
	public Etag: string

	constructor(uuid?: string) {
		if (uuid) {
			this.Uuid = uuid
		} else {
			this.Uuid = generateUuid()
		}
	}

	async SetUploadStatus(uploadStatus: TableObjectUploadStatus): Promise<void> {
		this.UploadStatus = uploadStatus;
		await this.Save(false);
	}

	async SetEtag(etag: string): Promise<void> {
		this.Etag = etag;
		await this.Save(false);
	}

	async SetPropertyValue(property: Property): Promise<void> {
		if (this.SetProperty(property)) {
			await this.Save();
		}
	}

	async SetPropertyValues(properties: Property[]): Promise<void> {
		var propertiesChanged = false;

		for (let property of properties) {
			if (this.SetProperty(property)) {
				propertiesChanged = true
			}
		}

		if (propertiesChanged) {
			await this.Save();
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
			if (this.Properties[property.name].local == property.options.local) return false
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
		var property = this.Properties[name];
		return property ? property.value : null;
	}

	async RemoveProperty(name: string): Promise<void> {
		if (this.Properties[name] == null) return

		if (!Dav.jwt || this.Properties[name].local) {
			delete this.Properties[name];
		} else {
			// Set the value to empty string if the user is logged in
			this.Properties[name].value = null;
		}

		await this.Save(Dav.environment == Environment.Test);
	}

	async Delete(): Promise<void> {
		if (Dav.jwt != null) {
			this.UploadStatus = TableObjectUploadStatus.Deleted;
			await this.Save();
		} else {
			await this.DeleteImmediately();
		}
	}

	async DeleteImmediately(): Promise<void> {
		await DatabaseOperations.RemoveTableObject(this.Uuid, this.TableId);
	}

	async Remove(): Promise<void> {
		if (Dav.jwt) {
			this.UploadStatus = TableObjectUploadStatus.Removed;
			await this.Save();
		} else {
			await this.DeleteImmediately();
		}
	}

	async SetFile(file: Blob, fileExt: string) {
		if (!this.IsFile) return;
		if (file == this.File) return;

		if (this.UploadStatus == TableObjectUploadStatus.UpToDate) {
			this.UploadStatus = TableObjectUploadStatus.Updated;
		}

		this.File = file;
		await this.SetPropertyValue({ name: "ext", value: fileExt });
	}

	GetFileDownloadStatus() : TableObjectFileDownloadStatus {
		if (!this.IsFile) return TableObjectFileDownloadStatus.NoFileOrNotLoggedIn
		if (this.File != null) return TableObjectFileDownloadStatus.Downloaded
		if (Dav.jwt == null) return TableObjectFileDownloadStatus.NoFileOrNotLoggedIn

		if (SyncManager.downloadingFileUuid == this.Uuid) return TableObjectFileDownloadStatus.Downloading
		return TableObjectFileDownloadStatus.NotDownloaded
	}

	async DownloadFile(): Promise<boolean> {
		var downloadStatus = this.GetFileDownloadStatus()

		if (
			Dav.jwt == null
			|| downloadStatus == TableObjectFileDownloadStatus.Downloading
			|| downloadStatus == TableObjectFileDownloadStatus.Downloaded
		) return false

		if (SyncManager.downloadingFileUuid != null) return false
		SyncManager.setDownloadingFileUuid(this.Uuid)

		try {
			let response = await axios.default({
				method: 'get',
				url: `${Dav.apiBaseUrl}/apps/object/${this.Uuid}`,
				responseType: 'blob',
				params: {
					file: true
				},
				headers: {
					'Authorization': Dav.jwt
				}
			})

			if (response && response.data) {
				this.File = response.data as Blob
				await this.Save(false)

				SyncManager.setDownloadingFileUuid(null)
				return true
			}
		} catch (error) {
			SyncManager.setDownloadingFileUuid(null)
			return false
		}
	}

	private async Save(triggerSyncPush: boolean = true) {
		if (
			this.UploadStatus == TableObjectUploadStatus.UpToDate
			&& triggerSyncPush
			&& await DatabaseOperations.TableObjectExists(this.Uuid)
		) {
			this.UploadStatus = TableObjectUploadStatus.Updated
		}

		await DatabaseOperations.SetTableObject(this)

		if (Dav.environment == Environment.Test && triggerSyncPush && !Dav.skipSyncPushInTests) {
			await SyncManager.SyncPush()
		} else if (Dav.environment != Environment.Test && triggerSyncPush) {
			SyncManager.SyncPush()
		}
	}
}

export function ConvertObjectToTableObject(
	obj: {
		Uuid: string,
		TableId: number,
		IsFile: boolean,
		File: Blob,
		Properties: TableObjectProperties,
		UploadStatus: number,
		Etag: string
	}): TableObject {
	let tableObject = new TableObject(obj.Uuid);
	tableObject.TableId = obj.TableId;
	tableObject.UploadStatus = obj.UploadStatus;
	tableObject.IsFile = obj.IsFile;
	tableObject.File = obj.File;
	tableObject.Etag = obj.Etag;
	tableObject.Properties = obj.Properties;
	return tableObject;
}