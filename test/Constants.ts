import { TableObject } from '../lib/models/TableObject';

export const davClassLibraryTestUserXTestUserJwt = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImRhdmNsYXNzbGlicmFyeXRlc3RAZGF2LWFwcHMudGVjaCIsInVzZXJuYW1lIjoiZGF2Q2xhc3NMaWJyYXJ5VGVzdFVzZXIiLCJ1c2VyX2lkIjoxMiwiZGV2X2lkIjoyLCJleHAiOjM3NTI5MTgzODQxfQ.lO-iq5UHk25wnysbrEw1PirgGBhz-rFqrK6iRGkcFnU";
export const davClassLibraryTestAppId = 12;
export const davClassLibraryTestUserId = 12;
export const testDataTableId = 23;

export const firstPropertyName = "page1";
export const secondPropertyName = "page2";

export var firstTestDataTableObject = new TableObject();
firstTestDataTableObject.Uuid = "642e6407-f357-4e03-b9c2-82f754931161";
firstTestDataTableObject.Properties = new Map([
   [firstPropertyName, "Hello World"],
   [secondPropertyName, "Hallo Welt"]
]);

export var secondTestDataTableObject = new TableObject();
secondTestDataTableObject.Uuid = "8d29f002-9511-407b-8289-5ebdcb5a5559";
secondTestDataTableObject.Properties = new Map([
   [firstPropertyName, "Table"],
   [secondPropertyName, "Tabelle"]
]);