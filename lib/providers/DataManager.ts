var localforage = require('localforage');
import * as Dav from '../Dav';

export function SetUser(user: object){
   localforage.setItem(Dav.userKey, user);
}

export async function GetUser(){
   return await localforage.getItem(Dav.userKey);
}