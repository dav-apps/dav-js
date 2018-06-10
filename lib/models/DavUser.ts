var localforage = require('localforage');
import * as ApiManager from '../providers/ApiManager';
import * as DataManager from '../providers/DataManager';
import * as Dav from "../Dav";

export class DavUser{
	public Email: string;
	public Username: string;
	public TotalStorage: number;
	public UsedStorage: number;
	public Plan: DavPlan;
	public Avatar: string;
	public AvatarEtag: string;
	public IsLoggedIn: boolean = false;
	public JWT: string;

	constructor(callback?: Function){
		try{
			DataManager.GetUser().then((userObject) => {
				if(userObject){
					this.SetUser(userObject);
				}
	
				if(callback){
					callback();
				}
			});
		}catch(error){
			console.log(error);
		}
	}

	private SetUser(userObject: object){
		this.IsLoggedIn = true;
		this.Email = userObject["email"];
		this.Username = userObject["username"];
		this.TotalStorage = userObject["totalStorage"];
		this.UsedStorage = userObject["usedStorage"];
		this.Plan = userObject["plan"];
		this.Avatar = userObject["avatar"];
		this.AvatarEtag = userObject["avatarEtag"];
		this.JWT = userObject["jwt"];
	}

	async Login(jwt: string): Promise<boolean>{
		// Try to log in with the jwt
		var userObject = await ApiManager.DownloadUserInformation(jwt);

		if(userObject){
			this.SetUser(userObject);
			DataManager.SetUser(userObject);
		}else{
			this.IsLoggedIn = false;
			localforage.removeItem(Dav.userKey);
		}

		return this.IsLoggedIn;
	}
}

export enum DavPlan{
	Free = 0,
	Plus = 1
}

export function ShowLoginPage(apiKey: string, callbackUrl: string){
	window.location.href = "http://localhost:3000/login_implicit?api_key=" + 
									apiKey + "&redirect_url=" + encodeURIComponent(callbackUrl);
}