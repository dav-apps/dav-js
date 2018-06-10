var axios = require('axios');
import * as Dav from '../Dav';
import { TableObject, TableObjectUploadStatus } from "../models/TableObject";
import * as DataManager from './DataManager';

export async function DownloadUserInformation(jwt: string){
   var url = Dav.apiBaseUrl + "auth/user";

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

export async function DownloadTableObjects(){
   
}

export async function CreateTableObject(tableObject: TableObject){

}

export async function UpdateTableObject(tableObject: TableObject){

}

export async function DeleteTableObject(tableObject: TableObject){

}

function Sync(){
   // Download all tableObject and save them
   
}

async function PushSync(){
   // Get all table objects
   var tableObjects: Array<TableObject> = await DataManager.GetAllTableObjects();
   tableObjects.reverse().forEach(tableObject => {
      switch (tableObject.UploadStatus) {
         case TableObjectUploadStatus.New:
            // Upload the table object
            CreateTableObject(tableObject);
            break;
         case TableObjectUploadStatus.Updated:
            // Update the table object
            UpdateTableObject(tableObject);
            break;
            case TableObjectUploadStatus.Deleted:
            // Delete the table object
            DeleteTableObject(tableObject);
            break;
      }
   });
}