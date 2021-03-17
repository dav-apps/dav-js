import { assert } from 'chai'
import * as moxios from 'moxios'
import { Dav } from '../../lib/Dav'
import { ApiResponse, ApiErrorResponse, Currency } from '../../lib/types'
import * as ErrorCodes from '../../lib/errorCodes'
import { Purchase } from '../../lib/models/Purchase'
import { CreatePurchase, GetPurchase, CompletePurchase } from '../../lib/controllers/PurchasesController'

beforeEach(() => {
	moxios.install()
})

afterEach(() => {
	moxios.uninstall()
})

describe("CreatePurchase function", () => {
	it("should call createPurchase endpoint", async () => {
		// Arrange
		let tableObjectUuid = "28c66e28-f1cd-4765-b38f-e03c0f467ae9"
		let id = 12
		let userId = 23
		let tableObjectId = 34
		let paymentIntentId = "pi_iasdohafhoasguf"
		let providerName = "Lemony Snicket"
		let providerImage = "https://api.pocketlib.app/author/asdasdasd/profile_image"
		let productName = "A Series of Unfortunate Events - Book the First"
		let productImage = "https://api.pocketlib.app/store/book/sdfsdfsfddf/cover"
		let price = 1313
		let currency: Currency = "eur"
		let completed = false

		let accessToken = "osdosdiosdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${tableObjectUuid}/purchase`

		let expectedResult: ApiResponse<Purchase> = {
			status: 201,
			data: new Purchase(
				id,
				userId,
				tableObjectId,
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
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.provider_name, providerName)
			assert.equal(data.provider_image, providerImage)
			assert.equal(data.product_name, productName)
			assert.equal(data.product_image, productImage)
			assert.equal(data.currency, currency)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					table_object_id: tableObjectId,
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
		let result = await CreatePurchase({
			tableObjectUuid,
			providerName,
			providerImage,
			productName,
			productImage,
			currency
		}) as ApiResponse<Purchase>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.UserId, expectedResult.data.UserId)
		assert.equal(result.data.TableObjectId, expectedResult.data.TableObjectId)
		assert.equal(result.data.ProviderName, expectedResult.data.ProviderName)
		assert.equal(result.data.ProviderImage, expectedResult.data.ProviderImage)
		assert.equal(result.data.ProductName, expectedResult.data.ProductName)
		assert.equal(result.data.ProductImage, expectedResult.data.ProductImage)
		assert.equal(result.data.Price, expectedResult.data.Price)
		assert.equal(result.data.Currency, expectedResult.data.Currency)
		assert.equal(result.data.Completed, expectedResult.data.Completed)
	})

	it("should call createPurchase endpoint with error", async () => {
		// Arrange
		let tableObjectUuid = "28c66e28-f1cd-4765-b38f-e03c0f467ae9"
		let providerName = "Lemony Snicket"
		let providerImage = "https://api.pocketlib.app/author/asdasdasd/profile_image"
		let productName = "A Series of Unfortunate Events - Book the First"
		let productImage = "https://api.pocketlib.app/store/book/sdfsdfsfddf/cover"
		let currency: Currency = "eur"

		let accessToken = "osdosdiosdf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${tableObjectUuid}/purchase`

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
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.provider_name, providerName)
			assert.equal(data.provider_image, providerImage)
			assert.equal(data.product_name, productName)
			assert.equal(data.product_image, productImage)
			assert.equal(data.currency, currency)

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
		let result = await CreatePurchase({
			tableObjectUuid,
			providerName,
			providerImage,
			productName,
			productImage,
			currency
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call createPurchase endpoint and renew the session", async () => {
		// Arrange
		let tableObjectUuid = "28c66e28-f1cd-4765-b38f-e03c0f467ae9"
		let id = 12
		let userId = 23
		let tableObjectId = 34
		let paymentIntentId = "pi_iasdohafhoasguf"
		let providerName = "Lemony Snicket"
		let providerImage = "https://api.pocketlib.app/author/asdasdasd/profile_image"
		let productName = "A Series of Unfortunate Events - Book the First"
		let productImage = "https://api.pocketlib.app/store/book/sdfsdfsfddf/cover"
		let price = 1313
		let currency: Currency = "eur"
		let completed = false

		let accessToken = "osdosdiosdf"
		let newAccessToken = "sgiodsfghiosghio"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/table_object/${tableObjectUuid}/purchase`

		let expectedResult: ApiResponse<Purchase> = {
			status: 201,
			data: new Purchase(
				id,
				userId,
				tableObjectId,
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

		// First createPurchase request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.provider_name, providerName)
			assert.equal(data.provider_image, providerImage)
			assert.equal(data.product_name, productName)
			assert.equal(data.product_image, productImage)
			assert.equal(data.currency, currency)

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

		// Second createPurchase request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)
			assert.include(request.config.headers["Content-Type"], "application/json")

			let data = JSON.parse(request.config.data)
			assert.equal(data.provider_name, providerName)
			assert.equal(data.provider_image, providerImage)
			assert.equal(data.product_name, productName)
			assert.equal(data.product_image, productImage)
			assert.equal(data.currency, currency)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					table_object_id: tableObjectId,
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
		let result = await CreatePurchase({
			tableObjectUuid,
			providerName,
			providerImage,
			productName,
			productImage,
			currency
		}) as ApiResponse<Purchase>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.UserId, expectedResult.data.UserId)
		assert.equal(result.data.TableObjectId, expectedResult.data.TableObjectId)
		assert.equal(result.data.ProviderName, expectedResult.data.ProviderName)
		assert.equal(result.data.ProviderImage, expectedResult.data.ProviderImage)
		assert.equal(result.data.ProductName, expectedResult.data.ProductName)
		assert.equal(result.data.ProductImage, expectedResult.data.ProductImage)
		assert.equal(result.data.Price, expectedResult.data.Price)
		assert.equal(result.data.Currency, expectedResult.data.Currency)
		assert.equal(result.data.Completed, expectedResult.data.Completed)
	})
})

describe("GetPurchase function", () => {
	it("should call getPurchase endpoint", async () => {
		// Arrange
		let id = 12
		let userId = 23
		let tableObjectId = 34
		let paymentIntentId = "pi_iasdohafhoasguf"
		let providerName = "Lemony Snicket"
		let providerImage = "https://api.pocketlib.app/author/asdasdasd/profile_image"
		let productName = "A Series of Unfortunate Events - Book the First"
		let productImage = "https://api.pocketlib.app/store/book/sdfsdfsfddf/cover"
		let price = 1313
		let currency: Currency = "eur"
		let completed = false

		let accessToken = "iosdfsiodhfsd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${id}`

		let expectedResult: ApiResponse<Purchase> = {
			status: 200,
			data: new Purchase(
				id,
				userId,
				tableObjectId,
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
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					table_object_id: tableObjectId,
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
		let result = await GetPurchase({
			id
		}) as ApiResponse<Purchase>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.UserId, expectedResult.data.UserId)
		assert.equal(result.data.TableObjectId, expectedResult.data.TableObjectId)
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
		let id = 12

		let accessToken = "iosdfsiodhfsd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${id}`

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
		let result = await GetPurchase({
			id
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call getPurchase endpoint and renew the session", async () => {
		// Arrange
		let id = 12
		let userId = 23
		let tableObjectId = 34
		let paymentIntentId = "pi_iasdohafhoasguf"
		let providerName = "Lemony Snicket"
		let providerImage = "https://api.pocketlib.app/author/asdasdasd/profile_image"
		let productName = "A Series of Unfortunate Events - Book the First"
		let productImage = "https://api.pocketlib.app/store/book/sdfsdfsfddf/cover"
		let price = 1313
		let currency: Currency = "eur"
		let completed = false

		let accessToken = "iosdfsiodhfsd"
		let newAccessToken = "sodskodjosfd"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${id}`

		let expectedResult: ApiResponse<Purchase> = {
			status: 200,
			data: new Purchase(
				id,
				userId,
				tableObjectId,
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

		// First getPurchase request
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

		// Second getPurchase request
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
					user_id: userId,
					table_object_id: tableObjectId,
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
		let result = await GetPurchase({
			id
		}) as ApiResponse<Purchase>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.UserId, expectedResult.data.UserId)
		assert.equal(result.data.TableObjectId, expectedResult.data.TableObjectId)
		assert.equal(result.data.ProviderName, expectedResult.data.ProviderName)
		assert.equal(result.data.ProviderImage, expectedResult.data.ProviderImage)
		assert.equal(result.data.ProductName, expectedResult.data.ProductName)
		assert.equal(result.data.ProductImage, expectedResult.data.ProductImage)
		assert.equal(result.data.Price, expectedResult.data.Price)
		assert.equal(result.data.Currency, expectedResult.data.Currency)
		assert.equal(result.data.Completed, expectedResult.data.Completed)
	})
})

describe("CompletePurchase function", () => {
	it("should call completePurchase endpoint", async () => {
		// Arrange
		let id = 12
		let userId = 23
		let tableObjectId = 34
		let paymentIntentId = "pi_iasdohafhoasguf"
		let providerName = "Lemony Snicket"
		let providerImage = "https://api.pocketlib.app/author/asdasdasd/profile_image"
		let productName = "A Series of Unfortunate Events - Book the First"
		let productImage = "https://api.pocketlib.app/store/book/sdfsdfsfddf/cover"
		let price = 1313
		let currency: Currency = "eur"
		let completed = false

		let accessToken = "shodsodsfhiodshiodf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${id}/complete`

		let expectedResult: ApiResponse<Purchase> = {
			status: 200,
			data: new Purchase(
				id,
				userId,
				tableObjectId,
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
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, accessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					table_object_id: tableObjectId,
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
		let result = await CompletePurchase({
			id
		}) as ApiResponse<Purchase>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.UserId, expectedResult.data.UserId)
		assert.equal(result.data.TableObjectId, expectedResult.data.TableObjectId)
		assert.equal(result.data.ProviderName, expectedResult.data.ProviderName)
		assert.equal(result.data.ProviderImage, expectedResult.data.ProviderImage)
		assert.equal(result.data.ProductName, expectedResult.data.ProductName)
		assert.equal(result.data.ProductImage, expectedResult.data.ProductImage)
		assert.equal(result.data.Price, expectedResult.data.Price)
		assert.equal(result.data.Currency, expectedResult.data.Currency)
		assert.equal(result.data.Completed, expectedResult.data.Completed)
	})

	it("should call completePurchase endpoint with error", async () => {
		// Arrange
		let id = 12

		let accessToken = "shodsodsfhiodshiodf"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${id}/complete`

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
		let result = await CompletePurchase({
			id
		}) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})

	it("should call completePurchase endpoint and renew the session", async () => {
		// Arrange
		let id = 12
		let userId = 23
		let tableObjectId = 34
		let paymentIntentId = "pi_iasdohafhoasguf"
		let providerName = "Lemony Snicket"
		let providerImage = "https://api.pocketlib.app/author/asdasdasd/profile_image"
		let productName = "A Series of Unfortunate Events - Book the First"
		let productImage = "https://api.pocketlib.app/store/book/sdfsdfsfddf/cover"
		let price = 1313
		let currency: Currency = "eur"
		let completed = false

		let accessToken = "shodsodsfhiodshiodf"
		let newAccessToken = "sdiofshiodghiosdg"
		Dav.accessToken = accessToken
		let url = `${Dav.apiBaseUrl}/purchase/${id}/complete`

		let expectedResult: ApiResponse<Purchase> = {
			status: 200,
			data: new Purchase(
				id,
				userId,
				tableObjectId,
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

		// First completePurchase request
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

		// Second completePurchase request
		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'post')
			assert.equal(request.config.headers.Authorization, newAccessToken)

			request.respondWith({
				status: expectedResult.status,
				response: {
					id,
					user_id: userId,
					table_object_id: tableObjectId,
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
		let result = await CompletePurchase({
			id
		}) as ApiResponse<Purchase>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Id, expectedResult.data.Id)
		assert.equal(result.data.UserId, expectedResult.data.UserId)
		assert.equal(result.data.TableObjectId, expectedResult.data.TableObjectId)
		assert.equal(result.data.ProviderName, expectedResult.data.ProviderName)
		assert.equal(result.data.ProviderImage, expectedResult.data.ProviderImage)
		assert.equal(result.data.ProductName, expectedResult.data.ProductName)
		assert.equal(result.data.ProductImage, expectedResult.data.ProductImage)
		assert.equal(result.data.Price, expectedResult.data.Price)
		assert.equal(result.data.Currency, expectedResult.data.Currency)
		assert.equal(result.data.Completed, expectedResult.data.Completed)
	})
})