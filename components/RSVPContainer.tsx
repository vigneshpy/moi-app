import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
	View,
	TouchableOpacity,
	Linking,
	Text,
	useColorScheme,
	StyleSheet,
} from "react-native";
import React from "react";

const RSVPContainer = (props: any) => {
	const { rsvp } = props;
	if (!rsvp?.responses?.length) return null;
	if (!rsvp?.responses?.length) return null;
	const colorScheme = useColorScheme();
	const theme = colorScheme === "dark" ? darkTheme : lightTheme;
	// Calculate counts
	const attendingCount = rsvp.responses.filter(
		(r: any) => r.response === "Yes"
	).length;
	const notAttendingCount = rsvp.responses.filter(
		(r: any) => r.response === "No"
	).length;
	const totalGuests = rsvp.responses.reduce(
		(total: any, response: any) => total + (response.number_of_guest || 0) + 1,
		0
	); // +1 to count the respondent

	return (
		<View style={styles.rsvpSection}>
			<Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
				RSVP Responses
			</Text>
			<View style={styles.rsvpCountContainer}>
				<View style={styles.rsvpCountItem}>
					<MaterialCommunityIcons name="check-circle" size={20} color="green" />
					<Text style={styles.rsvpCountText}>Attending: {attendingCount}</Text>
				</View>
				<View style={styles.rsvpCountItem}>
					<MaterialCommunityIcons name="close-circle" size={20} color="red" />
					<Text style={styles.rsvpCountText}>
						Not Attending: {notAttendingCount}
					</Text>
				</View>
				<View style={styles.rsvpCountItem}>
					<MaterialCommunityIcons
						name="account-group"
						size={20}
						color={theme.colors.primary}
					/>
					<Text style={styles.rsvpCountText}>Total Guests: {totalGuests}</Text>
				</View>
			</View>

			{rsvp.responses.map((response: any, index: number) => (
				<View
					key={index}
					style={[
						styles.rsvpResponseContainer,
						{
							backgroundColor:
								response.response === "Yes"
									? theme.colors.attending
									: theme.colors.notAttending,
						},
					]}
				>
					<View style={styles.rsvpProfileContainer}>
						{/* Profile Avatar */}
						<View style={styles.avatarContainer}>
							<Text style={styles.avatarText}>
								{response.name.charAt(0).toUpperCase()}
							</Text>
						</View>

						{/* Name and Response */}
						<View style={styles.rsvpTextContainer}>
							<View style={styles.rsvpNameResponseRow}>
								<Text style={styles.rsvpName}>{response.name}</Text>
								<Text
									style={[
										styles.rsvpStatusBadge,
										{
											backgroundColor:
												response.response === "Yes"
													? theme.colors.attending
													: theme.colors.notAttending,
											color: "white",
										},
									]}
								>
									{response.response}
								</Text>
							</View>
							{response.phone && (
								<TouchableOpacity
									style={styles.phoneContainer}
									onPress={() => {
										Linking.openURL(
											`tel:${response.phone?.replace(/[^\d]/g, "")}`
										);
									}}
								>
									<MaterialCommunityIcons
										name="phone"
										size={16}
										color={theme.colors.primary}
									/>
									<Text style={styles.phoneText}>{response.phone}</Text>
								</TouchableOpacity>
							)}

							{/* Guest Count */}
							{response.number_of_guest && response.number_of_guest > 0 && (
								<View style={styles.guestCountContainer}>
									<MaterialCommunityIcons
										name="account-group"
										size={16}
										color={theme.colors.primary}
									/>
									<Text style={styles.guestCountText}>
										{response.number_of_guest} Guest
										{response.number_of_guest !== 1 ? "s" : ""}
									</Text>
								</View>
							)}
							{response.comment && (
								<View style={styles.commentContainer}>
									<Text style={styles.commentText}>"{response.comment}"</Text>
								</View>
							)}
						</View>
					</View>
				</View>
			))}
		</View>
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
	phoneContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
	},
	phoneText: {
		marginLeft: 8,
		fontSize: 14,
		color: "#666",
		textDecorationLine: "underline",
	},
	guestCountContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
	},
	guestCountText: {
		marginLeft: 8,
		fontSize: 14,
		color: "#666",
	},

	text: {
		fontSize: 14,
		marginLeft: 8,
	},

	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},

	rsvpSection: {
		marginTop: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},

	rsvpStatus: {
		fontSize: 14,
		fontWeight: "600",
	},
	rsvpComment: {
		fontSize: 14,
		fontStyle: "italic",
		color: "#666",
	},

	rsvpResponseContainer: {
		borderRadius: 12,
		marginBottom: 12,
		padding: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	rsvpProfileContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatarContainer: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "#e1e1e1",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	avatarText: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
	},
	rsvpTextContainer: {
		flex: 1,
	},
	rsvpNameResponseRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	rsvpName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#fff",
	},
	rsvpStatusBadge: {
		fontSize: 12,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		overflow: "hidden",
		fontWeight: "600",
	},
	commentContainer: {
		marginTop: 8,
		paddingLeft: 4,
		borderLeftWidth: 3,
		borderLeftColor: "#888",
	},
	commentText: {
		fontSize: 14,
		fontStyle: "italic",
		color: "#666",
	},

	rsvpCountContainer: {
		justifyContent: "center",
		textAlign: "center",
		borderRadius: 10,
		paddingBlock: 20,
		width: "auto",
		height: "auto",
	},
	rsvpCountItem: {
		flexDirection: "row",
		alignItems: "center",
	},
	rsvpCountText: {
		marginLeft: 5,
		fontSize: 14,
		color: "#666",
	},
});

export default RSVPContainer;
