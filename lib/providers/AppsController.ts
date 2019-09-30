import * as axios from 'axios';
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';
import { Auth } from '../models/Auth';

export interface GetAllAppsResponseData{
	apps: {
		id: number,
		name: string,
		description: string,
		dev_id: number,
		published: boolean,
		created_at: string,
		updated_at: string,
		link_web: string,
		link_play: string,
		link_windows: string
	}[];
}

export async function GetAllApps(auth: Auth) : Promise<(ApiResponse<GetAllAppsResponseData> | ApiErrorResponse)>{
	let url = `${Dav.apiBaseUrl}/apps/apps/all`;

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
				apps: response.data.apps
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