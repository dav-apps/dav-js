import { Dictionary } from './Dictionary';

export class TableObject{
   public TableId: number;
   public Uuid: string = generateUUID();
   public Visibility: TableObjectVisibility = TableObjectVisibility.Private;
   public IsFile: boolean = false;
   public Properties: Dictionary = new Dictionary();
   public UploadStatus: TableObjectUploadStatus = TableObjectUploadStatus.New;

   constructor(){}
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

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function generateUUID() { // Public Domain/MIT
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