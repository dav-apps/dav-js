import * as axios from 'axios';
import { App, ConvertObjectArrayToApps } from '../models/App';
import { Auth } from '../models/Auth';
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';

export interface DevResponseData{
	id: number;
	userId: number;
	apiKey: string;
	secretKey: string;
	uuid: string;
	createdAt: string;
	updatedAt: string;
	apps: App[];
}

export async function GetDevByApiKey(auth: Auth, apiKey: string) : Promise<ApiResponse<DevResponseData> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/devs/dev/${apiKey}`;

	try{
		let response = await axios.default({
			method: 'get',
			url,
			headers: {
				Authorization: auth.token
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				apiKey: response.data.api_key,
				secretKey: response.data.secret_key,
				uuid: response.data.uuid,
				createdAt: response.data.created_at,
				updatedAt: response.data.updated_at,
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