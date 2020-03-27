import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Auth } from '../../lib/models/Auth';
import { PurchaseResponseData, CreatePurchase, GetPurchase, CompletePurchase } from '../../lib/providers/PurchasesController';

const devApiKey = "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm";
const devSecretKey = "Stac8pRhqH0CSO5o9Rxqjhu7vyVp4PINEMJumqlpvRQai4hScADamQ";
const devUuid = "d133e303-9dbb-47db-9531-008b20e5aae8";

beforeEach(() => {
	moxios.install();
	InitStatic(DavEnvironment.Test);
});

afterEach(() => {
	moxios.uninstall();
});

describe("CreatePurchase function", () => {
	it("should call createPurchase endpoint", async () => {
		// Arrange
		let tableObjectUuid = "asdasdasdasd";
		let url = `${Dav.apiBaseUrl}/apps/object/${tableObjectUuid}/purchase`;
		let jwt = "asdasdasdasdasd";
		let productImage = "http://localhost:3001/badbeginning.png";
		let productName = "A Series of Unfortunate Events - The Bad Beginning";
		let providerImage = "http://localhost:3001/snicket.png";
		let providerName = "Lemony Snicket";
		let price = 1366;
		let currency = "eur";

		let expectedResult: ApiResponse<PurchaseResponseData> = {
			status: 201,
			data: {
				id: 23,
				userId: 25,
				tableObjectId: 381,
				paymentIntentId: "pi_asdasdasd",
				productImage,
				productName,
				providerImage,
				providerName,
				price,
				currency,
				completed: false
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);

			let data = JSON.parse(request.config.data);
			assert.equal(data.product_image, productImage);
			assert.equal(data.product_name, productName);
			assert.equal(data.provider_image, providerImage);
			assert.equal(data.provider_name, providerName);
			assert.equal(data.price, price);
			assert.equal(data.currency, currency);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					user_id: expectedResult.data.userId,
					table_object_id: expectedResult.data.tableObjectId,
					payment_intent_id: expectedResult.data.paymentIntentId,
					product_image: expectedResult.data.productImage,
					product_name: expectedResult.data.productName,
					provider_image: expectedResult.data.providerImage,
					provider_name: expectedResult.data.providerName,
					price: expectedResult.data.price,
					currency: expectedResult.data.currency,
					completed: expectedResult.data.completed
				}
			})
		});

		// Act
		let result = await CreatePurchase(
			jwt,
			tableObjectUuid,
			productImage,
			productName,
			providerImage,
			providerName,
			price,
			currency
		) as ApiResponse<PurchaseResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.userId, expectedResult.data.userId);
		assert.equal(result.data.tableObjectId, expectedResult.data.tableObjectId);
		assert.equal(result.data.paymentIntentId, expectedResult.data.paymentIntentId);
		assert.equal(result.data.productImage, expectedResult.data.productImage);
		assert.equal(result.data.productName, expectedResult.data.productName);
		assert.equal(result.data.providerImage, expectedResult.data.providerImage);
		assert.equal(result.data.providerName, expectedResult.data.providerName);
		assert.equal(result.data.price, expectedResult.data.price);
		assert.equal(result.data.currency, expectedResult.data.currency);
		assert.equal(result.data.completed, expectedResult.data.completed);
	});

	it("should call createPurchase endpoint with error", async () => {
		// Arrange
		let tableObjectUuid = "asdasdasdasd";
		let url = `${Dav.apiBaseUrl}/apps/object/${tableObjectUuid}/purchase`;
		let jwt = "asdasdasdasdasd";
		let productImage = "http://localhost:3001/badbeginning.png";
		let productName = "A Series of Unfortunate Events - The Bad Beginning";
		let providerImage = "http://localhost:3001/snicket.png";
		let providerName = "Lemony Snicket";
		let price = 1366;
		let currency = "eur";

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);

			let data = JSON.parse(request.config.data);
			assert.equal(data.product_image, productImage);
			assert.equal(data.product_name, productName);
			assert.equal(data.provider_image, providerImage);
			assert.equal(data.provider_name, providerName);
			assert.equal(data.price, price);
			assert.equal(data.currency, currency);

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			});
		});

		// Act
		let result = await CreatePurchase(
			jwt,
			tableObjectUuid,
			productImage,
			productName,
			providerImage,
			providerName,
			price,
			currency
		) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("GetPurchase function", () => {
	it("should call getPurchase endpoint", async () => {
		// Arrange
		let id = 12;
		let url = `${Dav.apiBaseUrl}/purchase/${id}`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiResponse<PurchaseResponseData> = {
			status: 200,
			data: {
				id,
				userId: 23,
				tableObjectId: 52,
				paymentIntentId: "pi_asdasdasdasd",
				productImage: "http://localhost:3001/bla.png",
				productName: "Bla",
				providerImage: "http://localhost:3001/snicket.png",
				providerName: "Lemony Snicket",
				price: 1200,
				currency: "eur",
				completed: true
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
			assert.equal(request.config.headers.Authorization, auth.token);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					user_id: expectedResult.data.userId,
					table_object_id: expectedResult.data.tableObjectId,
					payment_intent_id: expectedResult.data.paymentIntentId,
					product_image: expectedResult.data.productImage,
					product_name: expectedResult.data.productName,
					provider_image: expectedResult.data.providerImage,
					provider_name: expectedResult.data.providerName,
					price: expectedResult.data.price,
					currency: expectedResult.data.currency,
					completed: expectedResult.data.completed
				}
			});
		});

		// Act
		let result = await GetPurchase(auth, id) as ApiResponse<PurchaseResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.userId, expectedResult.data.userId);
		assert.equal(result.data.tableObjectId, expectedResult.data.tableObjectId);
		assert.equal(result.data.paymentIntentId, expectedResult.data.paymentIntentId);
		assert.equal(result.data.productImage, expectedResult.data.productImage);
		assert.equal(result.data.productName, expectedResult.data.productName);
		assert.equal(result.data.providerImage, expectedResult.data.providerImage);
		assert.equal(result.data.providerName, expectedResult.data.providerName);
		assert.equal(result.data.price, expectedResult.data.price);
		assert.equal(result.data.currency, expectedResult.data.currency);
		assert.equal(result.data.completed, expectedResult.data.completed);
	});

	it("should call getPurchase endpoint with error", async () => {
		// Arrange
		let id = 12;
		let url = `${Dav.apiBaseUrl}/purchase/${id}`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
			assert.equal(request.config.headers.Authorization, auth.token);

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			});
		});

		// Act
		let result = await GetPurchase(auth, id) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("CompletePurchase function", () => {
	it("should call completePurchase endpoint", async () => {
		// Arrange
		let id = 34;
		let url = `${Dav.apiBaseUrl}/purchase/${id}/complete`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiResponse<PurchaseResponseData> = {
			status: 200,
			data: {
				id,
				userId: 93,
				tableObjectId: 25,
				paymentIntentId: "pi_asdasdasdasdasd",
				productImage: "http://localhost:3001/bla.png",
				productName: "Bla",
				providerImage: "http://localhost:3001/snicket.png",
				providerName: "Lemony Snicket",
				price: 1342,
				currency: "eur",
				completed: true
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					user_id: expectedResult.data.userId,
					table_object_id: expectedResult.data.tableObjectId,
					payment_intent_id: expectedResult.data.paymentIntentId,
					product_image: expectedResult.data.productImage,
					product_name: expectedResult.data.productName,
					provider_image: expectedResult.data.providerImage,
					provider_name: expectedResult.data.providerName,
					price: expectedResult.data.price,
					currency: expectedResult.data.currency,
					completed: expectedResult.data.completed
				}
			})
		});

		// Act
		let result = await CompletePurchase(auth, id) as ApiResponse<PurchaseResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.userId, expectedResult.data.userId);
		assert.equal(result.data.tableObjectId, expectedResult.data.tableObjectId);
		assert.equal(result.data.paymentIntentId, expectedResult.data.paymentIntentId);
		assert.equal(result.data.productImage, expectedResult.data.productImage);
		assert.equal(result.data.productName, expectedResult.data.productName);
		assert.equal(result.data.providerImage, expectedResult.data.providerImage);
		assert.equal(result.data.providerName, expectedResult.data.providerName);
		assert.equal(result.data.price, expectedResult.data.price);
		assert.equal(result.data.currency, expectedResult.data.currency);
		assert.equal(result.data.completed, expectedResult.data.completed);
	});

	it("should call completePurchase endpoint with error", async () => {
		// Arrange
		let id = 34;
		let url = `${Dav.apiBaseUrl}/purchase/${id}/complete`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			});
		});

		// Act
		let result = await CompletePurchase(auth, id) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});