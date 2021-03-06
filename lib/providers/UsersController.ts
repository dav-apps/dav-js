import * as axios from 'axios';
import { DavPlan } from "../models/DavUser";
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';
import { Auth } from '../models/Auth';
import { App, ConvertObjectArrayToApps } from '../models/App';

export interface SignupResponseData{
	id: number;
	email: string;
	username: string;
	confirmed: boolean;
	plan: DavPlan;
	totalStorage: number;
	usedStorage: number;
	jwt: string;
}

export async function Signup(
	auth: Auth, 
	email: string, 
	password: string, 
	username: string, 
	appId: number = -1, 
	apiKey: string = null,
	deviceName: string = null,
	deviceType: string = null,
	deviceOs: string = null
) : Promise<(ApiResponse<SignupResponseData> | ApiErrorResponse)>{
	let url = `${Dav.apiBaseUrl}/auth/signup`;

	let data = {};
	let params = {
		email,
		password,
		username
	}

	if(appId != -1){
		params["app_id"] = appId;

		data = {
			api_key: apiKey,
			device_name: deviceName,
			device_type: deviceType,
			device_os: deviceOs
		}
	}

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: auth.token
			},
			params,
			data
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				email: response.data.email,
				username: response.data.username,
				confirmed: response.data.confirmed,
				plan: response.data.plan,
				totalStorage: response.data.total_storage,
				usedStorage: response.data.used_storage,
				jwt: response.data.jwt
			}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export interface LoginResponseData{
	jwt: string;
	userId: number;
}

