import * as localforage from "localforage";
import * as Dav from '../Dav';
var bowser = require('bowser');

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