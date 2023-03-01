import { TableObject } from "../lib/models/TableObject.js"
import { Auth } from "../lib/models/Auth.js"
import { Plan } from "../lib/types.js"

export const testerXTestAppAccessToken = "ckktuu0gs00008iw3ctnrofzf"

export const testAppId = 5
export const testUserId = 2
export const testAppFirstTestTableId = 24
export const testAppSecondTestTableId = 25

export const davDevAuth = new Auth({
	apiKey: "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm",
	secretKey: "Stac8pRhqH0CSO5o9Rxqjhu7vyVp4PINEMJumqlpvRQai4hScADamQ",
	uuid: "d133e303-9dbb-47db-9531-008b20e5aae8"
})

export const testerDevAuth = new Auth({
	apiKey: "MhKSDyedSw8WXfLk2hkXzmElsiVStD7C8JU3KNGp",
	secretKey: "5nyf0tRr0GNmP3eB83pobm8hifALZsUq3NpW5En9nFRpssXxlZv-JA",
	uuid: "71a5d4f8-083e-413e-a8ff-66847a5f3a97"
})

export const tester = {
	id: 2,
	email: "test@example.com",
	password: "loremipsum",
	firstName: "Tester",
	confirmed: true,
	totalStorage: 2000000000,
	usedStorage: 0,
	plan: Plan.Free,
	dev: true,
	provider: true
}

export const firstPropertyName = "page1"
export const secondPropertyName = "page2"
export const firstNotificationPropertyName = "title"
export const secondNotificationPropertyName = "message"

export var firstTestDataTableObject = new TableObject({
	Uuid: "642e6407-f357-4e03-b9c2-82f754931161",
	Properties: {
		[firstPropertyName]: { value: "Hello World" },
		[secondPropertyName]: { value: "Hallo Welt" }
	}
})

export var secondTestDataTableObject = new TableObject({
	Uuid: "8d29f002-9511-407b-8289-5ebdcb5a5559",
	Properties: {
		[firstPropertyName]: { value: "Table" },
		[secondPropertyName]: { value: "Tabelle" }
	}
})
