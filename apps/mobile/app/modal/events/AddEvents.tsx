import React, { useState } from "react";
import {
	View,
	StyleSheet,
	ScrollView,
	TextInput,
	Pressable,
	Image,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { useEventsStore } from "@/store/eventsStore";
import { useGiftsStore } from "@/store/giftsStore";
import { saveCover } from "@/db/media";
import type { Direction, EventType } from "@/db/events";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { AppText } from "@/components/ui/AppText";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { colors, radius, spacing } from "@/theme/tokens";

type TypeOption = { value: EventType; labelKey: string };

const TYPE_OPTIONS: TypeOption[] = [
	{ value: "wedding", labelKey: "addEvent.types.wedding" },
	{ value: "birthday", labelKey: "addEvent.types.birthday" },
	{ value: "corporate", labelKey: "addEvent.types.corporate" },
	{ value: "other", labelKey: "addEvent.types.other" },
];

export default function AddEvents() {
	const { t, i18n } = useTranslation();
	const navigation = useNavigation();
	const addEventToStore = useEventsStore((s) => s.add);
	const addGift = useGiftsStore((s) => s.add);

	const [eventName, setEventName] = useState("");
	const [direction, setDirection] = useState<Direction>("HOSTED");
	const [hostFamily, setHostFamily] = useState("");
	const [givenBy, setGivenBy] = useState("");
	const [eventType, setEventType] = useState<EventType>("wedding");
	const [eventDescription, setEventDescription] = useState("");
	const [location, setLocation] = useState("");
	const [eventDate, setEventDate] = useState<Date>(new Date());
	const [amountGiven, setAmountGiven] = useState("");
	const [image, setImage] = useState<string | null>(null);

	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const pickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(t("addEvent.permissionDenied"));
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			quality: 0.8,
		});
		if (!result.canceled) setImage(result.assets[0].uri);
	};

	const handleSave = async () => {
		if (!eventName.trim()) {
			setErr(t("addEvent.nameRequired"));
			return;
		}
		if (direction === "ATTENDED" && !hostFamily.trim()) {
			setErr(t("addEvent.hostRequired"));
			return;
		}
		try {
			setSaving(true);
			setErr(null);
			const coverUri = image ? await saveCover(image) : null;
			const created = await addEventToStore({
				event_name: eventName.trim(),
				event_type: eventType,
				event_date: eventDate.toISOString(),
				location: location.trim() || null,
				description: eventDescription.trim() || null,
				cover_uri: coverUri,
				direction,
				host_family_name:
					direction === "ATTENDED" ? hostFamily.trim() : null,
			});

			// An attended function starts with the moi we gave, recorded against
			// the host family so it lines up with their side of the history.
			const amt = Number(amountGiven.replace(/[^\d.]/g, ""));
			if (direction === "ATTENDED" && amt > 0) {
				await addGift({
					event_id: created.id,
					recipient_name: hostFamily.trim(),
					amount: amt,
					given_by: givenBy.trim() || null,
					gift_date: eventDate.getTime(),
				});
			}
			navigation.goBack();
		} catch (e: any) {
			console.error("add event failed", e);
			setErr(e?.message || t("common.error"));
		} finally {
			setSaving(false);
		}
	};

	const formatDate = () =>
		eventDate.toLocaleDateString(i18n.language === "ta" ? "ta-IN" : "en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		}) +
		" · " +
		eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

	return (
		<PaperBackground>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView contentContainerStyle={styles.scroll}>
					<View style={styles.topBar}>
						<Pressable onPress={() => navigation.goBack()} hitSlop={12}>
							<AppText color={colors.maroon} weight="bold">
								← {t("common.cancel")}
							</AppText>
						</Pressable>
						<LanguageToggle />
					</View>

					<MangoFrame style={styles.card}>
						<AppText
							variant="h2"
							weight="bold"
							color={colors.maroon}
							align="center"
						>
							{t("addEvent.title")}
						</AppText>
						<KolamDivider compact />

						{/* Moi runs both ways: we host and receive, or we attend and
						    give. Everything below adapts to the choice. */}
						<Label>{t("addEvent.fieldDirection")}</Label>
						<View style={styles.directionRow}>
							<DirectionChip
								active={direction === "HOSTED"}
								label={t("addEvent.directionHosted")}
								hint={t("addEvent.directionHostedHint")}
								onPress={() => setDirection("HOSTED")}
							/>
							<DirectionChip
								active={direction === "ATTENDED"}
								label={t("addEvent.directionAttended")}
								hint={t("addEvent.directionAttendedHint")}
								onPress={() => setDirection("ATTENDED")}
							/>
						</View>

						<Label>{t("addEvent.fieldName")}</Label>
						<Input
							value={eventName}
							onChangeText={setEventName}
							placeholder={t("addEvent.namePlaceholder")}
						/>

						{direction === "ATTENDED" && (
							<>
								<Label>{t("addEvent.fieldHostFamily")}</Label>
								<Input
									value={hostFamily}
									onChangeText={setHostFamily}
									placeholder={t("addEvent.hostFamilyPlaceholder")}
								/>

								<Label>{t("addEvent.fieldAmountGiven")}</Label>
								<Input
									value={amountGiven}
									onChangeText={(v) => setAmountGiven(v.replace(/[^\d]/g, ""))}
									placeholder={t("ledger.amountPlaceholder")}
									keyboardType="number-pad"
								/>

								<Label>{t("addEvent.fieldGivenBy")}</Label>
								<Input
									value={givenBy}
									onChangeText={setGivenBy}
									placeholder={t("addEvent.givenByPlaceholder")}
								/>
							</>
						)}

						<Label>{t("addEvent.fieldType")}</Label>
						<View style={styles.typeRow}>
							{TYPE_OPTIONS.map((opt) => (
								<TypeChip
									key={opt.value}
									active={eventType === opt.value}
									label={t(opt.labelKey)}
									onPress={() => setEventType(opt.value)}
								/>
							))}
						</View>

						<Label>{t("addEvent.fieldDate")}</Label>
						<Pressable
							onPress={() => setDatePickerVisibility(true)}
							style={styles.dateButton}
						>
							<AppText color={colors.ink}>{formatDate()}</AppText>
						</Pressable>

						<Label>{t("addEvent.fieldLocation")}</Label>
						<Input
							value={location}
							onChangeText={setLocation}
							placeholder={t("addEvent.locationPlaceholder")}
						/>

						<Label>{t("addEvent.fieldDescription")}</Label>
						<Input
							value={eventDescription}
							onChangeText={setEventDescription}
							placeholder={t("addEvent.descriptionPlaceholder")}
							multiline
							numberOfLines={3}
							style={{ minHeight: 70, textAlignVertical: "top" }}
						/>

						<Label>{t("addEvent.fieldCover")}</Label>
						<Pressable onPress={pickImage} style={styles.coverPicker}>
							{image ? (
								<Image source={{ uri: image }} style={styles.coverPreview} />
							) : (
								<View style={styles.coverPlaceholder}>
									<AppText color={colors.inkMuted}>
										🖼  {t("addEvent.pickCover")}
									</AppText>
								</View>
							)}
						</Pressable>

						{err && (
							<AppText
								variant="small"
								color={colors.danger}
								align="center"
								style={{ marginTop: spacing.md }}
							>
								{err}
							</AppText>
						)}
					</MangoFrame>

					<View style={{ marginTop: spacing.xl }}>
						<MaroonButton
							label={t("addEvent.save")}
							onPress={handleSave}
							loading={saving}
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			<DateTimePickerModal
				isVisible={isDatePickerVisible}
				mode="datetime"
				date={eventDate}
				onConfirm={(d) => {
					setEventDate(d);
					setDatePickerVisibility(false);
				}}
				onCancel={() => setDatePickerVisibility(false)}
			/>
		</PaperBackground>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<AppText
			variant="label"
			color={colors.inkSoft}
			style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}
		>
			{String(children).toUpperCase()}
		</AppText>
	);
}

