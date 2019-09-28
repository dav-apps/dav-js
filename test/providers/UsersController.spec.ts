import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios'
import { Dav, InitStatic, ApiResponse, Init, ApiErrorResponse, userKey, ApiError } from '../../lib/Dav';
import { DavEnvironment, DavPlan } from '../../lib/models/DavUser';
import { Signup, SignupResponseData, LoginResponseData, Login } from '../../lib/providers/UsersController';
import { Auth } from '../../lib/models/Auth';

beforeEach(() => {
	moxios.install();
});

afterEach(() => {
	moxios.uninstall();
});

const devApiKey = "eUzs3PQZYweXvumcWvagRHjdUroGe5Mo7kN1inHm";
const devSecretKey = "Stac8pRhqH0CSO5o9Rxqjhu7vyVp4PINEMJumqlpvRQai4hScADamQ";
const devUuid = "d133e303-9dbb-47db-9531-008b20e5aae8";

describe("Signup function", () => {
	it("should call signup endpoint", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);
		
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let url = `${Dav.apiBaseUrl}/auth/signup`;

		let email = "dav2070@dav-apps.tech";
		let password = "davdavdav";
		let username = "dav2070";
		
		let expectedResult: ApiResponse<SignupResponseData> = {
			status: 201,
			data: {
				id: 1,
				email,
				username,
				confirmed: false,
				plan: DavPlan.Free,
				totalStorage: 50000,
				usedStorage: 0,
				jwt: "jwtjwtjwt"
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			assert.equal(request.config.params.email, email);
			assert.equal(request.config.params.password, password);
			assert.equal(request.config.params.username, username);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					email: expectedResult.data.email,
					username: expectedResult.data.username,
					confirmed: expectedResult.data.confirmed,
					plan: expectedResult.data.plan,
					total_storage: expectedResult.data.totalStorage,
					used_storage: expectedResult.data.usedStorage,
					jwt: expectedResult.data.jwt
				}
			});
		});

		// Act
		let result = await Signup(auth, email, password, username) as ApiResponse<SignupResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.email, expectedResult.data.email);
		assert.equal(result.data.username, expectedResult.data.username);
		assert.equal(result.data.confirmed, expectedResult.data.confirmed);
		assert.equal(result.data.plan, expectedResult.data.plan);
		assert.equal(result.data.totalStorage, expectedResult.data.totalStorage);
		assert.equal(result.data.usedStorage, expectedResult.data.usedStorage);
		assert.equal(result.data.jwt, expectedResult.data.jwt);
	});

	it("should call signup endpoint with error", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let url = `${Dav.apiBaseUrl}/auth/signup`;

		let email = "dav2070@dav-apps.tech";
		let password = "davdavdav";
		let username = "dav2070";

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: 1101,
					message: "Action not allowed"
				}
			]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			assert.equal(request.config.params.email, email);
			assert.equal(request.config.params.password, password);
			assert.equal(request.config.params.username, username);

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
		let result = await Signup(auth, email, password, username) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});

	it("should call signup endpoint with session parameters", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let url = `${Dav.apiBaseUrl}/auth/signup`;

		let email = "dav2070@dav-apps.tech";
		let password = "davdavdav";
		let username = "dav2070";
		let appId = 5;
		let apiKey = "testdevapikey";
		let deviceName = "Surface Phone";
		let deviceType = "6 in 1";
		let deviceOs = "Core OS";

		let expectedResult: ApiResponse<SignupResponseData> = {
			status: 201,
			data: {
				id: 1,
				email,
				username,
				confirmed: false,
				plan: DavPlan.Free,
				totalStorage: 500000,
				usedStorage: 0,
				jwt: "jwtjwtjwt,1"
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			assert.equal(request.config.params.email, email);
			assert.equal(request.config.params.password, password);
			assert.equal(request.config.params.username, username);
			assert.equal(request.config.params.app_id, appId);

			let data = JSON.parse(request.config.data);
			assert.equal(data.api_key, apiKey);
			assert.equal(data.device_name, deviceName);
			assert.equal(data.device_type, deviceType);
			assert.equal(data.device_os, deviceOs);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					email: expectedResult.data.email,
					username: expectedResult.data.username,
					confirmed: expectedResult.data.confirmed,
					plan: expectedResult.data.plan,
					total_storage: expectedResult.data.totalStorage,
					used_storage: expectedResult.data.usedStorage,
					jwt: expectedResult.data.jwt
				}
			});
		});

		// Act
		let result = await Signup(auth, email, password, username, appId, apiKey, deviceName, deviceType, deviceOs) as ApiResponse<SignupResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.email, expectedResult.data.email);
		assert.equal(result.data.username, expectedResult.data.username);
		assert.equal(result.data.confirmed, expectedResult.data.confirmed);
		assert.equal(result.data.plan, expectedResult.data.plan);
		assert.equal(result.data.totalStorage, expectedResult.data.totalStorage);
		assert.equal(result.data.usedStorage, expectedResult.data.usedStorage);
		assert.equal(result.data.jwt, expectedResult.data.jwt);
	});

	it("should call signup endpoint with session parameters and error", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let url = `${Dav.apiBaseUrl}/auth/signup`;

		let email = "dav2070@dav-apps.tech";
		let password = "davdavdav";
		let username = "dav2070";
		let appId = 5;
		let apiKey = "testdevapikey";
		let deviceName = "Surface Phone";
		let deviceType = "6 in 1";
		let deviceOs = "Core OS";

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: 1101,
					message: "Action not allowed"
				}
			]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			assert.equal(request.config.params.email, email);
			assert.equal(request.config.params.password, password);
			assert.equal(request.config.params.username, username);
			assert.equal(request.config.params.app_id, appId);

			let data = JSON.parse(request.config.data);
			assert.equal(data.api_key, apiKey);
			assert.equal(data.device_name, deviceName);
			assert.equal(data.device_type, deviceType);
			assert.equal(data.device_os, deviceOs);

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
		let result = await Signup(auth, email, password, username, appId, apiKey, deviceName, deviceType, deviceOs) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("Login function", () => {
	it("should call login endpoint", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let url = `${Dav.apiBaseUrl}/auth/login`;

		let email = "dav2070@dav-apps.tech";
		let password = "davdavdav";
		let jwt = "jwtjwtjwt";
		let userId = 63;

		let expectedResult: ApiResponse<LoginResponseData> = {
			status: 200,
			data: {
				jwt,
				userId
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
			assert.equal(request.config.headers.Authorization, auth.token);

			assert.equal(request.config.params.email, email);
			assert.equal(request.config.params.password, password);

			request.respondWith({
				status: expectedResult.status,
				response: {
					jwt: expectedResult.data.jwt,
					user_id: expectedResult.data.userId
				}
			});
		});

		// Act
		let result = await Login(auth, email, password) as ApiResponse<LoginResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.jwt, expectedResult.data.jwt);
		assert.equal(result.data.userId, expectedResult.data.userId);
	});

	it("should call login endpoint with error", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let url = `${Dav.apiBaseUrl}/auth/login`;

		let email = "dav2070@dav-apps.tech";
		let password = "davdavdav";

		let expectedResult: ApiErrorResponse = {
			status: 403,
			errors: [
				{
					code: 1101,
					message: "Action not allowed"
				}
			]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'get');
			assert.equal(request.config.headers.Authorization, auth.token);

			assert.equal(request.config.params.email, email);
			assert.equal(request.config.params.password, password);

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
		let result = await Login(auth, email, password) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});