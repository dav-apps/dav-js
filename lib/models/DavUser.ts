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
	public AvatarFile: Blob;
	public IsLoggedIn: boolean = false;
	public JWT: string;

	constructor(callback?: Function){
		try{
			DatabaseOperations.GetUser().then((userObject) => {
				if(userObject){
					this.SetUser(userObject);
					this.DownloadUserInformation();

					DataManager.Sync();

					Dav.startPushNotificationSubscription();
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
		this.AvatarFile = userObject["avatarFile"];
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
		this.AvatarFile = null;
		this.JWT = "";
		Dav.globals.jwt = "";
	}

	private async DownloadUserInformation() : Promise<boolean>{
		if(this.IsLoggedIn){
			let userObject = await DataManager.DownloadUserInformation(this.JWT);

			if(userObject){
				// Download the avatar
				if(this.AvatarEtag != userObject.avatarEtag){
					this.AvatarFile = await DataManager.DownloadFile(this.Avatar);
					userObject.avatarFile = this.AvatarFile;
				}

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
		await DataManager.UnsubscribePushNotifications();
		await DatabaseOperations.RemoveUser();
		this.ClearUser();
		await DatabaseOperations.RemoveAllNotifications();
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
	window.location.href = Dav.globals.websiteUrl + "login_implicit?api_key=" + 
									apiKey + "&redirect_url=" + encodeURIComponent(callbackUrl);
}

export function ShowSignupPage(callbackUrl: string){
	window.location.href = Dav.globals.websiteUrl + "signup?redirect_url=" + encodeURIComponent(callbackUrl);
}