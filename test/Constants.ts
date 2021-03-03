import { TableObject } from '../lib/models/TableObject'
import { Auth } from '../lib/models/Auth'

export const testerXTestAppAccessToken = "ckktuu0gs00008iw3ctnrofzf"

export const testAppId = 1
export const testUserId = 2
export const testAppCardTableId = 1

export const davDevAuth = new Auth({
	apiKey: "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm",
	secretKey: "Stac8pRhqH0CSO5o9Rxqjhu7vyVp4PINEMJumqlpvRQai4hScADamQ",
	uuid: "d133e303-9dbb-47db-9531-008b20e5aae8"
})

export const firstPropertyName = "page1"
export const secondPropertyName = "page2"
export const firstNotificationPropertyName = "title"
export const secondNotificationPropertyName = "message"

export var firstTestDataTableObject = new TableObject({
	Uuid: "642e6407-f357-4e03-b9c2-82f754931161",
	Properties: {
		[firstPropertyName]: {value: "Hello World"},
		[secondPropertyName]: {value: "Hallo Welt"}
	}
})

export var secondTestDataTableObject = new TableObject({
	Uuid: "8d29f002-9511-407b-8289-5ebdcb5a5559",
	Properties: {
		[firstPropertyName]: {value: "Table"},
		[secondPropertyName]: {value: "Tabelle"}
	}
})