import * as localforage from "localforage";
var bowser = require('bowser');
import * as Dav from '../Dav';
import { TableObject, TableObjectUploadStatus, generateUUID } from '../models/TableObject';
import { ConvertObjectToDictionary } from '../models/Dictionary';

function InitLocalforage(){
   if(bowser.firefox){
      // Use localstorage as driver
      localforage.setDriver(localforage.LOCALSTORAGE);
   }
}

//#region User methods
export function SetUser(user: object){
   InitLocalforage();
   localforage.setItem(Dav.userKey, user);
}

export async function GetUser(){
   InitLocalforage();
   return await localforage.getItem(Dav.userKey);
}

export async function RemoveUser(){
	InitLocalforage();
	localforage.removeItem(Dav.userKey);
}
//#endregion

//#region TableObject methods
async function SetTableObjectsArray(tableObjects: Array<TableObject>){
	InitLocalforage();
	try{
		await localforage.setItem(Dav.tableObjectsKey, tableObjects);
	}catch(error){
		console.log(error);
	}
}

async function GetTableObjectsArray(): Promise<TableObject[]>{
	InitLocalforage();

	try{
		var objArray = await localforage.getItem(Dav.tableObjectsKey) as object[];
		var tableObjectsArray: TableObject[] = [];

		objArray.forEach(obj => {
			var tableObject = new TableObject();
			tableObject.TableId = obj["TableId"];
			tableObject.UploadStatus = obj["UploadStatus"];
			tableObject.IsFile = obj["IsFile"];
			tableObject.Etag = obj["Etag"];
			tableObject.Visibility = obj["Visibility"];
			tableObject.Uuid = obj["Uuid"];
			tableObject.Properties = obj["Properties"];

			tableObjectsArray.push(tableObject);
		});

		return tableObjectsArray;
	}catch(error){
		console.log(error);
		return [];
	}
}

export async function CreateTableObject(tableObject: TableObject): Promise<string>{
	var tableObjects = await GetTableObjectsArray();
	var uuid = tableObject.Uuid;

	// Check if the uuid already exists
	while(tableObjects.findIndex(obj => obj.Uuid == uuid) !== -1){
		uuid = generateUUID();
	}

	tableObject.Uuid = uuid;
	tableObjects.push(tableObject);
	SetTableObjectsArray(tableObjects);

	return uuid;
}

export async function GetTableObject(uuid: string): Promise<TableObject>{
	var tableObjects = await GetTableObjectsArray();
	var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

	if(index !== -1){
		return tableObjects[index];
	}else{
		return null;
	}
}

export async function GetAllTableObjects(deleted: boolean): Promise<TableObject[]>{
	var tableObjects = await GetTableObjectsArray();

	if(tableObjects){
		var sortedTableObjects = tableObjects.filter(obj => obj.UploadStatus != TableObjectUploadStatus.Deleted || deleted)
									.map((tableObject: TableObject, index: number, tableObjects: TableObject[]) => {
										tableObject.Properties = ConvertObjectToDictionary(tableObject.Properties);
										return tableObject;
									});
		
		return sortedTableObjects;
	}

	return [];
}

export async function TableObjectExists(uuid: string){
	var tableObjects = await GetTableObjectsArray();
	return tableObjects.findIndex(obj => obj.Uuid == uuid) !== -1;
}

export async function UpdateTableObject(tableObject: TableObject){
	var tableObjects = await GetTableObjectsArray();
	var index = tableObjects.findIndex(obj => obj.Uuid == tableObject.Uuid);

	if(index !== -1){
		tableObjects[index] = tableObject;
		SetTableObjectsArray(tableObjects);
	}
}

export async function DeleteTableObject(uuid: string){
	var tableObjects = await GetTableObjectsArray();
	var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

	if(index !== -1){
		tableObjects[index].UploadStatus = TableObjectUploadStatus.Deleted;
		SetTableObjectsArray(tableObjects);
	}
}

export async function DeleteTableObjectImmediately(uuid: string){
	var tableObjects = await GetTableObjectsArray();
	var index = tableObjects.findIndex(obj => obj.Uuid == uuid);

	if(index !== -1){
		tableObjects.splice(index, 1);
		SetTableObjectsArray(tableObjects);
	}
}
//#endregion