import * as axios from 'axios';
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';
import { Auth } from '../models/Auth';
import { App, ConvertObjectArrayToApps } from '../models/App';
import { Table, ConvertObjectArrayToTables } from '../models/Table';
import { ConvertObjectArrayToEvents } from '../models/Event';
import { ConvertObjectArrayToApis } from '../models/Api';

export async function CreateApp(
	jwt: string, 
	name: string, 
	description: string, 
	linkWeb?: string, 
	linkPlay?: string, 
	linkWindows?: string
) : Promise<ApiResponse<App> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/apps/app`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: jwt
			},
			data: {
				name,
				description,
				link_web: linkWeb,
				link_play: linkPlay,
				link_windows: linkWindows
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
				ConvertObjectArrayToEvents(response.data.events),
				ConvertObjectArrayToApis(response.data.apis)
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

export interface GetActiveAppUsersResponseData{
	days: GetActiveAppUsersResponseDataDay[]
}

interface GetActiveAppUsersResponseDataDay{
	time: string,
	countDaily: number,
	countMonthly: number,
	countYearly: number
}

export async function GetActiveAppUsers(jwt: string, id: number, start?: number, end?: number) : Promise<ApiResponse<GetActiveAppUsersResponseData> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/app/${id}/active_users`,
			headers: {
				Authorization: jwt
			},
			params: {
				start,
				end
			}
		});

		let days: GetActiveAppUsersResponseDataDay[] = [];

		for(let day of response.data.days){
			days.push({
				time: day.time,
				countDaily: day.count_daily,
				countMonthly: day.count_monthly,
				countYearly: day.count_yearly
			})
		}

		return {
			status: response.status,
			data: {
				days
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
	published?: boolean,
	linkWeb?: string,
	linkPlay?: string,
	linkWindows?: string
}) : Promise<ApiResponse<App> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/apps/app/${id}`;
	let data: object = {};

	if(properties.name != null) data["name"] = properties.name;
	if(properties.description != null) data["description"] = properties.description;
	if(properties.published != null) data["published"] = properties.published;
	if(properties.linkWeb != null) data["link_web"] = properties.linkWeb;
	if(properties.linkPlay != null) data["link_play"] = properties.linkPlay;
	if(properties.linkWindows != null) data["link_windows"] = properties.linkWindows;

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

export async function CreateTable(jwt: string, appId: number, name: string) : Promise<ApiResponse<Table> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/apps/${appId}/table`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				Authorization: jwt
			},
			data: {
				name
			}
		});

		return {
			status: response.status,
			data: new Table(response.data.id, response.data.app_id, response.data.name)
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