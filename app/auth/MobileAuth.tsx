import React, { useState } from "react";
import {
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	useColorScheme,
} from "react-native";
import { View } from "@/components/Themed";
import { useRouter, useFocusEffect } from "expo-router";

export default function MobileAuth() {
	const [phone, setPhone] = useState("");
	const colorScheme = useColorScheme();
	const router = useRouter();

	const handleSendOTP = () => {
		console.log("Sending OTP to:", phone);
		router.replace(`/auth/OTPScreen?phone=${encodeURIComponent(phone)}`);
		// Implement OTP logic here
	};

	return (
		<View style={styles.container}>
			<Text style={[styles.title, colorScheme === "dark" && styles.darkText]}>
				Login/Signup
			</Text>
			<View style={styles.inputContainer}>
				<TextInput
					style={[styles.input, colorScheme === "dark" && styles.darkInput]}
					placeholder="Mobile Number"
					placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#555"}
					value={phone}
					onChangeText={(text) => {
						if (text.length <= 10) {
							setPhone(text.replace(/[^0-9]/g, ""));
						}
					}}
					keyboardType="phone-pad"
				/>

				<TouchableOpacity
					style={[
						styles.button,
						colorScheme === "dark" ? styles.darkButton : styles.lightButton,
						phone.length !== 10 && styles.disabledButton,
					]}
					onPress={handleSendOTP}
					disabled={phone.length !== 10}
				>
					<Text style={styles.buttonText}>Send OTP</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	inputContainer: {
		width: "100%",
		marginBottom: 20,
	},
	input: {
		width: "100%",
		height: 50,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		marginBottom: 12,
		paddingHorizontal: 10,
		color: "#000",
	},
	darkInput: {
		backgroundColor: "#333",
		borderColor: "#555",
		color: "#fff",
	},
	button: {
		width: "100%",
		height: 50,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	lightButton: {
		backgroundColor: "#2196F3",
	},
	darkButton: {
		backgroundColor: "#1E88E5", // A slightly brighter blue for dark mode
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	disabledButton: {
		backgroundColor: "#aaa",
	},
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
