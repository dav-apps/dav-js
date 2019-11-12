import { StandardEventSummary, ConvertObjectArrayToStandardEventSummaries } from './StandardEventSummary';

export class Event{
	constructor(
		public Id: number,
		public AppId: number,
		public Name: string,
		public Summaries: StandardEventSummary[]
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
				ConvertObjectArrayToStandardEventSummaries(obj.logs)
			));
		}
	}

	return events;
}