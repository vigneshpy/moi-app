import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	useColorScheme,
	ImageBackground,
	TouchableOpacity,
	ScrollView,
} from "react-native";
import { Card, Chip } from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Share } from "react-native";
import { api } from "@/app/api/axios.instance";
import { useLocalSearchParams } from "expo-router";

const EventDetailScreen = () => {
	const { eventId } = useLocalSearchParams();
	const [event, setEvent] = useState({});
	const colorScheme = useColorScheme();
	const theme = colorScheme === "dark" ? darkTheme : lightTheme;

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchEvent = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const eventResponse = await api.get(`/events/${eventId}`);
			setEvent(eventResponse.data || {});
		} catch (err) {
			console.error("error fetching the event detail", err);
			setError("Failed to load event details. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (eventId) fetchEvent();
	}, [eventId]);

	const handleShare = async () => {
		try {
			await Share.share({
				message: `Check out this event: ${event?.event_name} - ${event?.description}`,
			});
		} catch (error) {
			console.error("Error sharing event", error);
		}
	};

	const handleEdit = () => {
		// navigation.navigate("EditEvent", { event });
	};

	const renderEventDetails = () => {
		return (
			<View style={styles.detailsSection}>
				<View style={styles.detailRow}>
					<Ionicons
						name="calendar-outline"
						size={20}
						color={theme.colors.primary}
					/>
					<Text style={[styles.text, { color: theme.colors.text }]}>
						{event?.start_date} - {event?.end_date}
					</Text>
				</View>
				<View style={styles.detailRow}>
					<Ionicons
						name="time-outline"
						size={20}
						color={theme.colors.primary}
					/>
					<Text style={[styles.text, { color: theme.colors.text }]}>
						{event?.start_time} - {event?.end_time}
					</Text>
				</View>
				<View style={styles.detailRow}>
					<Ionicons
						name="location-sharp"
						size={20}
						color={theme.colors.primary}
					/>
					<Text style={[styles.text, { color: theme.colors.text }]}>
						{event?.location || "No location specified"}
					</Text>
				</View>
			</View>
		);
	};

	const renderEventTags = () => {
		const tags = event?.tags || [];
		return (
			<View style={styles.tagsContainer}>
				{tags.map((tag, index) => (
					<Chip key={index} style={styles.chip} textStyle={styles.chipText}>
						{tag}
					</Chip>
				))}
			</View>
		);
	};

	const renderAttendeeSection = () => {
		return (
			<View style={styles.attendeeSection}>
				<Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
					Attendees
				</Text>
				<View style={styles.attendeeIcons}>
					{event?.attendees?.slice(0, 5).map((attendee, index) => (
						<View
							key={index}
							style={[
								styles.attendeeIcon,
								{
									backgroundColor: theme.colors.primary,
									zIndex: 5 - index,
								},
							]}
						>
							<Text style={styles.attendeeInitials}>
								{attendee.name.charAt(0).toUpperCase()}
							</Text>
						</View>
					))}
					{event?.attendees?.length > 5 && (
						<View style={styles.moreAttendeesIcon}>
							<Text style={styles.moreAttendeesText}>
								+{event?.attendees.length - 5}
							</Text>
						</View>
					)}
				</View>
			</View>
		);
	};

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
			contentContainerStyle={styles.scrollViewContent}
		>
			<Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
				<View style={styles.imageContainer}>
					<ImageBackground
						source={{ uri: event?.cover_image?.presigned_url }}
						style={styles.coverImage}
						resizeMode="cover"
					>
						<View style={styles.overlayActions}>
							<TouchableOpacity
								style={styles.actionButton}
								onPress={handleEdit}
							>
								<Ionicons name="pencil" size={24} color="white" />
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.actionButton}
								onPress={handleShare}
							>
								<Ionicons name="share-social" size={24} color="white" />
							</TouchableOpacity>
						</View>
					</ImageBackground>
				</View>

				<Card.Content style={styles.cardContent}>
					<Text style={[styles.title, { color: theme.colors.text }]}>
						{event?.event_name}
					</Text>

					{event?.description && (
						<Text
							style={[
								styles.description,
								{ color: theme.colors.textSecondary },
							]}
						>
							{event?.description}
						</Text>
					)}

					{renderEventDetails()}
					{renderEventTags()}
					{renderAttendeeSection()}
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
	},
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollViewContent: {
		padding: 16,
		paddingBottom: 32,
	},
	card: {
		borderRadius: 15,
		overflow: "hidden",
	},
	imageContainer: {
		width: "100%",
		height: 250,
	},
	coverImage: {
		flex: 1,
		width: "100%",
		height: "100%",
		alignItems: "flex-end",
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
	cardContent: {
		paddingTop: 16,
		paddingBottom: 16,
	},
	title: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 8,
		textAlign: "center",
	},
	description: {
		fontSize: 16,
		marginBottom: 12,
		textAlign: "center",
	},
	detailsSection: {
		marginTop: 16,
		alignItems: "center",
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginVertical: 4,
	},
	text: {
		marginLeft: 8,
		fontSize: 16,
	},
	tagsContainer: {
		flexDirection: "row",
		justifyContent: "center",
		flexWrap: "wrap",
		marginTop: 16,
	},
	chip: {
		margin: 4,
		backgroundColor: "#f0f0f0",
	},
	chipText: {
		fontSize: 12,
	},
	attendeeSection: {
		marginTop: 16,
		alignItems: "center",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
	},
	attendeeIcons: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	attendeeIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: -10,
		borderWidth: 2,
		borderColor: "white",
	},
	attendeeInitials: {
		color: "white",
		fontWeight: "bold",
	},
	moreAttendeesIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(0,0,0,0.3)",
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: -10,
	},
	moreAttendeesText: {
		color: "white",
		fontWeight: "bold",
	},
});

export default EventDetailScreen;
