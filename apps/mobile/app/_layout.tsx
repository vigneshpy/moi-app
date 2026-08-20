import { useColorScheme } from "@/components/useColorScheme";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAppFonts } from "@/theme/useFonts";
import { cleanupOrphanedMedia } from "@/db/notebook";
import "@/i18n";
import React from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const fontsLoaded = useAppFonts();

	useEffect(() => {
		if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
	}, [fontsLoaded]);

	// Collect cover and notebook-page files that no row points at any more.
	// Best-effort — an orphaned file is never worth blocking startup over.
	useEffect(() => {
		cleanupOrphanedMedia().catch(() => {});
	}, []);

	if (!fontsLoaded) return null;

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<Stack screenOptions={{ headerShown: false }}>
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
				<Stack.Screen
					name="modal/events/FastEntry"
					options={{ presentation: "card" }}
				/>
				<Stack.Screen
					name="modal/events/NotebookEntry"
					options={{ presentation: "card" }}
				/>
				<Stack.Screen
					name="modal/events/NotebookPages"
					options={{ presentation: "card" }}
				/>
			</Stack>
		</ThemeProvider>
	);
}
