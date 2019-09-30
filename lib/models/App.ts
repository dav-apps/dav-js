export class App{
	constructor(
		public Name: string,
		public Description: string,
		public Published: boolean,
		public LinkWeb: string,
		public LinkPlay: string,
		public LinkWindows: string
	){}
}

export function ConvertObjectArrayToApps(objArray: any[]) : App[]{
	let apps: App[] = [];

	for(let obj of objArray){
		apps.push(new App(
			obj.name,
			obj.description,
			obj.published,
			obj.link_web,
			obj.link_play,
			obj.link_windows
		));
	}

	return apps;
}