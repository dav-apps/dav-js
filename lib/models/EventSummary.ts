import { EventSummaryPropertyCount, ConvertObjectArrayToEventSummaryPropertyCounts } from './EventSummaryPropertyCount';

export class EventSummary{
	constructor(
		public Time: Date,
		public Total: number,
		public Period: EventSummaryPeriod,
		public Properties: EventSummaryPropertyCount[]
	){}
}

export function ConvertObjectArrayToEventSummaries(objArray: any[]) : EventSummary[]{
	let eventSummaries: EventSummary[] = [];

	if(objArray){
		for(let obj of objArray){
			eventSummaries.push(new EventSummary(
				obj.time ? new Date(obj.time) : null,
				obj.total,
				obj.period,
				ConvertObjectArrayToEventSummaryPropertyCounts(obj.properties)
			));
		}
	}

	return eventSummaries;
}

export enum EventSummaryPeriod{
	Hour = 0,
	Day = 1,
	Month = 2,
	Year = 3
}