import { assert } from "chai"
import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { Dav } from "../../lib/Dav.js"
import { davDevAuth } from "../constants.js"
import { ApiResponse, ApiErrorResponse, Currency } from "../../lib/types.js"
import * as ErrorCodes from "../../lib/errorCodes.js"
import { Purchase } from "../../lib/models/Purchase.js"
import {
	GetPurchase,
	DeletePurchase
} from "../../lib/controllers/PurchasesController.js"

let mock: MockAdapter = new MockAdapter(axios)

beforeEach(() => {
	mock.reset()
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

		mock.onGet(url).reply(config => {
			assert.equal(config.headers.Authorization, davDevAuth.token)

			return [
				expectedResult.status,
				{
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
			]
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

		mock.onDelete(url).reply(config => {
			assert.equal(config.headers.Authorization, accessToken)

			return [expectedResult.status, {}]
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

		mock.onDelete(url).reply(config => {
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

		mock
			.onDelete(url)
			.replyOnce(config => {
				// First deletePurchase request
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
			.onDelete(url)
			.replyOnce(config => {
				// Second deletePurchase request
				assert.equal(config.headers.Authorization, newAccessToken)

				return [expectedResult.status, {}]
			})

		// Act
		let result = (await DeletePurchase({
			uuid
		})) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
	})
})
