import * as axios from 'axios'
import { Dav } from '../Dav'

export async function DeleteSessionOnServer(jwt: string) {
	// Return if the jwt is a normal jwt
	if (!jwt || !jwt.split('.')[3]) return;

	try {
		await axios.default({
			method: 'delete',
			url: `${Dav.apiBaseUrl}/auth/session`,
			headers: { 'Authorization': jwt }
		});
	} catch (error) { }
}