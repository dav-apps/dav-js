export class Table{
	constructor(
		public Id: number,
		public AppId: number,
		public Name: string
	){}
}

export function ConvertObjectArrayToTables(objArray: any[]) : Table[]{
	let tables: Table[] = [];

	if(objArray){
		for(let obj of objArray){
			tables.push(new Table(
				obj.id,
				obj.app_id,
				obj.name
			));
		}
	}

	return tables;
}