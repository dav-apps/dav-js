export class ApiFunction {
	constructor(
		public Id: number,
		public Name: string,
		public Params: string[],
		public Commands: string
	) {}
}

export function ConvertObjectArrayToApiFunctions(
	objArray: any[]
): ApiFunction[] {
	let functions: ApiFunction[] = []

	if (objArray != null) {
		for (let obj of objArray) {
			functions.push(
				new ApiFunction(
					obj.id,
					obj.name,
					obj.params ? (obj.params as string).split(",") : [],
					obj.commands
				)
			)
		}
	}

	return functions
}
