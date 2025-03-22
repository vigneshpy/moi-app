import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../constants";

const cookieJar = new CookieJar();
const saveCookies = async (cookies: string[]) => {
	try {
		// Save only relevant cookies as a JSON string
		const cookieString = JSON.stringify(cookies);
		await SecureStore.setItemAsync("cookies", cookieString);
	} catch (error) {
		console.error("Failed to save cookies:", error);
	}
};

// Function to load cookies from Encrypted Storage
const loadCookies = async () => {
	try {
		const storedCookies = await SecureStore.getItemAsync("cookies");
		if (storedCookies) {
			const cookies = JSON.parse(storedCookies);
			cookies.forEach((cookie: string) => {
				// Set cookies into the cookie jar
				cookieJar.setCookieSync(cookie, API_BASE_URL);
			});
			console.log("Cookies loaded successfully");
		} else {
			console.log("No cookies found in storage.");
		}
	} catch (error) {
		console.error("Failed to load cookies:", error);
	}
};
// Load cookies when the app starts
loadCookies();

export const api = wrapper(
	axios.create({
		baseURL: API_BASE_URL,
		withCredentials: true,
		jar: cookieJar, // Use cookieJar to store and send cookies with requests
	})
);

// Intercept response to save cookies if present
api.interceptors.response.use(
	async (response) => {
		const setCookieHeader = response.headers["set-cookie"];
		console.log("setCookieHeader: ", setCookieHeader);
		if (setCookieHeader) {
			await saveCookies(setCookieHeader); // Save the cookies from response
		}
		return response;
	},
	(error) => {
		console.log("error: ", error);
		return Promise.reject(error);
	}
);
