import { assert } from 'chai'
import moxios from 'moxios'
import { Dav } from '../../lib/Dav.js'
import { ApiResponse, ApiErrorResponse, SubscriptionStatus } from '../../lib/types.js'
import { davDevAuth } from '../constants.js'
import * as ErrorCodes from '../../lib/errorCodes.js'
import { User } from '../../lib/models/User.js'
import { App } from '../../lib/models/App.js'
import {
	Signup,
	GetUser,
	GetUserById,
	UpdateUser,
	SetProfileImageOfUser,
	CreateStripeCustomerForUser,
	SendConfirmationEmail,
	SendPasswordResetEmail,
	ConfirmUser,
	SaveNewEmail,
	SaveNewPassword,
	ResetEmail,
	SetPassword,
	SignupResponseData,
	CreateStripeCustomerForUserResponseData
} from '../../lib/controllers/UsersController.js'

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
		let deviceOs = "Windows 10"

		let id = 2
		let email = "test@example.com"
		let firstName = "TestUser"
		let password = "123456"
		let confirmed = false
		let totalStorage = 100000000
		let usedStorage = 2080234
		let stripeCustomerId = null
		let plan = 0
		let subscriptionStatus = SubscriptionStatus.Active
		let periodEnd = null
		let dev = false
		let provider = false
		let profileImage = `http://localhost:3111/v1/user/${id}/profile_image`
		let profileImageEtag = null
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
					stripeCustomerId,
					plan,
					subscriptionStatus,
					periodEnd,
					dev,
					provider,
					profileImage,
					profileImageEtag,
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
						stripe_customer_id: stripeCustomerId,
						plan,
						subscription_status: subscriptionStatus,
						period_end: periodEnd,
						dev,
						provider,
						profile_image: profileImage,
						profile_image_etag: profileImageEtag,
						apps: []
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
		assert.equal(result.data.user.StripeCustomerId, expectedResult.data.user.StripeCustomerId)
		assert.equal(result.data.user.Plan, expectedResult.data.user.Plan)
		assert.equal(result.data.user.SubscriptionStatus, expectedResult.data.user.SubscriptionStatus)
		assert.equal(result.data.user.PeriodEnd, expectedResult.data.user.PeriodEnd)
		assert.equal(result.data.user.Dev, expectedResult.data.user.Dev)
		assert.equal(result.data.user.Provider, expectedResult.data.user.Provider)
		assert.equal(result.data.user.ProfileImage, expectedResult.data.user.ProfileImage)
		assert.equal(result.data.user.ProfileImageEtag, expectedResult.data.user.ProfileImageEtag)
		assert.equal(result.data.user.Apps.length, expectedResult.data.user.Apps.length)
		assert.equal(result.data.accessToken, expectedResult.data.accessToken)
		assert.equal(result.data.websiteAccessToken, expectedResult.data.websiteAccessToken)
	})

	it("should call signup endpoint with error", async () => {
		// Arrange
		let appId = 23
		let apiKey = "0fefhiow4t09w"
		let deviceName = "TestDevice"
		let deviceOs = "Windows 10"

		let email = "test@example.com"
		let firstName = "TestUser"
		let password = "123456"

		let url = `${Dav.apiBaseUrl}/signup`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: ErrorCodes.ActionNotAllowed,
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
			deviceOs
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
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
		let profileImage = `http://localhost:3111/v1/user/${id}/profile_image`
		let profileImageEtag = "shodfhosidf"
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
				profileImage,
				profileImageEtag,
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
					profile_image: profileImage,
					profile_image_etag: profileImageEtag,
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
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(result.data.ProfileImageEtag, expectedResult.data.ProfileImageEtag)

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
				code: ErrorCodes.ActionNotAllowed,
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
		let profileImage = `http://localhost:3111/v1/user/${id}/profile_image`
		let profileImageEtag = "sfgosodgsfiod"
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
				profileImage,
				profileImageEtag,
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
						code: ErrorCodes.AccessTokenMustBeRenewed,
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
					profile_image: profileImage,
					profile_image_etag: profileImageEtag,
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
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(result.data.ProfileImageEtag, expectedResult.data.ProfileImageEtag)

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
		let profileImage = `http://localhost:3111/v1/user/${id}/profile_image`
		let profileImageEtag = "sghiodsiodg"
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
				profileImage,
				profileImageEtag,
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
					profile_image: profileImage,
					profile_image_etag: profileImageEtag,
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
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(result.data.ProfileImageEtag, expectedResult.data.ProfileImageEtag)

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
				code: ErrorCodes.ActionNotAllowed,
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
		let profileImage = `http://localhost:3111/v1/user/${id}/profile_image`
		let profileImageEtag = "sghiodsgdsgiod"

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
				provider,
				profileImage,
				profileImageEtag
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
					provider,
					profile_image: profileImage,
					profile_image_etag: profileImageEtag
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
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(result.data.ProfileImageEtag, expectedResult.data.ProfileImageEtag)
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
				code: ErrorCodes.ActionNotAllowed,
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
		let profileImage = `http://localhost:3111/v1/user/${id}/profile_image`
		let profileImageEtag = "ioshdhiosgd"

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
				provider,
				profileImage,
				profileImageEtag
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
						code: ErrorCodes.AccessTokenMustBeRenewed,
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
					provider,
					profile_image: profileImage,
					profile_image_etag: profileImageEtag
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
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(result.data.ProfileImageEtag, expectedResult.data.ProfileImageEtag)
	})
})

