import { GenericUploadStatus } from '../lib/types'
import { TableObject } from '../lib/models/TableObject'
import { Notification } from '../lib/models/Notification'
import { Auth } from '../lib/models/Auth'

export const davClassLibraryTestUserXTestUserJwt = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImRhdmNsYXNzbGlicmFyeXRlc3RAZGF2LWFwcHMudGVjaCIsInVzZXJfaWQiOjUsImRldl9pZCI6MiwiZXhwIjozNzU2MTA1MDAyMn0.jZpdLre_ZMWGN2VNbZOn2Xg51RLAT6ocGnyM38jljHI.1"
export const testUserXTestUserJwt = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwidXNlcl9pZCI6MiwiZGV2X2lkIjoyLCJleHAiOjM3NTk3MzI4Mjg2fQ.GZgXpshF77CEiYrsypCqAg8B4LXjbZzMSmaxvAssXA4"
export const testUserXdavJwt = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwidXNlcl9pZCI6MiwiZGV2X2lkIjoxLCJleHAiOjM3NTk3MzMxMTM2fQ.XaT3EL9cSrdNnRUri2yk2FJRipOsCq_l1KVHl8K83hs"
export const davXTestUserJwt = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImRhdkBkYXYtYXBwcy50ZWNoIiwidXNlcm5hbWUiOiJEYXYiLCJ1c2VyX2lkIjoxLCJkZXZfaWQiOjIsImV4cCI6Mzc1OTc2NjU3MjJ9.c-JWhngQZXg7Ya6Fo-zjNHROFZf6KCVcs5PxeeS54Ak"

export const davClassLibraryTestAppId = 3
export const davClassLibraryTestUserId = 5
export const testDataTableId = 3

export const davDevAuth = new Auth({
	apiKey: "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm",
	secretKey: "Stac8pRhqH0CSO5o9Rxqjhu7vyVp4PINEMJumqlpvRQai4hScADamQ",
	uuid: "d133e303-9dbb-47db-9531-008b20e5aae8"
})

export const firstPropertyName = "page1";
export const secondPropertyName = "page2";
export const firstNotificationPropertyName = "title";
export const secondNotificationPropertyName = "message";

export var firstTestDataTableObject = new TableObject();
firstTestDataTableObject.Uuid = "642e6407-f357-4e03-b9c2-82f754931161";
firstTestDataTableObject.Properties = {
	[firstPropertyName]: {value: "Hello World"},
	[secondPropertyName]: {value: "Hallo Welt"}
}

export var secondTestDataTableObject = new TableObject();
secondTestDataTableObject.Uuid = "8d29f002-9511-407b-8289-5ebdcb5a5559";
secondTestDataTableObject.Properties = {
	[firstPropertyName]: {value: "Table"},
	[secondPropertyName]: {value: "Tabelle"}
}

export var firstTestNotification = new Notification({
	Uuid: "0289e7ab-5497-45dc-a6ad-d5d49143b17b",
	Time: 1863541331,
	Interval: 3600,
	Title: "Hello World",
	Body: "You have an appointment",
	UploadStatus: GenericUploadStatus.UpToDate
})

export var secondTestNotification = new Notification({
	Uuid: "4590db9d-f154-42bc-aaa9-c222e3b82487",
	Time: 1806755643,
	Interval: 864000,
	Title: "Your daily summary",
	Body: "You have 2 appointments and one Todo for today",
	UploadStatus: GenericUploadStatus.UpToDate
})