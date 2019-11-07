import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { CreateEventLog, EventLogResponseData, GetEventByName } from '../../lib/providers/AnalyticsController';
import { Event } from '../../lib/models/Event';
import { EventSummary, EventSummaryPeriod } from '../../lib/models/EventSummary';
import { EventSummaryPropertyCount } from '../../lib/models/EventSummaryPropertyCount';

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
		let name = "Login";
		let appId = 7;
		let saveCountry = false;
		let properties = {
			browser_name: "Microsoft Edge",
			browser_version: "76"
		}

		let url = `${Dav.apiBaseUrl}/analytics/event`;

		let expectedResult: ApiResponse<EventLogResponseData> = {
			status: 201,
			data: {
				id: 5,
				eventId: 2,
				createdAt: "Heute",
				processed: false,
				properties
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');

			assert.equal(request.config.params.api_key, apiKey);
			assert.equal(request.config.params.name, name);
			assert.equal(request.config.params.app_id, appId);
			assert.equal(request.config.params.save_country, saveCountry);

			let data = JSON.parse(request.config.data);
			assert.equal(data.browser_name, properties.browser_name);
			assert.equal(data.browser_version, properties.browser_version);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					event_id: expectedResult.data.eventId,
					created_at: expectedResult.data.createdAt,
					processed: expectedResult.data.processed,
					properties: expectedResult.data.properties
				}
			});
		});

		// Act
		let result = await CreateEventLog(apiKey, name, appId, saveCountry, properties) as ApiResponse<EventLogResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.eventId, expectedResult.data.eventId);
		assert.equal(result.data.createdAt, expectedResult.data.createdAt);
		assert.equal(result.data.processed, expectedResult.data.processed);
		assert.equal(result.data.properties.browser_name, expectedResult.data.properties.browser_name);
		assert.equal(result.data.properties.browser_version, expectedResult.data.properties.browser_version);
	});

	it("should call createEventLog endpoint with error", async () => {
		// Arrange
		let apiKey = "albasdjasodasjda";
		let name = "Login";
		let appId = 7;
		let saveCountry = false;
		let properties = {
			browser_name: "Microsoft Edge",
			browser_version: "76"
		}

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

			assert.equal(request.config.params.api_key, apiKey);
			assert.equal(request.config.params.name, name);
			assert.equal(request.config.params.app_id, appId);
			assert.equal(request.config.params.save_country, saveCountry);

			let data = JSON.parse(request.config.data);
			assert.equal(data.browser_name, properties.browser_name);
			assert.equal(data.browser_version, properties.browser_version);

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
		let result = await CreateEventLog(apiKey, name, appId, saveCountry, properties) as ApiErrorResponse;

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
		let sorting = EventSummaryPeriod.Year;
		let firstEventSummaryTime = "2019-10-29T00:00:00Z";
		let secondEventSummaryTime = "2019-11-14T00:00:00Z";

		let expectedResult: ApiResponse<Event> = {
			status: 200,
			data: new Event(
				12,
				appId,
				name,
				[
					new EventSummary(
						new Date(firstEventSummaryTime),
						20,
						sorting,
						[
							new EventSummaryPropertyCount("os_name", "Windows", 5),
							new EventSummaryPropertyCount("os_version", "10", 5)
						]
					),
					new EventSummary(
						new Date(secondEventSummaryTime),
						38,
						sorting,
						[
							new EventSummaryPropertyCount("os_name", "Chrome OS", 9),
							new EventSummaryPropertyCount("os_version", "81", 9)
						]
					)
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
			assert.equal(request.config.params.sort, "year");

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.Id, 
					app_id: expectedResult.data.AppId,
					name: expectedResult.data.Name,
					period: sorting,
					logs: [
						{
							time: firstEventSummaryTime,
							total: expectedResult.data.Logs[0].Total,
							properties: [
								{
									name: expectedResult.data.Logs[0].Properties[0].Name,
									value: expectedResult.data.Logs[0].Properties[0].Value,
									count: expectedResult.data.Logs[0].Properties[0].Count
								},
								{
									name: expectedResult.data.Logs[0].Properties[1].Name,
									value: expectedResult.data.Logs[0].Properties[1].Value,
									count: expectedResult.data.Logs[0].Properties[1].Count
								}
							]
						},
						{
							time: secondEventSummaryTime,
							total: expectedResult.data.Logs[1].Total,
							properties: [
								{
									name: expectedResult.data.Logs[1].Properties[0].Name,
									value: expectedResult.data.Logs[1].Properties[0].Value,
									count: expectedResult.data.Logs[1].Properties[0].Count
								},
								{
									name: expectedResult.data.Logs[1].Properties[1].Name,
									value: expectedResult.data.Logs[1].Properties[1].Value,
									count: expectedResult.data.Logs[1].Properties[1].Count
								}
							]
						}
					]
				}
			});
		});

		// Act
		let result = await GetEventByName(jwt, name, appId, null, null, sorting) as ApiResponse<Event>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.Id, expectedResult.data.Id);
		assert.equal(result.data.AppId, expectedResult.data.AppId);
		assert.equal(result.data.Name, expectedResult.data.Name);
		assert.equal(result.data.Logs[0].Time.toString(), expectedResult.data.Logs[0].Time.toString());
		assert.equal(result.data.Logs[0].Total, expectedResult.data.Logs[0].Total);
		assert.equal(result.data.Logs[0].Period, expectedResult.data.Logs[0].Period);
		assert.equal(result.data.Logs[0].Properties[0].Name, expectedResult.data.Logs[0].Properties[0].Name);
		assert.equal(result.data.Logs[0].Properties[0].Value, expectedResult.data.Logs[0].Properties[0].Value);
		assert.equal(result.data.Logs[0].Properties[0].Count, expectedResult.data.Logs[0].Properties[0].Count);
		assert.equal(result.data.Logs[0].Properties[1].Name, expectedResult.data.Logs[0].Properties[1].Name);
		assert.equal(result.data.Logs[0].Properties[1].Value, expectedResult.data.Logs[0].Properties[1].Value);
		assert.equal(result.data.Logs[0].Properties[1].Count, expectedResult.data.Logs[0].Properties[1].Count);
		assert.equal(result.data.Logs[1].Time.toString(), expectedResult.data.Logs[1].Time.toString());
		assert.equal(result.data.Logs[1].Total, expectedResult.data.Logs[1].Total);
		assert.equal(result.data.Logs[1].Period, expectedResult.data.Logs[1].Period);
		assert.equal(result.data.Logs[1].Properties[0].Name, expectedResult.data.Logs[1].Properties[0].Name);
		assert.equal(result.data.Logs[1].Properties[0].Value, expectedResult.data.Logs[1].Properties[0].Value);
		assert.equal(result.data.Logs[1].Properties[0].Count, expectedResult.data.Logs[1].Properties[0].Count);
		assert.equal(result.data.Logs[1].Properties[1].Name, expectedResult.data.Logs[1].Properties[1].Name);
		assert.equal(result.data.Logs[1].Properties[1].Value, expectedResult.data.Logs[1].Properties[1].Value);
		assert.equal(result.data.Logs[1].Properties[1].Count, expectedResult.data.Logs[1].Properties[1].Count);
	});

	it("should call getEventByName endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/analytics/event`;
		let jwt = "jwtjwtjwtjwtjwt";
		let appId = 234;
		let name = "visit";
		let start = 234234;
		let end = 2923423234234;
		let sorting = EventSummaryPeriod.Year;

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
			assert.equal(request.config.params.sort, "year");

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
		let result = await GetEventByName(jwt, name, appId, start, end, sorting) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});