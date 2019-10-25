import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { CreateEventLog, EventLogResponseData } from '../../lib/providers/AnalyticsController';

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