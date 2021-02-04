import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse, SubscriptionStatus } from '../../lib/types'
import { davDevAuth } from '../constants'
import { User } from '../../lib/models/User'
import { App } from '../../lib/models/App'
import {
	Signup,
	GetUsers,
	GetUser,
	GetUserById,
	UpdateUser,
	CreateStripeCustomerForUser,
	SendConfirmationEmail,
	SendPasswordResetEmail,
	ConfirmUser,
	SaveNewEmail,
	SaveNewPassword,
	ResetEmail,
	SetPassword,
	SignupResponseData,
	GetUsersResponseData
} from '../../lib/controllers/UsersController'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("Signup function", () => {
	it("should call signup endpoint", async () => {
		// Arrange
		let appId = 23
		let apiKey = "0fefhiow4t09w"
		let deviceName = "TestDevice"
		let deviceType = "Laptop"
		let deviceOs = "Windows 10"

		let id = 2
		let email = "test@example.com"
		let firstName = "TestUser"
		let password = "123456"
		let confirmed = false
		let totalStorage = 100000000
		let usedStorage = 2080234
		let plan = 0
		let accessToken = "iasdho9h393iuasbad"
		let websiteAccessToken = "0hef9oh8risohfwg8r39rzq3"

		let url = `${Dav.apiBaseUrl}/signup`

		let expectedResult: ApiResponse<SignupResponseData> = {
			status: 201,
			data: {
				user: new User(
					id,
					email,
					firstName,
					confirmed,
					totalStorage,
					usedStorage,
					null,
					plan,
					SubscriptionStatus.Active,
					null,
					false,
					false,
					[]
				),
				accessToken,
				websiteAccessToken
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, email)
			assert.equal(data.first_name, firstName)
			assert.equal(data.password, password)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_type, deviceType)
			assert.equal(data.device_os, deviceOs)

			request.respondWith({
				status: expectedResult.status,
				response: {
					user: {
						id,
						email,
						first_name: firstName,
						confirmed,
						total_storage: totalStorage,
						used_storage: usedStorage,
						plan
					},
					access_token: accessToken,
					website_access_token: websiteAccessToken
				}
			})
		})

		// Act
		let result = await Signup({
			auth: davDevAuth,
			email,
			firstName,
			password,
			appId,
			apiKey,
			deviceName,
			deviceType,
			deviceOs
		}) as ApiResponse<SignupResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.user.Id, expectedResult.data.user.Id)
		assert.equal(result.data.user.Email, expectedResult.data.user.Email)
		assert.equal(result.data.user.FirstName, expectedResult.data.user.FirstName)
		assert.equal(result.data.user.Confirmed, expectedResult.data.user.Confirmed)
		assert.equal(result.data.user.TotalStorage, expectedResult.data.user.TotalStorage)
		assert.equal(result.data.user.UsedStorage, expectedResult.data.user.UsedStorage)
		assert.equal(result.data.user.Plan, expectedResult.data.user.Plan)
		assert.equal(result.data.accessToken, expectedResult.data.accessToken)
		assert.equal(result.data.websiteAccessToken, expectedResult.data.websiteAccessToken)
	})

	it("should call signup endpoint with error", async () => {
		// Arrange
		let appId = 23
		let apiKey = "0fefhiow4t09w"
		let deviceName = "TestDevice"
		let deviceType = "Laptop"
		let deviceOs = "Windows 10"

		let email = "test@example.com"
		let firstName = "TestUser"
		let password = "123456"

		let url = `${Dav.apiBaseUrl}/signup`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, email)
			assert.equal(data.first_name, firstName)
			assert.equal(data.password, password)
			assert.equal(data.app_id, appId)
			assert.equal(data.api_key, apiKey)
			assert.equal(data.device_name, deviceName)
			assert.equal(data.device_type, deviceType)
			assert.equal(data.device_os, deviceOs)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await Signup({
			auth: davDevAuth,
			email,
			firstName,
			password,
			appId,
			apiKey,
			deviceName,
			deviceType,
			deviceOs
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("GetUsers function", () => {
	it("should call getUsers endpoint", async () => {
		// Arrange
		let firstUserId = 1
		let firstUserConfirmed = true
		let firstUserLastActive = new Date("2020-12-10T00:00:00.000Z")
		let firstUserPlan = 1
		let firstUserCreatedAt = new Date("2018-08-12T00:00:00.000Z")
		let secondUserId = 2
		let secondUserConfirmed = false
		let secondUserLastActive = null
		let secondUserPlan = 0
		let secondUserCreatedAt = new Date("2019-10-29T00:00:00.000Z")

		let accessToken = "jjzmjkimzjh8ef9guwegwerg73"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/users`

		let expectedResult: ApiResponse<GetUsersResponseData> = {
			status: 200,
			data: {
				users: [
					{
						id: firstUserId,
						confirmed: firstUserConfirmed,
						lastActive: firstUserLastActive,
						plan: firstUserPlan,
						createdAt: firstUserCreatedAt
					},
					{
						id: secondUserId,
						confirmed: secondUserConfirmed,
						lastActive: secondUserLastActive,
						plan: secondUserPlan,
						createdAt: secondUserCreatedAt
					}
				]
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					users: [
						{
							id: firstUserId,
							confirmed: firstUserConfirmed,
							last_active: firstUserLastActive,
							plan: firstUserPlan,
							created_at: firstUserCreatedAt
						},
						{
							id: secondUserId,
							confirmed: secondUserConfirmed,
							last_active: secondUserLastActive,
							plan: secondUserPlan,
							created_at: secondUserCreatedAt
						}
					]
				}
			})
		})

		// Act
		let result = await GetUsers() as ApiResponse<GetUsersResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.users.length, expectedResult.data.users.length)

		assert.equal(result.data.users[0].id, expectedResult.data.users[0].id)
		assert.equal(result.data.users[0].confirmed, expectedResult.data.users[0].confirmed)
		assert.equal(result.data.users[0].lastActive?.toString(), expectedResult.data.users[0].lastActive?.toString())
		assert.equal(result.data.users[0].plan, expectedResult.data.users[0].plan)
		assert.equal(result.data.users[0].createdAt.toString(), expectedResult.data.users[0].createdAt.toString())

		assert.equal(result.data.users[1].id, expectedResult.data.users[1].id)
		assert.equal(result.data.users[1].confirmed, expectedResult.data.users[1].confirmed)
		assert.equal(result.data.users[1].lastActive?.toString(), expectedResult.data.users[1].lastActive?.toString())
		assert.equal(result.data.users[1].plan, expectedResult.data.users[1].plan)
		assert.equal(result.data.users[1].createdAt.toString(), expectedResult.data.users[1].createdAt.toString())
	})

	it("should call getUsers endpoint with error", async () => {
		// Arrange
		let accessToken = "jjzmjkimzjh8ef9guwegwerg73"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/users`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await GetUsers() as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getUsers endpoint and renew the session", async () => {
		// Arrange
		let firstUserId = 1
		let firstUserConfirmed = true
		let firstUserLastActive = new Date("2020-12-10T00:00:00.000Z")
		let firstUserPlan = 1
		let firstUserCreatedAt = new Date("2018-08-12T00:00:00.000Z")
		let secondUserId = 2
		let secondUserConfirmed = false
		let secondUserLastActive = null
		let secondUserPlan = 0
		let secondUserCreatedAt = new Date("2019-10-29T00:00:00.000Z")

		let accessToken = "jjzmjkimzjh8ef9guwegwerg73"
		let newAccessToken = "hiosgdhiosdhiosdfasd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/users`

		let expectedResult: ApiResponse<GetUsersResponseData> = {
			status: 200,
			data: {
				users: [
					{
						id: firstUserId,
						confirmed: firstUserConfirmed,
						lastActive: firstUserLastActive,
						plan: firstUserPlan,
						createdAt: firstUserCreatedAt
					},
					{
						id: secondUserId,
						confirmed: secondUserConfirmed,
						lastActive: secondUserLastActive,
						plan: secondUserPlan,
						createdAt: secondUserCreatedAt
					}
				]
			}
		}

		// First getUsers request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: 1602,
						message: "Access token must be renewed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second getUsers request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					users: [
						{
							id: firstUserId,
							confirmed: firstUserConfirmed,
							last_active: firstUserLastActive,
							plan: firstUserPlan,
							created_at: firstUserCreatedAt
						},
						{
							id: secondUserId,
							confirmed: secondUserConfirmed,
							last_active: secondUserLastActive,
							plan: secondUserPlan,
							created_at: secondUserCreatedAt
						}
					]
				}
			})
		})

		// Act
		let result = await GetUsers() as ApiResponse<GetUsersResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.users.length, expectedResult.data.users.length)

		assert.equal(result.data.users[0].id, expectedResult.data.users[0].id)
		assert.equal(result.data.users[0].confirmed, expectedResult.data.users[0].confirmed)
		assert.equal(result.data.users[0].lastActive?.toString(), expectedResult.data.users[0].lastActive?.toString())
		assert.equal(result.data.users[0].plan, expectedResult.data.users[0].plan)
		assert.equal(result.data.users[0].createdAt.toString(), expectedResult.data.users[0].createdAt.toString())

		assert.equal(result.data.users[1].id, expectedResult.data.users[1].id)
		assert.equal(result.data.users[1].confirmed, expectedResult.data.users[1].confirmed)
		assert.equal(result.data.users[1].lastActive?.toString(), expectedResult.data.users[1].lastActive?.toString())
		assert.equal(result.data.users[1].plan, expectedResult.data.users[1].plan)
		assert.equal(result.data.users[1].createdAt.toString(), expectedResult.data.users[1].createdAt.toString())
	})
})