describe("SetProfileImageOfUser function", () => {
	it("should call setProfileImageOfUser endpoint", async () => {
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
		let profileImage = `http://localhost:3111/v1/user/${id}/profile_image`
		let profileImageEtag = "sghiodsiodg"

		let data = "asdohdafhisahdasd"
		let type = "image/png"

		let accessToken = "sfjodsfjiodsfjkod"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/profile_image`

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
				profileImage,
				profileImageEtag
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], type)

			assert.equal(data, request.config.data)

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
					profile_image: profileImage,
					profile_image_etag: profileImageEtag
				}
			})
		})

		// Act
		let result = await SetProfileImageOfUser({
			data,
			type
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
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(result.data.ProfileImageEtag, expectedResult.data.ProfileImageEtag)
	})

	it("should call setProfileImageOfUser endpoint with error", async () => {
		// Arrange
		let data = "asdohdafhisahdasd"
		let type = "image/png"

		let accessToken = "sfjodsfjiodsfjkod"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/profile_image`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: ErrorCodes.ActionNotAllowed,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], type)

			assert.equal(data, request.config.data)

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
		let result = await SetProfileImageOfUser({
			data,
			type
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call setProfileImageOfUser endpoint and renew the session", async () => {
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
		let profileImage = `http://localhost:3111/v1/user/${id}/profile_image`
		let profileImageEtag = "sghiodsiodg"

		let data = "asdohdafhisahdasd"
		let type = "image/png"

		let accessToken = "sfjodsfjiodsfjkod"
		let newAccessToken = "siodhghosdfsiofhd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/profile_image`

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
				profileImage,
				profileImageEtag
			)
		}

		// First setProfileImageOfUser request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], type)

			assert.equal(data, request.config.data)

			request.respondWith({
				status: 403,
				response: {
					errors: [{
						code: ErrorCodes.AccessTokenMustBeRenewed,
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

		// Second setProfileImageOfUser request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'put')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], type)

			assert.equal(data, request.config.data)

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
					profile_image: profileImage,
					profile_image_etag: profileImageEtag
				}
			})
		})

		// Act
		let result = await SetProfileImageOfUser({
			data,
			type
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
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(result.data.ProfileImageEtag, expectedResult.data.ProfileImageEtag)
	})
})

describe("CreateStripeCustomerForUser function", () => {
	it("should call createStripeCustomerForUser endpoint", async () => {
		// Arrange
		let stripeCustomerId = "sogdosdfiodsfd"

		let accessToken = "shiodfhosdghiosdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiResponse<CreateStripeCustomerForUserResponseData> = {
			status: 201,
			data: {
				stripeCustomerId
			}
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
					stripe_customer_id: stripeCustomerId
				}
			})
		})

		// Act
		let result = await CreateStripeCustomerForUser() as ApiResponse<CreateStripeCustomerForUserResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.stripeCustomerId, expectedResult.data.stripeCustomerId)
	})

	it("should call createStripeCustomerForUser endpoint with error", async () => {
		// Arrange
		let accessToken = "shiodfhosdghiosdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: ErrorCodes.ActionNotAllowed,
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
		let stripeCustomerId = "sogdosdfiodsfd"

		let accessToken = "shiodfhosdghiosdg"
		let newAccessToken = "iohfgosdfiohsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiResponse<CreateStripeCustomerForUserResponseData> = {
			status: 201,
			data: {
				stripeCustomerId
			}
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
						code: ErrorCodes.AccessTokenMustBeRenewed,
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
				response: {
					stripe_customer_id: stripeCustomerId
				}
			})
		})

		// Act
		let result = await CreateStripeCustomerForUser() as ApiResponse<CreateStripeCustomerForUserResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.stripeCustomerId, expectedResult.data.stripeCustomerId)
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
				code: ErrorCodes.ActionNotAllowed,
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
		let email = "test@example.com"

		let url = `${Dav.apiBaseUrl}/user/send_password_reset_email`

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

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, email)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await SendPasswordResetEmail({
			auth: davDevAuth,
			email
		}) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call sendPasswordResetEmail endpoint with error", async () => {
		// Arrange
		let email = "test@example.com"

		let url = `${Dav.apiBaseUrl}/user/send_password_reset_email`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: ErrorCodes.ActionNotAllowed,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			let data = JSON.parse(request.config.data)
			assert.equal(data.email, email)

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
			email
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
				code: ErrorCodes.ActionNotAllowed,
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
				code: ErrorCodes.ActionNotAllowed,
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
				code: ErrorCodes.ActionNotAllowed,
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
				code: ErrorCodes.ActionNotAllowed,
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
				code: ErrorCodes.ActionNotAllowed,
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