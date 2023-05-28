import axios from "axios"
import MockAdapter from "axios-mock-adapter"

export let mock: MockAdapter = new MockAdapter(axios)
