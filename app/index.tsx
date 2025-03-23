import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import Toast from "react-native-toast-message";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import React from "react";

export default function Index() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isLoading = useAuthStore((state) => state.isLoading);

	const checkAuth = useAuthStore((state) => state.checkAuth);
	const loadUser = useUserStore((state) => state.loadUser);

	useEffect(() => {
		if (!isAuthenticated) {
			checkAuth();
			loadUser();
		}
	}, [checkAuth]);

	if (isLoading) {
		return null;
	}

	return (
		<>
			<Redirect href={isAuthenticated ? "/(tabs)" : "/auth/MobileAuth"} />
			<Toast />
		</>
	);
}
