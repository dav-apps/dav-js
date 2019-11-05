export class Event{
	constructor(
		public Id: number,
		public AppId: number,
		public Name: string
	){}
}

export function ConvertObjectArrayToEvents(objArray: any[]) : Event[]{
	let events: Event[] = [];

	if(objArray){
		for(let obj of objArray){
			events.push(new Event(
				obj.id,
				obj.app_id,
				obj.name
			));
		}
	}

	return events;
}