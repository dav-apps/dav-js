import * as axios from 'axios';
import { Dav, ConvertHttpResponseToErrorResponse, ApiResponse, ApiErrorResponse } from '../Dav';

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