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
	useTheme,
} from "react-native-paper";
import { api } from "@/app/api/axios.instance";
import { API_BASE_URL } from "@/app/constants";
import { useUserStore } from "@/store/useUserStore";

export default function TabTwoScreen() {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const colorScheme = useColorScheme();
	const { user } = useUserStore();
	console.log("user: ", user);

	const theme = {
		...defaultTheme,
		dark: colorScheme === "dark",
		colors: colorScheme === "dark" ? darkColors : lightColors,
	};

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const response = await api.get(`/events/user/${user?.id}`);
				setEvents(response.data);
			} catch (error) {
				console.error("Error fetching events:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, []);

	const renderItem = ({ item }: any) => (
		<Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
			<Card.Content>
				<Text style={[{ color: theme.colors.text }]}>{item.event_name}</Text>
				<Text style={[styles.text, { color: theme.colors.text }]}>
					📍 {item.location}
				</Text>
				<Text style={[styles.text, { color: theme.colors.text }]}>
					📅 {new Date(item.event_date).toDateString()}
				</Text>
				<Text style={[styles.text, { color: theme.colors.text }]}>
					💰 Total Collected: ₹{item.total_collected}
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
				) : (
					<FlatList
						data={events}
						keyExtractor={(item: any) => item?._id}
						renderItem={renderItem}
						contentContainerStyle={styles.list}
					/>
				)}
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
		paddingBottom: 20,
	},
	card: {
		marginBottom: 10,
		padding: 15,
		borderRadius: 10,
		elevation: 3,
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
};
