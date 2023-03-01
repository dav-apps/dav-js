import axios from "axios"
import { Dav } from "../Dav.js"
import { ApiResponse, ApiErrorResponse } from "../types.js"
import {
	ConvertErrorToApiErrorResponse,
	HandleApiError,
	PrepareRequestParams
} from "../utils.js"
import { Auth } from "../models/Auth.js"
import { User } from "../models/User.js"
import { ConvertObjectArrayToApps } from "../models/App.js"

export interface SignupResponseData {
	user: User
	accessToken: string
	websiteAccessToken?: string
}

export interface CreateStripeCustomerForUserResponseData {
	stripeCustomerId: string
}

export async function Signup(params: {
	auth: Auth
	email: string
	firstName: string
	password: string
	appId: number
	apiKey: string
	deviceName?: string
	deviceOs?: string
}): Promise<ApiResponse<SignupResponseData> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/signup`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				email: params.email,
				first_name: params.firstName,
				password: params.password,
				app_id: params.appId,
				api_key: params.apiKey,
				device_name: params.deviceName,
				device_os: params.deviceOs
			})
		})

		return {
			status: response.status,
			data: {
				user: new User(
					response.data.user.id,
					response.data.user.email,
					response.data.user.first_name,
					response.data.user.confirmed,
					response.data.user.total_storage,
					response.data.user.used_storage,
					response.data.user.stripe_customer_id,
					response.data.user.plan,
					response.data.user.subscription_status,
					null,
					response.data.user.dev,
					response.data.user.provider,
					response.data.user.profile_image,
					response.data.user.profile_image_etag,
					[]
				),
				accessToken: response.data.access_token,
				websiteAccessToken: response.data.website_access_token
			}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function GetUser(params?: {
	accessToken?: string
}): Promise<ApiResponse<User> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/user`,
			headers: {
				Authorization:
					params != null && params.accessToken != null
						? params.accessToken
						: Dav.accessToken
			}
		})

		let periodEnd = undefined
		if (response.data.period_end != null) {
			periodEnd = new Date(response.data.period_end)
		}

		return {
			status: response.status,
			data: new User(
				response.data.id,
				response.data.email,
				response.data.first_name,
				response.data.confirmed,
				response.data.total_storage,
				response.data.used_storage,
				response.data.stripe_customer_id,
				response.data.plan,
				response.data.subscription_status,
				periodEnd,
				response.data.dev,
				response.data.provider,
				response.data.profile_image,
				response.data.profile_image_etag,
				ConvertObjectArrayToApps(response.data.apps)
			)
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetUser()
	}
}

export async function GetUserById(params: {
	auth: Auth
	id: number
}): Promise<ApiResponse<User> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/user/${params.id}`,
			headers: {
				Authorization: params.auth.token
			}
		})

		return {
			status: response.status,
			data: new User(
				response.data.id,
				response.data.email,
				response.data.first_name,
				response.data.confirmed,
				response.data.total_storage,
				response.data.used_storage,
				response.data.stripe_customer_id,
				response.data.plan,
				response.data.subscription_status,
				response.data.period_end,
				response.data.dev,
				response.data.provider,
				response.data.profile_image,
				response.data.profile_image_etag,
				ConvertObjectArrayToApps(response.data.apps)
			)
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function UpdateUser(params: {
	accessToken?: string
	email?: string
	firstName?: string
	password?: string
}): Promise<ApiResponse<User> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.apiBaseUrl}/user`,
			headers: {
				Authorization:
					params.accessToken != null ? params.accessToken : Dav.accessToken
			},
			data: PrepareRequestParams({
				email: params.email,
				first_name: params.firstName,
				password: params.password
			})
		})

		return {
			status: response.status,
			data: new User(
				response.data.id,
				response.data.email,
				response.data.first_name,
				response.data.confirmed,
				response.data.total_storage,
				response.data.used_storage,
				response.data.stripe_customer_id,
				response.data.plan,
				response.data.subscription_status,
				response.data.period_end == null
					? null
					: new Date(response.data.period_end),
				response.data.dev,
				response.data.provider,
				response.data.profile_image,
				response.data.profile_image_etag,
				[]
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await UpdateUser(params)
	}
}

