import * as axios from 'axios';
import { Dav, ConvertHttpResponseToErrorResponse, ApiResponse, ApiErrorResponse } from '../Dav';
import { Api } from '../models/Api';
import { ConvertObjectArrayToApiEndpoints } from '../models/ApiEndpoint';
import { ConvertObjectArrayToApiFunctions } from '../models/ApiFunction';
import { ConvertObjectArrayToApiErrors, ApiError } from '../models/ApiError';
import { Auth } from '../models/Auth';

export async function CreateApi(jwt: string, appId: number, name: string) : Promise<ApiResponse<Api> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/apps/app/${appId}/api`,
			headers: {
				Authorization: jwt
			},
			data: {
				name
			}
		});

		return {
			status: response.status,
			data: new Api(response.data.id, response.data.name, [], [], [])
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

export async function GetApi(jwt: string, id: number){
	try{
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/api/${id}`,
			headers: {
				Authorization: jwt
			}
		});

		return {
			status: response.status,
			data: new Api(
				response.data.id,
				response.data.name,
				ConvertObjectArrayToApiEndpoints(response.data.endpoints),
				ConvertObjectArrayToApiFunctions(response.data.functions),
				ConvertObjectArrayToApiErrors(response.data.errors)
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

export async function SetApiError(
	auth: Auth, 
	apiId: number, 
	code: number, 
	message: string
) : Promise<ApiResponse<ApiError> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'put',
			url: `${Dav.apiBaseUrl}/api/${apiId}/error`,
			headers: {
				Authorization: auth.token
			},
			data: {
				code,
				message
			}
		});

		return {
			status: response.status,
			data: new ApiError(response.data.id, response.data.code, response.data.message)
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