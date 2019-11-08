import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Auth } from '../../lib/models/Auth';
import { App } from '../../lib/models/App';
import { GetAllApps, GetApp, UpdateApp } from '../../lib/providers/AppsController';
import { Table } from '../../lib/models/Table';
import { Event } from '../../lib/models/Event';

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

describe("GetApp function", () => {
	it("should call getApp endpoint", async () => {
		// Arrange
		let appId = 42;
		let url = `${Dav.apiBaseUrl}/apps/app/${appId}`;
		let jwt = "jwtjwtjwtjwtjwtjwt";

		let expectedResult: ApiResponse<App> = {
			status: 200,
			data: new App(
				4,
				"TestApp",
				"TestApp is the best app!",
				true,
				null,
				null,
				"https://example.com",
				null,
				[
					new Table(8, 4, "Card"),
					new Table(12, 4, "Deck")
				],
				[
					new Event(12, 4, "visit", []),
					new Event(13, 4, "login", [])
				]
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
			assert.equal(request.config.headers.Authorization, jwt);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.Id,
					name: expectedResult.data.Name,
					description: expectedResult.data.Description,
					published: expectedResult.data.Published,
					link_web: expectedResult.data.LinkWeb,
					link_play: expectedResult.data.LinkPlay,
					link_windows: expectedResult.data.LinkWindows,
					tables: [
						{
							id: expectedResult.data.Tables[0].Id,
							app_id: expectedResult.data.Tables[0].AppId,
							name: expectedResult.data.Tables[0].Name
						},
						{
							id: expectedResult.data.Tables[1].Id,
							app_id: expectedResult.data.Tables[1].AppId,
							name: expectedResult.data.Tables[1].Name
						}
					],
					events: [
						{
							id: expectedResult.data.Events[0].Id,
							app_id: expectedResult.data.Events[0].AppId,
							name: expectedResult.data.Events[0].Name
						},
						{
							id: expectedResult.data.Events[1].Id,
							app_id: expectedResult.data.Events[1].AppId,
							name: expectedResult.data.Events[1].Name
						}
					]
				}
			});
		});

		// Act
		let result = await GetApp(jwt, appId) as ApiResponse<App>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.Id, expectedResult.data.Id);
		assert.equal(result.data.Name, expectedResult.data.Name);
		assert.equal(result.data.Description, expectedResult.data.Description);
		assert.equal(result.data.Published, expectedResult.data.Published);
		assert.equal(result.data.LinkWeb, expectedResult.data.LinkWeb);
		assert.equal(result.data.LinkPlay, expectedResult.data.LinkPlay);
		assert.equal(result.data.LinkWindows, expectedResult.data.LinkWindows);
		assert.equal(result.data.UsedStorage, expectedResult.data.UsedStorage);
		assert.equal(result.data.Tables[0].Id, expectedResult.data.Tables[0].Id);
		assert.equal(result.data.Tables[0].AppId, expectedResult.data.Tables[0].AppId);
		assert.equal(result.data.Tables[0].Name, expectedResult.data.Tables[0].Name);
		assert.equal(result.data.Tables[1].Id, expectedResult.data.Tables[1].Id);
		assert.equal(result.data.Tables[1].AppId, expectedResult.data.Tables[1].AppId);
		assert.equal(result.data.Tables[1].Name, expectedResult.data.Tables[1].Name);
		assert.equal(result.data.Events[0].Id, expectedResult.data.Events[0].Id);
		assert.equal(result.data.Events[0].AppId, expectedResult.data.Events[0].AppId);
		assert.equal(result.data.Events[0].Name, expectedResult.data.Events[0].Name);
		assert.equal(result.data.Events[1].Id, expectedResult.data.Events[1].Id);
		assert.equal(result.data.Events[1].AppId, expectedResult.data.Events[1].AppId);
		assert.equal(result.data.Events[1].Name, expectedResult.data.Events[1].Name);
	});

	it("should call getApp endpoint with error", async () => {
		// Arrange
		let appId = 42;
		let url = `${Dav.apiBaseUrl}/apps/app/${appId}`;
		let jwt = "jwtjwtjwtjwtjwtjwt";

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2803,
				message: "Resource does not exist: App"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
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
		let result = await GetApp(jwt, appId) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("GetAllApps function", () => {
	it("should call getAllApps endpoint", async () => {
		// Arrange
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

describe("UpdateApp function", () => {
	it("should call updateApp endpoint", async () => {
		// Arrange
		let appId = 53;
		let url = `${Dav.apiBaseUrl}/apps/app/${appId}`;
		let jwt = "jwtjwtjwtjwtjwtjwtjwtjwt";

		let updatedName = "USB";
		let updatedDescription = "This app is very good!";
		let updatedLinkPlay = "play.google.com/app.dav.universalsoundboard";
		let updatedLinkWindows = "";

		let expectedResult: ApiResponse<App> = {
			status: 200,
			data: new App(
				4,
				updatedName,
				updatedDescription,
				true,
				null,
				updatedLinkPlay,
				updatedLinkWindows
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'put');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.equal(request.config.headers.ContentType, 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.name, updatedName);
			assert.equal(data.description, updatedDescription);
			assert.equal(data.link_play, updatedLinkPlay);
			assert.equal(data.link_windows, updatedLinkWindows);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.Id,
					name: expectedResult.data.Name,
					description: expectedResult.data.Description,
					published: expectedResult.data.Published,
					link_web: expectedResult.data.LinkWeb,
					link_play: expectedResult.data.LinkPlay,
					link_windows: expectedResult.data.LinkWindows
				}
			});
		});

		// Act
		let result = await UpdateApp(jwt, appId, {
			name: updatedName,
			description: updatedDescription,
			linkPlay: updatedLinkPlay,
			linkWindows: updatedLinkWindows
		}) as ApiResponse<App>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.Id, expectedResult.data.Id);
		assert.equal(result.data.Name, expectedResult.data.Name);
		assert.equal(result.data.Description, expectedResult.data.Description);
		assert.equal(result.data.Published, expectedResult.data.Published);
		assert.equal(result.data.LinkWeb, expectedResult.data.LinkWeb);
		assert.equal(result.data.LinkPlay, expectedResult.data.LinkPlay);
		assert.equal(result.data.LinkWindows, expectedResult.data.LinkWindows);
	});

	it("should call updateUser endpoint with error", async () => {
		// Arrange
		let appId = 53;
		let url = `${Dav.apiBaseUrl}/apps/app/${appId}`;
		let jwt = "jwtjwtjwtjwtjwtjwtjwtjwt";

		let updatedName = "USB";
		let updatedDescription = "This app is very good!";
		let updatedLinkPlay = "play.google.com/app.dav.universalsoundboard";
		let updatedLinkWindows = "";

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2803,
				message: "Resource does not exist: App"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'put');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.equal(request.config.headers.ContentType, 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.name, updatedName);
			assert.equal(data.description, updatedDescription);
			assert.equal(data.link_play, updatedLinkPlay);
			assert.equal(data.link_windows, updatedLinkWindows);

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
		let result = await UpdateApp(jwt, appId, {
			name: updatedName,
			description: updatedDescription,
			linkPlay: updatedLinkPlay,
			linkWindows: updatedLinkWindows
		}) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});