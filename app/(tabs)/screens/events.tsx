//@ts-nocheck
import { useEffect, useState } from "react";
import {
	View,
	ActivityIndicator,
	FlatList,
	useColorScheme,
	TouchableOpacity,
} from "react-native";
import {
	Card,
	Text,
	Provider as PaperProvider,
	Divider,
	FAB,
	Chip,
	Badge,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { api } from "@/app/api/axios.instance";
import { useUserStore } from "@/store/useUserStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useResourceStore } from "@/store/resourceStore";
import {
	getCategoryIcon,
	getEventStatus,
	getPastEvents,
	getRelativeTime,
	getUpcomingEvents,
} from "./utils";
import React from "react";

export default function EventListScreen() {
	const { events: eventsFromStore = [], setEvents: setEventInStore } =
		useResourceStore((state) => state);
	const [events, setEvents] = useState({
		upcomingEvents: getUpcomingEvents(eventsFromStore),
		pastEvents: getPastEvents(eventsFromStore),
	});
	const [loading, setLoading] = useState(true);
	const [viewMode, setViewMode] = useState("upcoming");

	const colorScheme = useColorScheme();
	const { user } = useUserStore();
	const navigation = useNavigation();

	const theme = {
		...defaultTheme,
		dark: colorScheme === "dark",
		colors: colorScheme === "dark" ? darkColors : lightColors,
	};

	const fetchEvents = async () => {
		const userID = user?._id;
		if (userID) {
			try {
				setLoading(true);
				const response = await api.get(`/events/user/${userID}`);
				const allEvents = response.data;
				setEventInStore(allEvents);
				setEvents({
					upcomingEvents: getUpcomingEvents(allEvents),
					pastEvents: getPastEvents(allEvents),
				});
			} catch (error) {
				console.error("Error fetching events:", error);
			} finally {
				setLoading(false);
			}
		}
	};

	const handleEventPress = (event: Event) => {
		router.push({
			pathname: "/modal/events/EventDetails",
			params: { eventId: event._id },
		});
	};

	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", fetchEvents);
		return unsubscribe;
	}, [navigation]);

	const renderItem = ({ item }) => {
		const categoryIcon = getCategoryIcon(item.event_description);
		const relativeTime = getRelativeTime(item.event_date);
		const status = getEventStatus(item.event_date);
		const formattedDate = new Date(item.event_date).toLocaleDateString(
			undefined,
			{
				weekday: "short",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			}
		);

		return (
			<TouchableOpacity onPress={() => handleEventPress(item)}>
				<Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
					<View style={styles.cardHeader}>
						<MaterialCommunityIcons
							name={categoryIcon}
							size={24}
							color={theme.colors.primary}
							style={styles.categoryIcon}
						/>
						<Chip
							mode="outlined"
							style={{ backgroundColor: status.color + "20" }}
							textStyle={{ color: status.color, fontSize: 12 }}
						>
							{status.label}
						</Chip>
					</View>

					<Card.Content>
						<Text style={[styles.title, { color: theme.colors.text }]}>
							{item.event_name}
						</Text>

						{item.description ? (
							<Text
								numberOfLines={2}
								style={[
									styles.description,
									{ color: theme.colors.textSecondary },
								]}
							>
								{item.description}
							</Text>
						) : null}

						<Divider style={styles.divider} />

						<View style={styles.detailsContainer}>
							<View style={styles.detailRow}>
								<MaterialCommunityIcons
									name="map-marker"
									size={16}
									color={theme.colors.primary}
								/>
								<Text style={[styles.text, { color: theme.colors.text }]}>
									{item.location || "No location specified"}
								</Text>
							</View>

							<View style={styles.detailRow}>
								<MaterialCommunityIcons
									name="clock-outline"
									size={16}
									color={theme.colors.primary}
								/>
								<Text style={[styles.text, { color: theme.colors.text }]}>
									{formattedDate}
								</Text>
							</View>

							<View style={styles.timeContainer}>
								<Text
									style={[
										styles.relativeTime,
										{
											color: status.color,
											fontWeight: status.label === "Today" ? "bold" : "normal",
										},
									]}
								>
									{relativeTime}
								</Text>
							</View>
						</View>

						{item.generate_rsvp && (
							<View style={styles.rsvpContainer}>
								<Badge size={8} style={{ backgroundColor: "#ff6d00" }} />
								<Text
									style={[
										styles.rsvpText,
										{ color: theme.colors.textSecondary },
									]}
								>
									RSVP Required
								</Text>
							</View>
						)}
					</Card.Content>
				</Card>
			</TouchableOpacity>
		);
	};

	// Tab toggle component
	const TabToggle = () => (
		<View style={styles.tabContainer}>
			<TouchableOpacity
				style={[
					styles.tab,
					viewMode === "upcoming" && {
						backgroundColor: theme.colors.primary + "20",
						borderBottomColor: theme.colors.primary,
						borderBottomWidth: 2,
					},
				]}
				onPress={() => setViewMode("upcoming")}
			>
				<Text
					style={[
						styles.tabText,
						{
							color:
								viewMode === "upcoming"
									? theme.colors.primary
									: theme.colors.textSecondary,
						},
					]}
				>
					Upcoming ({events.upcomingEvents.length})
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[
					styles.tab,
					viewMode === "past" && {
						backgroundColor: theme.colors.primary + "20",
						borderBottomColor: theme.colors.primary,
						borderBottomWidth: 2,
					},
				]}
				onPress={() => setViewMode("past")}
			>
				<Text
					style={[
						styles.tabText,
						{
							color:
								viewMode === "past"
									? theme.colors.primary
									: theme.colors.textSecondary,
						},
					]}
				>
					Past ({events.pastEvents.length})
				</Text>
			</TouchableOpacity>
		</View>
	);

	// Get the current event list based on view mode
	const currentEvents =
		viewMode === "upcoming" ? events.upcomingEvents : events.pastEvents;

	return (
		<PaperProvider theme={theme}>
			<View
				style={[styles.container, { backgroundColor: theme.colors.background }]}
			>
				<View style={styles.headerContainer}>
					<Text style={[styles.headerTitle, { color: theme.colors.text }]}>
						My Events
					</Text>
					<TouchableOpacity
						onPress={() => {
							// Implement search or filter functionality
							console.log("Search pressed");
						}}
					>
						<MaterialCommunityIcons
							name="magnify"
							size={24}
							color={theme.colors.text}
						/>
					</TouchableOpacity>
				</View>

				<TabToggle />

				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text
							style={[
								styles.loadingText,
								{ color: theme.colors.textSecondary },
							]}
						>
							Loading events...
						</Text>
					</View>
				) : currentEvents.length === 0 ? (
					<View style={styles.noEventsContainer}>
						<MaterialCommunityIcons
							name={
								viewMode === "upcoming" ? "calendar-plus" : "calendar-check"
							}
							size={64}
							color={theme.colors.textSecondary}
						/>
						<Text style={[styles.noEventsTitle, { color: theme.colors.text }]}>
							{viewMode === "upcoming"
								? "No upcoming events"
								: "No past events"}
						</Text>
						<Text
							style={[
								styles.noEventsText,
								{ color: theme.colors.textSecondary },
							]}
						>
							{viewMode === "upcoming"
								? "Tap the '+' button to add a new event"
								: "Your past events will appear here"}
						</Text>
					</View>
				) : (
					<FlatList
						data={currentEvents}
						keyExtractor={(item) => item._id}
						renderItem={renderItem}
						contentContainerStyle={styles.list}
						showsVerticalScrollIndicator={false}
					/>
				)}

				<FAB
					style={[styles.fab, { backgroundColor: theme.colors.primary }]}
					icon="plus"
					color="white"
					onPress={() => {
						router.push("/modal/events/AddEvents");
					}}
				/>
			</View>
		</PaperProvider>
	);
}

