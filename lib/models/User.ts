import { Plan, SubscriptionStatus } from "../types.js"
import { App } from "./App.js"

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
}

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
		public ProfileImage: string,
		public ProfileImageEtag: string,
		public Apps: App[] = []
	) {}
}
