import { useEffect, useState } from "react";
import {
	View,
	ActivityIndicator,
	FlatList,
	useColorScheme,
} from "react-native";
import {
	Card,
	Text,
	Provider as PaperProvider,
	Divider,
	FAB,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { api } from "@/app/api/axios.instance";
import { useUserStore } from "@/store/useUserStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function EventListScreen() {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
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
				const response = await api.get(`/events/user/${userID}`);
				setEvents(response.data);
			} catch (error) {
				console.error("Error fetching events:", error);
			} finally {
				setLoading(false);
			}
		}
	};

	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", fetchEvents);
		return unsubscribe;
	}, [navigation]);

	const renderItem = ({ item }: any) => (
		<Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
			<Card.Content>
				<Text style={[styles.title, { color: theme.colors.text }]}>
					{item.event_name}
				</Text>
				<Divider style={styles.divider} />
				<Text style={[styles.text, { color: theme.colors.text }]}>
					<MaterialCommunityIcons
						name="map-marker"
						size={16}
						color={theme.colors.text}
					/>{" "}
					{item.location}
				</Text>
				<Text style={[styles.text, { color: theme.colors.text }]}>
					<MaterialCommunityIcons
						name="calendar"
						size={16}
						color={theme.colors.text}
					/>{" "}
					{new Date(item.event_date).toDateString()}
				</Text>
			</Card.Content>
		</Card>
	);

	return (
		<PaperProvider theme={theme}>
			<View
				style={[styles.container, { backgroundColor: theme.colors.background }]}
			>
				{loading ? (
					<ActivityIndicator size="large" color={theme.colors.primary} />
				) : events.length === 0 ? (
					<View style={styles.noEventsContainer}>
						<Text style={styles.noEventsText}>
							No events yet. Tap '+' to add one.
						</Text>
					</View>
				) : (
					<FlatList
						data={events}
						keyExtractor={(item: any) => item?._id}
						renderItem={renderItem}
						contentContainerStyle={styles.list}
					/>
				)}

				<FAB
					style={styles.fab}
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
};

const darkColors = {
	primary: "#bb86fc",
	background: "#121212",
	card: "#1e1e1e",
	text: "#ffffff",
};

const styles = {
	container: {
		flex: 1,
		padding: 10,
	},
	list: {
		paddingBottom: 80,
	},
	card: {
		marginBottom: 10,
		padding: 15,
		borderRadius: 10,
		elevation: 5,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 5,
	},
	text: {
		fontSize: 14,
		marginBottom: 3,
	},
	noEventsContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	noEventsText: {
		fontSize: 16,
		color: "#666",
	},
	fab: {
		position: "absolute",
		right: 20,
		bottom: 20,
		backgroundColor: "#6200ee",
	},
};
