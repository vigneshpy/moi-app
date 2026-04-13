import { useColorScheme } from "@/components/useColorScheme";
import { useAuthStore } from "@/store/authStore";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<Stack screenOptions={{ headerShown: false }}>
				{" "}
				{/* Hide header for all screens */}
				{isAuthenticated ? (
					<>
						<Stack.Screen name="(tabs)" />
						<Stack.Screen
							name="modal/events/AddEvents"
							options={{
								presentation: "modal",
							}}
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
