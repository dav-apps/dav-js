export class ApiError{
	constructor(
		public Id: number,
		public Code: number,
		public Message: string
	){}
}

export function ConvertObjectArrayToApiErrors(objArray: any[]) : ApiError[]{
	let errors: ApiError[] = [];

	if(objArray){
		for(let obj of objArray){
			errors.push(new ApiError(
				obj.id,
				obj.code,
				obj.message
			));
		}
	}

	return errors;
}