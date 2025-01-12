import { assert } from "chai"
import { mock } from "../utils.js"
import { Dav } from "../../lib/Dav.js"
import {
	ApiResponse,
	ApiErrorResponse,
	SubscriptionStatus
} from "../../lib/types.js"
import { davDevAuth } from "../constants.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { User } from "../../lib/models/User.js"
import { App } from "../../lib/models/App.js"
import {
	GetUserById,
	UpdateUser,
	SetProfileImageOfUser,
	CreateStripeCustomerForUser,
	CreateStripeCustomerForUserResponseData
} from "../../lib/controllers/UsersController.js"

beforeEach(() => {
	mock.reset()
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

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, davDevAuth.token)

			return [
				expectedResult.status,
				{
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
					apps: [
						{
							id: appId,
							name: appName,
							description: appDescription,
							published: appPublished,
							web_link: appWebLink,
							google_play_link: appGooglePlayLink,
							microsoft_store_link: appMicrosoftStoreLink
						}
					]
				}
			]
		})

		// Act
		let result = (await GetUserById({
			auth: davDevAuth,
			id
		})) as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(
			result.data.StripeCustomerId,
			expectedResult.data.StripeCustomerId
		)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(
			result.data.SubscriptionStatus,
			expectedResult.data.SubscriptionStatus
		)
		assert.equal(
			result.data.PeriodEnd.toString(),
			expectedResult.data.PeriodEnd.toISOString()
		)
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(
			result.data.ProfileImageEtag,
			expectedResult.data.ProfileImageEtag
		)

		assert.equal(result.data.Apps.length, 1)
		assert.equal(result.data.Apps[0].Id, expectedResult.data.Apps[0].Id)
		assert.equal(result.data.Apps[0].Name, expectedResult.data.Apps[0].Name)
		assert.equal(
			result.data.Apps[0].Description,
			expectedResult.data.Apps[0].Description
		)
		assert.equal(
			result.data.Apps[0].Published,
			expectedResult.data.Apps[0].Published
		)
		assert.equal(
			result.data.Apps[0].WebLink,
			expectedResult.data.Apps[0].WebLink
		)
		assert.equal(
			result.data.Apps[0].GooglePlayLink,
			expectedResult.data.Apps[0].GooglePlayLink
		)
		assert.equal(
			result.data.Apps[0].MicrosoftStoreLink,
			expectedResult.data.Apps[0].MicrosoftStoreLink
		)
	})

	it("should call getUserById endpoint with error", async () => {
		// Arrange
		let id = 34

		let url = `${Dav.apiBaseUrl}/user/${id}`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, davDevAuth.token)

			return [
				expectedResult.status,
				{
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			]
		})

		// Act
		let result = (await GetUserById({
			auth: davDevAuth,
			id
		})) as ApiErrorResponse

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

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.email, newEmail)
			assert.equal(data.first_name, newFirstName)
			assert.equal(data.password, password)

			return [
				expectedResult.status,
				{
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
			]
		})

		// Act
		let result = (await UpdateUser({
			email: newEmail,
			firstName: newFirstName,
			password
		})) as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(
			result.data.StripeCustomerId,
			expectedResult.data.StripeCustomerId
		)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(
			result.data.SubscriptionStatus,
			expectedResult.data.SubscriptionStatus
		)
		assert.equal(
			result.data.PeriodEnd.toString(),
			expectedResult.data.PeriodEnd.toString()
		)
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(
			result.data.ProfileImageEtag,
			expectedResult.data.ProfileImageEtag
		)
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
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], "application/json")

			let data = JSON.parse(config.data)
			assert.equal(data.email, newEmail)
			assert.equal(data.first_name, newFirstName)
			assert.equal(data.password, password)

			return [
				expectedResult.status,
				{
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			]
		})

		// Act
		let result = (await UpdateUser({
			email: newEmail,
			firstName: newFirstName,
			password
		})) as ApiErrorResponse

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

		mock
			.onPut(url)
			.replyOnce(config => {
				// First updateUser request
				assert.equal(config.headers.Authorization, accessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.email, newEmail)
				assert.equal(data.first_name, newFirstName)
				assert.equal(data.password, password)

				return [
					403,
					{
						errors: [
							{
								code: ErrorCodes.AccessTokenMustBeRenewed,
								message: "Access token must be renewed"
							}
						]
					}
				]
			})
			.onPut(`${Dav.apiBaseUrl}/session/renew`)
			.replyOnce(config => {
				// renewSession request
				assert.equal(config.headers.Authorization, accessToken)

				return [
					200,
					{
						access_token: newAccessToken
					}
				]
			})
			.onPut(url)
			.replyOnce(config => {
				// Second updateUser request
				assert.equal(config.headers.Authorization, newAccessToken)
				assert.include(config.headers["Content-Type"], "application/json")

				let data = JSON.parse(config.data)
				assert.equal(data.email, newEmail)
				assert.equal(data.first_name, newFirstName)
				assert.equal(data.password, password)

				return [
					expectedResult.status,
					{
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
				]
			})

		// Act
		let result = (await UpdateUser({
			email: newEmail,
			firstName: newFirstName,
			password
		})) as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(
			result.data.StripeCustomerId,
			expectedResult.data.StripeCustomerId
		)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(
			result.data.SubscriptionStatus,
			expectedResult.data.SubscriptionStatus
		)
		assert.equal(
			result.data.PeriodEnd.toString(),
			expectedResult.data.PeriodEnd.toString()
		)
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(
			result.data.ProfileImageEtag,
			expectedResult.data.ProfileImageEtag
		)
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

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], type)

			assert.equal(data, config.data)

			return [
				expectedResult.status,
				{
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
			]
		})

		// Act
		let result = (await SetProfileImageOfUser({
			data,
			type
		})) as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(
			result.data.StripeCustomerId,
			expectedResult.data.StripeCustomerId
		)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(
			result.data.SubscriptionStatus,
			expectedResult.data.SubscriptionStatus
		)
		assert.equal(
			result.data.PeriodEnd.toString(),
			expectedResult.data.PeriodEnd.toString()
		)
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(
			result.data.ProfileImageEtag,
			expectedResult.data.ProfileImageEtag
		)
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
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onPut(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)
			assert.include(config.headers["Content-Type"], type)

			assert.equal(data, config.data)

			return [
				expectedResult.status,
				{
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			]
		})

		// Act
		let result = (await SetProfileImageOfUser({
			data,
			type
		})) as ApiErrorResponse

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

		mock
			.onPut(url)
			.replyOnce(config => {
				// First setProfileImageOfUser request
				assert.equal(config.headers.Authorization, accessToken)
				assert.include(config.headers["Content-Type"], type)

				assert.equal(data, config.data)

				return [
					403,
					{
						errors: [
							{
								code: ErrorCodes.AccessTokenMustBeRenewed,
								message: "Access token must be renewed"
							}
						]
					}
				]
			})
			.onPut(`${Dav.apiBaseUrl}/session/renew`)
			.replyOnce(config => {
				// renewSession request
				assert.equal(config.headers.Authorization, accessToken)

				return [
					200,
					{
						access_token: newAccessToken
					}
				]
			})
			.onPut(url)
			.replyOnce(config => {
				// Second setProfileImageOfUser request
				assert.equal(config.headers.Authorization, newAccessToken)
				assert.include(config.headers["Content-Type"], type)

				assert.equal(data, config.data)

				return [
					expectedResult.status,
					{
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
				]
			})

		// Act
		let result = (await SetProfileImageOfUser({
			data,
			type
		})) as ApiResponse<User>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.Email, expectedResult.data.Email)
		assert.equal(result.data.FirstName, expectedResult.data.FirstName)
		assert.equal(result.data.Confirmed, expectedResult.data.Confirmed)
		assert.equal(result.data.TotalStorage, expectedResult.data.TotalStorage)
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage)
		assert.equal(
			result.data.StripeCustomerId,
			expectedResult.data.StripeCustomerId
		)
		assert.equal(result.data.Plan, expectedResult.data.Plan)
		assert.equal(
			result.data.SubscriptionStatus,
			expectedResult.data.SubscriptionStatus
		)
		assert.equal(
			result.data.PeriodEnd.toString(),
			expectedResult.data.PeriodEnd.toString()
		)
		assert.equal(result.data.Dev, expectedResult.data.Dev)
		assert.equal(result.data.Provider, expectedResult.data.Provider)
		assert.equal(result.data.ProfileImage, expectedResult.data.ProfileImage)
		assert.equal(
			result.data.ProfileImageEtag,
			expectedResult.data.ProfileImageEtag
		)
	})
})

