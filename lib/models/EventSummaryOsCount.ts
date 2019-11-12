export class EventSummaryOsCount{
	constructor(
		public Name: string,
		public Version: string,
		public Count: number
	){}
}

export function ConvertObjectArrayToEventSummaryOsCounts(objArray: any[]) : EventSummaryOsCount[]{
	let counts: EventSummaryOsCount[] = [];

	if(objArray){
		for(let obj of objArray){
			counts.push(new EventSummaryOsCount(
				obj.name,
				obj.version,
				obj.count
			));
		}
	}

	return counts;
}