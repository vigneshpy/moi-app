import React from "react";
import { StyleSheet, Text, useColorScheme, Button } from "react-native";
import { View } from "@/components/Themed";
import { api } from "@/app/api/axios.instance";
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";

export default function AuthScreen() {
	const colorScheme = useColorScheme();
	const logout = useAuthStore((state) => state.handlelogout);

	const handleLogout = async () => {
		const loggoutRes = await api.post("/auth/logout");
		if (loggoutRes.status == 200) {
			await logout();
			router.replace(`/auth/MobileAuth?`);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={[styles.title, colorScheme === "dark" && styles.darkText]}>
				Profile
			</Text>
			<Button title="Logout" onPress={handleLogout} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	darkText: {
		color: "#fff",
	},
});
