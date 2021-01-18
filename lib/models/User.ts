import { Plan, SubscriptionStatus } from '../types'
import { App } from './App'

export class User {
	constructor(
		public Id: number,
		public Email: string,
		public FirstName: string,
		public Confirmed: boolean,
		public TotalStorage: number,
		public UsedStorage: number,
		public StripeCustomerId: string,
		public Plan: Plan,
		public SubscriptionStatus: SubscriptionStatus,
		public PeriodEnd: Date,
		public Dev: boolean,
		public Provider: boolean,
		public Apps: App[] = []
	) { }
}