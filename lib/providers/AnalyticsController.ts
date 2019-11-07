import * as axios from 'axios';
import { Dav, ConvertHttpResponseToErrorResponse, ApiResponse, ApiErrorResponse } from '../Dav';
import { Event } from '../models/Event';
import { ConvertObjectArrayToEventSummaries, EventSummaryPeriod } from '../models/EventSummary';

export interface EventLogResponseData{
	id: number;
	eventId: number;
	createdAt: string;
	processed: boolean;
	properties: any;
}

export async function CreateEventLog(
	apiKey: string, 
	name: string, 
	appId: number, 
	saveCountry: boolean, 
	properties: any
) : Promise<ApiResponse<EventLogResponseData> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/analytics/event`;

	try{
		let response = await axios.default({
			method: 'post',
			url,
			params: {
				api_key: apiKey,
				name,
				app_id: appId,
				save_country: saveCountry
			},
			data: properties
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				eventId: response.data.event_id,
				createdAt: response.data.created_at,
				processed: response.data.processed,
				properties: response.data.properties
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
	sort?: EventSummaryPeriod
) : Promise<ApiResponse<Event> | ApiErrorResponse>{
	let url = `${Dav.apiBaseUrl}/analytics/event`;

	let sorting = null;
	switch(sort){
		case EventSummaryPeriod.Hour:
			sorting = "hour";
			break;
		case EventSummaryPeriod.Day:
			sorting = "day";
			break;
		case EventSummaryPeriod.Month:
			sorting = "month";
			break;
		case EventSummaryPeriod.Year:
			sorting = "year";
			break;
	}

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
				sort: sorting
			}
		});

		// In the response the period is only given on the root object. Set the period of each log
		let logs = ConvertObjectArrayToEventSummaries(response.data.logs);
		for(let log of logs) log.Period = response.data.period;

		return {
			status: response.status,
			data: new Event(
				response.data.id,
				response.data.app_id,
				response.data.name,
				logs
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