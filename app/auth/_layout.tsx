import { useColorScheme } from "@/components/useColorScheme";
import { useAuthStore } from "@/store/authStore";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const [ready, setReady] = useState(false);

	// Wait until after mount to ensure Zustand state is loaded properly
	useEffect(() => {
		setReady(true);
	}, []);

	if (!ready) {
		// Show nothing during initial load to prevent flashing
		return null;
	}

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="auth/OTPScreen" options={{ headerShown: false }} />
				<Stack.Screen name="auth/MobileAuth" options={{ headerShown: false }} />
			</Stack>
		</ThemeProvider>
	);
}
