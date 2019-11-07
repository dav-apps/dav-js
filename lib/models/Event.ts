import { EventSummary, ConvertObjectArrayToEventSummaries } from "./EventSummary";

export class Event{
	constructor(
		public Id: number,
		public AppId: number,
		public Name: string,
		public Logs: EventSummary[]
	){}
}

export function ConvertObjectArrayToEvents(objArray: any[]) : Event[]{
	let events: Event[] = [];

	if(objArray){
		for(let obj of objArray){
			events.push(new Event(
				obj.id,
				obj.app_id,
				obj.name,
				ConvertObjectArrayToEventSummaries(obj.logs)
			));
		}
	}

	return events;
}