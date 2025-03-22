import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

type User = {
	id: string;
	first_name: string;
	last_name: string;
	password: string;
	is_verified: Boolean;
	email: string;
	phone_number: string;
} | null;

type UserState = {
	user: User;
	setUser: (user: User) => Promise<void>;
	clearUser: () => Promise<void>;
	loadUser: () => Promise<void>;
};

export const useUserStore = create<UserState>((set) => ({
	user: null,

	setUser: async (user) => {
		try {
			await SecureStore.setItemAsync("user", JSON.stringify(user));
			set({ user });
		} catch (error) {
			console.error("Failed to store user data:", error);
		}
	},

	clearUser: async () => {
		try {
			await SecureStore.deleteItemAsync("user");
			set({ user: null });
		} catch (error) {
			console.error("Failed to clear user data:", error);
		}
	},

	loadUser: async () => {
		try {
			const storedUser = await SecureStore.getItemAsync("user");
			if (storedUser) {
				set({ user: JSON.parse(storedUser) });
				console.log("User data loaded.");
			} else {
				set({ user: null });
				console.log("No user data found.");
			}
		} catch (error) {
			console.error("Failed to load user data:", error);
		}
	},
}));
