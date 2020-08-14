import * as axios from 'axios'
import * as localforage from 'localforage'
import { Dav, tableObjectsKey } from '../lib/Dav'
import { TableObject } from '../lib/models/TableObject'
import { davClassLibraryTestUserXTestUserJwt } from './Constants'

export async function SetTableObjectsArray(tableObjects: Array<TableObject>){
	try{
		// Convert the table objects into objects
		var objects: object[] = [];
		tableObjects.forEach(tableObject => {
			objects.push({
				TableId: tableObject.TableId,
				IsFile: tableObject.IsFile,
				File: tableObject.File,
				Uuid: tableObject.Uuid,
				UploadStatus: tableObject.UploadStatus,
				Etag: tableObject.Etag,
				Properties: tableObject.Properties
			})
		})

		await localforage.setItem(tableObjectsKey, objects)
	}catch(error){
		console.log(error)
	}
}

export async function GetNotificationFromServer(uuid: string) : Promise<{ uuid: string, time: number, interval: number, properties: object }>{
   try{
		var response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/notification/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});

      return {
         uuid: response.data.uuid,
         time: response.data.time,
         interval: response.data.interval,
         properties: response.data.properties
      }
   }catch(error){
      return null;
   }
}

export async function DeleteNotificationFromServer(uuid: string) : Promise<{ ok: Boolean, message: string }>{
   try{
		var response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/apps/notification/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});
		
      return {ok: true, message: response.data};
   }catch(error){
      return {ok: false, message: error.response.data};
   }
}