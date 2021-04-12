import { Currency } from '../types'

export class Purchase {
	constructor(
		public Id: number,
		public UserId: number,
		public Uuid: string,
		public PaymentIntentId: string,
		public ProviderName: string,
		public ProviderImage: string,
		public ProductName: string,
		public ProductImage: string,
		public Price: number,
		public Currency: Currency,
		public Completed: boolean
	) { }
}