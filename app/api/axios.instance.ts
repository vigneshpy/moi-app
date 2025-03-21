import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../constants";

const cookieJar = new CookieJar();
const saveCookies = async (cookies: any) => {
	try {
		const cookieString = JSON.stringify(cookies); // Convert to string
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
			const cookies = JSON.parse(storedCookies); // Convert string back to object
			cookies.forEach((cookie: any) => {
				cookieJar.setCookieSync(cookie, API_BASE_URL);
			});
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
		jar: cookieJar,
	})
);

api.interceptors.response.use(
	async (response) => {
		// Extract cookies from the response headers
		const setCookieHeader = response.headers["set-cookie"]; // Get cookies from headers
		if (setCookieHeader) {
			await saveCookies(setCookieHeader); // Pass cookies to saveCookies function
		}
		return response;
	},
	(error) => {
		return Promise.reject(error);
	}
);
