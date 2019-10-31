export class App{
	constructor(
		public Id: number,
		public Name: string,
		public Description: string,
		public Published: boolean,
		public LinkWeb: string,
		public LinkPlay: string,
		public LinkWindows: string,
		public UsedStorage: number = 0
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
				obj.used_storage
			));
		}
	}

	return apps;
}