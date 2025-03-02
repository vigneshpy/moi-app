import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Text } from "react-native";
import { View } from "@/components/Themed";

export default function Profile() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLogin, setIsLogin] = useState(true);

	const handleAuth = () => {
		// Here you would implement your actual authentication logic
		if (isLogin) {
			console.log("Logging in with:", email, password);
			// Call your login API
		} else {
			console.log("Signing up with:", email, password);
			// Call your signup API
		}
	};

	const toggleAuthMode = () => {
		setIsLogin(!isLogin);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{isLogin ? "Login" : "Sign Up"}</Text>

			<View style={styles.inputContainer}>
				<TextInput
					style={styles.input}
					placeholder="Email"
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
					keyboardType="email-address"
				/>

				<TextInput
					style={styles.input}
					placeholder="Password"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
				/>
			</View>

			<TouchableOpacity style={styles.button} onPress={handleAuth}>
				<Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
			</TouchableOpacity>

			<TouchableOpacity onPress={toggleAuthMode}>
				<Text style={styles.switchText}>
					{isLogin
						? "Don't have an account? Sign Up"
						: "Already have an account? Login"}
				</Text>
			</TouchableOpacity>

			<View
				style={styles.separator}
				lightColor="#eee"
				darkColor="rgba(255,255,255,0.1)"
			/>
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
	switchText: {
		color: "#2196F3",
		marginBottom: 20,
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: "80%",
	},
});
