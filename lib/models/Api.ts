import { ApiEndpoint, ConvertObjectArrayToApiEndpoints } from './ApiEndpoint';
import { ApiFunction, ConvertObjectArrayToApiFunctions } from './ApiFunction';
import { ApiError, ConvertObjectArrayToApiErrors } from './ApiError';

export class Api{
	constructor(
		public Id: number,
		public Name: string,
		public Endpoints: ApiEndpoint[],
		public Functions: ApiFunction[],
		public Errors: ApiError[]
	){}
}

export function ConvertObjectArrayToApis(objArray: any[]) : Api[]{
	let apis: Api[] = [];

	if(objArray){
		for(let obj of objArray){
			apis.push(new Api(
				obj.id,
				obj.name,
				ConvertObjectArrayToApiEndpoints(obj.endpoints),
				ConvertObjectArrayToApiFunctions(obj.functions),
				ConvertObjectArrayToApiErrors(obj.errors)
			));
		}
	}

	return apis;
}