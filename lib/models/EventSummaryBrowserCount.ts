export class EventSummaryBrowserCount{
	constructor(
		public Name: string,
		public Version: string,
		public Count: number
	){}
}

export function ConvertObjectArrayToEventSummaryBrowserCounts(objArray: any[]) : EventSummaryBrowserCount[]{
	let counts: EventSummaryBrowserCount[] = [];

	if(objArray){
		for(let obj of objArray){
			counts.push(new EventSummaryBrowserCount(
				obj.name,
				obj.version,
				obj.count
			));
		}
	}

	return counts;
}