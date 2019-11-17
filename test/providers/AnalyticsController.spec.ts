import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { 
	CreateEventLog, 
	EventLogResponseData, 
	GetEventByName, 
	GetUsers, 
	GetUsersResponseData, 
	GetActiveUsersResponseData, 
	GetActiveUsers,
	GetAppUsers,
	GetAppUsersResponseData
} from '../../lib/providers/AnalyticsController';
import { Event } from '../../lib/models/Event';
import { StandardEventSummary, EventSummaryPeriod } from '../../lib/models/StandardEventSummary';
import { EventSummaryOsCount } from '../../lib/models/EventSummaryOsCount';
import { EventSummaryBrowserCount } from '../../lib/models/EventSummaryBrowserCount';
import { EventSummaryCountryCount } from '../../lib/models/EventSummaryCountryCount';

beforeEach(() => {
	moxios.install();
	InitStatic(DavEnvironment.Test);
});

afterEach(() => {
	moxios.uninstall();
});

describe("CreateEventLog function", () => {
	it("should call createEventLog endpoint", async () => {
		// Arrange
		let apiKey = "albasdjasodasjda";
		let appId = 7;
		let name = "Login";
		let osName = "Windows";
		let osVersion = "10";
		let browserName = "Microsoft Edge";
		let browserVersion = "80";
		let country = "DE";

		let url = `${Dav.apiBaseUrl}/analytics/event`;

		let expectedResult: ApiResponse<EventLogResponseData> = {
			status: 201,
			data: {
				id: 5,
				eventId: 2,
				createdAt: "Heute",
				processed: false,
				osName,
				osVersion,
				browserName,
				browserVersion,
				country
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');

			let data = JSON.parse(request.config.data);
			assert.equal(data.api_key, apiKey);
			assert.equal(data.app_id, appId);
			assert.equal(data.name, name);
			assert.equal(data.os_name, osName);
			assert.equal(data.os_version, osVersion);
			assert.equal(data.browser_name, browserName);
			assert.equal(data.browser_version, browserVersion);
			assert.equal(data.country, country);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					event_id: expectedResult.data.eventId,
					created_at: expectedResult.data.createdAt,
					processed: expectedResult.data.processed,
					os_name: expectedResult.data.osName,
					os_version: expectedResult.data.osVersion,
					browser_name: expectedResult.data.browserName,
					browser_version: expectedResult.data.browserVersion,
					country: expectedResult.data.country
				}
			});
		});

		// Act
		let result = await CreateEventLog(apiKey, appId, name, osName, osVersion, browserName, browserVersion, country) as ApiResponse<EventLogResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.eventId, expectedResult.data.eventId);
		assert.equal(result.data.createdAt, expectedResult.data.createdAt);
		assert.equal(result.data.processed, expectedResult.data.processed);
		assert.equal(result.data.osName, expectedResult.data.osName);
		assert.equal(result.data.osVersion, expectedResult.data.osVersion);
		assert.equal(result.data.browserName, expectedResult.data.browserName);
		assert.equal(result.data.browserVersion, expectedResult.data.browserVersion);
		assert.equal(result.data.country, expectedResult.data.country);
	});

	it("should call createEventLog endpoint with error", async () => {
		// Arrange
		let apiKey = "albasdjasodasjda";
		let appId = 7;
		let name = "Login";
		let osName = "Windows";
		let osVersion = "10";
		let browserName = "Microsoft Edge";
		let browserVersion = "80";
		let country = "DE";

		let url = `${Dav.apiBaseUrl}/analytics/event`;

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

			let data = JSON.parse(request.config.data);
			assert.equal(data.api_key, apiKey);
			assert.equal(data.app_id, appId);
			assert.equal(data.name, name);
			assert.equal(data.os_name, osName);
			assert.equal(data.os_version, osVersion);
			assert.equal(data.browser_name, browserName);
			assert.equal(data.browser_version, browserVersion);
			assert.equal(data.country, country);

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
		let result = await CreateEventLog(apiKey, appId, name, osName, osVersion, browserName, browserVersion, country) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("GetEventByName function", () => {
	it("should call getEventByName endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/analytics/event`;
		let jwt = "jwtjwtjwtjwtjwt";
		let appId = 234;
		let name = "visit";
		let period = EventSummaryPeriod.Year;
		let firstEventSummaryTime = "2019-10-29T00:00:00Z";
		let secondEventSummaryTime = "2019-11-14T00:00:00Z";

		let expectedResult: ApiResponse<Event> = {
			status: 200,
			data: new Event(
				12,
				appId,
				name,
				[
					new StandardEventSummary(
						new Date(firstEventSummaryTime),
						period,
						20,
						[
							new EventSummaryOsCount("Windows", "10", 10),
							new EventSummaryOsCount("Ubuntu", "20.04", 3)
						],
						[
							new EventSummaryBrowserCount("Microsoft Edge", "83", 5),
							new EventSummaryBrowserCount("Firefox", "85", 7)
						],
						[
							new EventSummaryCountryCount("DE", 9),
							new EventSummaryCountryCount("FR", 4)
						]
					),
					new StandardEventSummary(
						new Date(secondEventSummaryTime),
						period,
						20,
						[
							new EventSummaryOsCount("Windows", "7", 5),
							new EventSummaryOsCount("Chrome OS", "81", 4)
						],
						[
							new EventSummaryBrowserCount("Google Chrome", "81", 4),
							new EventSummaryBrowserCount("Firefox", "85", 5)
						],
						[
							new EventSummaryCountryCount("DE", 6),
							new EventSummaryCountryCount("US", 3)
						]
					),
				]
			)
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();
			
			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
			assert.equal(request.config.headers.Authorization, jwt);

			assert.equal(request.config.params.name, expectedResult.data.Name);
			assert.equal(request.config.params.app_id, expectedResult.data.AppId);
			assert.equal(request.config.params.period, period);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.Id, 
					app_id: expectedResult.data.AppId,
					name: expectedResult.data.Name,
					period,
					summaries: [
						{
							time: firstEventSummaryTime,
							total: expectedResult.data.Summaries[0].Total,
							os_counts: [
								{
									name: expectedResult.data.Summaries[0].OsCounts[0].Name,
									version: expectedResult.data.Summaries[0].OsCounts[0].Version,
									count: expectedResult.data.Summaries[0].OsCounts[0].Count
								},
								{
									name: expectedResult.data.Summaries[0].OsCounts[1].Name,
									version: expectedResult.data.Summaries[0].OsCounts[1].Version,
									count: expectedResult.data.Summaries[0].OsCounts[1].Count
								}
							],
							browser_counts: [
								{
									name: expectedResult.data.Summaries[0].BrowserCounts[0].Name,
									version: expectedResult.data.Summaries[0].BrowserCounts[0].Version,
									count: expectedResult.data.Summaries[0].BrowserCounts[0].Count
								},
								{
									name: expectedResult.data.Summaries[0].BrowserCounts[1].Name,
									version: expectedResult.data.Summaries[0].BrowserCounts[1].Version,
									count: expectedResult.data.Summaries[0].BrowserCounts[1].Count
								}
							],
							country_counts: [
								{
									country: expectedResult.data.Summaries[0].CountryCounts[0].Country,
									count: expectedResult.data.Summaries[0].CountryCounts[0].Count
								},
								{
									country: expectedResult.data.Summaries[0].CountryCounts[1].Country,
									count: expectedResult.data.Summaries[0].CountryCounts[1].Count
								}
							]
						},
						{
							time: secondEventSummaryTime,
							total: expectedResult.data.Summaries[1].Total,
							os_counts: [
								{
									name: expectedResult.data.Summaries[1].OsCounts[0].Name,
									version: expectedResult.data.Summaries[1].OsCounts[0].Version,
									count: expectedResult.data.Summaries[1].OsCounts[0].Count
								},
								{
									name: expectedResult.data.Summaries[1].OsCounts[1].Name,
									version: expectedResult.data.Summaries[1].OsCounts[1].Version,
									count: expectedResult.data.Summaries[1].OsCounts[1].Count
								}
							],
							browser_counts: [
								{
									name: expectedResult.data.Summaries[1].BrowserCounts[0].Name,
									version: expectedResult.data.Summaries[1].BrowserCounts[0].Version,
									count: expectedResult.data.Summaries[1].BrowserCounts[0].Count
								},
								{
									name: expectedResult.data.Summaries[1].BrowserCounts[1].Name,
									version: expectedResult.data.Summaries[1].BrowserCounts[1].Version,
									count: expectedResult.data.Summaries[1].BrowserCounts[1].Count
								}
							],
							country_counts: [
								{
									country: expectedResult.data.Summaries[1].CountryCounts[0].Country,
									count: expectedResult.data.Summaries[1].CountryCounts[0].Count
								},
								{
									country: expectedResult.data.Summaries[1].CountryCounts[1].Country,
									count: expectedResult.data.Summaries[1].CountryCounts[1].Count
								}
							]
						}
					]
				}
			});
		});

		// Act
		let result = await GetEventByName(jwt, name, appId, null, null, period) as ApiResponse<Event>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.Id, expectedResult.data.Id);
		assert.equal(result.data.AppId, expectedResult.data.AppId);
		assert.equal(result.data.Name, expectedResult.data.Name);

		assert.equal(result.data.Summaries[0].OsCounts[0].Name, expectedResult.data.Summaries[0].OsCounts[0].Name);
		assert.equal(result.data.Summaries[0].OsCounts[0].Version, expectedResult.data.Summaries[0].OsCounts[0].Version);
		assert.equal(result.data.Summaries[0].OsCounts[0].Count, expectedResult.data.Summaries[0].OsCounts[0].Count);
		assert.equal(result.data.Summaries[0].OsCounts[1].Name, expectedResult.data.Summaries[0].OsCounts[1].Name);
		assert.equal(result.data.Summaries[0].OsCounts[1].Version, expectedResult.data.Summaries[0].OsCounts[1].Version);
		assert.equal(result.data.Summaries[0].OsCounts[1].Count, expectedResult.data.Summaries[0].OsCounts[1].Count);

		assert.equal(result.data.Summaries[0].BrowserCounts[0].Name, expectedResult.data.Summaries[0].BrowserCounts[0].Name);
		assert.equal(result.data.Summaries[0].BrowserCounts[0].Version, expectedResult.data.Summaries[0].BrowserCounts[0].Version);
		assert.equal(result.data.Summaries[0].BrowserCounts[0].Count, expectedResult.data.Summaries[0].BrowserCounts[0].Count);
		assert.equal(result.data.Summaries[0].BrowserCounts[1].Name, expectedResult.data.Summaries[0].BrowserCounts[1].Name);
		assert.equal(result.data.Summaries[0].BrowserCounts[1].Version, expectedResult.data.Summaries[0].BrowserCounts[1].Version);
		assert.equal(result.data.Summaries[0].BrowserCounts[1].Count, expectedResult.data.Summaries[0].BrowserCounts[1].Count);

		assert.equal(result.data.Summaries[0].CountryCounts[0].Country, expectedResult.data.Summaries[0].CountryCounts[0].Country);
		assert.equal(result.data.Summaries[0].CountryCounts[0].Count, expectedResult.data.Summaries[0].CountryCounts[0].Count);
		assert.equal(result.data.Summaries[0].CountryCounts[1].Country, expectedResult.data.Summaries[0].CountryCounts[1].Country);
		assert.equal(result.data.Summaries[0].CountryCounts[1].Count, expectedResult.data.Summaries[0].CountryCounts[1].Count);

		assert.equal(result.data.Summaries[1].OsCounts[0].Name, expectedResult.data.Summaries[1].OsCounts[0].Name);
		assert.equal(result.data.Summaries[1].OsCounts[0].Version, expectedResult.data.Summaries[1].OsCounts[0].Version);
		assert.equal(result.data.Summaries[1].OsCounts[0].Count, expectedResult.data.Summaries[1].OsCounts[0].Count);
		assert.equal(result.data.Summaries[1].OsCounts[1].Name, expectedResult.data.Summaries[1].OsCounts[1].Name);
		assert.equal(result.data.Summaries[1].OsCounts[1].Version, expectedResult.data.Summaries[1].OsCounts[1].Version);
		assert.equal(result.data.Summaries[1].OsCounts[1].Count, expectedResult.data.Summaries[1].OsCounts[1].Count);

		assert.equal(result.data.Summaries[1].BrowserCounts[0].Name, expectedResult.data.Summaries[1].BrowserCounts[0].Name);
		assert.equal(result.data.Summaries[1].BrowserCounts[0].Version, expectedResult.data.Summaries[1].BrowserCounts[0].Version);
		assert.equal(result.data.Summaries[1].BrowserCounts[0].Count, expectedResult.data.Summaries[1].BrowserCounts[0].Count);
		assert.equal(result.data.Summaries[1].BrowserCounts[1].Name, expectedResult.data.Summaries[1].BrowserCounts[1].Name);
		assert.equal(result.data.Summaries[1].BrowserCounts[1].Version, expectedResult.data.Summaries[1].BrowserCounts[1].Version);
		assert.equal(result.data.Summaries[1].BrowserCounts[1].Count, expectedResult.data.Summaries[1].BrowserCounts[1].Count);

		assert.equal(result.data.Summaries[1].CountryCounts[0].Country, expectedResult.data.Summaries[1].CountryCounts[0].Country);
		assert.equal(result.data.Summaries[1].CountryCounts[0].Count, expectedResult.data.Summaries[1].CountryCounts[0].Count);
		assert.equal(result.data.Summaries[1].CountryCounts[1].Country, expectedResult.data.Summaries[1].CountryCounts[1].Country);
		assert.equal(result.data.Summaries[1].CountryCounts[1].Count, expectedResult.data.Summaries[1].CountryCounts[1].Count);
	});

	it("should call getEventByName endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/analytics/event`;
		let jwt = "jwtjwtjwtjwtjwt";
		let appId = 234;
		let name = "visit";
		let start = 234234;
		let end = 2923423234234;
		let period = EventSummaryPeriod.Year;

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [
				{
					code: 2807,
					message: "Resource does not exist: Event"
				}
			]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
			assert.equal(request.config.headers.Authorization, jwt);

			assert.equal(request.config.params.name, name);
			assert.equal(request.config.params.app_id, appId);
			assert.equal(request.config.params.start, start);
			assert.equal(request.config.params.end, end);
			assert.equal(request.config.params.period, period);

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
		let result = await GetEventByName(jwt, name, appId, start, end, period) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("GetAppUsers function", () => {
	it("should call getAppUsers endpoint", async () => {
		// Arrange
		let appId = 4;
		let jwt = "jwtjwtjwtjwtjwtjwtjwtjwt";
		let url = `${Dav.apiBaseUrl}/analytics/app/${appId}`;

		let expectedResult: ApiResponse<GetAppUsersResponseData> = {
			status: 200,
			data: {
				users: [{
					id: 4,
					startedUsing: "Vorgestern"
				}, {
					id: 5,
					startedUsing: "Heute"
				}]
			}
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
					users: [{
						id: expectedResult.data.users[0].id,
						started_using: expectedResult.data.users[0].startedUsing
					}, {
						id: expectedResult.data.users[1].id,
						started_using: expectedResult.data.users[1].startedUsing
					}]
				}
			});
		});

		// Act
		let result = await GetAppUsers(jwt, appId) as ApiResponse<GetAppUsersResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.users[0].id, expectedResult.data.users[0].id);
		assert.equal(result.data.users[0].startedUsing, expectedResult.data.users[0].startedUsing);
		assert.equal(result.data.users[1].id, expectedResult.data.users[1].id);
		assert.equal(result.data.users[1].startedUsing, expectedResult.data.users[1].startedUsing);
	});

	it("should call getAppUsers endpoint with error", async () => {
		// Arrange
		let appId = 4;
		let jwt = "jwtjwtjwtjwtjwtjwtjwtjwt";
		let url = `${Dav.apiBaseUrl}/analytics/app/${appId}`;

		let expectedResult: ApiErrorResponse = {
			status: 401,
			errors: [{
				code: 1302,
				message: "JWT not valid"
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
		let result = await GetAppUsers(jwt, appId) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("GetUsers function", () => {
	it("should call getUsers endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/analytics/users`;
		let jwt = "jwtjwtjwtjwtjwtjwt";

		let expectedResult: ApiResponse<GetUsersResponseData> = {
			status: 200,
			data: {
				users: [{
					id: 4,
					createdAt: "Gestern",
					updatedAt: null,
					confirmed: false,
					plan: 1,
					lastActive: "Gestern",
					apps: [{
						id: 4,
						name: "TestApp"
					}, {
						id: 9,
						name: "PocketLib"
					}]
				}, {
					id: 5,
					createdAt: "Vorgestern",
					updatedAt: "Gestern",
					confirmed: true,
					plan: 0,
					lastActive: "Heute",
					apps: [{
						id: 10,
						name: "NewsHub"
					}]
				}]
			}
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
					users: [{
						id: expectedResult.data.users[0].id,
						created_at: expectedResult.data.users[0].createdAt,
						updated_at: expectedResult.data.users[0].updatedAt,
						confirmed: expectedResult.data.users[0].confirmed,
						plan: expectedResult.data.users[0].plan,
						last_active: expectedResult.data.users[0].lastActive,
						apps: [{
							id: expectedResult.data.users[0].apps[0].id,
							name: expectedResult.data.users[0].apps[0].name
						}, {
							id: expectedResult.data.users[0].apps[1].id,
							name: expectedResult.data.users[0].apps[1].name
						}]
					}, {
						id: expectedResult.data.users[1].id,
						created_at: expectedResult.data.users[1].createdAt,
						updated_at: expectedResult.data.users[1].updatedAt,
						confirmed: expectedResult.data.users[1].confirmed,
						plan: expectedResult.data.users[1].plan,
						last_active: expectedResult.data.users[1].lastActive,
						apps: [{
							id: expectedResult.data.users[1].apps[0].id,
							name: expectedResult.data.users[1].apps[0].name
						}]
					}]
				}
			});
		});

		// Act
		let result = await GetUsers(jwt) as ApiResponse<GetUsersResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.users[0].id, expectedResult.data.users[0].id);
		assert.equal(result.data.users[0].createdAt, expectedResult.data.users[0].createdAt);
		assert.equal(result.data.users[0].updatedAt, expectedResult.data.users[0].updatedAt);
		assert.equal(result.data.users[0].confirmed, expectedResult.data.users[0].confirmed);
		assert.equal(result.data.users[0].plan, expectedResult.data.users[0].plan);
		assert.equal(result.data.users[0].lastActive, expectedResult.data.users[0].lastActive);
		assert.equal(result.data.users[0].apps[0].id, expectedResult.data.users[0].apps[0].id);
		assert.equal(result.data.users[0].apps[0].name, expectedResult.data.users[0].apps[0].name);
		assert.equal(result.data.users[0].apps[1].id, expectedResult.data.users[0].apps[1].id);
		assert.equal(result.data.users[0].apps[1].name, expectedResult.data.users[0].apps[1].name);
		
		assert.equal(result.data.users[1].id, expectedResult.data.users[1].id);
		assert.equal(result.data.users[1].createdAt, expectedResult.data.users[1].createdAt);
		assert.equal(result.data.users[1].updatedAt, expectedResult.data.users[1].updatedAt);
		assert.equal(result.data.users[1].confirmed, expectedResult.data.users[1].confirmed);
		assert.equal(result.data.users[1].plan, expectedResult.data.users[1].plan);
		assert.equal(result.data.users[1].lastActive, expectedResult.data.users[1].lastActive);
		assert.equal(result.data.users[1].apps[0].id, expectedResult.data.users[1].apps[0].id);
		assert.equal(result.data.users[1].apps[0].name, expectedResult.data.users[1].apps[0].name);
	});

	it("should call getUsers endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/analytics/users`;
		let jwt = "jwtjwtjwtjwtjwtjwt";

		let expectedResult: ApiErrorResponse = {
			status: 401,
			errors: [{
				code: 1302,
				message: "JWT not valid"
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
		let result = await GetUsers(jwt) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("GetActiveUsers function", () => {
	it("should call getActiveUsers endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/analytics/active_users`;
		let jwt = "jwtjwtjwtjwtjwtjwt";
		let start = 234235;
		let end = 13938291;

		let expectedResult: ApiResponse<GetActiveUsersResponseData> = {
			status: 200,
			data: {
				days: [{
					time: "Heute",
					countDaily: 4,
					countMonthly: 10,
					countYearly: 21
				}, {
					time: "Gestern",
					countDaily: 7,
					countMonthly: 13,
					countYearly: 123
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
		let result = await GetActiveUsers(jwt, start, end) as ApiResponse<GetActiveUsersResponseData>;

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

	it("should call getActiveUsers endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/analytics/active_users`;
		let jwt = "jwtjwtjwtjwtjwtjwt";
		let start = 234235;
		let end = 13938291;

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
		let result = await GetActiveUsers(jwt, start, end) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});