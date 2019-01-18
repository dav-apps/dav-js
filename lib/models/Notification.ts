import { generateUUID } from "./TableObject";
import * as DatabaseOperations from "../providers/DatabaseOperations";
import { UploadStatus } from '../providers/DataManager';

export class Notification{
   public Uuid: string;
   public Time: number;
   public Interval: number = 0;
   public Properties: object = {};
   public Status: UploadStatus;

   constructor(time: number, interval: number, properties: object, uuid: string = null, status: UploadStatus = UploadStatus.UpToDate){
      if(!uuid) uuid = generateUUID();
      this.Uuid = uuid;
      this.Time = time;
      this.Interval = interval;
      this.Properties = properties;
      this.Status = status;
   }

   async Save(){
      await DatabaseOperations.SaveNotification(this);
   }
}