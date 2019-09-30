import * as axios from 'axios';
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';
import { Auth } from '../models/Auth';
import { App, ConvertObjectArrayToApps } from '../models/App';

export async function GetAllApps(auth: Auth) : Promise<(ApiResponse<App[]> | ApiErrorResponse)>{
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
			data: ConvertObjectArrayToApps(response.data.apps)
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