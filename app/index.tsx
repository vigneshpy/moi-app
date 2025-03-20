import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	console.log("isAuthenticated: ", isAuthenticated);

	if (isAuthenticated) {
		return <Redirect href="/(tabs)" />;
	} else {
		return <Redirect href="/auth/MobileAuth" />;
	}
}
