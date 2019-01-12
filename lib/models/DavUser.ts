var localforage = require('localforage');
import * as DatabaseOperations from '../providers/DatabaseOperations';
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
			DatabaseOperations.GetUser().then((userObject) => {
				if(userObject){
					this.SetUser(userObject);
					DataManager.Sync();

					Dav.startWebWorker();
					Dav.startPushNotificationSubscription();
					DataManager.UpdateSubscriptionOnServer();
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
		Dav.globals.jwt = this.JWT;
	}

	private ClearUser(){
		this.IsLoggedIn = false;
		this.Email = "";
		this.Username = "";
		this.TotalStorage = 0;
		this.UsedStorage = 0;
		this.Plan = 0;
		this.Avatar = "";
		this.AvatarEtag = "";
		this.JWT = "";
		Dav.globals.jwt = "";
	}

	async Login(jwt: string): Promise<boolean>{
		// Try to log in with the jwt
		var userObject = await DataManager.DownloadUserInformation(jwt);

		if(userObject){
			this.SetUser(userObject);
			DatabaseOperations.SetUser(userObject);
		}else{
			this.IsLoggedIn = false;
			localforage.removeItem(Dav.userKey);
		}

		return this.IsLoggedIn;
	}

	Logout(){
		// Delete the user key from the local storage
		DatabaseOperations.RemoveUser();
		this.ClearUser();
	}
}

export enum DavPlan{
	Free = 0,
	Plus = 1
}

export function ShowLoginPage(apiKey: string, callbackUrl: string){
	window.location.href = Dav.globals.websiteUrl + "login_implicit?api_key=" + 
									apiKey + "&redirect_url=" + encodeURIComponent(callbackUrl);
}