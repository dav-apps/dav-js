import * as DataManager from '../providers/DataManager';
import * as DatabaseOperations from '../providers/DatabaseOperations';

export class TableObject{
   public TableId: number;
   public Uuid: string = generateUUID();
   public Visibility: TableObjectVisibility = TableObjectVisibility.Private;
   public IsFile: boolean = false;
	public Properties: Map<string, string> = new Map();
	public UploadStatus: TableObjectUploadStatus = TableObjectUploadStatus.New;
	public Etag: string;

	constructor(){}
	
	SetVisibility(visibility: TableObjectVisibility){
		this.Visibility = visibility;
		this.Save();
	}

	SetUploadStatus(uploadStatus: TableObjectUploadStatus){
		this.UploadStatus = uploadStatus;
		this.Save();
	}

	SetPropertyValue(name: string, value: string){
		if(this.Properties.get(name) == value) return;

		this.Properties.set(name, value);
		this.Save();
	}

	SetPropertyValues(properties: { name: string, value: string }[]){
		var propertiesChanged = false;

		properties.forEach(property => {
			if(this.Properties.get(property.name) != property.value){
				this.Properties.set(property.name, property.value);
				propertiesChanged = true;
			}
		});

		if(propertiesChanged){
			this.Save();
		}
	}

	GetPropertyValue(name: string): string{
		return this.Properties.get(name);
	}

	RemoveProperty(name: string){
		if(!this.Properties.get(name)){
			this.Properties.delete(name);
			this.Save();
		}
	}

   Delete(){
		this.UploadStatus = TableObjectUploadStatus.Deleted;
		this.Save();
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

		DataManager.SyncPush();
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

export function ConvertVisibilityToInt(visibility: TableObjectVisibility): number{
	var visibilityInt = 0;

	switch (visibility) {
		case TableObjectVisibility.Protected:
			visibilityInt = 1;
			break;
		case TableObjectVisibility.Public:
			visibilityInt = 2;
			break;
	}

	return visibilityInt;
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