import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import Toast from "react-native-toast-message";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";

export default function Index() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isLoading = useAuthStore((state) => state.isLoading);

	console.log("isAuthenticated: ", isAuthenticated);
	const checkAuth = useAuthStore((state) => state.checkAuth);
	const loadUser = useUserStore((state) => state.loadUser);

	// Add loading state to prevent redirect before authentication state is checked
	console.log("isLoading: ", isLoading);

	useEffect(() => {
		if (!isAuthenticated) {
			checkAuth();
			loadUser();
		}
	}, [checkAuth, loadUser]);

	if (isLoading) {
		console.log("isLoading: ", isLoading);
		return null;
	}

	return (
		<>
			<Redirect href={isAuthenticated ? "/(tabs)" : "/auth/MobileAuth"} />
			<Toast />
		</>
	);
}
