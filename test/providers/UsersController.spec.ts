import 'mocha';
import { assert } from 'chai';
import * as moxios from 'moxios';
import { Dav, InitStatic, ApiResponse, ApiErrorResponse } from '../../lib/Dav';
import { DavEnvironment, DavPlan } from '../../lib/models/DavUser';
import { 
	Signup, 
	SignupResponseData, 
	LoginResponseData, 
	Login, 
	UserResponseData, 
	GetUserByAuth,
	UpdateUser, 
	CreateStripeCustomerForUserResponseData,
	CreateStripeCustomerForUser,
	SendDeleteAccountEmail, 
	SendRemoveAppEmail, 
	SendVerificationEmail, 
	SendPasswordResetEmail, 
	SetPassword, 
	SaveNewPassword,
	SaveNewEmail,
	ResetNewEmail,
	DeleteUser,
	RemoveApp,
	ConfirmUser,
	CreateSessionResponseData,
	CreateSession,
	CreateSessionWithJwt
} from '../../lib/providers/UsersController';
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

describe("Signup function", () => {
	it("should call signup endpoint", async () => {
		// Arrange
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

describe("GetUserByAuth function", () => {
	it("should call getUserByAuth endpoint", async () => {
		// Arrange
		let id = 123;
		let url = `${Dav.apiBaseUrl}/auth/user/${id}/auth`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiResponse<UserResponseData> = {
			status: 200,
			data: {
				id,
				email: "testuser@dav-apps.tech",
				username: "Testuser",
				confirmed: false,
				newEmail: "testuser2@dav-apps.tech",
				oldEmail: null,
				createdAt: "Gestern",
				updatedAt: "Heute",
				plan: 0,
				periodEnd: null,
				subscriptionStatus: 0,
				totalStorage: 2000000000,
				usedStorage: 10000,
				lastActive: null,
				avatar: "Avatar",
				avatarEtag: "asdasdasdasd",
				apps: [new App(201, "TestApp", "TestApp is a very good app!", true, "testapp.dav-apps.tech", null, null, 20000)]
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
					email: expectedResult.data.email,
					username: expectedResult.data.username,
					confirmed: expectedResult.data.confirmed,
					new_email: expectedResult.data.newEmail,
					old_email: expectedResult.data.oldEmail,
					created_at: expectedResult.data.createdAt,
					updated_at: expectedResult.data.updatedAt,
					plan: expectedResult.data.plan,
					period_end: expectedResult.data.periodEnd,
					subscription_status: expectedResult.data.subscriptionStatus,
					total_storage: expectedResult.data.totalStorage,
					used_storage: expectedResult.data.usedStorage,
					last_active: expectedResult.data.lastActive,
					avatar: expectedResult.data.avatar,
					avatar_etag: expectedResult.data.avatarEtag,
					apps: [{
						id: expectedResult.data.apps[0].Id,
						name: expectedResult.data.apps[0].Name,
						description: expectedResult.data.apps[0].Description,
						published: expectedResult.data.apps[0].Published,
						link_web: expectedResult.data.apps[0].LinkWeb,
						link_play: expectedResult.data.apps[0].LinkPlay,
						link_windows: expectedResult.data.apps[0].LinkWindows,
						used_storage: expectedResult.data.apps[0].UsedStorage
					}]
				}
			})
		});

		// Act
		let result = await GetUserByAuth(auth, id) as ApiResponse<UserResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.email, expectedResult.data.email);
		assert.equal(result.data.username, expectedResult.data.username);
		assert.equal(result.data.confirmed, expectedResult.data.confirmed);
		assert.equal(result.data.newEmail, expectedResult.data.newEmail);
		assert.equal(result.data.oldEmail, expectedResult.data.oldEmail);
		assert.equal(result.data.createdAt, expectedResult.data.createdAt);
		assert.equal(result.data.updatedAt, expectedResult.data.updatedAt);
		assert.equal(result.data.plan, expectedResult.data.plan);
		assert.equal(result.data.periodEnd, expectedResult.data.periodEnd);
		assert.equal(result.data.subscriptionStatus, expectedResult.data.subscriptionStatus);
		assert.equal(result.data.totalStorage, expectedResult.data.totalStorage);
		assert.equal(result.data.usedStorage, expectedResult.data.usedStorage);
		assert.equal(result.data.lastActive, expectedResult.data.lastActive);
		assert.equal(result.data.avatar, expectedResult.data.avatar);
		assert.equal(result.data.avatarEtag, expectedResult.data.avatarEtag);
		assert.equal(result.data.apps[0].Id, expectedResult.data.apps[0].Id);
		assert.equal(result.data.apps[0].Name, expectedResult.data.apps[0].Name);
		assert.equal(result.data.apps[0].Description, expectedResult.data.apps[0].Description);
		assert.equal(result.data.apps[0].Published, expectedResult.data.apps[0].Published);
		assert.equal(result.data.apps[0].LinkWeb, expectedResult.data.apps[0].LinkWeb);
		assert.equal(result.data.apps[0].LinkPlay, expectedResult.data.apps[0].LinkPlay);
		assert.equal(result.data.apps[0].LinkWindows, expectedResult.data.apps[0].LinkWindows);
		assert.equal(result.data.apps[0].UsedStorage, expectedResult.data.apps[0].UsedStorage);
	});

	it("should call getUserByAuth endpoint with error", async () => {
		// Arrange
		let id = 123;
		let url = `${Dav.apiBaseUrl}/auth/user/${id}/auth`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
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
		let result = await GetUserByAuth(auth, id) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("UpdateUser function", () => {
	it("should call updateUser endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/user`;
		let jwt = "jwtjwtjwt";

		let updatedEmail = "dav2071@dav-apps.tech";
		let updatedUsername = "dav2071";

		let expectedResult: ApiResponse<UserResponseData> = {
			status: 200,
			data: {
				id: 2,
				email: "dav2070@dav-apps.tech",
				username: updatedUsername,
				confirmed: true,
				newEmail: updatedEmail,
				oldEmail: null,
				createdAt: "Heute",
				updatedAt: "Morgen",
				plan: 1,
				periodEnd: null,
				subscriptionStatus: 0,
				totalStorage: 2000000000,
				usedStorage: 10000,
				lastActive: null,
				avatar: "Avatar",
				avatarEtag: "asdasdasdasd",
				apps: [new App(201, "TestApp", "TestApp is a very good app!", true, "testapp.dav-apps.tech", null, null, 20000)]
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'put');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email, updatedEmail);
			assert.equal(data.username, updatedUsername);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					email: expectedResult.data.email,
					username: expectedResult.data.username,
					confirmed: expectedResult.data.confirmed,
					new_email: expectedResult.data.newEmail,
					old_email: expectedResult.data.oldEmail,
					created_at: expectedResult.data.createdAt,
					updated_at: expectedResult.data.updatedAt,
					plan: expectedResult.data.plan,
					period_end: expectedResult.data.periodEnd,
					subscription_status: expectedResult.data.subscriptionStatus,
					total_storage: expectedResult.data.totalStorage,
					used_storage: expectedResult.data.usedStorage,
					last_active: expectedResult.data.lastActive,
					avatar: expectedResult.data.avatar,
					avatar_etag: expectedResult.data.avatarEtag,
					apps: [{
						id: expectedResult.data.apps[0].Id,
						name: expectedResult.data.apps[0].Name,
						description: expectedResult.data.apps[0].Description,
						published: expectedResult.data.apps[0].Published,
						link_web: expectedResult.data.apps[0].LinkWeb,
						link_play: expectedResult.data.apps[0].LinkPlay,
						link_windows: expectedResult.data.apps[0].LinkWindows,
						used_storage: expectedResult.data.apps[0].UsedStorage
					}]
				}
			});
		});

		// Act
		let result = await UpdateUser(jwt, {
			email: updatedEmail,
			username: updatedUsername
		}) as ApiResponse<UserResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.email, expectedResult.data.email);
		assert.equal(result.data.username, expectedResult.data.username);
		assert.equal(result.data.confirmed, expectedResult.data.confirmed);
		assert.equal(result.data.newEmail, expectedResult.data.newEmail);
		assert.equal(result.data.oldEmail, expectedResult.data.oldEmail);
		assert.equal(result.data.createdAt, expectedResult.data.createdAt);
		assert.equal(result.data.updatedAt, expectedResult.data.updatedAt);
		assert.equal(result.data.plan, expectedResult.data.plan);
		assert.equal(result.data.periodEnd, expectedResult.data.periodEnd);
		assert.equal(result.data.subscriptionStatus, expectedResult.data.subscriptionStatus);
		assert.equal(result.data.totalStorage, expectedResult.data.totalStorage);
		assert.equal(result.data.usedStorage, expectedResult.data.usedStorage);
		assert.equal(result.data.lastActive, expectedResult.data.lastActive);
		assert.equal(result.data.avatar, expectedResult.data.avatar);
		assert.equal(result.data.avatarEtag, expectedResult.data.avatarEtag);
		assert.equal(result.data.apps[0].Id, expectedResult.data.apps[0].Id);
		assert.equal(result.data.apps[0].Name, expectedResult.data.apps[0].Name);
		assert.equal(result.data.apps[0].Description, expectedResult.data.apps[0].Description);
		assert.equal(result.data.apps[0].Published, expectedResult.data.apps[0].Published);
		assert.equal(result.data.apps[0].LinkWeb, expectedResult.data.apps[0].LinkWeb);
		assert.equal(result.data.apps[0].LinkPlay, expectedResult.data.apps[0].LinkPlay);
		assert.equal(result.data.apps[0].LinkWindows, expectedResult.data.apps[0].LinkWindows);
		assert.equal(result.data.apps[0].UsedStorage, expectedResult.data.apps[0].UsedStorage);
	});

	it("should call updateUser endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/user`;
		let jwt = "jwtjwtjwt";

		let updatedEmail = "dav2071@dav-apps.tech";
		let updatedUsername = "dav2071";

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
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
			assert.equal(data.email, updatedEmail);
			assert.equal(data.username, updatedUsername);

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
		let result = await UpdateUser(jwt, {
			email: updatedEmail,
			username: updatedUsername
		}) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("CreateStripeCustomerForUser function", () => {
	it("should call createStripeCustomerForUser endpoint", async () => {
		// Arrange
		let jwt = "jwtjwtjwtjwt";
		let url = `${Dav.apiBaseUrl}/auth/user/stripe`;

		let expectedResult: ApiResponse<CreateStripeCustomerForUserResponseData> = {
			status: 201,
			data: {
				stripe_customer_id: "stripe_customer_id"
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);

			request.respondWith({
				status: expectedResult.status,
				response: {
					stripe_customer_id: expectedResult.data.stripe_customer_id
				}
			});
		});

		// Act
		let result = await CreateStripeCustomerForUser(jwt) as ApiResponse<CreateStripeCustomerForUserResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.stripe_customer_id, expectedResult.data.stripe_customer_id);
	});

	it("should call createStripeCustomerForUser endpoint with error", async () => {
		// Arrange
		let jwt = "jwtjwtjwtjwt";
		let url = `${Dav.apiBaseUrl}/auth/user/stripe`;

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
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
		let result = await CreateStripeCustomerForUser(jwt) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("DeleteUser function", () => {
	it("should call deleteUser endpoint", async () => {
		// Arrange
		let userId = 23;
		let emailConfirmationToken = "emailconfirmationtoken";
		let passwordConfirmationToken = "passwordconfirmationtoken";
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'delete');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email_confirmation_token, emailConfirmationToken);
			assert.equal(data.password_confirmation_token, passwordConfirmationToken);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await DeleteUser(auth, userId, emailConfirmationToken, passwordConfirmationToken) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call deleteUser endpoint with error", async () => {
		// Arrange
		let userId = 23;
		let emailConfirmationToken = "emailconfirmationtoken";
		let passwordConfirmationToken = "passwordconfirmationtoken";
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'delete');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email_confirmation_token, emailConfirmationToken);
			assert.equal(data.password_confirmation_token, passwordConfirmationToken);

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
		let result = await DeleteUser(auth, userId, emailConfirmationToken, passwordConfirmationToken) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("RemoveApp function", () => {
	it("should call removeApp endpoint", async () => {
		// Arrange
		let userId = 12;
		let appId = 23;
		let passwordConfirmationToken = "passwordconfirmationtoken";
		let url = `${Dav.apiBaseUrl}/auth/app/${appId}`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'delete');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.user_id, userId);
			assert.equal(data.password_confirmation_token, passwordConfirmationToken);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await RemoveApp(auth, appId, userId, passwordConfirmationToken) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call removeApp endpoint with error", async () => {
		// Arrange
		let userId = 12;
		let appId = 23;
		let passwordConfirmationToken = "passwordconfirmationtoken";
		let url = `${Dav.apiBaseUrl}/auth/app/${appId}`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'delete');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.user_id, userId);
			assert.equal(data.password_confirmation_token, passwordConfirmationToken);

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
		let result = await RemoveApp(auth, appId, userId, passwordConfirmationToken) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("ConfirmUser function", () => {
	it("should call confirmUser endpoint", async () => {
		// Arrange
		let userId = 52;
		let emailConfirmationToken = "emailconfirmationtoken";
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}/confirm`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email_confirmation_token, emailConfirmationToken);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await ConfirmUser(auth, userId, emailConfirmationToken);

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call confirmUser endpoint with error", async () => {
		// Arrange
		let userId = 52;
		let emailConfirmationToken = "emailconfirmationtoken";
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}/confirm`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email_confirmation_token, emailConfirmationToken);

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
		let result = await ConfirmUser(auth, userId, emailConfirmationToken) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("SendVerificationEmail function", () => {
	it("should call sendVerificationEmail endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/send_verification_email`;
		let jwt = "blablabla";

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await SendVerificationEmail(jwt) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call sendVerificationEmail endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/send_verification_email`;
		let jwt = "blablabla";

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
			assert.equal(request.config.method, 'post');

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
		let result = await SendVerificationEmail(jwt) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("SendDeleteAccountEmail function", () => {
	it("should call sendDeleteAccountEmail endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/send_delete_account_email`;
		let jwt = "jwtjwtjwt";

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await SendDeleteAccountEmail(jwt) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call sendDeleteAccountEmail endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/send_delete_account_email`;

		let expectedResult: ApiErrorResponse = {
			status: 401,
			errors: [{
				code: 2102,
				message: "Missing field: jwt"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');

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
		let result = await SendDeleteAccountEmail(null) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("SendRemoveAppEmail function", () => {
	it("should call sendRemoveAppEmail endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/send_remove_app_email`;
		let jwt = "asdasdoafdasd";
		let appId = 32;

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);

			let data = JSON.parse(request.config.data);
			assert.equal(data.app_id, appId);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await SendRemoveAppEmail(jwt, appId) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call sendRemoveAppEmail endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/send_remove_app_email`;
		let jwt = "asdasdasd";
		let appId = 1213;

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

			let data = JSON.parse(request.config.data);
			assert.equal(data.app_id, appId);

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
		let result = await SendRemoveAppEmail(jwt, appId) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("SendPasswordResetEmail function", () => {
	it("should call sendPasswordResetEmail endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/send_password_reset_email`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let email = "test@dav-apps.tech";

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			let data = JSON.parse(request.config.data);
			assert.equal(data.email, email);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await SendPasswordResetEmail(auth, email) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call sendPasswordResetEmail endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/send_password_reset_email`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let email = "test@dav-apps.tech";

		let expectedResult: ApiErrorResponse = {
			status: 400,
			errors: [{
				code: 2106,
				message: "Missing field: email"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			let data = JSON.parse(request.config.data);
			assert.equal(data.email, email);

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
		let result = await SendPasswordResetEmail(auth, email) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("SetPassword function", () => {
	it("should call setPassword endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/set_password`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let userId = 20;
		let passwordConfirmationToken = "confirmation_token";
		let password = "my new password";

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.user_id, userId);
			assert.equal(data.password_confirmation_token, passwordConfirmationToken);
			assert.equal(data.password, password);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await SetPassword(auth, userId, passwordConfirmationToken, password) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call setPassword endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/set_password`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let userId = 20;
		let passwordConfirmationToken = "confirmation_token";
		let password = "my new password";

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.user_id, userId);
			assert.equal(data.password_confirmation_token, passwordConfirmationToken);
			assert.equal(data.password, password);

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
		let result = await SetPassword(auth, userId, passwordConfirmationToken, password) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("SaveNewPassword function", () => {
	it("should call saveNewPassword endpoint", async () => {
		// Arrange
		let userId = 42;
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}/save_new_password`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let passwordConfirmationToken = "password_confirmation_token";

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.password_confirmation_token, passwordConfirmationToken);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await SaveNewPassword(auth, userId, passwordConfirmationToken) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call saveNewPassword endpoint with error", async () => {
		// Arrange
		let userId = 42;
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}/save_new_password`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let passwordConfirmationToken = "password_confirmation_token";

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.password_confirmation_token, passwordConfirmationToken);

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
		let result = await SaveNewPassword(auth, userId, passwordConfirmationToken) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("SaveNewEmail function", () => {
	it("should call saveNewEmail endpoint", async () => {
		// Arrange
		let userId = 42;
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}/save_new_email`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let emailConfirmationToken = "email_confirmation_token";

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email_confirmation_token, emailConfirmationToken);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await SaveNewEmail(auth, userId, emailConfirmationToken) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call saveNewEmail endpoint with error", async () => {
		// Arrange
		let userId = 42;
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}/save_new_email`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let emailConfirmationToken = "email_confirmation_token";

		let expectedResult: ApiErrorResponse = {
			status: 404,
			errors: [{
				code: 2801,
				message: "Resource does not exist: User"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email_confirmation_token, emailConfirmationToken);

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
		let result = await SaveNewEmail(auth, userId, emailConfirmationToken) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("ResetNewEmail function", () => {
	it("should call resetNewEmail endpoint", async () => {
		// Arrange
		let userId = 13;
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}/reset_new_email`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

		let expectedResult: ApiResponse<{}> = {
			status: 200,
			data: {}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);

			request.respondWith({
				status: expectedResult.status,
				response: {}
			});
		});

		// Act
		let result = await ResetNewEmail(auth, userId) as ApiResponse<{}>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
	});

	it("should call resetNewEmail endpoint with error", async () => {
		// Arrange
		let userId = 13;
		let url = `${Dav.apiBaseUrl}/auth/user/${userId}/reset_new_email`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);

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
			assert.equal(request.config.method, 'post');
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
		let result = await ResetNewEmail(auth, userId) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
	});
});

