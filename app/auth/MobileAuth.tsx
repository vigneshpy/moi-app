import React, { useState } from "react";
import {
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	useColorScheme,
	View as RNView,
	Alert,
} from "react-native";
import { View } from "@/components/Themed";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "../api/axios.instance";
import { DEFAULT_COUNTRY_CODE } from "../constants";

export default function MobileAuth() {
	const [userData, setUserData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const colorScheme = useColorScheme();
	const router = useRouter();

	const handleInputChange = (field: string, value: string) => {
		setUserData({
			...userData,
			[field]: field === "phone" ? value.replace(/[^0-9]/g, "") : value,
		});
	};

	const handleSendOTP = async () => {
		if (userData.phone.length !== 10) {
			Alert.alert(
				"Invalid Phone",
				"Please enter a valid 10-digit phone number"
			);
			return;
		}

		setIsLoading(true);
		try {
			console.log("Sending OTP to:", DEFAULT_COUNTRY_CODE + userData.phone);
			const response = await api.post("/otp/send", {
				phone_number: DEFAULT_COUNTRY_CODE + userData.phone,
			});
			console.log("OTP sent successfully:", response.data);

			const queryParams = new URLSearchParams({
				phone: DEFAULT_COUNTRY_CODE + userData.phone,
				firstName: userData.firstName,
				lastName: userData.lastName,
				email: userData.email,
			}).toString();

			router.replace(`/auth/OTPScreen?${queryParams}`);
		} catch (error: any) {
			console.error(
				"Failed to send OTP:",
				error.response?.data || error.message
			);
			Alert.alert("Error", "Failed to send OTP. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={[styles.title, colorScheme === "dark" && styles.darkText]}>
				Signup
			</Text>
			<View style={styles.inputContainer}>
				<RNView style={styles.nameInputContainer}>
					<TextInput
						style={[
							styles.nameInput,
							colorScheme === "dark" && styles.darkInput,
						]}
						placeholder="First Name"
						placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#555"}
						value={userData.firstName}
						onChangeText={(text) => handleInputChange("firstName", text)}
					/>

					<TextInput
						style={[
							styles.nameInput,
							colorScheme === "dark" && styles.darkInput,
						]}
						placeholder="Last Name"
						placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#555"}
						value={userData.lastName}
						onChangeText={(text) => handleInputChange("lastName", text)}
					/>
				</RNView>

				<TextInput
					style={[styles.input, colorScheme === "dark" && styles.darkInput]}
					placeholder="Email (Optional)"
					placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#555"}
					value={userData.email}
					onChangeText={(text) => handleInputChange("email", text)}
					keyboardType="email-address"
					autoCapitalize="none"
				/>

				<RNView style={styles.phoneInputContainer}>
					<RNView
						style={[
							styles.countryCodeContainer,
							colorScheme === "dark" && styles.darkInput,
						]}
					>
						<Text
							style={[
								styles.countryCodeText,
								colorScheme === "dark" && styles.darkText,
							]}
						>
							{DEFAULT_COUNTRY_CODE}
						</Text>
					</RNView>
					<TextInput
						style={[
							styles.phoneInput,
							colorScheme === "dark" && styles.darkInput,
						]}
						placeholder="Mobile Number"
						placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#555"}
						value={userData.phone}
						onChangeText={(text) => {
							if (text.length <= 10) {
								handleInputChange("phone", text);
							}
						}}
						keyboardType="phone-pad"
						maxLength={10}
					/>
				</RNView>

				<TouchableOpacity
					style={[
						styles.button,
						colorScheme === "dark" ? styles.darkButton : styles.lightButton,
						(userData.phone.length !== 10 || isLoading) &&
							styles.disabledButton,
					]}
					onPress={handleSendOTP}
					disabled={userData.phone.length !== 10 || isLoading}
					activeOpacity={0.7}
				>
					<Text style={styles.buttonText}>
						{isLoading ? "Sending..." : "Send OTP"}
					</Text>
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

	nameInputContainer: {
		flexDirection: "row",
		width: "100%",
		marginBottom: 12,
		justifyContent: "space-between",
	},
	nameInput: {
		width: "48%",
		height: 50,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		paddingHorizontal: 10,
		color: "#000",
	},

	phoneInputContainer: {
		flexDirection: "row",
		width: "100%",
		marginBottom: 12,
	},
	countryCodeContainer: {
		height: 50,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRightWidth: 0,
		borderTopLeftRadius: 8,
		borderBottomLeftRadius: 8,
		paddingHorizontal: 10,
		justifyContent: "center",
		backgroundColor: "#f5f5f5",
	},
	countryCodeText: {
		color: "#000",
		fontSize: 16,
	},
	phoneInput: {
		flex: 1,
		height: 50,
		borderWidth: 1,
		borderColor: "#ddd",
		borderTopRightRadius: 8,
		borderBottomRightRadius: 8,
		paddingHorizontal: 10,
		color: "#000",
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
