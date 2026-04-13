import { useColorScheme } from "@/components/useColorScheme";
import { useAuthStore } from "@/store/authStore";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAppFonts } from "@/theme/useFonts";
import "@/i18n";
import React from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const fontsLoaded = useAppFonts();

	useEffect(() => {
		if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
	}, [fontsLoaded]);

	if (!fontsLoaded) return null;

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<Stack screenOptions={{ headerShown: false }}>
				{isAuthenticated ? (
					<>
						<Stack.Screen name="(tabs)" />
						<Stack.Screen
							name="modal/events/AddEvents"
							options={{ presentation: "modal" }}
						/>
						<Stack.Screen
							name="modal/events/EventDetails"
							options={{ presentation: "modal" }}
						/>
						<Stack.Screen
							name="modal/events/Ledger"
							options={{ presentation: "card" }}
						/>
					</>
				) : (
					<>
						<Stack.Screen name="auth/MobileAuth" />
						<Stack.Screen name="auth/OTPScreen" />
					</>
				)}
			</Stack>
		</ThemeProvider>
	);
}
