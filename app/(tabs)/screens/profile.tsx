import React, { useState } from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";
import { View } from "@/components/Themed";

export default function AuthScreen() {
	const colorScheme = useColorScheme();

	return (
		<View style={styles.container}>
			<Text style={[styles.title, colorScheme === "dark" && styles.darkText]}>
				Profile
			</Text>
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
