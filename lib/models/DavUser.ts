import * as DatabaseOperations from '../providers/DatabaseOperations';
import * as DataManager from '../providers/DataManager';
import { Dav, startPushNotificationSubscription } from "../Dav";
import { App, ConvertObjectArrayToApps } from './App';

export class DavUser{
	public Id: number;
	public Email: string;
	public Username: string;
	public TotalStorage: number;
	public UsedStorage: number;
	public Plan: DavPlan;
	public Avatar: string;
	public AvatarEtag: string;
	public IsLoggedIn: boolean = false;
	public Confirmed: boolean;
	public SubscriptionStatus: DavSubscriptionStatus;
	public PeriodEnd: Date;
	public StripeCustomerId: string;
	public Dev: boolean;
	public Provider: boolean;
	public Apps: App[] = [];
	public JWT: string;

	constructor(callback?: Function){
		try{
			DatabaseOperations.GetUser().then((userObject) => {
				if(userObject){
					this.SetUser(userObject);
					this.DownloadUserInformation().then((success: boolean) => {
						if (!success) return;

						DataManager.Sync();
						startPushNotificationSubscription();
						DataManager.UpdateSubscriptionOnServer();
						DataManager.SyncNotifications();
					});
				}else{
					Dav.callbacks.UserDownloadFinished();
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
		this.Id = userObject["id"];
		this.Email = userObject["email"];
		this.Username = userObject["username"];
		this.TotalStorage = userObject["totalStorage"];
		this.UsedStorage = userObject["usedStorage"];
		this.Plan = userObject["plan"];
		this.Avatar = userObject["avatar"];
		this.AvatarEtag = userObject["avatarEtag"];
		this.Confirmed = userObject["confirmed"];
		this.SubscriptionStatus = userObject["subscriptionStatus"];
		this.PeriodEnd = userObject["periodEnd"] ? new Date(userObject["periodEnd"]) : null;
		this.StripeCustomerId = userObject["stripeCustomerId"];
		this.Dev = userObject["dev"];
		this.Provider = userObject["provider"];
		this.Apps = userObject["apps"] ? ConvertObjectArrayToApps(userObject["apps"]) : [];
		this.JWT = userObject["jwt"];
		Dav.jwt = this.JWT;
	}

	private ClearUser(){
		this.IsLoggedIn = false;
		this.Id = 0;
		this.Email = "";
		this.Username = "";
		this.TotalStorage = 0;
		this.UsedStorage = 0;
		this.Plan = 0;
		this.Avatar = "";
		this.AvatarEtag = "";
		this.Confirmed = false;
		this.SubscriptionStatus = 0;
		this.PeriodEnd = null;
		this.StripeCustomerId = "";
		this.Dev = false;
		this.Provider = false;
		this.Apps = [];
		this.JWT = "";
		Dav.jwt = "";
	}

	private async DownloadUserInformation() : Promise<boolean>{
		if(this.IsLoggedIn){
			let result = await DataManager.DownloadUserInformation(this.JWT);

			if (result.success) {
				this.SetUser(result.data);
				await DatabaseOperations.SetUser(result.data);
				Dav.callbacks.UserDownloadFinished();
			} else if (result.logout) {
				// Log the user out
				await this.Logout();
			}

			return result.success;
		}

		Dav.callbacks.UserDownloadFinished();
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

export enum DavSubscriptionStatus{
	Active = 0,
	Ending = 1
}

export enum DavEnvironment{
	Development,
	Test,
	Production
}

export function ShowLoginPage(apiKey: string, callbackUrl: string){
	window.location.href = `${Dav.websiteUrl}/login?type=session&api_key=${apiKey}&app_id=${Dav.appId}&redirect_url=${encodeURIComponent(callbackUrl)}`
}

export function ShowSignupPage(apiKey: string, callbackUrl: string){
	window.location.href = `${Dav.websiteUrl}/signup?type=session&api_key=${apiKey}&app_id=${Dav.appId}&redirect_url=${encodeURIComponent(callbackUrl)}`
}

export function ShowUserPage(anker: string = "", newTab: boolean = false) {
	let url = GetUserPageLink(anker)

	if (newTab) {
		window.open(url, "blank")
	} else {
		window.location.href = url
	}
}

export function GetUserPageLink(anker: string = "") {
	return `${Dav.websiteUrl}/login?redirect=user${anker ? encodeURIComponent(`#${anker}`) : ''}`
}