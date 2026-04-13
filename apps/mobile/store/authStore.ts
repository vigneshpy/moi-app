import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

type AuthState = {
	isAuthenticated: boolean | undefined;
	isLoading: boolean | undefined;

	setIsAuthenticated: (value: boolean) => void;
	checkAuth: () => Promise<void>;
	handlelogout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
	isAuthenticated: undefined,
	isLoading: true,
	setIsAuthenticated: (value: AuthState["isAuthenticated"]) => {
		console.log("Auth Updated:", value);
		set({ isAuthenticated: value });
	},
	checkAuth: async () => {
		try {
			const storedCookies = await SecureStore.getItemAsync("cookies"); // Load cookies
			console.log("storedCookies: ", storedCookies);
			if (storedCookies) {
				const cookies = JSON.parse(storedCookies);
				const sessionCookie = cookies.find((cookie: string) =>
					cookie.includes("token=")
				);
				console.log("sessionCookie: ", sessionCookie);

				if (sessionCookie) {
					set({ isAuthenticated: true });
					set({ isLoading: false });
				} else {
					set({ isAuthenticated: false });
					set({ isLoading: false });

					console.log("No valid session cookie found.");
				}
			} else {
				set({ isAuthenticated: false });
				set({ isLoading: false });

				console.log("No cookies stored.");
			}
		} catch (error) {
			console.error("Failed to check authentication:", error);
			set({ isAuthenticated: false });
			set({ isLoading: false });
		}
	},
	handlelogout: async () => {
		try {
			await SecureStore.deleteItemAsync("cookies");
			set({ isAuthenticated: false });
			set({ isLoading: false });
		} catch (error) {
			console.error("Failed to logout:", error);
		}
	},
}));
