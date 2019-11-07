export class EventSummaryPropertyCount{
	constructor(
		public Name: string,
		public Value: string,
		public Count: number
	){}
}

export function ConvertObjectArrayToEventSummaryPropertyCounts(objArray: any[]) : EventSummaryPropertyCount[]{
	let properties: EventSummaryPropertyCount[] = [];

	if(objArray){
		for(let obj of objArray){
			properties.push(new EventSummaryPropertyCount(
				obj.name,
				obj.value,
				obj.count
			));
		}
	}

	return properties;
}