import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { ProviderResponseData, CreateProvider } from '../../lib/providers/ProvidersController';

beforeEach(() => {
	moxios.install();
	InitStatic(DavEnvironment.Test);
});

afterEach(() => {
	moxios.uninstall();
});

describe("CreateProvider function", () => {
	it("should call createProvider endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/provider`;
		let jwt = "asdasasdasdasdasd";

		let expectedResult: ApiResponse<ProviderResponseData> = {
			status: 201,
			data: {
				id: 1,
				userId: 1,
				stripeAccountId: "accnt_asasda"
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					user_id: expectedResult.data.userId,
					stripe_account_id: expectedResult.data.stripeAccountId
				}
			});
		});

		// Act
		let result = await CreateProvider(jwt) as ApiResponse<ProviderResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.userId, expectedResult.data.userId);
		assert.equal(result.data.stripeAccountId, expectedResult.data.stripeAccountId);
	});

	it("should call createProvider endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/provider`;
		let jwt = "asdasasdasdasdasd";

		let expectedResult: ApiErrorResponse = {
			status: 409,
			errors: [{
				code: 2910,
				message: "Resource already exists: Provider"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);

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
		let result = await CreateProvider(jwt) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});