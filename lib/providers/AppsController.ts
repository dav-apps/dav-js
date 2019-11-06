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

export async function UpdateApp(jwt: string, id: number, properties: {
	name?: string,
	description?: string,
	linkWeb?: string,
	linkPlay?: string,
	linkWindows?: string
}) : Promise<ApiResponse<App> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/apps/app/${id}`;
	let data: object = {};

	if(properties.name) data["name"] = properties.name;
	if(properties.description) data["description"] = properties.description;
	if(properties.linkWeb) data["link_web"] = properties.linkWeb;
	if(properties.linkPlay) data["link_play"] = properties.linkPlay;
	if(properties.linkWindows) data["link_windows"] = properties.linkWindows;

	try{
		let response = await axios.default({
			method: 'put',
			url,
			headers: {
				Authorization: jwt,
				ContentType: 'application/json'
			},
			data
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
				response.data.link_windows
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