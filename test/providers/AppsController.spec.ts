import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Auth } from '../../lib/models/Auth';
import { App } from '../../lib/models/App';
import { GetAllApps } from '../../lib/providers/AppsController';

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

		let expectedResult: ApiResponse<App[]> = {
			status: 200,
			data: [new App(
				20,
				"TestApp",
				"TestApp is a very good app!",
				true,
				"https://testapp.dav-apps.tech",
				null,
				null,
				112000
			)]
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
					apps: [{
						id: expectedResult.data[0].Id,
						name: expectedResult.data[0].Name,
						description: expectedResult.data[0].Description,
						published: expectedResult.data[0].Published,
						link_web: expectedResult.data[0].LinkWeb,
						link_play: expectedResult.data[0].LinkPlay,
						link_windows: expectedResult.data[0].LinkWindows,
						used_storage: expectedResult.data[0].UsedStorage
					}]
				}
			});
		});

		// Act
		let result = await GetAllApps(auth) as ApiResponse<App[]>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data[0].Id, expectedResult.data[0].Id);
		assert.equal(result.data[0].Name, expectedResult.data[0].Name);
		assert.equal(result.data[0].Description, expectedResult.data[0].Description);
		assert.equal(result.data[0].Published, expectedResult.data[0].Published);
		assert.equal(result.data[0].LinkWeb, expectedResult.data[0].LinkWeb);
		assert.equal(result.data[0].LinkPlay, expectedResult.data[0].LinkPlay);
		assert.equal(result.data[0].LinkWindows, expectedResult.data[0].LinkWindows);
		assert.equal(result.data[0].UsedStorage, expectedResult.data[0].UsedStorage);
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