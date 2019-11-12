export class EventSummaryCountryCount{
	constructor(
		public Country: string,
		public Count: number
	){}
}

export function ConvertObjectArrayToEventSummaryCountryCounts(objArray: any[]) : EventSummaryCountryCount[]{
	let counts: EventSummaryCountryCount[] = [];

	if(objArray){
		for(let obj of objArray){
			counts.push(new EventSummaryCountryCount(
				obj.country,
				obj.count
			));
		}
	}

	return counts;
}