import * as localforage from "localforage";
import * as Dav from '../Dav';
var bowser = require('bowser');
import { TableObject, TableObjectUploadStatus } from '../models/TableObject';
import { Observable } from 'rxjs';
import * as ApiManager from './ApiManager';

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

async function GetAllTableObjectsArray(): Promise<Array<TableObject>>{
	Init();
	var tableObjects = await localforage.getItem<TableObject[]>(Dav.tableObjectsKey);

	if(tableObjects){
		return tableObjects.filter(obj => obj.UploadStatus != TableObjectUploadStatus.Deleted);
	}
	return [];
}

export function GetAllTableObjects(): Observable<TableObject>{
	Init();
	return new Observable<TableObject>((observer: any) => {
		localforage.getItem(Dav.tableObjectsKey, (error, tableObjects: TableObject[]) => {
			if(!error){
				if(tableObjects){
					tableObjects.forEach(tableObject => {
						if(tableObject.UploadStatus != TableObjectUploadStatus.Deleted){
							observer.next(tableObject);
						}
					});
				}
			}

			// Sync
			ApiManager.DownloadTableObjects()
				.forEach((tableObject: TableObject) => {
					observer.next(tableObject);
				});
		});
	});
}

export async function SetTableObjects(tableObjects: Array<TableObject>){
   Init();
   await localforage.setItem(Dav.tableObjectsKey, tableObjects);
}

export async function SaveTableObject(tableObject: TableObject){
	var tableObjects = await GetAllTableObjectsArray();
	var savedTableObject = tableObjects.find(obj => obj.Uuid === tableObject.Uuid);
	if(savedTableObject){
		// The table object already exists, set it to updated
		savedTableObject.Properties = tableObject.Properties;
		savedTableObject.UploadStatus = TableObjectUploadStatus.Updated;
	}else{
		// The table object is new, set it to new
		tableObject.UploadStatus = TableObjectUploadStatus.New;
		tableObjects.push(tableObject);
	}
	// Save the new list
	await SetTableObjects(tableObjects);
}

export async function GetTableObject(uuid: string): Promise<TableObject>{
	var tableObjects = await GetAllTableObjectsArray();
	return tableObjects.find(obj => obj.Uuid === uuid);
}

export async function DeleteTableObject(tableObject: TableObject){
	// Get all table objects
	// Find the tableObject in the list and set it to deleted
	// Save the new list
	var tableObjects = await GetAllTableObjectsArray();
	var savedTableObject: TableObject = tableObjects.find(obj => obj.Uuid == tableObject.Uuid);
	if(savedTableObject){
		savedTableObject.UploadStatus = TableObjectUploadStatus.Deleted;
		await SetTableObjects(tableObjects);
	}
}

async function PushSync(){
   // Get all table objects
   var tableObjects: Array<TableObject> = await GetAllTableObjectsArray();
   tableObjects.reverse().forEach(tableObject => {
      switch (tableObject.UploadStatus) {
         case TableObjectUploadStatus.New:
            // Upload the table object
            ApiManager.CreateTableObject(tableObject);
            break;
         case TableObjectUploadStatus.Updated:
            // Update the table object
            ApiManager.UpdateTableObject(tableObject);
            break;
            case TableObjectUploadStatus.Deleted:
            // Delete the table object
            ApiManager.DeleteTableObject(tableObject);
            break;
      }
   });
}