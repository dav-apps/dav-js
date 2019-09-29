export class App{
	constructor(
		public name: string,
		public description: string,
		public published: boolean,
		public linkWeb: string,
		public linkPlay: string,
		public linkWindows: string
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