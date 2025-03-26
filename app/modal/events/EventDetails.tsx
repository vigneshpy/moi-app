import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	useColorScheme,
	ImageBackground,
	TouchableOpacity,
	ScrollView,
	TextInput,
	Modal,
} from "react-native";
import { Card } from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";
import { api } from "@/app/api/axios.instance";
import { useLocalSearchParams } from "expo-router";
import { formatDate } from "@/app/(tabs)/screens/utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import RSVPContainer from "@/components/RSVPContainer";
import { useEventShare } from "@/components/hooks/useShareEventHook";

const EventDetailScreen = () => {
	const { eventId } = useLocalSearchParams();
	const [event, setEvent] = useState<Event>();
	const [rsvp, setRSVP] = useState<RSVP>();

	const eventName = event?.event_name || "Our Event";
	const eventDescription = event?.description || "";
	const eventDate = formatDate(event?.event_date || "") || "";

	const location = event?.location || "";

	const rsvpLink = rsvp?.rsvp_link || "";
	const imageUrl = event?.cover_image?.presigned_url;

	const colorScheme = useColorScheme();
	const theme = colorScheme === "dark" ? darkTheme : lightTheme;

	const fetchEvent = async () => {
		try {
			const eventResponse = await api.get(`/events/${eventId}?rsvp=true`);
			setEvent(eventResponse.data?.event || {});
			setRSVP(eventResponse.data?.rsvp);
		} catch (err) {
			console.error("error fetching the event detail", err);
		}
	};

	useEffect(() => {
		if (eventId) fetchEvent();
	}, [eventId]);

	const {
		shareEvent,
		openShareModal,
		closeShareModal,
		modalVisible,
		caption,
		setCaption,
	} = useEventShare();

	const handleShare = () => {
		shareEvent({
			eventName,
			eventDescription,
			eventDate,
			location,
			rsvpLink,
			imageUrl,
		});
	};

	if (!event) {
		return (
			<View
				style={[
					styles.container,
					{ justifyContent: "center", alignItems: "center" },
				]}
			>
				<Text style={{ color: theme.colors.text }}>
					Loading event details...
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
			contentContainerStyle={styles.scrollViewContent}
		>
			<Modal visible={modalVisible} transparent animationType="slide">
				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						backgroundColor: "rgba(0,0,0,0.5)",
					}}
				>
					<View
						style={{
							width: 300,
							padding: 20,
							backgroundColor: "#fff",
							borderRadius: 10,
						}}
					>
						<Text style={{ fontSize: 18, fontWeight: "bold" }}>
							Add Caption before sharing
						</Text>
						<TextInput
							placeholder="Enter your custom caption..."
							value={caption}
							onChangeText={setCaption}
							style={{
								borderWidth: 1,
								borderColor: "#ccc",
								padding: 10,
								marginVertical: 10,
								borderRadius: 5,
							}}
						/>
						<View
							style={{ flexDirection: "row", justifyContent: "space-between" }}
						>
							<TouchableOpacity onPress={() => {}} style={{ padding: 10 }}>
								<Text style={{ color: "red" }}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={openShareModal}
								style={{ padding: 10 }}
							>
								<Text style={{ color: "blue" }}>Share on WhatsApp</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			<Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
				<View style={styles.imageContainer}>
					<ImageBackground
						source={{ uri: event?.cover_image?.presigned_url }}
						style={styles.coverImage}
						resizeMode="cover"
						imageStyle={styles.imageStyle}
					>
						<View style={styles.overlayActions}>
							<TouchableOpacity
								style={styles.actionButton}
								onPress={() => {
									/* Edit Event */
								}}
							>
								<Ionicons name="pencil" size={24} color="white" />
							</TouchableOpacity>

							{rsvp && (
								<TouchableOpacity
									style={styles.actionButton}
									onPress={handleShare}
								>
									<Ionicons name="share-social" size={24} color="white" />
								</TouchableOpacity>
							)}
						</View>
						<View style={styles.eventTypeLabel}>
							<Text style={styles.eventTypeText}>{event.type || "Event"}</Text>
						</View>
					</ImageBackground>
				</View>

				<Card.Content style={styles.cardContent}>
					<Text style={[styles.title, { color: theme.colors.text }]}>
						{event?.event_name}
					</Text>

					{eventDescription && (
						<Text
							style={[
								styles.description,
								{ color: theme.colors.textSecondary },
							]}
						>
							{eventDescription}
						</Text>
					)}

					<View style={styles.detailsContainer}>
						<View style={styles.detailRow}>
							<MaterialCommunityIcons
								name="map-marker"
								size={16}
								color={theme.colors.primary}
							/>
							<Text style={[styles.text, { color: theme.colors.text }]}>
								{location || "No location specified"}
							</Text>
						</View>

						<View style={styles.detailRow}>
							<MaterialCommunityIcons
								name="clock-outline"
								size={16}
								color={theme.colors.primary}
							/>
							<Text style={[styles.text, { color: theme.colors.text }]}>
								{eventDate}
							</Text>
						</View>

						<View style={styles.detailRow}>
							<MaterialCommunityIcons
								name="mail"
								size={16}
								color={theme.colors.primary}
							/>
							<Text style={[styles.text, { color: theme.colors.text }]}>
								Send RSVP
							</Text>
						</View>
					</View>
					<RSVPContainer rsvp={rsvp} />
				</Card.Content>
			</Card>
		</ScrollView>
	);
};

const lightTheme = {
	colors: {
		primary: "#6200ee",
		background: "#f8f9fa",
		card: "#ffffff",
		text: "#333333",
		textSecondary: "#666666",
		border: "#e0e0e0",
		attending: "rgba(76, 175, 80, 0.1)", // Light green
		notAttending: "rgba(244, 67, 54, 0.1)", // Light red
	},
};

const darkTheme = {
	colors: {
		primary: "#bb86fc",
		background: "#121212",
		card: "#1e1e1e",
		text: "#ffffff",
		textSecondary: "#b0b0b0",
		border: "#2c2c2c",
		attending: "rgba(81, 206, 85, 0.2)", // Dark green
		notAttending: "rgba(185, 69, 60, 0.2)", // Dark red
	},
};

const styles = StyleSheet.create({
	detailsContainer: {
		marginTop: 4,
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 25,
	},
	timeContainer: {
		marginTop: 4,
		alignSelf: "flex-end",
	},
	container: {
		flex: 1,
	},
	scrollViewContent: {
		padding: 16,
		paddingBottom: 32,
	},
	card: {
		borderRadius: 15,
		elevation: 4,
		shadowOpacity: 0.1,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
	},
	imageContainer: {
		width: "100%",
		height: 250,
	},
	imageStyle: {
		borderTopLeftRadius: 15,
		borderTopRightRadius: 15,
	},
	coverImage: {
		flex: 1,
		width: "100%",
		height: "100%",
	},
	overlayActions: {
		flexDirection: "row",
		position: "absolute",
		top: 16,
		right: 16,
	},
	actionButton: {
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 10,
	},
	eventTypeLabel: {
		position: "absolute",
		bottom: 16,
		left: 16,
		backgroundColor: "rgba(0,0,0,0.5)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	eventTypeText: {
		color: "white",
		fontWeight: "bold",
		textTransform: "uppercase",
	},
	text: {
		fontSize: 14,
		marginLeft: 8,
	},
	cardContent: {
		paddingTop: 16,
		paddingBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
	description: {
		fontSize: 16,
		marginBottom: 16,
		textAlign: "center",
		lineHeight: 22,
	},

	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
});

export default EventDetailScreen;
