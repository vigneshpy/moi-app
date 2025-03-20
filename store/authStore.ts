import { create } from "zustand";

type AuthState = {
	isAuthenticated: boolean;
	setIsAuthenticated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
	isAuthenticated: false,
	setIsAuthenticated: (value) => {
		console.log("Auth Updated:", value); // ✅ Debug Log
		set({ isAuthenticated: value });
	},
}));
