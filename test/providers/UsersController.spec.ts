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
	UpdateUser, 
	SendDeleteAccountEmail, 
	SendRemoveAppEmail, 
	SendVerificationEmail, 
	SendPasswordResetEmail, 
	SetPassword, 
	SaveNewPassword,
	SaveNewEmail,
	ResetNewEmail
} from '../../lib/providers/UsersController';
import { Auth } from '../../lib/models/Auth';
import { App } from '../../lib/models/App';

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

describe("UpdateUser function", () => {
	it("should call updateUser endpoint", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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

describe("SendVerificationEmail function", () => {
	it("should call sendVerificationEmail endpoint", async () => {
		// Arrange
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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
			assert.equal(request.config.headers.ContentType, "application/json");

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
		InitStatic(DavEnvironment.Test);

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
			assert.equal(request.config.headers.ContentType, "application/json");

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
		InitStatic(DavEnvironment.Test);

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
			assert.equal(request.config.headers.ContentType, "application/json");

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
		InitStatic(DavEnvironment.Test);

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
			assert.equal(request.config.headers.ContentType, "application/json");

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
		InitStatic(DavEnvironment.Test);

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
			assert.equal(request.config.headers.ContentType, "application/json");

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
		InitStatic(DavEnvironment.Test);

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
			assert.equal(request.config.headers.ContentType, "application/json");

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
		InitStatic(DavEnvironment.Test);

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
		InitStatic(DavEnvironment.Test);

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