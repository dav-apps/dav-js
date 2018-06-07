export class DavUser{
	constructor(public Email: string,
					public Username: string,
					public TotalStorage: number,
					public UsedStorage: number,
					public Plan: DavPlan,
					public Avatar: ImageBitmap,
					public AvatarEtag: string,
					public IsLoggedIn: boolean,
					public JWT: string){}

	Login(){
		
	}
}

export enum DavPlan{
	Free = 0,
	Plus = 1
}