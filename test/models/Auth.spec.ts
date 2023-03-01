import { assert } from "chai"
import { Auth } from "../../lib/models/Auth.js"

describe("Constructor", () => {
	it("should assign the params and generate the correct auth token", () => {
		// Arrange
		let apiKey = "MhKSDyedSw8WXfLk2hkXzmElsiVStD7C8JU3KNGp"
		let secretKey = "5nyf0tRr0GNmP3eB83pobm8hifALZsUq3NpW5En9nFRpssXxlZv-JA"
		let uuid = "71a5d4f8-083e-413e-a8ff-66847a5f3a97"
		let authToken =
			"MhKSDyedSw8WXfLk2hkXzmElsiVStD7C8JU3KNGp,NTU5ZGE3YTNiMmU5ZjNmNGRmNWEzZDcyMmZjOWFjMWMyZGMxYTQ3NjNmMTgwZmQwNjgxOGE3MGViZjNmODUyZg=="

		// Act
		let auth = new Auth({
			apiKey,
			secretKey,
			uuid
		})

		// Assert
		assert.equal(auth.token, authToken)
	})
})
