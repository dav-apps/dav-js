import * as localforage from "localforage";
import * as Dav from '../Dav';
var axios = require('axios');
import { TableObject, TableObjectUploadStatus, ConvertIntToVisibility } from '../models/TableObject';
import { ConvertObjectToDictionary, ConvertDictionaryToObject } from '../models/Dictionary';
import * as DatabaseOperations from './DatabaseOperations';

var syncing = false;
var syncAgain = true;

//#region Data methods
export async function Sync(){
	if(syncing) return;
	if(!Dav.globals.jwt) return;

	syncing = true;

	Dav.globals.tableIds.forEach(tableId => {
		axios.get(Dav.globals.apiBaseUrl + "apps/table/" + tableId, {
				headers: {'Authorization': Dav.globals.jwt}
			})
			.then((response) => {
				// Check if the table object is saved locally
				response.data.table_objects.forEach(async obj => {
					// Does the table object already exist?
					var tableObject = await DatabaseOperations.GetTableObject(obj["uuid"]);
					var getTableObject = false;

					if(tableObject){
						// Has the etag changed?
						if(tableObject.Etag !== obj.etag){
							// the etag has changed, download the table object and save it in the database
							getTableObject = true;
						}
					}else{
						// Save the new table object
						getTableObject = true;
					}

					if(getTableObject){
						// Download the table object
						var newTableObject = await GetTableObjectFromServer(obj.uuid);
						newTableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
						
						if(tableObject){
							DatabaseOperations.UpdateTableObject(newTableObject);
						}else{
							DatabaseOperations.CreateTableObject(newTableObject);
						}
					}
				});
			})
			.catch((error) => {
				console.log(error);
			});
	});

	syncing = false;
	SyncPush();
}

export async function SyncPush(){
	const okKey = "ok";
	const messageKey = "message";

	if(!(await DatabaseOperations.GetUser())) return;
	if(syncing){
		syncAgain = true;
		return;
	}
	syncing = true;
	
	// Get all table objects
	var tableObjects: TableObject[] = await DatabaseOperations.GetAllTableObjects(true);
	tableObjects.filter(obj => obj.UploadStatus != TableObjectUploadStatus.UpToDate && 
								obj.UploadStatus != TableObjectUploadStatus.NoUpload).reverse().forEach(async tableObject => {

		switch (tableObject.UploadStatus) {
			case TableObjectUploadStatus.New:
				// Upload the table object
				var result = await CreateTableObjectOnServer(tableObject);

				if(result[okKey]){
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
					DatabaseOperations.UpdateTableObject(tableObject);
				}else if(result[messageKey]){
					// Check error codes
					var messageString = JSON.stringify(result[messageKey])

					if(messageString.includes("2704")){		// Field already taken: uuid
						// Set the upload status to UpToDate
						tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
						DatabaseOperations.UpdateTableObject(tableObject);
					}else{
						console.log(result[messageKey])
					}
				}
				break;
			case TableObjectUploadStatus.Updated:
				// Update the table object
				var result = await UpdateTableObjectOnServer(tableObject);

				if(result[okKey]){
					tableObject.UploadStatus = TableObjectUploadStatus.UpToDate;
					DatabaseOperations.UpdateTableObject(tableObject);
				}else if(result[messageKey]){
					// Check error codes
					var messageString = JSON.stringify(result[messageKey])

					if(messageString.includes("2805")){		// Resource does not exist: TableObject
						// Delete the table object locally
						DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);
					}else{
						console.log(result[messageKey])
					}
				}
				break;
			case TableObjectUploadStatus.Deleted:
				var result = await DeleteTableObjectOnServer(tableObject);

				if(result[okKey]){
					// Delete the table object
					DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);
				}else if(result[messageKey]){
					// Check error codes
					var messageString = JSON.stringify(result[messageKey])

					if(messageString.includes("2805")){		// Resource does not exist: TableObject
						DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);
					}else if(result[messageKey].includes("1102")){		// Action not allowed
						DatabaseOperations.DeleteTableObjectImmediately(tableObject.Uuid);
					}else{
						console.log(result[messageKey])
					}
				}
				break;
		}
	});

	syncing = false;

	if(syncAgain){
		syncAgain = false;
		await SyncPush();
	}
}
//#endregion

//#region Api methods
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

async function GetTableObjectFromServer(uuid: string): Promise<TableObject>{
	if(!Dav.globals.jwt) return null;

	try{
		var response = await axios.get(Dav.globals.apiBaseUrl + "apps/object/" + uuid, {
			headers: {'Authorization': Dav.globals.jwt}
		});

		var tableObject = new TableObject();
		tableObject.TableId = response.data.table_id;
		tableObject.IsFile = response.data.file;
		tableObject.Etag = response.data.etag;
		tableObject.Uuid = response.data.uuid;
		tableObject.Visibility = ConvertIntToVisibility(response.data.visibility);
		tableObject.Properties = ConvertObjectToDictionary(response.data.properties);

		return tableObject;
	}catch(error){
		console.log(error);
		return null;
	}
}

export async function CreateTableObjectOnServer(tableObject: TableObject): Promise<object>{		// Return {ok: boolean, message: string}
	if(!Dav.globals.jwt) return {ok: false, message: null};

	try{
		var response = await axios({
			method: 'post',
			url: Dav.globals.apiBaseUrl + "apps/object",
			params: {
				table_id: tableObject.TableId,
				app_id: Dav.globals.appId
			},
			headers: {
				'Authorization': Dav.globals.jwt,
				'Content-Type': 'application/json'
			},
			data: JSON.stringify(ConvertDictionaryToObject(tableObject.Properties))
		});

		return {ok: true, message: response.data};
	}catch(error){
		return {ok: false, message: error.response.data};
	}
}

export async function UpdateTableObjectOnServer(tableObject: TableObject): Promise<object>{
	if(!Dav.globals.jwt) return {ok: false, message: null};

	try{
		var response = await axios({
			method: 'put',
			url: Dav.globals.apiBaseUrl + "apps/object/" + tableObject.Uuid,
			headers: {
				'Authorization': Dav.globals.jwt,
				'Content-Type': 'application/json'
			},
			data: JSON.stringify(ConvertDictionaryToObject(tableObject.Properties))
		});

		return {ok: true, message: response.data};
	}catch(error){
		return {ok: false, message: error.response.data};
	}
}

export async function DeleteTableObjectOnServer(tableObject: TableObject): Promise<object>{
	if(!Dav.globals.jwt) return {ok: false, message: null};

	try{
		var response = await axios({
			method: 'delete',
			url: Dav.globals.apiBaseUrl + "apps/object/" + tableObject.Uuid,
			headers: {
				'Authorization': Dav.globals.jwt
			}
		});

		return {ok: true, message: response.data};
	}catch(error){
		return {ok: false, message: error.response.data};
	}
}
//#endregion