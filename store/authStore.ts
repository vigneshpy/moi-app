import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

type AuthState = {
	isAuthenticated: boolean;
	setIsAuthenticated: (value: boolean) => void;
	checkAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
	isAuthenticated: false,
	setIsAuthenticated: (value) => {
		console.log("Auth Updated:", value);
		set({ isAuthenticated: value });
	},
	checkAuth: async () => {
		try {
			const storedCookies = await SecureStore.getItemAsync("cookies"); // Load cookies
			if (storedCookies) {
				const cookies = JSON.parse(storedCookies);
				const sessionCookie = cookies.find(
					(cookie: string) => cookie.includes("session=") // Adjust for your actual cookie name
				);

				if (sessionCookie) {
					set({ isAuthenticated: true }); // ✅ Set user as authenticated
					console.log("User is authenticated from cookies.");
				} else {
					set({ isAuthenticated: false });
					console.log("No valid session cookie found.");
				}
			} else {
				set({ isAuthenticated: false });
				console.log("No cookies stored.");
			}
		} catch (error) {
			console.error("Failed to check authentication:", error);
			set({ isAuthenticated: false });
		}
	},
}));
