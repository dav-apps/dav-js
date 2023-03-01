import { assert } from "chai"
import moxios from "moxios"
import { Dav } from "../../lib/Dav.js"
import { davDevAuth } from "../constants.js"
import { ApiResponse, ApiErrorResponse, Currency } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { Purchase } from "../../lib/models/Purchase.js"
import {
	GetPurchase,
	DeletePurchase
} from "../../lib/controllers/PurchasesController.js"

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("GetPurchase function", () => {
	it("should call getPurchase endpoint", async () => {
		// Arrange
		let id = 12
		let userId = 23
		let uuid = "ed082924-ca1b-4d4e-9ee5-69da388546cf"
		let paymentIntentId = "pi_iasdohafhoasguf"
		let providerName = "Lemony Snicket"
		let providerImage =
			"https://api.pocketlib.app/author/asdasdasd/profile_image"
		let productName = "A Series of Unfortunate Events - Book the First"
		let productImage =
			"https://api.pocketlib.app/store/book/sdfsdfsfddf/cover"
		let price = 1313
		let currency: Currency = "eur"
		let completed = false

		let url = `${Dav.apiBaseUrl}/purchase/${uuid}`

		let expectedResult: ApiResponse<Purchase> = {
			status: 200,
			data: new Purchase(
				id,
				userId,
				uuid,
				paymentIntentId,
				providerName,
				providerImage,
				productName,
				productImage,
				price,
				currency,
				completed
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "get")
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					uuid,
					payment_intent_id: paymentIntentId,
					provider_name: providerName,
					provider_image: providerImage,
					product_name: productName,
					product_image: productImage,
					price,
					currency,
					completed
				}
			})
		})

		// Act
		let result = (await GetPurchase({
			auth: davDevAuth,
			uuid
		})) as ApiResponse<Purchase>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.UserId, expectedResult.data.UserId)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.ProviderName, expectedResult.data.ProviderName)
		assert.equal(result.data.ProviderImage, expectedResult.data.ProviderImage)
		assert.equal(result.data.ProductName, expectedResult.data.ProductName)
		assert.equal(result.data.ProductImage, expectedResult.data.ProductImage)
		assert.equal(result.data.Price, expectedResult.data.Price)
		assert.equal(result.data.Currency, expectedResult.data.Currency)
		assert.equal(result.data.Completed, expectedResult.data.Completed)
	})

	it("should call getPurchase endpoint with error", async () => {
		// Arrange
		let uuid = "ed082924-ca1b-4d4e-9ee5-69da388546cf"

		let url = `${Dav.apiBaseUrl}/purchase/${uuid}`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "get")
			assert.equal(request.config.headers.Authorization, davDevAuth.token)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			})
		})

		// Act
		let result = (await GetPurchase({
			auth: davDevAuth,
			uuid
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("DeletePurchase function", () => {
	it("should call deletePurchase endpoint", async () => {
		// Arrange
		let uuid = "1903b4e7-cb52-48e4-8605-943794cee4eb"

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${uuid}`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "delete")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = (await DeletePurchase({
			uuid
		})) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})

	it("should call deletePurchase endpoint with error", async () => {
		// Arrange
		let uuid = "1903b4e7-cb52-48e4-8605-943794cee4eb"

		let accessToken = "iosdfshodhsdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${uuid}`

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: ErrorCodes.ActionNotAllowed,
					message: "Action not allowed"
				}
			]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "delete")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						{
							code: expectedResult.errors[0].code,
							message: expectedResult.errors[0].message
						}
					]
				}
			})
		})

		// Act
		let result = (await DeletePurchase({
			uuid
		})) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call deletePurchase endpoint and renew session", async () => {
		// Arrange
		let uuid = "1903b4e7-cb52-48e4-8605-943794cee4eb"

		let accessToken = "iosdfshodhsdf"
		let newAccessToken = "sfdhosfdhiosfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${uuid}`

		let expectedResult: ApiResponse<{}> = {
			status: 204,
			data: {}
		}

		// First deletePurchase request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "delete")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 403,
				response: {
					errors: [
						{
							code: ErrorCodes.AccessTokenMustBeRenewed,
							message: "Access token must be renewed"
						}
					]
				}
			})
		})

		// renewSession request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, `${Dav.apiBaseUrl}/session/renew`)
			assert.equal(request.config.method, "put")
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: 200,
				response: {
					access_token: newAccessToken
				}
			})
		})

		// Second deletePurchase request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, "delete")
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = (await DeletePurchase({
			uuid
		})) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})
})
