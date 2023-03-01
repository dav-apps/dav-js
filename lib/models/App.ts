import { Table, ConvertObjectArrayToTables } from "./Table.js"
import { Api, ConvertObjectArrayToApis } from "./Api.js"

export class App {
	constructor(
		public Id: number,
		public Name: string,
		public Description: string,
		public Published: boolean,
		public WebLink: string,
		public GooglePlayLink: string,
		public MicrosoftStoreLink: string,
		public UsedStorage: number = 0,
		public Tables: Table[] = [],
		public Apis: Api[] = []
	) {}
}

export function ConvertObjectArrayToApps(objArray: any[]): App[] {
	let apps: App[] = []

	if (objArray != null) {
		for (let obj of objArray) {
			apps.push(
				new App(
					obj.id,
					obj.name,
					obj.description,
					obj.published,
					obj.web_link,
					obj.google_play_link,
					obj.microsoft_store_link,
					obj.used_storage,
					ConvertObjectArrayToTables(obj.tables),
					ConvertObjectArrayToApis(obj.apis)
				)
			)
		}
	}

	return apps
}