const defaultTheme = {
	roundness: 10,
	colors: {},
};

const lightColors = {
	primary: "#6200ee",
	background: "#f8f9fa",
	card: "#ffffff",
	text: "#333333",
	textSecondary: "#666666",
	border: "#e0e0e0",
};

const darkColors = {
	primary: "#bb86fc",
	background: "#121212",
	card: "#1e1e1e",
	text: "#ffffff",
	textSecondary: "#b0b0b0",
	border: "#2c2c2c",
};

const styles = {
	container: {
		flex: 1,
		padding: 16,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
	},
	tabContainer: {
		flexDirection: "row",
		marginBottom: 16,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
	},
	tabText: {
		fontWeight: "500",
	},
	list: {
		paddingBottom: 80,
	},
	card: {
		marginBottom: 12,
		borderRadius: 12,
		elevation: 3,
		overflow: "hidden",
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	categoryIcon: {
		marginRight: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginVertical: 6,
	},
	description: {
		fontSize: 14,
		marginBottom: 8,
	},
	divider: {
		marginVertical: 10,
	},
	detailsContainer: {
		marginTop: 4,
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 6,
	},
	text: {
		fontSize: 14,
		marginLeft: 8,
	},
	timeContainer: {
		marginTop: 4,
		alignSelf: "flex-end",
	},
	relativeTime: {
		fontSize: 14,
		fontStyle: "italic",
	},
	rsvpContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
	},
	rsvpText: {
		fontSize: 12,
		marginLeft: 6,
	},
	noEventsContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 16,
	},
	noEventsTitle: {
		fontSize: 20,
		fontWeight: "bold",
		marginTop: 16,
		marginBottom: 8,
	},
	noEventsText: {
		fontSize: 16,
		textAlign: "center",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
	},
	fab: {
		position: "absolute",
		right: 20,
		bottom: 20,
	},
};
