import { GenericUploadStatus } from '../types'
import { generateUuid } from '../utils'
import * as DatabaseOperations from '../providers/DatabaseOperations'

export class Notification {
	public Uuid: string
	public Time: number
	public Interval: number
	public Title: string
	public Body: string
	public UploadStatus: GenericUploadStatus

	constructor(params: {
		Uuid?: string,
		Time: number,
		Interval: number,
		Title: string,
		Body: string,
		UploadStatus?: GenericUploadStatus
	}) {
		this.Uuid = params.Uuid == null ? generateUuid() : params.Uuid
		this.Time = params.Time
		this.Interval = params.Interval
		this.Title = params.Title
		this.Body = params.Body
		this.UploadStatus = params.UploadStatus == null ? GenericUploadStatus.New : params.UploadStatus
	}

	async Save() {
		await DatabaseOperations.SetNotification(this)
	}
}