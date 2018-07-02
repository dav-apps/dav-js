import * as DataManager from '../providers/DataManager';
import * as DatabaseOperations from '../providers/DatabaseOperations';
import * as Dav from '../Dav';

export class TableObject{
   public TableId: number;
   public Uuid: string = generateUUID();
   public Visibility: TableObjectVisibility = TableObjectVisibility.Private;
   public IsFile: boolean = false;
	public Properties: Map<string, string> = new Map();
	public UploadStatus: TableObjectUploadStatus = TableObjectUploadStatus.New;
	public Etag: string;

	constructor(){}
	
	async SetVisibility(visibility: TableObjectVisibility): Promise<void>{
		this.Visibility = visibility;
		await this.Save();
	}

	async SetUploadStatus(uploadStatus: TableObjectUploadStatus): Promise<void>{
		this.UploadStatus = uploadStatus;
		await this.Save();
	}

	async SetPropertyValue(name: string, value: string): Promise<void>{
		if(this.Properties.get(name) == value) return;

		this.Properties.set(name, value);
		await this.Save();
	}

	async SetPropertyValues(properties: { name: string, value: string }[]): Promise<void>{
		var propertiesChanged = false;

		properties.forEach(property => {
			if(this.Properties.get(property.name) != property.value){
				this.Properties.set(property.name, property.value);
				propertiesChanged = true;
			}
		});

		if(propertiesChanged){
			await this.Save();
		}
	}

	GetPropertyValue(name: string): string{
		var value = this.Properties.get(name);
		return value ? value : null;
	}

	async RemoveProperty(name: string): Promise<void>{
		if(this.Properties.get(name)){
			this.Properties.delete(name);
			await this.Save();
		}
	}

   async Delete(): Promise<void>{
		if(Dav.globals.jwt){
			// If the user is logged in
			this.UploadStatus = TableObjectUploadStatus.Deleted;
			await this.Save();
		}else{
			await this.DeleteImmediately();
		}
	}

	async DeleteImmediately(): Promise<void>{
		await DatabaseOperations.DeleteTableObjectImmediately(this.Uuid);
	}
	
	private async Save(){
		if(await DatabaseOperations.TableObjectExists(this.Uuid)){
			if(this.UploadStatus == TableObjectUploadStatus.UpToDate){
				this.UploadStatus = TableObjectUploadStatus.Updated;
			}
			await DatabaseOperations.UpdateTableObject(this);
		}else{
			this.UploadStatus = TableObjectUploadStatus.New;
			await DatabaseOperations.CreateTableObject(this).then(uuid => this.Uuid = uuid);
		}

		await DataManager.SyncPush();
	}
}

export enum TableObjectVisibility{
   Private = 0,
   Protected = 1,
   Public = 2
}

export enum TableObjectUploadStatus{
   UpToDate = 0,
   New = 1,
   Updated = 2,
   Deleted = 3,
   NoUpload = 4
}

export function ConvertIntToVisibility(visibilityInt: number): TableObjectVisibility{
	var visibility = TableObjectVisibility.Private;

	switch (visibilityInt) {
		case 1:
			visibility = TableObjectVisibility.Protected
			break;
		case 2:
			visibility = TableObjectVisibility.Public;
			break;
	}

	return visibility;
}

export function ConvertMapToObject(map: Map<string, string>): object{
	var obj = {};

	for(let [key, value] of map){
		obj[key] = value;
	}

	return obj;
}

export function ConvertObjectToMap(obj: object): Map<string, string>{
	var map: Map<string, string> = new Map();

	Object.keys(obj).forEach(key => {
		map.set(key, obj[key]);
	});

	return map;
}

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function generateUUID() { // Public Domain/MIT
   var d = new Date().getTime();
   if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
       d += performance.now(); //use high-precision timer if available
   }
   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
       var r = (d + Math.random() * 16) % 16 | 0;
       d = Math.floor(d / 16);
       return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
   });
}