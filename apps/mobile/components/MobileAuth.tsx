import React, { useState } from "react";
import {
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	useColorScheme,
} from "react-native";
import { View } from "@/components/Themed";

export default function MobileAuth() {
	const [phone, setPhone] = useState("");
	const colorScheme = useColorScheme();

	const handleSendOTP = () => {
		console.log("Sending OTP to:", phone);
		// Implement OTP logic here
	};

	return (
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
				style={[styles.button, phone.length !== 10 && styles.disabledButton]}
				onPress={handleSendOTP}
				disabled={phone.length !== 10}
			>
				{" "}
			</TouchableOpacity>
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
		backgroundColor: "#2196F3",
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	disabledButton: {
		backgroundColor: "#aaa",
	},
});