export async function Login(
	auth: Auth,
	email: string,
	password: string
) : Promise<(ApiResponse<LoginResponseData> | ApiErrorResponse)>{
	let url = `${Dav.apiBaseUrl}/auth/login`;

	let params = {
		email,
		password
	}

	try{
		let response = await axios.default({
			method: 'get',
			url,
			headers: {
				Authorization: auth.token
			},
			params
		});

		return {
			status: response.status,
			data: {
				jwt: response.data.jwt,
				userId: response.data.user_id
			}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export interface UserResponseData{
	id: number;
	email: string;
	username: string;
	confirmed: boolean;
	newEmail: string;
	oldEmail: string;
	createdAt: string;
	updatedAt: string;
	plan: number;
	periodEnd: string;
	subscriptionStatus: number;
	totalStorage: number;
	usedStorage: number;
	lastActive: string;
	avatar: string;
	avatarEtag: string;
	apps: App[];
}

export async function GetUserByAuth(auth: Auth, id: number) : Promise<ApiResponse<UserResponseData> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/auth/user/${id}/auth`,
			headers: {
				Authorization: auth.token
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				email: response.data.email,
				username: response.data.username,
				confirmed: response.data.confirmed,
				newEmail: response.data.new_email,
				oldEmail: response.data.old_email,
				createdAt: response.data.created_at,
				updatedAt: response.data.updated_at,
				plan: response.data.plan,
				periodEnd: response.data.period_end,
				subscriptionStatus: response.data.subscription_status,
				totalStorage: response.data.total_storage,
				usedStorage: response.data.used_storage,
				lastActive: response.data.last_active,
				avatar: response.data.avatar,
				avatarEtag: response.data.avatar_etag,
				apps: ConvertObjectArrayToApps(response.data.apps)
			}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function UpdateUser(
	jwt: string,
	properties: {
		email?: string,
		username?: string,
		password?: string,
		avatar?: string
	}
) : Promise<(ApiResponse<UserResponseData> | ApiErrorResponse)>{
	let url = `${Dav.apiBaseUrl}/auth/user`;

	let data: object = {};

	if(properties.email) data["email"] = properties.email;
	if(properties.username) data["username"] = properties.username;
	if(properties.password) data["password"] = properties.password;
	if(properties.avatar) data["avatar"] = properties.avatar;

	try{
		let response = await axios.default({
			method: 'put',
			url,
			headers: {
				Authorization: jwt
			},
			data
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				email: response.data.email,
				username: response.data.username,
				confirmed: response.data.confirmed,
				newEmail: response.data.new_email,
				oldEmail: response.data.old_email,
				createdAt: response.data.created_at,
				updatedAt: response.data.updated_at,
				plan: response.data.plan,
				periodEnd: response.data.period_end,
				subscriptionStatus: response.data.subscription_status,
				totalStorage: response.data.total_storage,
				usedStorage: response.data.used_storage,
				lastActive: response.data.last_active,
				avatar: response.data.avatar,
				avatarEtag: response.data.avatar_etag,
				apps: ConvertObjectArrayToApps(response.data.apps)
			}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export interface CreateStripeCustomerForUserResponseData{
	stripe_customer_id: string;
}

export async function CreateStripeCustomerForUser(jwt: string) : Promise<ApiResponse<CreateStripeCustomerForUserResponseData> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/user/stripe`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: jwt
			}
		});

		return {
			status: response.status,
			data: {
				stripe_customer_id: response.data.stripe_customer_id
			}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function DeleteUser(auth: Auth, userId: number, emailConfirmationToken: string, passwordConfirmationToken: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/user/${userId}`;

	try{
		let response = await axios.default({
			method: 'delete',
			url,
			headers: {
				Authorization: auth.token
			},
			data: {
				email_confirmation_token: emailConfirmationToken,
				password_confirmation_token: passwordConfirmationToken
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function RemoveApp(auth: Auth, appId: number, userId: number, passwordConfirmationToken: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/app/${appId}`;

	try{
		let response = await axios.default({
			method: 'delete',
			url,
			headers: {
				Authorization: auth.token
			},
			data: {
				user_id: userId,
				password_confirmation_token: passwordConfirmationToken
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function ConfirmUser(auth: Auth, userId: number, emailConfirmationToken: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/user/${userId}/confirm`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: auth.token
			},
			data: {
				email_confirmation_token: emailConfirmationToken
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function SendVerificationEmail(jwt: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/send_verification_email`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: jwt
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function SendDeleteAccountEmail(jwt: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/send_delete_account_email`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: jwt
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function SendRemoveAppEmail(jwt: string, appId: number) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/send_remove_app_email`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			data: {
				app_id: appId
			},
			headers: {
				Authorization: jwt
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function SendPasswordResetEmail(auth: Auth, email: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/send_password_reset_email`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			data: {
				email
			},
			headers: {
				Authorization: auth.token
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function SetPassword(auth: Auth, userId: number, passwordConfirmationToken: string, password: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/set_password`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: auth.token
			},
			data: {
				user_id: userId,
				password_confirmation_token: passwordConfirmationToken,
				password
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function SaveNewPassword(auth: Auth, userId: number, passwordConfirmationToken: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/user/${userId}/save_new_password`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: auth.token
			},
			data: {
				password_confirmation_token: passwordConfirmationToken
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function SaveNewEmail(auth: Auth, userId: number, emailConfirmationToken: string) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/user/${userId}/save_new_email`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: auth.token
			},
			data: {
				email_confirmation_token: emailConfirmationToken
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function ResetNewEmail(auth: Auth, userId: number) : Promise<ApiResponse<{}> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/user/${userId}/reset_new_email`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: auth.token
			}
		});

		return {
			status: response.status,
			data: {}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export interface CreateSessionResponseData{
	id: number;
	userId: number;
	appId: number;
	exp: number;
	deviceName: string;
	deviceType: string;
	deviceOs: string;
	jwt: string;
	createdAt: string;
}

export async function CreateSession(
	auth: Auth,
	email: string,
	password: string,
	appId: number,
	apiKey: string,
	deviceName: string,
	deviceType: string,
	deviceOs: string
) : Promise<ApiResponse<CreateSessionResponseData> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/session`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: auth.token
			},
			data: {
				email,
				password,
				app_id: appId,
				api_key: apiKey,
				device_name: deviceName,
				device_type: deviceType,
				device_os: deviceOs
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				appId: response.data.app_id,
				exp: response.data.exp,
				deviceName: response.data.device_name,
				deviceType: response.data.device_type,
				deviceOs: response.data.device_os,
				jwt: response.data.jwt,
				createdAt: response.data.created_at
			}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}

export async function CreateSessionWithJwt(
	jwt: string,
	appId: number,
	apiKey: string,
	deviceName: string,
	deviceType: string,
	deviceOs: string
) : Promise<ApiResponse<CreateSessionResponseData> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/auth/session/jwt`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: jwt
			},
			data: {
				app_id: appId,
				api_key: apiKey,
				device_name: deviceName,
				device_type: deviceType,
				device_os: deviceOs
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				appId: response.data.app_id,
				exp: response.data.exp,
				deviceName: response.data.device_name,
				deviceType: response.data.device_type,
				deviceOs: response.data.device_os,
				jwt: response.data.jwt,
				createdAt: response.data.created_at
			}
		}
	}catch(error){
		if(error.response){
			// Api error
			return ConvertHttpResponseToErrorResponse(error.response);
		}else{
			// Javascript error
			return {status: -1, errors: []};
		}
	}
}