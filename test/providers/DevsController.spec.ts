import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { GetDevByApiKey, DevResponseData } from '../../lib/providers/DevsController';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Auth } from '../../lib/models/Auth';
import { App } from '../../lib/models/App';

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

describe("GetDevByApiKey function", () => {
	it("should call getDevByApiKey endpoint", async () => {
		// Arrange
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let apiKey = "devapikey";
		let url = `${Dav.apiBaseUrl}/devs/dev/${apiKey}`;

		let expectedResult: ApiResponse<DevResponseData> = {
			status: 200,
			data: {
				id: 1,
				userId: 4,
				apiKey: "asdpkasdasdpokasdpkoasd",
				secretKey: "asdoaisdabdjandknfdsiofs",
				uuid: "26d48388-1d91-4cb5-b9a9-906f7b35beac",
				createdAt: "Gestern",
				updatedAt: "Heute",
				apps: [new App(5, "TestApp", "TestApp is a very good app", true, "https://testapp.dav-apps.tech", null, null)]
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
					api_key: expectedResult.data.apiKey,
					secret_key: expectedResult.data.secretKey,
					uuid: expectedResult.data.uuid,
					created_at: expectedResult.data.createdAt,
					updated_at: expectedResult.data.updatedAt,
					apps: [{
						id: expectedResult.data.apps[0].Id,
						name: expectedResult.data.apps[0].Name,
						description: expectedResult.data.apps[0].Description,
						published: expectedResult.data.apps[0].Published,
						link_web: expectedResult.data.apps[0].LinkWeb,
						link_windows: expectedResult.data.apps[0].LinkWindows,
						link_play: expectedResult.data.apps[0].LinkPlay
					}]
				}
			});
		});

		// Act
		let result = await GetDevByApiKey(auth, apiKey) as ApiResponse<DevResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.userId, expectedResult.data.userId);
		assert.equal(result.data.apiKey, expectedResult.data.apiKey);
		assert.equal(result.data.secretKey, expectedResult.data.secretKey);
		assert.equal(result.data.uuid, expectedResult.data.uuid);
		assert.equal(result.data.createdAt, expectedResult.data.createdAt);
		assert.equal(result.data.updatedAt, expectedResult.data.updatedAt);
		assert.equal(result.data.apps[0].Id, expectedResult.data.apps[0].Id);
		assert.equal(result.data.apps[0].Name, expectedResult.data.apps[0].Name);
		assert.equal(result.data.apps[0].Description, expectedResult.data.apps[0].Description);
		assert.equal(result.data.apps[0].Published, expectedResult.data.apps[0].Published);
		assert.equal(result.data.apps[0].LinkWeb, expectedResult.data.apps[0].LinkWeb);
		assert.equal(result.data.apps[0].LinkWindows, expectedResult.data.apps[0].LinkWindows);
		assert.equal(result.data.apps[0].LinkPlay, expectedResult.data.apps[0].LinkPlay);
	});

	it("should call getDevByApiKey with error", async () => {
		// Arrange
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let apiKey = "devapikey";
		let url = `${Dav.apiBaseUrl}/devs/dev/${apiKey}`;

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2802,
				message: "Resource does not exist: Dev"
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
		let result = await GetDevByApiKey(auth, apiKey) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});