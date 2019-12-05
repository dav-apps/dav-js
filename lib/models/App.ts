import { Table, ConvertObjectArrayToTables } from './Table';
import { Event, ConvertObjectArrayToEvents } from './Event';
import { Api, ConvertObjectArrayToApis } from './Api';

export class App{
	constructor(
		public Id: number,
		public Name: string,
		public Description: string,
		public Published: boolean,
		public LinkWeb: string,
		public LinkPlay: string,
		public LinkWindows: string,
		public UsedStorage: number = 0,
		public Tables: Table[] = [],
		public Events: Event[] = [],
		public Apis: Api[] = []
	){}
}

export function ConvertObjectArrayToApps(objArray: any[]) : App[]{
	let apps: App[] = [];

	if(objArray){
		for(let obj of objArray){
			apps.push(new App(
				obj.id,
				obj.name,
				obj.description,
				obj.published,
				obj.link_web,
				obj.link_play,
				obj.link_windows,
				obj.used_storage,
				ConvertObjectArrayToTables(obj.tables),
				ConvertObjectArrayToEvents(obj.events),
				ConvertObjectArrayToApis(obj.apis)
			));
		}
	}

	return apps;
}