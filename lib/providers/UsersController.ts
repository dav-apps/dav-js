import * as axios from 'axios';
import { DavPlan } from "../models/DavUser";
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';
import { Auth } from '../models/Auth';

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
	};

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
				'Authorization': auth.token
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