describe("GetUser function", () => {
	it("should call getUser endpoint", async () => {
		// Arrange
		let id = 34
		let email = "test@example.com"
		let firstName = "TestUser"
		let confirmed = true
		let totalStorage = 100000000000
		let usedStorage = 2073424982
		let stripeCustomerId = "09u243ioasdasd"
		let plan = 1
		let subscriptionStatus = SubscriptionStatus.Active
		let periodEnd = new Date("2021-01-13 21:21:24 +0100")
		let dev = false
		let provider = false
		let appId = 23
		let appName = "TestApp"
		let appDescription = "Test app description"
		let appPublished = true
		let appWebLink = "https://testapp.dav-apps.tech"
		let appGooglePlayLink = null
		let appMicrosoftStoreLink = null

		let accessToken = "hdsfigtw9gueiwefhued"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user`

		let expectedResult: ApiResponse<User> = {
			status: 200,
			data: new User(
				id,
				email,
				firstName,
				confirmed,
				totalStorage,
				usedStorage,
				stripeCustomerId,
				plan,
				subscriptionStatus,
				periodEnd,
				dev,
				provider,
				[
					new App(
						appId,
						appName,
						appDescription,
						appPublished,
						appWebLink,
						appGooglePlayLink,
						appMicrosoftStoreLink
					)
				]
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					email,
					first_name: firstName,
					confirmed,
					total_storage: totalStorage,
					used_storage: usedStorage,
					stripe_customer_id: stripeCustomerId,
					plan,
					subscription_status: subscriptionStatus,
					period_end: periodEnd,
					dev,
					provider,
					apps: [{
						id: appId,
						name: appName,
						description: appDescription,
						published: appPublished,
						web_link: appWebLink,
						google_play_link: appGooglePlayLink,
						microsoft_store_link: appMicrosoftStoreLink
					}]
				}
			})
		})

		// Act
		let result = await GetUser() as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(result.data.StripeCustomerId, expectedResult.data.StripeCustomerId)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(result.data.SubscriptionStatus, expectedResult.data.SubscriptionStatus)
		assert.equal(result.data.PeriodEnd.toString(), expectedResult.data.PeriodEnd.toString())
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)

		assert.equal(result.data.Apps.length, 1)
		assert.equal(result.data.Apps[0].Id, expectedResult.data.Apps[0].Id)
		assert.equal(result.data.Apps[0].Name, expectedResult.data.Apps[0].Name)
		assert.equal(result.data.Apps[0].Description, expectedResult.data.Apps[0].Description)
		assert.equal(result.data.Apps[0].Published, expectedResult.data.Apps[0].Published)
		assert.equal(result.data.Apps[0].WebLink, expectedResult.data.Apps[0].WebLink)
		assert.equal(result.data.Apps[0].GooglePlayLink, expectedResult.data.Apps[0].GooglePlayLink)
		assert.equal(result.data.Apps[0].MicrosoftStoreLink, expectedResult.data.Apps[0].MicrosoftStoreLink)
	})

	it("should call getUser endpoint with error", async () => {
		// Arrange
		let accessToken = "hdsfigtw9gueiwefhued"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await GetUser() as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getUser endpoint and renew session", async () => {
		// Arrange
		let id = 34
		let email = "test@example.com"
		let firstName = "TestUser"
		let confirmed = true
		let totalStorage = 100000000000
		let usedStorage = 2073424982
		let stripeCustomerId = "09u243ioasdasd"
		let plan = 1
		let subscriptionStatus = SubscriptionStatus.Active
		let periodEnd = new Date("2021-01-13 21:21:24 +0100")
		let dev = false
		let provider = false
		let appId = 23
		let appName = "TestApp"
		let appDescription = "Test app description"
		let appPublished = true
		let appWebLink = "https://testapp.dav-apps.tech"
		let appGooglePlayLink = null
		let appMicrosoftStoreLink = null

		let accessToken = "hdsfigtw9gueiwefhued"
		let newAccessToken = "sfioasghiodshiogsghio"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user`

		let expectedResult: ApiResponse<User> = {
			status: 200,
			data: new User(
				id,
				email,
				firstName,
				confirmed,
				totalStorage,
				usedStorage,
				stripeCustomerId,
				plan,
				subscriptionStatus,
				periodEnd,
				dev,
				provider,
				[
					new App(
						appId,
						appName,
						appDescription,
						appPublished,
						appWebLink,
						appGooglePlayLink,
						appMicrosoftStoreLink
					)
				]
			)
		}

		// First getUser request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: 1602,
						message: "Access token must be renewed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second getUser request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					email,
					first_name: firstName,
					confirmed,
					total_storage: totalStorage,
					used_storage: usedStorage,
					stripe_customer_id: stripeCustomerId,
					plan,
					subscription_status: subscriptionStatus,
					period_end: periodEnd,
					dev,
					provider,
					apps: [{
						id: appId,
						name: appName,
						description: appDescription,
						published: appPublished,
						web_link: appWebLink,
						google_play_link: appGooglePlayLink,
						microsoft_store_link: appMicrosoftStoreLink
					}]
				}
			})
		})

		// Act
		let result = await GetUser() as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(result.data.StripeCustomerId, expectedResult.data.StripeCustomerId)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(result.data.SubscriptionStatus, expectedResult.data.SubscriptionStatus)
		assert.equal(result.data.PeriodEnd.toString(), expectedResult.data.PeriodEnd.toString())
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)

		assert.equal(result.data.Apps.length, 1)
		assert.equal(result.data.Apps[0].Id, expectedResult.data.Apps[0].Id)
		assert.equal(result.data.Apps[0].Name, expectedResult.data.Apps[0].Name)
		assert.equal(result.data.Apps[0].Description, expectedResult.data.Apps[0].Description)
		assert.equal(result.data.Apps[0].Published, expectedResult.data.Apps[0].Published)
		assert.equal(result.data.Apps[0].WebLink, expectedResult.data.Apps[0].WebLink)
		assert.equal(result.data.Apps[0].GooglePlayLink, expectedResult.data.Apps[0].GooglePlayLink)
		assert.equal(result.data.Apps[0].MicrosoftStoreLink, expectedResult.data.Apps[0].MicrosoftStoreLink)
	})
})

