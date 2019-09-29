import * as DatabaseOperations from '../providers/DatabaseOperations';
import * as DataManager from '../providers/DataManager';
import { Dav, startPushNotificationSubscription } from "../Dav";

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
					this.DownloadUserInformation();

					DataManager.Sync();

					startPushNotificationSubscription();
					DataManager.UpdateSubscriptionOnServer();
					DataManager.SyncNotifications();
				}
	
				if(callback){
					callback();
				}
			});
		}catch(error){
			console.log(error);

			if(callback){
				callback();
			}
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
		Dav.jwt = this.JWT;
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
		Dav.jwt = "";
	}

	private async DownloadUserInformation() : Promise<boolean>{
		if(this.IsLoggedIn){
			let userObject = await DataManager.DownloadUserInformation(this.JWT);

			if(userObject){
				this.SetUser(userObject);
				await DatabaseOperations.SetUser(userObject);

				return true;
			}
		}

		return false;
	}

	async Login(jwt: string): Promise<boolean>{
		this.JWT = jwt;
		this.IsLoggedIn = true;

		if(await this.DownloadUserInformation()){
			return true;
		}else{
			await this.Logout();
			return false;
		}
	}

	async Logout(){
      // Delete the user key from the local storage
      let jwt = this.JWT;
		await DataManager.UnsubscribePushNotifications();
		await DatabaseOperations.RemoveUser();
		this.ClearUser();
      await DatabaseOperations.RemoveAllNotifications();
      await DataManager.DeleteSessionOnServer(jwt);
	}
}

export enum DavPlan{
	Free = 0,
	Plus = 1,
	Pro = 2
}

export enum DavEnvironment{
	Development,
	Test,
	Production
}

export function ShowLoginPage(apiKey: string, callbackUrl: string){
	window.location.href = `${Dav.websiteUrl}/login_session?api_key=${apiKey}&app_id=${Dav.appId}&redirect_url=${encodeURIComponent(callbackUrl)}`
}

export function ShowSignupPage(apiKey: string, callbackUrl: string){
	window.location.href = `${Dav.websiteUrl}/signup?api_key=${apiKey}&app_id=${Dav.appId}&redirect_url=${encodeURIComponent(callbackUrl)}`
}