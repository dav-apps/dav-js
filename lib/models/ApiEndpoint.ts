export class ApiEndpoint {
	constructor(
		public Id: number,
		public Path: string,
		public Method: string,
		public Commands: string,
		public Caching: boolean
	) { }
}

export function ConvertObjectArrayToApiEndpoints(objArray: any[]): ApiEndpoint[] {
	let endpoints: ApiEndpoint[] = []

	if (objArray != null) {
		for (let obj of objArray) {
			endpoints.push(new ApiEndpoint(
				obj.id,
				obj.path,
				obj.method,
				obj.commands,
				obj.caching
			))
		}
	}

	return endpoints
}