import * as axios from 'axios';
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';
import { Auth } from '../models/Auth';

export interface PurchaseResponseData{
	id: number;
	userId: number;
	tableObjectId: number;
	productImage: string,
	productName: string,
	providerImage: string,
	providerName: string,
	price: number;
	currency: string;
	paid: boolean;
	completed: boolean;
}

export async function CreatePurchase(
	jwt: string,
	tableObjectUuid: string,
	productImage: string,
	productName: string,
	providerImage: string,
	providerName: string,
	price: number,
	currency: string
) : Promise<ApiResponse<PurchaseResponseData> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'post',
			url: `${Dav.apiBaseUrl}/apps/object/${tableObjectUuid}/purchase`,
			headers: {
				Authorization: jwt,
				'Content-Type': 'application/json'
			},
			data: {
				product_image: productImage,
				product_name: productName,
				provider_image: providerImage,
				provider_name: providerName,
				price,
				currency
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				tableObjectId: response.data.table_object_id,
				productImage: response.data.product_image,
				productName: response.data.product_name,
				providerImage: response.data.provider_image,
				providerName: response.data.provider_name,
				price: response.data.price,
				currency: response.data.currency,
				paid: response.data.paid,
				completed: response.data.completed
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

export async function GetPurchase(auth: Auth, id: number) : Promise<ApiResponse<PurchaseResponseData> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/purchase/${id}`,
			headers: {
				Authorization: auth.token
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				tableObjectId: response.data.table_object_id,
				productImage: response.data.product_image,
				productName: response.data.product_name,
				providerImage: response.data.provider_image,
				providerName: response.data.provider_name,
				price: response.data.price,
				currency: response.data.currency,
				paid: response.data.paid,
				completed: response.data.completed
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