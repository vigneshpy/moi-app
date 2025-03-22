import { api } from "@/app/api/axios.instance";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/useUserStore";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	View,
	StyleSheet,
	SafeAreaView,
	ScrollView,
	useColorScheme,
	Text,
} from "react-native";
import {
	Appbar,
	Avatar,
	Card,
	TextInput,
	Button,
	Title,
	Provider as PaperProvider,
	MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import Toast from "react-native-toast-message";

// Define light and dark color palettes
const lightColors = {
	primary: "#3498db",
	onPrimary: "#ffffff",
	primaryContainer: "#cfe4ff",
	onPrimaryContainer: "#001d36",
	secondary: "#555b71",
	onSecondary: "#ffffff",
	secondaryContainer: "#d9e3f9",
	onSecondaryContainer: "#121c2c",
	tertiary: "#6f5678",
	onTertiary: "#ffffff",
	tertiaryContainer: "#f9d8ff",
	onTertiaryContainer: "#271132",
	error: "#ba1a1a",
	onError: "#ffffff",
	errorContainer: "#ffdad6",
	onErrorContainer: "#410002",
	background: "#f5f5f5",
	onBackground: "#1a1c1e",
	surface: "#ffffff",
	onSurface: "#1a1c1e",
	outline: "#73777f",
	surfaceVariant: "#dfe2eb",
	onSurfaceVariant: "#43474e",
	text: "#333333",
};

const darkColors = {
	primary: "#a1c9ff",
	onPrimary: "#00325b",
	primaryContainer: "#004881",
	onPrimaryContainer: "#cfe4ff",
	secondary: "#bdc7dc",
	onSecondary: "#273142",
	secondaryContainer: "#3e4759",
	onSecondaryContainer: "#d9e3f9",
	tertiary: "#dcbce3",
	onTertiary: "#3e2947",
	tertiaryContainer: "#564060",
	onTertiaryContainer: "#f9d8ff",
	error: "#ffb4ab",
	onError: "#690005",
	errorContainer: "#93000a",
	onErrorContainer: "#ffb4ab",
	background: "#121212",
	onBackground: "#e2e2e6",
	surface: "#1a1c1e",
	onSurface: "#e2e2e6",
	outline: "#8c9199",
	surfaceVariant: "#43474e",
	onSurfaceVariant: "#c3c7cf",
	text: "#ffffff",
};

const ProfileScreen = () => {
	const colorScheme = useColorScheme();

	const defaultTheme = DefaultTheme;

	const theme = {
		...defaultTheme,
		dark: colorScheme === "dark",
		colors: colorScheme === "dark" ? darkColors : lightColors,
	};
	const storeUser = useUserStore((state) => state.user);
	const setUserDetailInStore = useUserStore((state) => state.setUser);
	const logoutAndClearCookie = useAuthStore((state) => state.handlelogout);

	const [user, setUser] = useState({
		firstName: storeUser?.first_name || "",
		lastName: storeUser?.last_name || "",
		email: storeUser?.email || "",
		phone: storeUser?.phone_number || "",
	});

	useEffect(() => {
		fetchUser();
	}, []);

	const handleLogout = async () => {
		const loggoutRes = await api.post("/auth/logout");
		if (loggoutRes.status == 200) {
			await logoutAndClearCookie();
			router.replace(`/auth/LoginScreen`);
		}
	};

	const fetchUser = async () => {
		try {
			const userId = storeUser?.id;
			if (userId) {
				const userResponse = await api.get(`/users/${userId}`);
				const userDetails = userResponse.data;
				if (userDetails) {
					setUserDetailInStore(userDetails);
					setUser({
						...user,
						...{
							firstName: userDetails?.first_name,
							lastName: userDetails?.last_name,
							email: userDetails?.email,
							phone: userDetails?.phone_number,
						},
					});
				}
				console.log("userDetails: ", userDetails);
			}
		} catch (error: any) {
			Toast.show({
				type: "error",
				text1: "Unable to get profile details",
			});
		}
	};

	const [isEditing, setIsEditing] = useState(false);

	// Handle field changes
	const handleChange = (field: string, value: string) => {
		setUser({
			...user,
			[field]: value,
		});
	};

	// Save changes
	const handleSave = () => {
		setUser({ ...user });
		setIsEditing(false);
	};

	// Cancel editing
	const handleCancel = () => {
		setIsEditing(false);
	};

	const isDark = colorScheme === "dark";

	return (
		<PaperProvider theme={theme}>
			<SafeAreaView
				style={[styles.container, { backgroundColor: theme.colors.background }]}
			>
				<Appbar.Header>
					<Appbar.Content />
					{!isEditing ? (
						<Appbar.Action icon="pencil" onPress={() => setIsEditing(true)} />
					) : (
						<Appbar.Action icon="close" onPress={handleCancel} />
					)}
					<Appbar.Action icon="power" onPress={handleLogout} />
				</Appbar.Header>

				<ScrollView>
					<View style={styles.avatarContainer}>
						<Avatar.Image
							size={100}
							source={{
								uri: `https://ui-avatars.com/api/?name=${user.firstName}+${
									user.lastName
								}&background=${isDark ? "1e1e1e" : "ffffff"}&color=${
									isDark ? "ffffff" : "000000"
								}`,
							}}
						/>
					</View>

					<Card
						style={[styles.card, { backgroundColor: theme.colors.surface }]}
					>
						<Card.Content>
							<Title
								style={[styles.sectionTitle, { color: theme.colors.text }]}
							>
								Personal Information
							</Title>

							<View style={styles.inputContainer}>
								<Text style={[styles.label, { color: theme.colors.text }]}>
									First Name
								</Text>
								{isEditing ? (
									<TextInput
										label="First Name"
										value={user.firstName}
										onChangeText={(text) => handleChange("firstName", text)}
										mode="outlined"
										style={[
											styles.input,
											{
												backgroundColor: theme.colors.surface,
												color: theme.colors.text,
											},
										]}
										theme={{
											colors: {
												placeholder: theme.colors.outline,
												text: theme.colors.text,
												primary: theme.colors.primary,
												background: theme.colors.surface,
											},
										}}
									/>
								) : (
									<Text style={[styles.text, { color: theme.colors.text }]}>
										{user.firstName}
									</Text>
								)}
							</View>

							<View style={styles.inputContainer}>
								<Text style={[styles.label, { color: theme.colors.text }]}>
									Last Name
								</Text>
								{isEditing ? (
									<TextInput
										label="Last Name"
										value={user.lastName}
										onChangeText={(text) => handleChange("lastName", text)}
										mode="outlined"
										style={[
											styles.input,
											{
												backgroundColor: theme.colors.surface,
												color: theme.colors.text,
											},
										]}
										theme={{
											colors: {
												placeholder: theme.colors.outline,
												text: theme.colors.text,
												primary: theme.colors.primary,
												background: theme.colors.surface,
											},
										}}
									/>
								) : (
									<Text style={[styles.text, { color: theme.colors.text }]}>
										{user.lastName}
									</Text>
								)}
							</View>

							<View style={styles.inputContainer}>
								<Text style={[styles.label, { color: theme.colors.text }]}>
									Email
								</Text>
								{isEditing ? (
									<TextInput
										label="Email"
										value={user.email}
										onChangeText={(text) => handleChange("email", text)}
										mode="outlined"
										keyboardType="email-address"
										style={[
											styles.input,
											{
												backgroundColor: theme.colors.surface,
												color: theme.colors.text,
											},
										]}
										theme={{
											colors: {
												placeholder: theme.colors.outline,
												text: theme.colors.text,
												primary: theme.colors.primary,
												background: theme.colors.surface,
											},
										}}
									/>
								) : (
									<Text style={[styles.text, { color: theme.colors.text }]}>
										{user.email}
									</Text>
								)}
							</View>

							<View style={styles.inputContainer}>
								<Text style={[styles.label, { color: theme.colors.text }]}>
									Phone Number
								</Text>

								<Text style={[styles.text, { color: theme.colors.text }]}>
									{user.phone}
								</Text>
							</View>

							{isEditing && (
								<View style={styles.buttonContainer}>
									<Button
										mode="contained"
										onPress={handleSave}
										style={[
											styles.button,
											{ backgroundColor: theme.colors.primary },
										]}
										labelStyle={{ color: theme.colors.onPrimary }}
									>
										Save
									</Button>
								</View>
							)}
						</Card.Content>
					</Card>
				</ScrollView>
			</SafeAreaView>
		</PaperProvider>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	avatarContainer: {
		alignItems: "center",
		padding: 20,
	},
	card: {
		margin: 16,
		elevation: 4,
		borderRadius: 8,
	},
	sectionTitle: {
		marginBottom: 16,
	},
	inputContainer: {
		marginBottom: 16,
	},
	input: {
		borderRadius: 4,
	},
	text: {
		fontSize: 16,
		lineHeight: 24,
	},
	label: {
		fontSize: 14,
		fontWeight: "bold",
		marginBottom: 8,
	},
	buttonContainer: {
		marginTop: 8,
		flexDirection: "row",
		justifyContent: "flex-end",
	},
	button: {
		minWidth: 100,
	},
	logoutButton: {
		margin: 16,
		paddingVertical: 10,
		borderRadius: 8,
	},
});
export default ProfileScreen;