describe("CreateStripeCustomerForUser function", () => {
	it("should call createStripeCustomerForUser endpoint", async () => {
		// Arrange
		let stripeCustomerId = "sogdosdfiodsfd"

		let accessToken = "shiodfhosdghiosdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiResponse<CreateStripeCustomerForUserResponseData> =
			{
				status: 201,
				data: {
					stripeCustomerId
				}
			}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					stripe_customer_id: stripeCustomerId
				}
			]
		})

		// Act
		let result =
			(await CreateStripeCustomerForUser()) as ApiResponse<CreateStripeCustomerForUserResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(
			result.data.stripeCustomerId,
			expectedResult.data.stripeCustomerId
		)
	})

	it("should call createStripeCustomerForUser endpoint with error", async () => {
		// Arrange
		let accessToken = "shiodfhosdghiosdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/user/stripe`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		mock.onPost(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [
				expectedResult.status,
				{
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			]
		})

		// Act
		let result = (await CreateStripeCustomerForUser()) as ApiErrorResponse

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

		let expectedResult: ApiResponse<CreateStripeCustomerForUserResponseData> =
			{
				status: 201,
				data: {
					stripeCustomerId
				}
			}

		mock
			.onPost(url)
			.replyOnce(config => {
				// First createStripeCustomerForUser request
				assert.equal(config.headers.Authorization, accessToken)

				return [
					403,
					{
						errors: [
							{
								code: ErrorCodes.AccessTokenMustBeRenewed,
								message: "Access token must be renewed"
							}
						]
					}
				]
			})
			.onPut(`${Dav.apiBaseUrl}/session/renew`)
			.replyOnce(config => {
				// renewSession request
				assert.equal(config.headers.Authorization, accessToken)

				return [
					200,
					{
						access_token: newAccessToken
					}
				]
			})
			.onPost(url)
			.replyOnce(config => {
				// Second createStripeCustomerForUser request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [
					expectedResult.status,
					{
						stripe_customer_id: stripeCustomerId
					}
				]
			})

		// Act
		let result =
			(await CreateStripeCustomerForUser()) as ApiResponse<CreateStripeCustomerForUserResponseData>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(
			result.data.stripeCustomerId,
			expectedResult.data.stripeCustomerId
		)
	})
})
