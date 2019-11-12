import { EventSummaryOsCount, ConvertObjectArrayToEventSummaryOsCounts } from './EventSummaryOsCount';
import { EventSummaryBrowserCount, ConvertObjectArrayToEventSummaryBrowserCounts } from './EventSummaryBrowserCount';
import { EventSummaryCountryCount, ConvertObjectArrayToEventSummaryCountryCounts } from './EventSummaryCountryCount';

export class StandardEventSummary{
	constructor(
		public Time: Date,
		public Period: EventSummaryPeriod,
		public Total: number,
		public OsCounts: EventSummaryOsCount[],
		public BrowserCounts: EventSummaryBrowserCount[],
		public CountryCounts: EventSummaryCountryCount[]
	){}
}

export function ConvertObjectArrayToStandardEventSummaries(objArray: any[]) : StandardEventSummary[]{
	let summaries: StandardEventSummary[] = [];

	if(objArray){
		for(let obj of objArray){
			summaries.push(new StandardEventSummary(
				obj.time ? new Date(obj.time) : null,
				obj.period,
				obj.total,
				ConvertObjectArrayToEventSummaryOsCounts(obj.os_counts),
				ConvertObjectArrayToEventSummaryBrowserCounts(obj.browser_counts),
				ConvertObjectArrayToEventSummaryCountryCounts(obj.country_counts)
			));
		}
	}

	return summaries;
}

export enum EventSummaryPeriod{
	Hour = 0,
	Day = 1,
	Month = 2,
	Year = 3
}