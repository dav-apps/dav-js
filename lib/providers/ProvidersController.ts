import * as axios from 'axios';
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';

export interface ProviderResponseData{
	id: number;
	userId: number;
	stripeAccountId: string;
}

export async function CreateProvider(jwt: string, country: string) : Promise<ApiResponse<ProviderResponseData> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/provider`,
			headers: {
				Authorization: jwt,
				'Content-Type': 'application/json'
			},
			data: {
				country
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				stripeAccountId: response.data.stripe_account_id
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

export async function GetProvider(jwt: string) : Promise<ApiResponse<ProviderResponseData> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/provider`,
			headers: {
				Authorization: jwt
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				stripeAccountId: response.data.stripe_account_id
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