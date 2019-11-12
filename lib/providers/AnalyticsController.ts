import * as axios from 'axios';
import { Dav, ConvertHttpResponseToErrorResponse, ApiResponse, ApiErrorResponse } from '../Dav';
import { Event } from '../models/Event';
import { ConvertObjectArrayToStandardEventSummaries, EventSummaryPeriod } from '../models/StandardEventSummary';

export interface EventLogResponseData{
	id: number;
	eventId: number;
	createdAt: string;
	processed: boolean;
	osName: string;
	osVersion: string;
	browserName: string;
	browserVersion: string;
	country: string;
}

export async function CreateEventLog(
	apiKey: string, 
	appId: number, 
	name: string, 
	osName: string,
	osVersion: string,
	browserName: string,
	browserVersion: string,
	country?: string
) : Promise<ApiResponse<EventLogResponseData> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/analytics/event`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			headers: {
				ContentType: 'application/json'
			},
			data: {
				api_key: apiKey,
				app_id: appId,
				name,
				os_name: osName,
				os_version: osVersion,
				browser_name: browserName,
				browser_version: browserVersion,
				country
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				eventId: response.data.event_id,
				createdAt: response.data.created_at,
				processed: response.data.processed,
				osName: response.data.os_name,
				osVersion: response.data.os_version,
				browserName: response.data.browser_name,
				browserVersion: response.data.browser_version,
				country: response.data.country
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

export async function GetEventByName(
	jwt: string, 
	name: string, 
	appId: number, 
	start?: number, 
	end?: number, 
	period?: EventSummaryPeriod
) : Promise<ApiResponse<Event> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/analytics/event`;

	try{
		let response = await axios.default({
			method: 'get',
			url,
			headers: {
				Authorization: jwt
			},
			params: {
				name,
				app_id: appId,
				start,
				end,
				period
			}
		});

		// In the response the period is only given on the root object. Set the period of each log
		let summaries = ConvertObjectArrayToStandardEventSummaries(response.data.summaries);
		for(let summary of summaries) summary.Period = response.data.period;

		return {
			status: response.status,
			data: new Event(
				response.data.id,
				response.data.app_id,
				response.data.name,
				summaries
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