import axios from "axios"
import { Dav } from "../Dav.js"
import { ApiErrorResponse, ApiResponse } from "../types.js"
import { ConvertErrorToApiErrorResponse, HandleApiError } from "../utils.js"

export interface CreateCustomerPortalSessionResponseData {
	sessionUrl: string
}

export async function CreateCustomerPortalSession(params?: {
	accessToken?: string
}): Promise<
	ApiResponse<CreateCustomerPortalSessionResponseData> | ApiErrorResponse
> {
	try {
		let response = await axios({
			method: "post",
			url: `${Dav.apiBaseUrl}/customer_portal_session`,
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
				sessionUrl: response.data.session_url
			}
		}
	} catch (error) {
		if (params != null && params.accessToken != null) {
			return ConvertErrorToApiErrorResponse(error)
		}

		let renewSessionError = await HandleApiError(error)
		if (renewSessionError != null) return renewSessionError

		return await CreateCustomerPortalSession()
	}
}
