import { Table } from "./Table.js"

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
		public Tables: Table[] = []
	) {}
}