function Input(props: React.ComponentProps<typeof TextInput>) {
	return (
		<TextInput
			{...props}
			placeholderTextColor={colors.inkMuted}
			style={[styles.input, props.style]}
		/>
	);
}

function DirectionChip({
	active,
	label,
	hint,
	onPress,
}: {
	active: boolean;
	label: string;
	hint: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={[styles.directionChip, active && styles.chipActive]}
		>
			<AppText
				color={active ? colors.gold : colors.maroon}
				weight="bold"
				style={{ fontSize: 14 }}
			>
				{label}
			</AppText>
			<AppText
				variant="small"
				color={active ? colors.goldLight : colors.inkMuted}
				align="center"
				style={{ marginTop: 2 }}
			>
				{hint}
			</AppText>
		</Pressable>
	);
}

function TypeChip({
	active,
	label,
	onPress,
}: {
	active: boolean;
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={[styles.chip, active && styles.chipActive]}
		>
			<AppText
				color={active ? colors.gold : colors.maroon}
				weight={active ? "bold" : "regular"}
				style={{ fontSize: 13 }}
			>
				{label}
			</AppText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	scroll: {
		padding: spacing.lg,
		paddingBottom: spacing.xxxl,
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.lg,
	},
	card: {
		marginHorizontal: spacing.xs,
	},
	input: {
		borderBottomWidth: 1,
		borderColor: colors.divider,
		paddingVertical: spacing.md,
		fontSize: 16,
		color: colors.ink,
	},
	dateButton: {
		borderWidth: 1,
		borderColor: colors.divider,
		borderRadius: radius.md,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
	},
	typeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
	},
	directionRow: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	directionChip: {
		flex: 1,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.sm,
		borderRadius: radius.lg,
		borderWidth: 1.5,
		borderColor: colors.maroon,
		alignItems: "center",
	},
	chip: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		borderWidth: 1.5,
		borderColor: colors.maroon,
	},
	chipActive: {
		backgroundColor: colors.maroon,
	},
	coverPicker: {
		borderWidth: 1.5,
		borderColor: colors.divider,
		borderStyle: "dashed",
		borderRadius: radius.md,
		height: 140,
		overflow: "hidden",
	},
	coverPlaceholder: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	coverPreview: {
		width: "100%",
		height: "100%",
	},
});
