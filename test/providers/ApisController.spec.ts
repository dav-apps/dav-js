import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment } from '../../lib/models/DavUser';
import { Api } from '../../lib/models/Api';
import { CreateApi, GetApi } from '../../lib/providers/ApisController';
import { ApiEndpoint } from '../../lib/models/ApiEndpoint';
import { ApiFunction } from '../../lib/models/ApiFunction';
import { ApiError } from '../../lib/models/ApiError';

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

describe("GetApi function", () => {
	it("should call getApi endpoint", async () => {
		// Arrange
		let id = 23;
		let url = `${Dav.apiBaseUrl}/api/${id}`;
		let jwt = "daodnfsoafndasda";

		let expectedResult: ApiResponse<Api> = {
			status: 200,
			data: new Api(
				id,
				"Test API",
				[
					new ApiEndpoint(4, "test", "POST", "(log 'Hello World')"),
					new ApiEndpoint(5, "test/:id", "GET", "(log id)")
				],
				[
					new ApiFunction(6, "TestFunction", ["bla", "test"], "(bla + ' ' + test)"),
					new ApiFunction(7, "Greeter", ["message"], "(log message)")
				],
				[
					new ApiError(8, 1000, "Resource does not exist: Bla"),
					new ApiError(9, 1100, "Missing field: message")
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
					endpoints: [
						{
							id: expectedResult.data.Endpoints[0].Id,
							path: expectedResult.data.Endpoints[0].Path,
							method: expectedResult.data.Endpoints[0].Method,
							commands: expectedResult.data.Endpoints[0].Commands
						},
						{
							id: expectedResult.data.Endpoints[1].Id,
							path: expectedResult.data.Endpoints[1].Path,
							method: expectedResult.data.Endpoints[1].Method,
							commands: expectedResult.data.Endpoints[1].Commands
						}
					],
					functions: [
						{
							id: expectedResult.data.Functions[0].Id,
							name: expectedResult.data.Functions[0].Name,
							params: expectedResult.data.Functions[0].Params.join(','),
							commands: expectedResult.data.Functions[0].Commands
						},
						{
							id: expectedResult.data.Functions[1].Id,
							name: expectedResult.data.Functions[1].Name,
							params: expectedResult.data.Functions[1].Params.join(','),
							commands: expectedResult.data.Functions[1].Commands
						}
					],
					errors: [
						{
							id: expectedResult.data.Errors[0].Id,
							code: expectedResult.data.Errors[0].Code,
							message: expectedResult.data.Errors[0].Message
						},
						{
							id: expectedResult.data.Errors[1].Id,
							code: expectedResult.data.Errors[1].Code,
							message: expectedResult.data.Errors[1].Message
						}
					]
				}
			});
		});

		// Act
		let result = await GetApi(jwt, id) as ApiResponse<Api>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.Id, expectedResult.data.Id);
		assert.equal(result.data.Name, expectedResult.data.Name);

		assert.equal(result.data.Endpoints[0].Id, expectedResult.data.Endpoints[0].Id);
		assert.equal(result.data.Endpoints[0].Path, expectedResult.data.Endpoints[0].Path);
		assert.equal(result.data.Endpoints[0].Method, expectedResult.data.Endpoints[0].Method);
		assert.equal(result.data.Endpoints[0].Commands, expectedResult.data.Endpoints[0].Commands);

		assert.equal(result.data.Endpoints[1].Id, expectedResult.data.Endpoints[1].Id);
		assert.equal(result.data.Endpoints[1].Path, expectedResult.data.Endpoints[1].Path);
		assert.equal(result.data.Endpoints[1].Method, expectedResult.data.Endpoints[1].Method);
		assert.equal(result.data.Endpoints[1].Commands, expectedResult.data.Endpoints[1].Commands);

		assert.equal(result.data.Functions[0].Id, expectedResult.data.Functions[0].Id);
		assert.equal(result.data.Functions[0].Name, expectedResult.data.Functions[0].Name);
		assert.equal(result.data.Functions[0].Params.join(','), expectedResult.data.Functions[0].Params.join(','));
		assert.equal(result.data.Functions[0].Commands, expectedResult.data.Functions[0].Commands);

		assert.equal(result.data.Functions[1].Id, expectedResult.data.Functions[1].Id);
		assert.equal(result.data.Functions[1].Name, expectedResult.data.Functions[1].Name);
		assert.equal(result.data.Functions[1].Params.join(','), expectedResult.data.Functions[1].Params.join(','));
		assert.equal(result.data.Functions[1].Commands, expectedResult.data.Functions[1].Commands);

		assert.equal(result.data.Errors[0].Id, expectedResult.data.Errors[0].Id);
		assert.equal(result.data.Errors[0].Code, expectedResult.data.Errors[0].Code);
		assert.equal(result.data.Errors[0].Message, expectedResult.data.Errors[0].Message);

		assert.equal(result.data.Errors[1].Id, expectedResult.data.Errors[1].Id);
		assert.equal(result.data.Errors[1].Code, expectedResult.data.Errors[1].Code);
		assert.equal(result.data.Errors[1].Message, expectedResult.data.Errors[1].Message);
	});

	it("should call getApi endpoint with error", async () => {
		// Arrange
		let id = 23;
		let url = `${Dav.apiBaseUrl}/api/${id}`;
		let jwt = "daodnfsoafndasda";

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2815,
				message: "Resource does not exist: Api"
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
			})
		});

		// Act
		let result = await GetApi(jwt, id) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});