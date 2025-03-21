import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import Toast from "react-native-toast-message";
import { useEffect } from "react";

export default function Index() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	console.log("isAuthenticated: ", isAuthenticated);
	const checkAuth = useAuthStore((state) => state.checkAuth);

	useEffect(() => {
		checkAuth();
		Toast.show({
			type: isAuthenticated ? "success" : "info",
			text1: isAuthenticated ? "Welcome Back!" : "Please Log In",
		});
	}, [isAuthenticated]);
	return (
		<>
			<Redirect href={isAuthenticated ? "/(tabs)" : "/auth/MobileAuth"} />
			<Toast />
		</>
	);
}