describe("CreateSession function", () => {
	it("should call createSession endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/session`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let email = "dav@dav-apps.tech";
		let password = "password";
		let appId = 4;
		let apiKey = "asdoasijdajsdoasjd";
		let deviceName = "Surface Duo";
		let deviceType = "Foldable";
		let deviceOs = "Android";

		let expectedResult: ApiResponse<CreateSessionResponseData> = {
			status: 201,
			data: {
				id: 4,
				userId: 20,
				appId,
				exp: 10000000000,
				deviceName,
				deviceType,
				deviceOs,
				jwt: "nlalbalasdapsjdasdna",
				createdAt: "Jetzt gerade"
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email, email);
			assert.equal(data.password, password);
			assert.equal(data.app_id, appId);
			assert.equal(data.api_key, apiKey);
			assert.equal(data.device_name, deviceName);
			assert.equal(data.device_type, deviceType);
			assert.equal(data.device_os, deviceOs);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					user_id: expectedResult.data.userId,
					app_id: expectedResult.data.appId,
					exp: expectedResult.data.exp,
					device_name: expectedResult.data.deviceName,
					device_type: expectedResult.data.deviceType,
					device_os: expectedResult.data.deviceOs,
					jwt: expectedResult.data.jwt,
					created_at: expectedResult.data.createdAt
				}
			});
		});

		// Act
		let result = await CreateSession(
			auth, 
			email, 
			password, 
			appId, 
			apiKey, 
			deviceName, 
			deviceType, 
			deviceOs
		) as ApiResponse<CreateSessionResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.userId, expectedResult.data.userId);
		assert.equal(result.data.appId, expectedResult.data.appId);
		assert.equal(result.data.exp, expectedResult.data.exp);
		assert.equal(result.data.deviceName, expectedResult.data.deviceName);
		assert.equal(result.data.deviceType, expectedResult.data.deviceType);
		assert.equal(result.data.deviceOs, expectedResult.data.deviceOs);
		assert.equal(result.data.jwt, expectedResult.data.jwt);
		assert.equal(result.data.createdAt, expectedResult.data.createdAt);
	});

	it("should call createSession endpoint with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/session`;
		let auth = new Auth(devApiKey, devSecretKey, devUuid);
		let email = "dav@dav-apps.tech";
		let password = "password";
		let appId = 4;
		let apiKey = "asdoasijdajsdoasjd";
		let deviceName = "Surface Duo";
		let deviceType = "Foldable";
		let deviceOs = "Android";

		let expectedResult: ApiErrorResponse = {
			status: 400,
			errors: [{
				code: 2125,
				message: "Missing field: device_name"
			}, {
				code: 2126,
				message: "Missing field: device_type"
			}, {
				code: 2127,
				message: "Missing field: device_os"
			}]
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, auth.token);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.email, email);
			assert.equal(data.password, password);
			assert.equal(data.app_id, appId);
			assert.equal(data.api_key, apiKey);
			assert.equal(data.device_name, deviceName);
			assert.equal(data.device_type, deviceType);
			assert.equal(data.device_os, deviceOs);

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message],
						[expectedResult.errors[1].code, expectedResult.errors[1].message],
						[expectedResult.errors[2].code, expectedResult.errors[2].message]
					]
				}
			});
		});

		// Act
		let result = await CreateSession(
			auth, 
			email, 
			password, 
			appId, 
			apiKey, 
			deviceName, 
			deviceType, 
			deviceOs
		) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
		assert.equal(result.errors[1].code, expectedResult.errors[1].code);
		assert.equal(result.errors[1].message, expectedResult.errors[1].message);
		assert.equal(result.errors[2].code, expectedResult.errors[2].code);
		assert.equal(result.errors[2].message, expectedResult.errors[2].message);
	});
});

