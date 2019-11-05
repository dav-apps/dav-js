import * as axios from 'axios';
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';
import { Auth } from '../models/Auth';
import { App, ConvertObjectArrayToApps } from '../models/App';
import { ConvertObjectArrayToTables } from '../models/Table';
import { ConvertObjectArrayToEvents } from '../models/Event';

export async function GetApp(jwt: string, id: number) : Promise<ApiResponse<App> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/apps/app/${id}`;

	try{
		let response = await axios.default({
			method: 'get',
			url,
			headers: {
				Authorization: jwt
			}
		});

		return {
			status: response.status,
			data: new App(
				response.data.id,
				response.data.name,
				response.data.description,
				response.data.published,
				response.data.link_web,
				response.data.link_play,
				response.data.link_windows,
				null,
				ConvertObjectArrayToTables(response.data.tables),
				ConvertObjectArrayToEvents(response.data.events)
			)
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