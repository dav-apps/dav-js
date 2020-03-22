import * as axios from 'axios';
import { Dav, ApiResponse, ApiErrorResponse, ConvertHttpResponseToErrorResponse } from '../Dav';

export interface PurchaseResponseData{
	id: number;
	userId: number;
	tableObjectId: number;
	price: number;
	currency: string;
	paid: boolean;
	completed: boolean;
}

export async function GetPurchase(jwt: string, id: number) : Promise<ApiResponse<PurchaseResponseData> | ApiErrorResponse>{
	try{
		let response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/purchase/${id}`,
			headers: {
				Authorization: jwt
			}
		});

		return {
			status: response.status,
			data: {
				id: response.data.id,
				userId: response.data.user_id,
				tableObjectId: response.data.table_object_id,
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