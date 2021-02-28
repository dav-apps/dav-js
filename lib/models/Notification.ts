import { Environment, GenericUploadStatus } from '../types'
import { generateUuid } from '../utils'
import { Dav } from '../Dav'
import * as DatabaseOperations from '../providers/DatabaseOperations'
import * as NotificationManager from '../providers/NotificationManager'

export class Notification {
	public Uuid: string = generateUuid()
	public Time: number
	public Interval: number
	public Title: string
	public Body: string
	public UploadStatus: GenericUploadStatus = GenericUploadStatus.New

	constructor(params: {
		Uuid?: string,
		Time: number,
		Interval: number,
		Title: string,
		Body: string,
		UploadStatus?: GenericUploadStatus
	}) {
		if (params.Uuid != null) this.Uuid = params.Uuid
		this.Time = params.Time
		this.Interval = params.Interval
		this.Title = params.Title
		this.Body = params.Body
		if (params.UploadStatus != null) this.UploadStatus = params.UploadStatus
	}

	async Delete() {
		if (Dav.isLoggedIn) {
			this.UploadStatus = GenericUploadStatus.Deleted
			await this.Save()
		} else {
			await this.DeleteImmediately()
		}
	}

	async DeleteImmediately() {
		await DatabaseOperations.RemoveNotification(this.Uuid)
	}

	private async Save() {
		if (
			this.UploadStatus == GenericUploadStatus.UpToDate
			&& await DatabaseOperations.NotificationExists(this.Uuid)
		) this.UploadStatus = GenericUploadStatus.Updated

		await DatabaseOperations.SetNotification(this)

		if (Dav.environment == Environment.Test && !Dav.skipSyncPushInTests) {
			await NotificationManager.NotificationSyncPush()
		} else if(Dav.environment != Environment.Test) {
			NotificationManager.NotificationSyncPush()
		}
	}
}

export function ConvertObjectArrayToNotifications(objArray: any[]): Notification[] {
	let notifications: Notification[] = []

	if (objArray != null) {
		for (let obj of objArray) {
			notifications.push(new Notification({
				Uuid: obj.uuid,
				Time: obj.time,
				Interval: obj.interval,
				Title: obj.title,
				Body: obj.body
			}))
		}
	}

	return notifications
}