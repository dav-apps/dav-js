import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Api } from '../../lib/models/Api';
import { CreateApi } from '../../lib/providers/ApisController';

beforeEach(() => {
	moxios.install();
	InitStatic(DavEnvironment.Test);
});

afterEach(() => {
	moxios.uninstall();
});

const devApiKey = "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm";
const devSecretKey = "Stac8pRhqH0CSO5o9Rxqjhu7vyVp4PINEMJumqlpvRQai4hScADamQ";
const devUuid = "d133e303-9dbb-47db-9531-008b20e5aae8";

describe("CreateApi function", () => {
	it("should call createApi endpoint", async () => {
		// Arrange
		let appId = 5;
		let url = `${Dav.apiBaseUrl}/apps/app/${appId}/api`;
		let jwt = "asdiafoiasdas";
		let name = "Test Api";

		let expectedResult: ApiResponse<Api> = {
			status: 201,
			data: new Api(4, name, [], [], [])
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.equal(request.config.headers.ContentType, 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.name, name);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.Id,
					app_id: appId,
					name: expectedResult.data.Name
				}
			});
		});

		// Act
		let result = await CreateApi(jwt, appId, name) as ApiResponse<Api>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.Id, expectedResult.data.Id);
		assert.equal(result.data.Name, expectedResult.data.Name);
	});

	it("should call createApi endpoint with error", async () => {
		// Arrange
		let appId = 5;
		let url = `${Dav.apiBaseUrl}/apps/app/${appId}/api`;
		let jwt = "asdiafoiasdas";
		let name = "Test Api";

		let expectedResult: ApiErrorResponse = {
			status: 400,
			errors: [{
				code: 2203,
				message: "Field too short: name"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.equal(request.config.headers.ContentType, 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.name, name);

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
		let result = await CreateApi(jwt, appId, name) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});