describe("GetUserById function", () => {
	it("should call getUserById endpoint", async () => {
		// Arrange
		let id = 34
		let email = "test@example.com"
		let firstName = "TestUser"
		let confirmed = true
		let totalStorage = 100000000000
		let usedStorage = 2073424982
		let stripeCustomerId = "09u243ioasdasd"
		let plan = 1
		let subscriptionStatus = SubscriptionStatus.Active
		let periodEnd = new Date("2021-01-13 21:21:24 +0100")
		let dev = false
		let provider = false
		let appId = 23
		let appName = "TestApp"
		let appDescription = "Test app description"
		let appPublished = true
		let appWebLink = "https://testapp.dav-apps.tech"
		let appGooglePlayLink = null
		let appMicrosoftStoreLink = null

		let url = `${Dav.apiBaseUrl}/user/${id}`

		let expectedResult: ApiResponse<User> = {
			status: 200,
			data: new User(
				id,
				email,
				firstName,
				confirmed,
				totalStorage,
				usedStorage,
				stripeCustomerId,
				plan,
				subscriptionStatus,
				periodEnd,
				dev,
				provider,
				[
					new App(
						appId,
						appName,
						appDescription,
						appPublished,
						appWebLink,
						appGooglePlayLink,
						appMicrosoftStoreLink
					)
				]
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					email,
					first_name: firstName,
					confirmed,
					total_storage: totalStorage,
					used_storage: usedStorage,
					stripe_customer_id: stripeCustomerId,
					plan,
					subscription_status: subscriptionStatus,
					period_end: periodEnd,
					dev,
					provider,
					apps: [{
						id: appId,
						name: appName,
						description: appDescription,
						published: appPublished,
						web_link: appWebLink,
						google_play_link: appGooglePlayLink,
						microsoft_store_link: appMicrosoftStoreLink
					}]
				}
			})
		})

		// Act
		let result = await GetUserById({ auth: davDevAuth, id }) as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(result.data.StripeCustomerId, expectedResult.data.StripeCustomerId)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(result.data.SubscriptionStatus, expectedResult.data.SubscriptionStatus)
		assert.equal(result.data.PeriodEnd.toString(), expectedResult.data.PeriodEnd.toString())
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)

		assert.equal(result.data.Apps.length, 1)
		assert.equal(result.data.Apps[0].Id, expectedResult.data.Apps[0].Id)
		assert.equal(result.data.Apps[0].Name, expectedResult.data.Apps[0].Name)
		assert.equal(result.data.Apps[0].Description, expectedResult.data.Apps[0].Description)
		assert.equal(result.data.Apps[0].Published, expectedResult.data.Apps[0].Published)
		assert.equal(result.data.Apps[0].WebLink, expectedResult.data.Apps[0].WebLink)
		assert.equal(result.data.Apps[0].GooglePlayLink, expectedResult.data.Apps[0].GooglePlayLink)
		assert.equal(result.data.Apps[0].MicrosoftStoreLink, expectedResult.data.Apps[0].MicrosoftStoreLink)
	})

	it("should call getUserById endpoint with error", async () => {
		// Arrange
		let id = 34

		let url = `${Dav.apiBaseUrl}/user/${id}`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await GetUserById({ auth: davDevAuth, id }) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("UpdateUser function", () => {
	it("should call updateUser endpoint", async () => {
		// Arrange
		let id = 23
		let email = "test@example.com"
		let confirmed = true
		let totalStorage = 100000000000
		let usedStorage = 2073424982
		let stripeCustomerId = "09u243ioasdasd"
		let plan = 1
		let subscriptionStatus = SubscriptionStatus.Active
		let periodEnd = new Date("2021-01-13 21:21:24 +0100")
		let dev = false
		let provider = false

		let newFirstName = "UpdatedTestUser"
		let newEmail = "updatedemail@example.com"
		let password = "64534231"

		let accessToken = "hdsfigtw9gueiwefhued"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user`

		let expectedResult: ApiResponse<User> = {
			status: 200,
			data: new User(
				id,
				email,
				newFirstName,
				confirmed,
				totalStorage,
				usedStorage,
				stripeCustomerId,
				plan,
				subscriptionStatus,
				periodEnd,
				dev,
				provider
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, newEmail)
			assert.equal(data.first_name, newFirstName)
			assert.equal(data.password, password)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					email,
					first_name: newFirstName,
					confirmed,
					total_storage: totalStorage,
					used_storage: usedStorage,
					stripe_customer_id: stripeCustomerId,
					plan,
					subscription_status: subscriptionStatus,
					period_end: periodEnd,
					dev,
					provider
				}
			})
		})

		// Act
		let result = await UpdateUser({
			email: newEmail,
			firstName: newFirstName,
			password
		}) as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(result.data.StripeCustomerId, expectedResult.data.StripeCustomerId)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(result.data.SubscriptionStatus, expectedResult.data.SubscriptionStatus)
		assert.equal(result.data.PeriodEnd.toString(), expectedResult.data.PeriodEnd.toString())
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)
	})

	it("should call updateUser endpoint with error", async () => {
		// Arrange
		let newFirstName = "UpdatedTestUser"
		let newEmail = "updatedemail@example.com"
		let password = "64534231"

		let accessToken = "hdsfigtw9gueiwefhued"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, newEmail)
			assert.equal(data.first_name, newFirstName)
			assert.equal(data.password, password)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await UpdateUser({
			email: newEmail,
			firstName: newFirstName,
			password
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call updateUser endpoint and renew the session", async () => {
		// Arrange
		let id = 23
		let email = "test@example.com"
		let confirmed = true
		let totalStorage = 100000000000
		let usedStorage = 2073424982
		let stripeCustomerId = "09u243ioasdasd"
		let plan = 1
		let subscriptionStatus = SubscriptionStatus.Active
		let periodEnd = new Date("2021-01-13 21:21:24 +0100")
		let dev = false
		let provider = false

		let newFirstName = "UpdatedTestUser"
		let newEmail = "updatedemail@example.com"
		let password = "64534231"

		let accessToken = "hdsfigtw9gueiwefhued"
		let newAccessToken = "sodshiodgsghiodsghiod"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user`

		let expectedResult: ApiResponse<User> = {
			status: 200,
			data: new User(
				id,
				email,
				newFirstName,
				confirmed,
				totalStorage,
				usedStorage,
				stripeCustomerId,
				plan,
				subscriptionStatus,
				periodEnd,
				dev,
				provider
			)
		}

		// First updateUser request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, newEmail)
			assert.equal(data.first_name, newFirstName)
			assert.equal(data.password, password)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: 1602,
						message: "Access token must be renewed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second updateUser request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, newEmail)
			assert.equal(data.first_name, newFirstName)
			assert.equal(data.password, password)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					email,
					first_name: newFirstName,
					confirmed,
					total_storage: totalStorage,
					used_storage: usedStorage,
					stripe_customer_id: stripeCustomerId,
					plan,
					subscription_status: subscriptionStatus,
					period_end: periodEnd,
					dev,
					provider
				}
			})
		})

		// Act
		let result = await UpdateUser({
			email: newEmail,
			firstName: newFirstName,
			password
		}) as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(result.data.StripeCustomerId, expectedResult.data.StripeCustomerId)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(result.data.SubscriptionStatus, expectedResult.data.SubscriptionStatus)
		assert.equal(result.data.PeriodEnd.toString(), expectedResult.data.PeriodEnd.toString())
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)
	})
})

