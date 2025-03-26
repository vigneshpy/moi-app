import { useState } from "react";
import { Alert, Linking } from "react-native";
import * as FileSystem from "expo-file-system";
import Share from "react-native-share";

interface UseEventShareProps {
	eventName: string;
	eventDescription: string;
	eventDate: string;
	location: string;
	rsvpLink: string;
	imageUrl?: string;
}

export const useEventShare = () => {
	const [modalVisible, setModalVisible] = useState(false);
	const [caption, setCaption] = useState("");

	const shareEvent = async ({
		eventName,
		eventDescription,
		eventDate,
		location,
		rsvpLink,
		imageUrl,
	}: UseEventShareProps) => {
		try {
			const message = caption
				? caption
				: `🙏 You're Invited! 
        🙏\n\n🎉 ${eventName} 🎉\n
        📖 ${eventDescription}\n\n
        📖 ${eventDate}\n\n
        📍 ${location}\n\n
        Join us & confirm your presence here: ${rsvpLink}\n\nLooking forward to celebrating together! 🎊✨`;

			// If no image, share via text
			if (!imageUrl) {
				const encodedMessage = encodeURIComponent(message);
				const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
				const canOpen = await Linking.canOpenURL(whatsappUrl);

				if (canOpen) {
					await Linking.openURL(whatsappUrl);
				} else {
					Alert.alert("Error", "WhatsApp is not installed.");
				}
				return;
			}

			const fileUri = `${FileSystem.cacheDirectory}event_image.jpg`;
			const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);

			const shareOptions: any = {
				title: "Share Event",
				message: message,
				url: `file://${uri}`,
				social: Share.Social.WHATSAPP,
			};

			await Share.shareSingle(shareOptions);
		} catch (error) {
			console.error("WhatsApp sharing error:", error);
			Alert.alert("Sharing Error", "Could not share via WhatsApp.");
		} finally {
			setCaption("");
			setModalVisible(false);
		}
	};

	const openShareModal = () => {
		setModalVisible(true);
	};

	const closeShareModal = () => {
		setModalVisible(false);
	};

	return {
		shareEvent,
		openShareModal,
		closeShareModal,
		modalVisible,
		caption,
		setCaption,
	};
};