export async function SetProfileImageOfUser(params: {
	accessToken?: string
	data: string
	type: string
}): Promise<ApiResponse<User> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.apiBaseUrl}/user/profile_image`,
			headers: {
				Authorization:
					params.accessToken != null
						? params.accessToken
						: Dav.accessToken,
				"Content-Type": params.type
			},
			data: params.data
		})

		return {
			status: response.status,
			data: new User(
				response.data.id,
				response.data.email,
				response.data.first_name,
				response.data.confirmed,
				response.data.total_storage,
				response.data.used_storage,
				response.data.stripe_customer_id,
				response.data.plan,
				response.data.subscription_status,
				response.data.period_end == null
					? null
					: new Date(response.data.period_end),
				response.data.dev,
				response.data.provider,
				response.data.profile_image,
				response.data.profile_image_etag,
				[]
			)
		}
	} catch (error) {
		if (params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await SetProfileImageOfUser(params)
	}
}

export async function GetProfileImageOfUser(params?: {
	accessToken?: string
}): Promise<ApiResponse<Blob> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/user/profile_image`,
			headers: {
				Authorization:
					params != null && params.accessToken != null
						? params.accessToken
						: Dav.accessToken
			},
			responseType: "blob"
		})

		return {
			status: response.status,
			data: response.data as Blob
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await GetProfileImageOfUser()
	}
}

export async function GetProfileImageOfUserById(params: {
	auth: Auth
	id: number
}): Promise<ApiResponse<Blob> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "get",
			url: `${Dav.apiBaseUrl}/user/${params.id}/profile_image`,
			headers: {
				Authorization: params.auth.token
			},
			responseType: "blob"
		})

		return {
			status: response.status,
			data: response.data as Blob
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function CreateStripeCustomerForUser(params?: {
	accessToken?: string
}): Promise<
	ApiResponse<CreateStripeCustomerForUserResponseData> | ApiErrorResponse
> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/user/stripe`,
			headers: {
				Authorization:
					params != null && params.accessToken != null
						? params.accessToken
						: Dav.accessToken
			}
		})

		return {
			status: response.status,
			data: {
				stripeCustomerId: response.data.stripe_customer_id
			}
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateStripeCustomerForUser()
	}
}

export async function SendConfirmationEmail(params: {
	auth: Auth
	id: number
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/user/${params.id}/send_confirmation_email`,
			headers: {
				Authorization: params.auth.token
			}
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function SendPasswordResetEmail(params: {
	auth: Auth
	email: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/user/send_password_reset_email`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				email: params.email
			})
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function ConfirmUser(params: {
	auth: Auth
	id: number
	emailConfirmationToken: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/user/${params.id}/confirm`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				email_confirmation_token: params.emailConfirmationToken
			})
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function SaveNewEmail(params: {
	auth: Auth
	id: number
	emailConfirmationToken: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/user/${params.id}/save_new_email`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				email_confirmation_token: params.emailConfirmationToken
			})
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function SaveNewPassword(params: {
	auth: Auth
	id: number
	passwordConfirmationToken: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/user/${params.id}/save_new_password`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				password_confirmation_token: params.passwordConfirmationToken
			})
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function ResetEmail(params: {
	auth: Auth
	id: number
	emailConfirmationToken: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/user/${params.id}/reset_email`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				email_confirmation_token: params.emailConfirmationToken
			})
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}

export async function SetPassword(params: {
	auth: Auth
	id: number
	password: string
	passwordConfirmationToken: string
}): Promise<ApiResponse<{}> | ApiErrorResponse> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.apiBaseUrl}/user/${params.id}/password`,
			headers: {
				Authorization: params.auth.token
			},
			data: PrepareRequestParams({
				password: params.password,
				password_confirmation_token: params.passwordConfirmationToken
			})
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		return ConvertErrorToApiErrorResponse(error)
	}
}
