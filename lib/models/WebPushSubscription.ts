export class WebPushSubscription{
	constructor(
		public Uuid: string,
		public Endpoint: string,
		public P256dh: string,
		public Auth: string
	){}
}