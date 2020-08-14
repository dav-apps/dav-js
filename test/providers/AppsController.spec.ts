import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Auth } from '../../lib/models/Auth';
import { App } from '../../lib/models/App';
import {
	GetTableObject,
	DeleteTableObject,
	CreateApp,
	GetApp,
	GetActiveAppUsers,
	GetAllApps,
	UpdateApp,
	CreateTable,
	GetActiveAppUsersResponseData,
	DeleteTable,
	GetSubscription,
	GetNotification,
	DeleteNotification
} from '../../lib/providers/AppsController'
import { Table } from '../../lib/models/Table'
import { Event } from '../../lib/models/Event'
import { Api } from '../../lib/models/Api'
import { Notification } from '../../lib/models/Notification'
import { generateUUID, TableObject } from '../../lib/models/TableObject'
import { WebPushSubscription } from '../../lib/models/WebPushSubscription'

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

describe("GetTableObject function", () => {
	it("should call getTableObject endpoint", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/object/${uuid}`
		let jwt = "asdasfljaksfad"

		let tableId = 123
		let etag = "asdasdasdasfga"
		let firstPropertyName = "page1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "page2"
		let secondPropertyValue = 123

		let tableObject = new TableObject(uuid)
		tableObject.TableId = tableId
		tableObject.Etag = etag
		tableObject.Properties = {
			[firstPropertyName]: { value: firstPropertyValue },
			[secondPropertyName]: { value: secondPropertyValue }
		}

		let expectedResult: ApiResponse<TableObject> = {
			status: 201,
			data: tableObject
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, jwt)
			
			request.respondWith({
				status: expectedResult.status,
				response: {
					uuid,
					table_id: tableId,
					file: false,
					etag,
					properties: {
						[firstPropertyName]: firstPropertyValue,
						[secondPropertyName]: secondPropertyValue
					}
				}
			})
		})

		// Act
		let result = await GetTableObject(jwt, uuid) as ApiResponse<TableObject>

		// Assert
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.TableId, expectedResult.data.TableId)
		assert.equal(result.data.IsFile, expectedResult.data.IsFile)
		assert.equal(result.data.File, expectedResult.data.File)
		assert.equal(result.data.UploadStatus, expectedResult.data.UploadStatus)
		assert.equal(result.data.Etag, expectedResult.data.Etag)
		assert.equal(Object.keys(result.data.Properties).length, 2)
		assert.equal(result.data.Properties[firstPropertyName].value, firstPropertyValue)
		assert.equal(result.data.Properties[secondPropertyName].value, secondPropertyValue)
	})

	it("should call getTableObject endpoint with error", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/object/${uuid}`
		let jwt = "asdasfljaksfad"

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, jwt)
			
			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			})
		})

		// Act
		let result = await GetTableObject(jwt, uuid) as ApiErrorResponse

		// Assert
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("DeleteTableObject function", () => {
	it("should call deleteTableObject endpoint", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/object/${uuid}`
		let jwt = "asdpagisfonasf"

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteTableObject(jwt, uuid) as ApiResponse<{}>

		// Assert
		assert.equal(result.status, expectedResult.status)
		assert.equal(Object.keys(result.data).length, 0)
	})

	it("should call deleteTableObject endpoint with error", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/object/${uuid}`
		let jwt = "asdpagisfonasf"

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			})
		})

		// Act
		let result = await DeleteTableObject(jwt, uuid) as ApiErrorResponse

		// Assert
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("CreateApp function", () => {
	it("should call createApp endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/apps/app`;
		let jwt = "jwtjwtjwtjwt";
		let name = "TestApp";
		let description = "This is a test app";
		let linkWeb = "https://testapp.dav-apps.tech";
		let linkPlay = "https://play.google.com";
		let linkWindows = "https://store.microsoft.com";

		let expectedResult: ApiResponse<App> = {
			status: 201,
			data: new App(
				3,
				name,
				description,
				false,
				linkWeb,
				linkPlay,
				linkWindows
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.name, name);
			assert.equal(data.description, description);
			assert.equal(data.link_web, linkWeb);
			assert.equal(data.link_play, linkPlay);
			assert.equal(data.link_windows, linkWindows);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.Id,
					name: expectedResult.data.Name,
					description: expectedResult.data.Description,
					published: false,
					link_web: expectedResult.data.LinkWeb,
					link_play: expectedResult.data.LinkPlay,
					link_windows: expectedResult.data.LinkWindows,
					tables: []
				}
			});
		});

		// Act
		let result = await CreateApp(jwt, name, description, linkWeb, linkPlay, linkWindows) as ApiResponse<App>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.Id, expectedResult.data.Id);
		assert.equal(result.data.Name, expectedResult.data.Name);
		assert.equal(result.data.Description, expectedResult.data.Description);
		assert.equal(result.data.Published, expectedResult.data.Published);
		assert.equal(result.data.LinkWeb, expectedResult.data.LinkWeb);
		assert.equal(result.data.LinkPlay, expectedResult.data.LinkPlay);
		assert.equal(result.data.LinkWindows, expectedResult.data.LinkWindows);
		assert.equal(0, result.data.Tables.length);
	});

	it("should call createApp endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/apps/app`;
		let jwt = "jwtjwtjwtjwt";
		let name = "TestApp";
		let linkWeb = "https://testapp.dav-apps.tech";
		let linkWindows = "https://store.microsoft.com";

		let expectedResult: ApiErrorResponse = {
			status: 400,
			errors: [{
				code: 2112,
				message: "Missing field: description"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.name, name);
			assert.equal(data.link_web, linkWeb);
			assert.equal(data.link_windows, linkWindows);

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
		let result = await CreateApp(jwt, name, null, linkWeb, null, linkWindows) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

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
				],
				[
					new Api(23, "Test API", [], [], []),
					new Api(24, "Test API 2", [], [], [])
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
					],
					apis: [
						{
							id: expectedResult.data.Apis[0].Id,
							name: expectedResult.data.Apis[0].Name
						},
						{
							id: expectedResult.data.Apis[1].Id,
							name: expectedResult.data.Apis[1].Name
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
		assert.equal(result.data.Apis[0].Id, expectedResult.data.Apis[0].Id);
		assert.equal(result.data.Apis[0].Name, expectedResult.data.Apis[0].Name);
		assert.equal(result.data.Apis[1].Id, expectedResult.data.Apis[1].Id);
		assert.equal(result.data.Apis[1].Name, expectedResult.data.Apis[1].Name);
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

describe("GetActiveAppUsers function", () => {
	it("should call getActiveAppUsers endpoint", async () => {
		// Arrange
		let jwt = "asdoisdbosdf";
		let appId = 5;
		let start = 234234234;
		let end = 123123123123;
		let url = `${Dav.apiBaseUrl}/apps/app/${appId}/active_users`;

		let expectedResult: ApiResponse<GetActiveAppUsersResponseData> = {
			status: 200,
			data: {
				days: [{
					time: "Gestern",
					countDaily: 4,
					countMonthly: 7,
					countYearly: 12
				}, {
					time: "Heute",
					countDaily: 7,
					countMonthly: 10,
					countYearly: 17
				}]
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
			assert.equal(request.config.headers.Authorization, jwt);

			assert.equal(request.config.params.start, start);
			assert.equal(request.config.params.end, end);

			request.respondWith({
				status: expectedResult.status,
				response: {
					days: [{
						time: expectedResult.data.days[0].time,
						count_daily: expectedResult.data.days[0].countDaily,
						count_monthly: expectedResult.data.days[0].countMonthly,
						count_yearly: expectedResult.data.days[0].countYearly
					}, {
						time: expectedResult.data.days[1].time,
						count_daily: expectedResult.data.days[1].countDaily,
						count_monthly: expectedResult.data.days[1].countMonthly,
						count_yearly: expectedResult.data.days[1].countYearly
					}]
				}
			});
		});

		// Act
		let result = await GetActiveAppUsers(jwt, appId, start, end) as ApiResponse<GetActiveAppUsersResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.days[0].time, expectedResult.data.days[0].time);
		assert.equal(result.data.days[0].countDaily, expectedResult.data.days[0].countDaily);
		assert.equal(result.data.days[0].countMonthly, expectedResult.data.days[0].countMonthly);
		assert.equal(result.data.days[0].countYearly, expectedResult.data.days[0].countYearly);

		assert.equal(result.data.days[1].time, expectedResult.data.days[1].time);
		assert.equal(result.data.days[1].countDaily, expectedResult.data.days[1].countDaily);
		assert.equal(result.data.days[1].countMonthly, expectedResult.data.days[1].countMonthly);
		assert.equal(result.data.days[1].countYearly, expectedResult.data.days[1].countYearly);
	});

	it("should call getActiveAppUsers endpoint with error", async () => {
		// Arrange
		let jwt = "asdoisdbosdf";
		let appId = 5;
		let start = 234234234;
		let end = null;
		let url = `${Dav.apiBaseUrl}/apps/app/${appId}/active_users`;

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

			assert.equal(request.config.params.start, start);
			assert.equal(request.config.params.end, end);

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
		let result = await GetActiveAppUsers(jwt, appId, start, end) as ApiErrorResponse;

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
			assert.include(request.config.headers["Content-Type"], 'application/json');

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

	it("should call updateApp endpoint with error", async () => {
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
			assert.include(request.config.headers["Content-Type"], 'application/json');

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

describe("CreateTable function", () => {
	it("should call createTable endpoint", async () => {
		// Arrange
		let appId = 43;
		let url = `${Dav.apiBaseUrl}/apps/${appId}/table`;
		let jwt = "blablablabla";
		let name = "Test";

		let expectedResult: ApiResponse<Table> = {
			status: 201,
			data: new Table(10, appId, name)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.name, name);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.Id,
					app_id: expectedResult.data.AppId,
					name: expectedResult.data.Name
				}
			});
		});

		// Act
		let result = await CreateTable(jwt, appId, name) as ApiResponse<Table>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.Id, expectedResult.data.Id);
		assert.equal(result.data.AppId, expectedResult.data.AppId);
		assert.equal(result.data.Name, expectedResult.data.Name);
	});

	it("should call createTable endpoint with error", async () => {
		// Arrange
		let appId = 43;
		let url = `${Dav.apiBaseUrl}/apps/${appId}/table`;
		let jwt = "blablablabla";
		let name = "Test";

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
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.name, name);

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			})
		});

		// Act
		let result = await CreateTable(jwt, appId, name) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("DeleteTable function", () => {
	it("should call deleteTable endpoint", async () => {
		// Arrange
		let tableId = 12
		let url = `${Dav.apiBaseUrl}/apps/table/${tableId}`
		let jwt = "asdoahsfohbasfsd"

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteTable(jwt, tableId) as ApiResponse<{}>
		
		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(Object.keys(result.data).length, 0)
	})

	it("should call deleteTable endpoint with error", async () => {
		// Arrange
		let tableId = 12
		let url = `${Dav.apiBaseUrl}/apps/table/${tableId}`
		let jwt = "asdoahsfohbasfsd"

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			})
		})

		// Act
		let result = await DeleteTable(jwt, tableId) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("GetSubscription function", () => {
	it("should call getSubscription endpoint", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/subscription/${uuid}`
		let jwt = "phsidoshfdsdsdfsdf"

		let endpoint = "https://example.com"
		let p256dh = "asdasd"
		let auth = "asodagiasda"

		let expectedResult: ApiResponse<WebPushSubscription> = {
			status: 200,
			data: new WebPushSubscription(
				uuid,
				endpoint,
				p256dh,
				auth
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {
					uuid,
					endpoint,
					p256dh,
					auth
				}
			})
		})

		// Act
		let result = await GetSubscription(jwt, uuid) as ApiResponse<WebPushSubscription>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Endpoint, expectedResult.data.Endpoint)
		assert.equal(result.data.P256dh, expectedResult.data.P256dh)
		assert.equal(result.data.Auth, expectedResult.data.Auth)
	})

	it("should call getSubscription endpoint with error", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/subscription/${uuid}`
		let jwt = "phsidoshfdsdsdfsdf"

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			})
		})

		// Act
		let result = await GetSubscription(jwt, uuid) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("GetNotification function", () => {
	it("should call getNotification endpoint", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/notification/${uuid}`
		let jwt = "asdobagaibsfasjd"

		let time = 1312313123
		let interval = 212
		let firstPropertyName = "test1"
		let firstPropertyValue = "Hello World"
		let secondPropertyName = "test2"
		let secondPropertyValue = "Hallo Welt"

		let expectedResult: ApiResponse<Notification> = {
			status: 200,
			data: new Notification(
				time,
				interval,
				{
					[firstPropertyName]: firstPropertyValue,
					[secondPropertyName]: secondPropertyValue
				},
				uuid
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {
					time: expectedResult.data.Time,
					interval: expectedResult.data.Interval,
					uuid: expectedResult.data.Uuid,
					properties: expectedResult.data.Properties
				}
			})
		})

		// Act
		let result = await GetNotification(jwt, uuid) as ApiResponse<Notification>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.data.Time, expectedResult.data.Time)
		assert.equal(result.data.Interval, expectedResult.data.Interval)
		assert.equal(result.data.Uuid, expectedResult.data.Uuid)
		assert.equal(result.data.Properties[firstPropertyName], expectedResult.data.Properties[firstPropertyName])
		assert.equal(result.data.Properties[secondPropertyName], expectedResult.data.Properties[secondPropertyName])
	})

	it("should call getNotification endpoint with error", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/notification/${uuid}`
		let jwt = "asdobagaibsfasjd"

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'get')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			})
		})

		// Act
		let result = await GetNotification(jwt, uuid) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})

describe("DeleteNotification endpoint", () => {
	it("should call deleteNotification endpoint", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/notification/${uuid}`
		let jwt = "aosdaogbsadjasda"

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {}
			})
		})

		// Act
		let result = await DeleteNotification(jwt, uuid) as ApiResponse<{}>

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(Object.keys(result.data).length, 0)
	})

	it("should call deleteNotification endpoint with error", async () => {
		// Arrange
		let uuid = generateUUID()
		let url = `${Dav.apiBaseUrl}/apps/notification/${uuid}`
		let jwt = "aosdaogbsadjasda"

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [{
				code: 1102,
				message: "Action not allowed"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent()

			// Assert for the request
			assert.equal(request.config.url, url)
			assert.equal(request.config.method, 'delete')
			assert.equal(request.config.headers.Authorization, jwt)

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message]
					]
				}
			})
		})

		// Act
		let result = await DeleteNotification(jwt, uuid) as ApiErrorResponse

		// Assert for the response
		assert.equal(result.status, expectedResult.status)
		assert.equal(result.errors[0].code, expectedResult.errors[0].code)
		assert.equal(result.errors[0].message, expectedResult.errors[0].message)
	})
})