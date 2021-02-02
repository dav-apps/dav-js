export type Currency = "eur"

export class Purchase {
	constructor(
		public Id: number,
		public UserId: number,
		public TableObjectId: number,
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