import { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { api } from "@/app/api/axios.instance";
import { useUserStore } from "@/store/useUserStore";

export default function AddEventScreen() {
	const [eventName, setEventName] = useState("");
	const [eventDescription, setEventDescription] = useState("");

	const [location, setLocation] = useState("");
	const [eventDate, setEventDate] = useState("");
	const navigation = useNavigation();
	const { user } = useUserStore();
	const theme = useTheme();

	const addEvent = async () => {
		try {
			await api.post("/events/create", {
				event_name: eventName,
				event_description: eventDescription,
				location,
				event_date: eventDate,
				user_id: user?._id,
			});
			navigation.goBack();
		} catch (error) {
			console.error("Error adding event:", error.message);
		}
	};

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<Text style={[styles.title, { color: theme.colors.onBackground }]}>
				Add Event
			</Text>
			<TextInput
				placeholder="Event Name"
				placeholderTextColor={theme.colors.onSurfaceDisabled}
				style={[
					styles.input,
					{
						backgroundColor: theme.colors.surface,
						color: theme.colors.onSurface,
					},
				]}
				value={eventName}
				onChangeText={setEventName}
			/>
			<TextInput
				placeholder="Description"
				placeholderTextColor={theme.colors.onSurfaceDisabled}
				style={[
					styles.input,
					{
						backgroundColor: theme.colors.surface,
						color: theme.colors.onSurface,
					},
				]}
				value={eventDescription}
				onChangeText={setEventDescription}
			/>
			<TextInput
				placeholder="Location"
				placeholderTextColor={theme.colors.onSurfaceDisabled}
				style={[
					styles.input,
					{
						backgroundColor: theme.colors.surface,
						color: theme.colors.onSurface,
					},
				]}
				value={location}
				onChangeText={setLocation}
			/>
			<TextInput
				placeholder="YYYY-MM-DD"
				placeholderTextColor={theme.colors.onSurfaceDisabled}
				style={[
					styles.input,
					{
						backgroundColor: theme.colors.surface,
						color: theme.colors.onSurface,
					},
				]}
				value={eventDate}
				onChangeText={setEventDate}
			/>
			<Button mode="contained" onPress={addEvent} style={styles.button}>
				Add Event
			</Button>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
	},
	title: {
		fontSize: 20,
		marginBottom: 10,
		fontWeight: "bold",
	},
	input: {
		borderWidth: 1,
		borderRadius: 5,
		padding: 10,
		marginBottom: 10,
	},
	button: {
		marginTop: 10,
	},
});
