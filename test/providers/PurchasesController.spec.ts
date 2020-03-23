import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Auth } from '../../lib/models/Auth';
import { PurchaseResponseData, GetPurchase } from '../../lib/providers/PurchasesController';

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
				price: 1200,
				currency: "eur",
				paid: false,
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
					price: expectedResult.data.price,
					currency: expectedResult.data.currency,
					paid: expectedResult.data.paid,
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
		assert.equal(result.data.price, expectedResult.data.price);
		assert.equal(result.data.currency, expectedResult.data.currency);
		assert.equal(result.data.paid, expectedResult.data.paid);
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