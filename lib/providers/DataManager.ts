import * as localforage from "localforage";
import * as Dav from '../Dav';
var bowser = require('bowser');
import { TableObject, TableObjectUploadStatus } from '../models/TableObject';

function Init(){
   if(bowser.firefox){
      // Use localstorage as driver
      localforage.setDriver(localforage.LOCALSTORAGE);
   }
}

export function SetUser(user: object){
   Init();
   localforage.setItem(Dav.userKey, user);
}

export async function GetUser(){
   Init();
   return await localforage.getItem(Dav.userKey);
}

export async function GetAllTableObjects(): Promise<Array<TableObject>>{
   Init();
   return <Array<TableObject>>JSON.parse(await localforage.getItem(Dav.tableObjectsKey).toString());
}

export async function GetTableObjectsOfTable(tableId: number){
   var allTableObjects: Array<TableObject> = await GetAllTableObjects();
   var tableObjects: Array<TableObject> = [];
   allTableObjects.forEach(tableObject => {
      if(tableObject.TableId == tableId){
         tableObjects.push(tableObject);
      }
   });
   return tableObjects;
}

export async function SetTableObjects(tableObjects: Array<TableObject>){
   Init();
   await localforage.setItem(Dav.tableObjectsKey, tableObjects);
}

export async function CreateTableObject(tableObject: TableObject){
	// Get all table Objects
	// Check if the table object is already in the list
	// If the table object is new, add it to the list
	// Save the new list
	var tableObjects = await GetAllTableObjects();
	var savedTableObject: TableObject = tableObjects.find(obj => obj.Uuid === tableObject.Uuid);
	if(savedTableObject){
			// The table object already exists, set it to updated
			savedTableObject = tableObject;
			savedTableObject.UploadStatus = TableObjectUploadStatus.Updated;
	}else{
			// The table object is new, set it to new
			tableObject.UploadStatus = TableObjectUploadStatus.New;
			tableObjects.push(tableObject);
	}
	await SetTableObjects(tableObjects);
}

export async function DeleteTableObject(tableObject: TableObject){
	// Get all table objects
	// Find the tableObject in the list and set it to deleted
	// Save the new list
	var tableObjects = await GetAllTableObjects();
	var savedTableObject: TableObject = tableObjects.find(obj => obj.Uuid == tableObject.Uuid);
	if(savedTableObject){
		savedTableObject.UploadStatus = TableObjectUploadStatus.Deleted;
		await SetTableObjects(tableObjects);
	}
}