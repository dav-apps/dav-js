import * as crypto from 'crypto'

export class Auth{
	public apiKey: string;
	public secretKey: string;
	public uuid: string;
	public token: string;

	constructor(
		apiKey: string,
		secretKey: string,
		uuid: string
	){
		this.apiKey = apiKey;
		this.secretKey = secretKey;
		this.uuid = uuid;

		// Generate the token
		this.token = this.GenerateAuthToken();
	}

	private GenerateAuthToken() : string{
		return this.apiKey + "," + Buffer.from(crypto.createHmac("SHA256", this.secretKey).update(this.uuid).digest('hex')).toString('base64');
	}
}