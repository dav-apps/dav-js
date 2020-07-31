import * as axios from 'axios';
import { Dav } from '../lib/Dav';
import { TableObject } from '../lib/models/TableObject';
import { davClassLibraryTestUserXTestUserJwt } from './Constants';

export async function GetTableObjectFromServer(uuid: string): Promise<TableObject>{
   try{
		var response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/object/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});

      var tableObject = new TableObject();
      tableObject.TableId = response.data.table_id;
      tableObject.IsFile = response.data.file;
      tableObject.Etag = response.data.etag;
      tableObject.Uuid = response.data.uuid;
		
		for (let key of Object.keys(response.data.properties)) {
			tableObject.Properties[key] = {value: response.data.properties[key]}
		}

      return tableObject;
   }catch(error){
      return null;
   }
}

export async function DeleteTableObjectFromServer(uuid: string) : Promise<{ ok: Boolean, message: string }>{
   try{
		var response = await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/apps/object/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});

      return {ok: true, message: response.data};
   }catch(error){
      return {ok: false, message: error.response.data};
   }
}

export async function GetSubscriptionFromServer(uuid: string) : Promise<{ uuid: string, endpoint: string, p256dh: string, auth: string }>{
   try{
		var response = await axios.default({
			method: 'get',
			url: `${Dav.apiBaseUrl}/apps/subscription/${uuid}`,
			headers: {
				'Authorization': davClassLibraryTestUserXTestUserJwt
			}
		});

      return {
         uuid: response.data.uuid,
         endpoint: response.data.endpoint,
         p256dh: response.data.p256dh,
         auth: response.data.auth
      }
   }catch(error){
      return null;
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