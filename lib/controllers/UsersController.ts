import axios from "axios"
import { request, gql, ClientError } from "graphql-request"
import { Dav } from "../Dav.js"
import {
	ApiResponse,
	ErrorCode,
	ApiErrorResponse2,
	UserResource
} from "../types.js"
import {
	convertErrorToApiErrorResponse2,
	getErrorCodesOfGraphQLError,
	handleApiError2,
	handleGraphQLErrors,
	convertUserResourceToUser
} from "../utils.js"
import { Auth } from "../models/Auth.js"
import { User } from "../models/User.js"

export interface CreateUserResponseData {
	user: User
	accessToken: string
	websiteAccessToken?: string
}

export async function retrieveUser(
	queryData: string,
	variables?: { accessToken?: string }
): Promise<User | ErrorCode[]> {
	try {
		const response = await request<{ retrieveUser: UserResource }>(
			Dav.newApiBaseUrl,
			gql`
				query RetrieveUser {
					retrieveUser {
						${queryData}
					}
				}
			`,
			{},
			{
				Authorization: variables?.accessToken ?? Dav.accessToken
			}
		)

		return convertUserResourceToUser(response.retrieveUser)
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await retrieveUser(queryData, variables)
	}
}

export async function retrieveUserById(
	queryData: string,
	variables: {
		auth: Auth
		id: number
	}
): Promise<User | ErrorCode[]> {
	try {
		const response = await request<{ retrieveUserById: UserResource }>(
			Dav.newApiBaseUrl,
			gql`
				query RetrieveUserById($id: Int!) {
					retrieveUserById(id: $id) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id
			},
			{
				Authorization: variables.auth.token
			}
		)

		return convertUserResourceToUser(response.retrieveUserById)
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function createUser(
	queryData: string,
	variables: {
		auth: Auth
		email: string
		firstName: string
		password: string
		appId: number
		apiKey: string
		deviceName?: string
		deviceOs?: string
	}
): Promise<CreateUserResponseData | ErrorCode[]> {
	try {
		let response = await request<{
			createUser: {
				user: UserResource
				accessToken: string
				websiteAccessToken?: string
			}
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation CreateUser(
					$email: String!
					$firstName: String!
					$password: String!
					$appId: Int!
					$apiKey: String!
					$deviceName: String
					$deviceOs: String
				) {
					createUser(
						email: $email
						firstName: $firstName
						password: $password
						appId: $appId
						apiKey: $apiKey
						deviceName: $deviceName
						deviceOs: $deviceOs
					) {
						${queryData}
					}
				}
			`,
			{
				email: variables.email,
				firstName: variables.firstName,
				password: variables.password,
				appId: variables.appId,
				apiKey: variables.apiKey,
				deviceName: variables.deviceName,
				deviceOs: variables.deviceOs
			},
			{
				Authorization: variables.auth.token
			}
		)

		if (response.createUser == null) {
			return null
		} else {
			return {
				user: convertUserResourceToUser(response.createUser.user),
				accessToken: response.createUser.accessToken,
				websiteAccessToken: response.createUser.websiteAccessToken
			}
		}
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function updateUser(
	queryData: string,
	variables: {
		accessToken?: string
		email?: string
		firstName?: string
		password?: string
	}
): Promise<User | ErrorCode[]> {
	try {
		let response = await request<{ updateUser: UserResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation UpdateUser(
					$email: String
					$firstName: String
					$password: String
				) {
					updateUser(
						email: $email
						firstName: $firstName
						password: $password
					) {
						${queryData}
					}
				}
			`,
			{
				email: variables.email,
				firstName: variables.firstName,
				password: variables.password
			},
			{
				Authorization: variables.accessToken ?? Dav.accessToken
			}
		)

		return convertUserResourceToUser(response.updateUser)
	} catch (error) {
		const errorCodes = getErrorCodesOfGraphQLError(error as ClientError)

		if (variables.accessToken != null) {
			return errorCodes
		}

		let renewSessionError = await handleGraphQLErrors(errorCodes)
		if (renewSessionError != null) return renewSessionError as ErrorCode[]

		return await updateUser(queryData, variables)
	}
}

export async function uploadUserProfileImage(params: {
	accessToken?: string
	contentType: string
	data: string
}): Promise<ApiResponse<{}> | ApiErrorResponse2> {
	try {
		let response = await axios({
			method: "put",
			url: `${Dav.newApiBaseUrl}/user/profileImage`,
			headers: {
				Authorization: params.accessToken ?? Dav.accessToken,
				"Content-Type": params.contentType
			},
			data: params.data
		})

		return {
			status: response.status,
			data: {}
		}
	} catch (error) {
		if (params.accessToken != null) {
			return convertErrorToApiErrorResponse2(error)
		}

		let renewSessionError = await handleApiError2(error)
		if (renewSessionError != null) return renewSessionError

		return await uploadUserProfileImage(params)
	}
}

export async function sendConfirmationEmailForUser(
	queryData: string,
	variables: {
		auth: Auth
		id: number
	}
): Promise<User | ErrorCode[]> {
	try {
		let response = await request<{
			sendConfirmationEmailForUser: UserResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation SendConfirmationEmailForUser($id: Int!) {
					sendConfirmationEmailForUser(id: $id) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id
			},
			{
				Authorization: variables.auth.token
			}
		)

		return convertUserResourceToUser(response.sendConfirmationEmailForUser)
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function sendPasswordResetEmailForUser(
	queryData: string,
	variables: {
		auth: Auth
		email: string
	}
): Promise<User | ErrorCode[]> {
	try {
		let response = await request<{
			sendPasswordResetEmailForUser: UserResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation SendPasswordResetEmailForUser($email: String!) {
					sendPasswordResetEmailForUser(email: $email) {
						${queryData}
					}
				}
			`,
			{
				email: variables.email
			},
			{
				Authorization: variables.auth.token
			}
		)

		return convertUserResourceToUser(response.sendPasswordResetEmailForUser)
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function confirmUser(
	queryData: string,
	variables: {
		auth: Auth
		id: number
		emailConfirmationToken: string
	}
): Promise<User | ErrorCode[]> {
	try {
		let response = await request<{ confirmUser: UserResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation ConfirmUser(
					$id: Int!
					$emailConfirmationToken: String!
				) {
					confirmUser(
						id: $id
						emailConfirmationToken: $emailConfirmationToken
					) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id,
				emailConfirmationToken: variables.emailConfirmationToken
			},
			{
				Authorization: variables.auth.token
			}
		)

		return convertUserResourceToUser(response.confirmUser)
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function saveNewEmailOfUser(
	queryData: string,
	variables: {
		auth: Auth
		id: number
		emailConfirmationToken: string
	}
): Promise<User | ErrorCode[]> {
	try {
		let response = await request<{ saveNewEmailOfUser: UserResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation SaveNewEmailOfUser(
					$id: Int!
					$emailConfirmationToken: String!
				) {
					saveNewEmailOfUser(
						id: $id
						emailConfirmationToken: $emailConfirmationToken
					) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id,
				emailConfirmationToken: variables.emailConfirmationToken
			},
			{
				Authorization: variables.auth.token
			}
		)

		return convertUserResourceToUser(response.saveNewEmailOfUser)
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function saveNewPasswordOfUser(
	queryData: string,
	variables: {
		auth: Auth
		id: number
		passwordConfirmationToken: string
	}
): Promise<User | ErrorCode[]> {
	try {
		let response = await request<{ saveNewPasswordOfUser: UserResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation SaveNewPasswordOfUser(
					$id: Int!
					$passwordConfirmationToken: String!
				) {
					saveNewPasswordOfUser(
						id: $id
						passwordConfirmationToken: $passwordConfirmationToken
					) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id,
				passwordConfirmationToken: variables.passwordConfirmationToken
			},
			{
				Authorization: variables.auth.token
			}
		)

		return convertUserResourceToUser(response.saveNewPasswordOfUser)
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function resetEmailOfUser(
	queryData: string,
	variables: {
		auth: Auth
		id: number
		emailConfirmationToken: string
	}
): Promise<User | ErrorCode[]> {
	try {
		let response = await request<{ resetEmailOfUser: UserResource }>(
			Dav.newApiBaseUrl,
			gql`
				mutation ResetEmailOfUser(
					$id: Int!
					$emailConfirmationToken: String!
				) {
					resetEmailOfUser(
						id: $id
						emailConfirmationToken: $emailConfirmationToken
					) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id,
				emailConfirmationToken: variables.emailConfirmationToken
			},
			{
				Authorization: variables.auth.token
			}
		)

		return convertUserResourceToUser(response.resetEmailOfUser)
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}

export async function setPasswordOfUser(
	queryData: string,
	variables: {
		auth: Auth
		id: number
		password: string
		passwordConfirmationToken: string
	}
): Promise<User | ErrorCode[]> {
	try {
		let response = await request<{
			setPasswordOfUser: UserResource
		}>(
			Dav.newApiBaseUrl,
			gql`
				mutation SetPasswordOfUser(
					$id: Int!
					$password: String!
					$passwordConfirmationToken: String!
				) {
					setPasswordOfUser(
						id: $id
						password: $password
						passwordConfirmationToken: $passwordConfirmationToken
					) {
						${queryData}
					}
				}
			`,
			{
				id: variables.id,
				password: variables.password,
				passwordConfirmationToken: variables.passwordConfirmationToken
			},
			{
				Authorization: variables.auth.token
			}
		)

		return convertUserResourceToUser(response.setPasswordOfUser)
	} catch (error) {
		return getErrorCodesOfGraphQLError(error as ClientError)
	}
}
