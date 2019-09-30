import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Auth } from '../../lib/models/Auth';
import { GetAllApps, GetAllAppsResponseData } from '../../lib/providers/AppsController';

beforeEach(() => {
	moxios.install();
});

afterEach(() => {
	moxios.uninstall();
});

const devApiKey = "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm";
const devSecretKey = "Stac8pRhqH0CSO5o9Rxqjhu7vyVp4PINEMJumqlpvRQai4hScADamQ";
const devUuid = "d133e303-9dbb-47db-9531-008b20e5aae8";

describe("GetAllApps function", () => {
	it("should call getAllApps endpoint", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let url = `${Dav.apiBaseUrl}/apps/apps/all`;

		let expectedResult: ApiResponse<GetAllAppsResponseData> = {
			status: 200,
			data: {
				apps: [{
					id: 1,
					name: "TestApp",
					description: "TestApp is a very good app!",
					dev_id: 3,
					published: true,
					created_at: "Heute",
					updated_at: "Morgen",
					link_web: "https://testapp.dav-apps.tech",
					link_play: null,
					link_windows: null
				}]
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
				response: expectedResult.data
			});
		});

		// Act
		let result = await GetAllApps(auth) as ApiResponse<GetAllAppsResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.apps[0].id, expectedResult.data.apps[0].id);
		assert.equal(result.data.apps[0].name, expectedResult.data.apps[0].name);
		assert.equal(result.data.apps[0].description, expectedResult.data.apps[0].description);
		assert.equal(result.data.apps[0].dev_id, expectedResult.data.apps[0].dev_id);
		assert.equal(result.data.apps[0].published, expectedResult.data.apps[0].published);
		assert.equal(result.data.apps[0].created_at, expectedResult.data.apps[0].created_at);
		assert.equal(result.data.apps[0].updated_at, expectedResult.data.apps[0].updated_at);
		assert.equal(result.data.apps[0].link_web, expectedResult.data.apps[0].link_web);
		assert.equal(result.data.apps[0].link_play, expectedResult.data.apps[0].link_play);
		assert.equal(result.data.apps[0].link_windows, expectedResult.data.apps[0].link_windows);
	});

	it("should call getAllApps endpoint with error", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let url = `${Dav.apiBaseUrl}/apps/apps/all`;

		let expectedResult: ApiErrorResponse = {
			status: 401,
			errors: [{
				code: 2101,
				message: "Missing field: auth"
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
		let result = await GetAllApps(auth) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});