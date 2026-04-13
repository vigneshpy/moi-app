import { useRef, useState } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import {
	Button,
	Text,
	Switch,
	TextInput,
	MD3DarkTheme,
	MD3LightTheme,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { api } from "@/app/api/axios.instance";
import { useUserStore } from "@/store/useUserStore";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from "@react-native-picker/picker";

import * as ImagePicker from "expo-image-picker";

import React from "react";
export default function AddEvents() {
	const [image, setImage] = useState<string | null>(null);

	const [eventDetails, setEventDetails] = useState({
		eventName: "",
		eventDescription: "",
		location: "",
		type: "",
		eventDate: new Date(),
		generateRSVP: false,
	});

	const eventType = [
		{
			label: "Wedding",
			value: "wedding",
		},
		{
			label: "Birthday",
			value: "birthday",
		},
		{
			label: "Corporate",
			value: "corporate",
		},
		{
			label: "Get together",
			value: "get to gether",
		},
		{
			label: "other",
			value: "other",
		},
	];
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

	const navigation = useNavigation();
	const { user }: any = useUserStore();

	const colorScheme = useColorScheme();
	const theme = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;

	const backgroundColor = colorScheme === "dark" ? "#121212" : "#FFFFFF";
	const textColor = colorScheme === "dark" ? "#FFFFFF" : "#000000";

	const handleTextChange = (field: string, value: string | boolean | Date) => {
		setEventDetails({
			...eventDetails,
			[field]: value,
		});
	};

	const pickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			alert("Permission denied!");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			quality: 0.8,
		});
		if (!result.canceled) {
			setImage(result.assets[0].uri);
		}
	};

	const addEvent = async () => {
		try {
			const formData = new FormData();

			// Append event details
			formData.append("event_name", eventDetails.eventName);
			formData.append("description", eventDetails.eventDescription);
			formData.append("location", eventDetails.location);
			formData.append("type", eventDetails.type);
			formData.append("event_date", eventDetails.eventDate.toISOString());
			formData.append("generate_rsvp", String(eventDetails.generateRSVP));
			formData.append("user_id", user._id);

			// Append cover image if selected
			if (image) {
				formData.append("cover_image", {
					uri: image,
					name: `cover_${Date.now()}.jpg`,
					type: "image/jpeg",
				} as any);
			}

			await api.post("/events/create", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			navigation.goBack();
		} catch (error: any) {
			console.error("Error adding event:", error?.message);
		}
	};

	const showDatePicker = () => {
		setDatePickerVisibility(true);
	};

	const hideDatePicker = () => {
		setDatePickerVisibility(false);
	};

	const handleDateConfirm = (date: Date) => {
		setEventDetails({
			...eventDetails,
			["eventDate"]: date,
		});
		hideDatePicker();
	};

	const formatDateTime = () => {
		return `${eventDetails.eventDate?.toDateString()} at ${eventDetails.eventDate.toLocaleTimeString(
			[],
			{
				hour: "2-digit",
				minute: "2-digit",
			}
		)}`;
	};

	return (
		<View style={[styles.container, { backgroundColor }]}>
			<Text
				variant="headlineMedium"
				style={[styles.title, { color: textColor }]}
			>
				Add Event
			</Text>

			<TextInput
				mode="outlined"
				label="Event Name"
				style={styles.input}
				value={eventDetails.eventName}
				onChangeText={(value) => handleTextChange("eventName", value)}
				theme={theme}
			/>
			<Picker
				selectedValue={eventDetails.type}
				onValueChange={(itemValue, itemIndex) =>
					handleTextChange("type", itemValue)
				}
			>
				{eventType.map((item, index) => {
					return (
						<Picker.Item
							label={item.label}
							value={item.value}
							key={`${item.value}_${index}`}
						/>
					);
				})}
			</Picker>

			<TextInput
				mode="outlined"
				label="Description"
				style={styles.input}
				multiline
				numberOfLines={3}
				value={eventDetails.eventDescription}
				onChangeText={(value) => handleTextChange("eventDescription", value)}
				theme={theme}
			/>

			<TextInput
				mode="outlined"
				label="Location"
				style={styles.input}
				value={eventDetails.location}
				onChangeText={(value) => handleTextChange("location", value)}
				theme={theme}
			/>

			<Text
				variant="bodyLarge"
				style={[styles.dateLabel, { color: textColor }]}
			>
				Event Date & Time
			</Text>

			<Button
				mode="outlined"
				onPress={showDatePicker}
				style={styles.dateButton}
				theme={theme}
			>
				{formatDateTime()}
			</Button>

			<DateTimePickerModal
				isVisible={isDatePickerVisible}
				mode="datetime"
				onConfirm={handleDateConfirm}
				onCancel={hideDatePicker}
			/>

			<Button onPress={pickImage}>Pick a Cover Image</Button>

			<View style={styles.switchContainer}>
				<Text variant="bodyLarge" style={{ color: textColor }}>
					Generate RSVP Invite Link
				</Text>
				<Switch
					value={eventDetails.generateRSVP}
					onValueChange={(text: any) => handleTextChange("generateRSVP", text)}
					theme={theme}
				/>
			</View>

			<Button
				mode="contained"
				onPress={addEvent}
				style={styles.button}
				theme={theme}
			>
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
		marginBottom: 20,
		fontWeight: "bold",
		alignSelf: "center",
	},
	input: {
		marginBottom: 16,
	},
	dateLabel: {
		marginBottom: 8,
	},
	dateButton: {
		marginBottom: 16,
	},
	button: {
		marginTop: 16,
		paddingVertical: 6,
	},
	switchContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginVertical: 16,
	},
});