describe("CreateSessionWithJwt function", () => {
	it("should call createSessionWithJwt endpoint", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/session/jwt`;
		let jwt = "jwtjwtjwtjwtjwtjwt";
		let appId = 6;
		let apiKey = "asdasdasdasdasdasd";
		let deviceName = "Surface Neo";
		let deviceType = "Foldable Laptop";
		let deviceOs = "Windows 10X";

		let expectedResult: ApiResponse<CreateSessionResponseData> = {
			status: 201, 
			data: {
				id: 4,
				userId: 21,
				appId,
				exp: 1212132423121,
				deviceName,
				deviceType,
				deviceOs,
				createdAt: "Gestern",
				jwt: "adpodfioasdjdaa"
			}
		}

		moxios.wait(() => {
			let request = moxios.requests.mostRecent();

			// Assert for the request
			assert.equal(request.config.url, url);
			assert.equal(request.config.method, 'post');
			assert.equal(request.config.headers.Authorization, jwt);
			assert.include(request.config.headers["Content-Type"], 'application/json');

			let data = JSON.parse(request.config.data);
			assert.equal(data.app_id, appId);
			assert.equal(data.api_key, apiKey);
			assert.equal(data.device_name, deviceName);
			assert.equal(data.device_type, deviceType);
			assert.equal(data.device_os, deviceOs);

			request.respondWith({
				status: expectedResult.status,
				response: {
					id: expectedResult.data.id,
					user_id: expectedResult.data.userId,
					app_id: expectedResult.data.appId,
					exp: expectedResult.data.exp,
					device_name: expectedResult.data.deviceName,
					device_type: expectedResult.data.deviceType,
					device_os: expectedResult.data.deviceOs,
					jwt: expectedResult.data.jwt,
					created_at: expectedResult.data.createdAt
				}
			});
		});

		// Act
		let result = await CreateSessionWithJwt(
			jwt, 
			appId, 
			apiKey, 
			deviceName, 
			deviceType, 
			deviceOs
		) as ApiResponse<CreateSessionResponseData>;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.data.id, expectedResult.data.id);
		assert.equal(result.data.userId, expectedResult.data.userId);
		assert.equal(result.data.appId, expectedResult.data.appId);
		assert.equal(result.data.exp, expectedResult.data.exp);
		assert.equal(result.data.deviceName, expectedResult.data.deviceName);
		assert.equal(result.data.deviceType, expectedResult.data.deviceType);
		assert.equal(result.data.deviceOs, expectedResult.data.deviceOs);
		assert.equal(result.data.jwt, expectedResult.data.jwt);
		assert.equal(result.data.createdAt, expectedResult.data.createdAt);
	});

	it("should call createSessionWithJwt with error", async () => {
		// Arrange
		let url = `${Dav.apiBaseUrl}/auth/session/jwt`;
		let jwt = "jwtjwtjwtjwtjwtjwt";
		let appId = 6;
		let apiKey = "asdasdasdasdasdasd";
		let deviceName = "Surface Neo";
		let deviceType = "Foldable Laptop";
		let deviceOs = "Windows 10X";

		let expectedResult: ApiErrorResponse = {
			status: 400,
			errors: [{
				code: 2125,
				message: "Missing field: device_name"
			}, {
				code: 2126,
				message: "Missing field: device_type"
			}, {
				code: 2127,
				message: "Missing field: device_os"
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
			assert.equal(data.app_id, appId);
			assert.equal(data.api_key, apiKey);
			assert.equal(data.device_name, deviceName);
			assert.equal(data.device_type, deviceType);
			assert.equal(data.device_os, deviceOs);

			request.respondWith({
				status: expectedResult.status,
				response: {
					errors: [
						[expectedResult.errors[0].code, expectedResult.errors[0].message],
						[expectedResult.errors[1].code, expectedResult.errors[1].message],
						[expectedResult.errors[2].code, expectedResult.errors[2].message]
					]
				}
			});
		});

		// Act
		let result = await CreateSessionWithJwt(
			jwt, 
			appId, 
			apiKey, 
			deviceName, 
			deviceType, 
			deviceOs
		) as ApiErrorResponse;

		// Assert for the response
		assert.equal(result.status, expectedResult.status);
		assert.equal(result.errors[0].code, expectedResult.errors[0].code);
		assert.equal(result.errors[0].message, expectedResult.errors[0].message);
		assert.equal(result.errors[1].code, expectedResult.errors[1].code);
		assert.equal(result.errors[1].message, expectedResult.errors[1].message);
		assert.equal(result.errors[2].code, expectedResult.errors[2].code);
		assert.equal(result.errors[2].message, expectedResult.errors[2].message);
	});
});