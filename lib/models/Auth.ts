var cryptoJs = require('crypto-js');

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
		try{
			return this.apiKey + "," + Buffer.from(cryptoJs.HmacSHA256(this.uuid, this.secretKey).toString(cryptoJs.enc.hex)).toString('base64');
		}catch(e){
			return this.apiKey + "," + btoa(cryptoJs.HmacSHA256(this.uuid, this.secretKey).toString(cryptoJs.enc.hex));
		}
	}
}