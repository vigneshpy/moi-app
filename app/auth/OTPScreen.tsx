import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Text } from "react-native";
import { View } from "@/components/Themed";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useColorScheme } from "react-native"; // Import useColorScheme

export default function OTPScreen() {
	const [otp, setOtp] = useState("");
	const { phone } = useLocalSearchParams();
	const router = useRouter();
	const { setIsAuthenticated } = useAuthStore();
	const colorScheme = useColorScheme(); // Get the current color scheme

	const handleVerifyOTP = () => {
		if (otp.length === 6) {
			setIsAuthenticated(true);
			router.replace("/(tabs)");
		}
	};

	// Define styles based on the color scheme
	const styles = createStyles(colorScheme);

	return (
		<View style={styles.container}>
			<Text style={styles.text}>Enter OTP sent to {phone}</Text>
			<TextInput
				style={styles.input}
				placeholder="Enter OTP"
				placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#555"}
				value={otp}
				onChangeText={(text) => {
					if (text.length <= 6) {
						setOtp(text.replace(/[^0-9]/g, ""));
					}
				}}
				keyboardType="number-pad"
			/>
			<TouchableOpacity
				style={[styles.button, otp.length !== 6 && styles.disabledButton]}
				onPress={handleVerifyOTP}
				disabled={otp.length !== 6}
			>
				<Text style={styles.buttonText}>Verify OTP</Text>
			</TouchableOpacity>
		</View>
	);
}

// Function to create styles based on the color scheme
const createStyles = (colorScheme) => {
	return StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: colorScheme === "dark" ? "#121212" : "#ffffff", // Background color
		},
		text: {
			color: colorScheme === "dark" ? "#ffffff" : "#000000", // Text color
			marginBottom: 20,
		},
		input: {
			width: "80%",
			height: 50,
			borderWidth: 1,
			paddingHorizontal: 10,
			borderRadius: 8,
			borderColor: colorScheme === "dark" ? "#aaa" : "#555", // Border color
			backgroundColor: colorScheme === "dark" ? "#333" : "#ffffff", // Input background color
			color: colorScheme === "dark" ? "#ffffff" : "#000000", // Input text color
		},
		button: {
			width: "80%",
			height: 50,
			backgroundColor: "#2196F3",
			alignItems: "center",
			justifyContent: "center",
			borderRadius: 8,
			marginTop: 12,
		},
		disabledButton: { backgroundColor: "#aaa" },
		buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
	});
};
