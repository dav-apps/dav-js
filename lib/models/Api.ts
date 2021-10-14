import { ApiEndpoint, ConvertObjectArrayToApiEndpoints } from './ApiEndpoint.js'
import { ApiFunction, ConvertObjectArrayToApiFunctions } from './ApiFunction.js'
import { ApiError, ConvertObjectArrayToApiErrors } from './ApiError.js'

export class Api {
	constructor(
		public Id: number,
		public Name: string,
		public Endpoints: ApiEndpoint[],
		public Functions: ApiFunction[],
		public Errors: ApiError[]
	) { }
}

export function ConvertObjectArrayToApis(objArray: any[]): Api[] {
	let apis: Api[] = []

	if (objArray != null) {
		for (let obj of objArray) {
			apis.push(new Api(
				obj.id,
				obj.name,
				ConvertObjectArrayToApiEndpoints(obj.endpoints),
				ConvertObjectArrayToApiFunctions(obj.functions),
				ConvertObjectArrayToApiErrors(obj.errors)
			))
		}
	}

	return apis
}