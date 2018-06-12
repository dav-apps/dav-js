var axios = require('axios');
import * as Dav from '../Dav';
import { TableObject, TableObjectUploadStatus } from "../models/TableObject";
import { Observable } from 'rxjs';

export async function DownloadUserInformation(jwt: string){
   var url = Dav.globals.apiBaseUrl + "auth/user";

   var options = {
      headers: {
         "Authorization": jwt
      }
   }

   try{
      var response = await axios.get(url, options);
      if(response.status == 200){
         return {
            email: response.data.email,
            username: response.data.username,
            totalStorage: response.data.total_storage,
            usedStorage: response.data.used_storage,
            plan: response.data.plan,
            avatar: response.data.avatar,
            avatarEtag: response.data.avatar_etag,
            jwt: jwt
         }
      }else{
         return null;
      }
   }catch(error){
      console.log(error);
      return null;
   }
}

export function DownloadTableObjects(): Observable<TableObject>{
   // Download all tableObject and save them
   return new Observable<TableObject>((observer: any) => {

	});
}

export async function CreateTableObject(tableObject: TableObject){

}

export async function UpdateTableObject(tableObject: TableObject){

}

export async function DeleteTableObject(tableObject: TableObject){

}