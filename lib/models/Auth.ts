import * as CryptoJS from 'crypto-js'

export class Auth {
	public apiKey: string
	public secretKey: string
	public uuid: string
	public token: string

	constructor(params: {
		apiKey: string,
		secretKey: string,
		uuid: string
	}) {
		this.apiKey = params.apiKey
		this.secretKey = params.secretKey
		this.uuid = params.uuid

		// Generate the token
		this.token = this.GenerateAuthToken()
	}

	private GenerateAuthToken(): string {
		return `${this.apiKey},${CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(this.uuid, this.secretKey))}`
	}
}