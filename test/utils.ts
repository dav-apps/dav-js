import * as localforage from 'localforage'
import { tableObjectsKey } from '../lib/constants'
import { TableObject } from '../lib/models/TableObject'

export async function SetTableObjectsArray(tableObjects: Array<TableObject>) {
	try {
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
	} catch (error) {
		console.log(error)
	}
}