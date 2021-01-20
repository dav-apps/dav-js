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
	UpdateUser,
	SendConfirmationEmail,
	ConfirmUser,
	SaveNewEmail,
	SaveNewPassword,
	ResetEmail,
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
		let jwt = "iasdho9h393iuasbad"
		let websiteJwt = "0hef9oh8risohfwg8r39rzq3"

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
				jwt,
				websiteJwt
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
					jwt,
					website_jwt: websiteJwt
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
		assert.equal(result.data.jwt, expectedResult.data.jwt)
		assert.equal(result.data.websiteJwt, expectedResult.data.websiteJwt)
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

		let jwt = "jjzmjkimzjh8ef9guwegwerg73"
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
			assert.equal(request.config.headers.Authorization, jwt)

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
		let result = await GetUsers({
			jwt
		}) as ApiResponse<GetUsersResponseData>

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
		let jwt = "jjzmjkimzjh8ef9guwegwerg73"
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
			assert.equal(request.config.headers.Authorization, jwt)

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
		let result = await GetUsers({
			jwt
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
		let appId = 23
		let appName = "TestApp"
		let appDescription = "Test app description"
		let appPublished = true
		let appWebLink = "https://testapp.dav-apps.tech"
		let appGooglePlayLink = null
		let appMicrosoftStoreLink = null

		let jwt = "hdsfigtw9gueiwefhued"
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
			assert.equal(request.config.headers.Authorization, jwt)

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
		let result = await GetUser({
			jwt
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
		let jwt = "hdsfigtw9gueiwefhued"
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
			assert.equal(request.config.headers.Authorization, jwt)

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
		let result = await GetUser({
			jwt
		}) as ApiErrorResponse

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

		let jwt = "hdsfigtw9gueiwefhued"
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
			assert.equal(request.config.headers.Authorization, jwt)
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
			jwt,
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

		let jwt = "hdsfigtw9gueiwefhued"
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
			assert.equal(request.config.headers.Authorization, jwt)
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
			jwt,
			email: newEmail,
			firstName: newFirstName,
			password
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
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