describe("CreateStripeCustomerForUser function", () => {
	it("should call createStripeCustomerForUser endpoint", async () => {
		// Arrange
		let accessToken = "shiodfhosdghiosdg"
		Dav.accessToken = accessToken

		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await CreateStripeCustomerForUser() as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call createStripeCustomerForUser endpoint with error", async () => {
		// Arrange
		let accessToken = "shiodfhosdghiosdg"
		Dav.accessToken = accessToken

		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await CreateStripeCustomerForUser() as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createStripeCustomerForUser endpoint and renew the session", async () => {
		// Arrange
		let accessToken = "shiodfhosdghiosdg"
		let newAccessToken = "iohfgosdfiohsdf"
		Dav.accessToken = accessToken

		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		// First createStripeCustomerForUser request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: 1602,
						message: "Access token must be renewed"
					}]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second createStripeCustomerForUser request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await CreateStripeCustomerForUser() as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})
})

describe("SendConfirmationEmail function", () => {
	it("should call sendConfirmationEmail endpoint", async () => {
		// Arrange
		let id = 123

		let url = `${Dav.apiBaseUrl}/user/${id}/send_confirmation_email`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await SendConfirmationEmail({
			auth: davDevAuth,
			id
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call sendConfirmationEmail endpoint with error", async () => {
		// Arrange
		let id = 123

		let url = `${Dav.apiBaseUrl}/user/${id}/send_confirmation_email`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await SendConfirmationEmail({
			auth: davDevAuth,
			id
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("SendPasswordResetEmail function", () => {
	it("should call sendPasswordResetEmail endpoint", async () => {
		// Arrange
		let id = 123

		let url = `${Dav.apiBaseUrl}/user/${id}/send_password_reset_email`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await SendPasswordResetEmail({
			auth: davDevAuth,
			id
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call sendPasswordResetEmail endpoint with error", async () => {
		// Arrange
		let id = 123

		let url = `${Dav.apiBaseUrl}/user/${id}/send_password_reset_email`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await SendPasswordResetEmail({
			auth: davDevAuth,
			id
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("ConfirmUser function", () => {
	it("should call confirmUser endpoint", async () => {
		// Arrange
		let id = 12
		let emailConfirmationToken = "skodahiosfahiofahiosfahiofas"
		
		let url = `${Dav.apiBaseUrl}/user/${id}/confirm`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email_confirmation_token, emailConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await ConfirmUser({
			auth: davDevAuth,
			id,
			emailConfirmationToken
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call confirmUser endpoint with error", async () => {
		// Arrange
		let id = 12
		let emailConfirmationToken = "skodahiosfahiofahiosfahiofas"

		let url = `${Dav.apiBaseUrl}/user/${id}/confirm`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email_confirmation_token, emailConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await ConfirmUser({
			auth: davDevAuth,
			id,
			emailConfirmationToken
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("SaveNewEmail function", () => {
	it("should call saveNewEmail endpoint", async () => {
		// Arrange
		let id = 234
		let emailConfirmationToken = "asdasdasdasdasdasd"

		let url = `${Dav.apiBaseUrl}/user/${id}/save_new_email`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email_confirmation_token, emailConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await SaveNewEmail({
			auth: davDevAuth,
			id,
			emailConfirmationToken
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call saveNewEmail endpoint with error", async () => {
		// Arrange
		let id = 234
		let emailConfirmationToken = "asdasdasdasdasdasd"

		let url = `${Dav.apiBaseUrl}/user/${id}/save_new_email`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email_confirmation_token, emailConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await SaveNewEmail({
			auth: davDevAuth,
			id,
			emailConfirmationToken
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("SaveNewPassword function", () => {
	it("should call saveNewPassword endpoint", async () => {
		// Arrange
		let id = 41
		let passwordConfirmationToken = "hf0hq20üqfü9agw8308wg7ar"

		let url = `${Dav.apiBaseUrl}/user/${id}/save_new_password`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.password_confirmation_token, passwordConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await SaveNewPassword({
			auth: davDevAuth,
			id,
			passwordConfirmationToken
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call saveNewPassword endpoint with error", async () => {
		// Arrange
		let id = 41
		let passwordConfirmationToken = "hf0hq20üqfü9agw8308wg7ar"

		let url = `${Dav.apiBaseUrl}/user/${id}/save_new_password`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.password_confirmation_token, passwordConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await SaveNewPassword({
			auth: davDevAuth,
			id,
			passwordConfirmationToken
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("ResetEmail function", () => {
	it("should call resetEmail endpoint", async () => {
		// Arrange
		let id = 234
		let emailConfirmationToken = "asdasdasdasdasdasd"

		let url = `${Dav.apiBaseUrl}/user/${id}/reset_email`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email_confirmation_token, emailConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await ResetEmail({
			auth: davDevAuth,
			id,
			emailConfirmationToken
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call resetEmail endpoint with error", async () => {
		// Arrange
		let id = 234
		let emailConfirmationToken = "asdasdasdasdasdasd"

		let url = `${Dav.apiBaseUrl}/user/${id}/reset_email`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.email_confirmation_token, emailConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await ResetEmail({
			auth: davDevAuth,
			id,
			emailConfirmationToken
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("SetPassword function", () => {
	it("should call setPassword endpoint", async () => {
		// Arrange
		let id = 2
		let password = "123456"
		let passwordConfirmationToken = "asdasdasasdasdasd"

		let url = `${Dav.apiBaseUrl}/user/${id}/password`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.password, password)
			assert.equal(data.password_confirmation_token, passwordConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await SetPassword({
			auth: davDevAuth,
			id,
			password,
			passwordConfirmationToken
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call setPassword endpoint with error", async () => {
		// Arrange
		let id = 2
		let password = "123456"
		let passwordConfirmationToken = "asdasdasasdasdasd"

		let url = `${Dav.apiBaseUrl}/user/${id}/password`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1103,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.password, password)
			assert.equal(data.password_confirmation_token, passwordConfirmationToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [{
						code: expectedResult.errors[0].code,
						message: expectedResult.errors[0].message
					}]
				}
			})
		})

		// Act
		let result = await SetPassword({
			auth: davDevAuth,
			id,
			password,
			passwordConfirmationToken
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})