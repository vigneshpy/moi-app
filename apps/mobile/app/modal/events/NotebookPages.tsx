import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	StyleSheet,
	Image,
	Pressable,
	ScrollView,
	ActivityIndicator,
	Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getEvent, type EventWithTotals } from "@/db/events";
import {
	listPages,
	addPage,
	deletePage,
	type NotebookPageWithCount,
} from "@/db/notebook";
import { listGiftsForPage } from "@/db/gifts";
import type { GiftRow } from "@/db/gifts";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { AppText } from "@/components/ui/AppText";
import { colors, radius, spacing } from "@/theme/tokens";

/**
 * Notebook pages for a function: attach photos, start transcribing, and later
 * reopen a page beside the entries taken from it so the original stays
 * verifiable.
 */
export default function NotebookPagesScreen() {
	const { eventId } = useLocalSearchParams<{ eventId: string }>();
	const { t } = useTranslation();

	const [event, setEvent] = useState<EventWithTotals | null>(null);
	const [pages, setPages] = useState<NotebookPageWithCount[]>([]);
	const [expanded, setExpanded] = useState<string | null>(null);
	const [entries, setEntries] = useState<GiftRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		if (!eventId) return;
		try {
			setLoading(true);
			const [ev, pgs] = await Promise.all([
				getEvent(eventId),
				listPages(eventId),
			]);
			setEvent(ev);
			setPages(pgs);
		} catch (e) {
			console.error("notebook pages load failed", e);
		} finally {
			setLoading(false);
		}
	}, [eventId]);

	useEffect(() => {
		load();
	}, [load]);

	const pickPages = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(t("addEvent.permissionDenied"));
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsMultipleSelection: true,
			quality: 0.9,
		});
		if (result.canceled || !eventId) return;

		try {
			setBusy(true);
			for (const asset of result.assets) {
				await addPage(eventId, asset.uri);
			}
			await load();
		} catch (e) {
			console.error("add page failed", e);
			Alert.alert(t("common.error"));
		} finally {
			setBusy(false);
		}
	};

	const capturePage = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(t("notebook.cameraDenied"));
			return;
		}
		const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
		if (result.canceled || !eventId) return;

		try {
			setBusy(true);
			await addPage(eventId, result.assets[0].uri);
			await load();
		} catch (e) {
			console.error("capture page failed", e);
			Alert.alert(t("common.error"));
		} finally {
			setBusy(false);
		}
	};

	const toggleExpanded = async (page: NotebookPageWithCount) => {
		if (expanded === page.id) {
			setExpanded(null);
			setEntries([]);
			return;
		}
		setExpanded(page.id);
		try {
			setEntries(await listGiftsForPage(page.id));
		} catch (e) {
			console.error("page entries load failed", e);
			setEntries([]);
		}
	};

	const confirmDeletePage = (page: NotebookPageWithCount) => {
		Alert.alert(
			t("notebook.deletePageTitle"),
			t("notebook.deletePageBody", { entries: page.entry_count }),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: async () => {
						try {
							await deletePage(page.id);
							if (expanded === page.id) {
								setExpanded(null);
								setEntries([]);
							}
							await load();
						} catch (e) {
							console.error("delete page failed", e);
						}
					},
				},
			],
		);
	};

	if (loading && !event) {
		return (
			<PaperBackground>
				<View style={styles.center}>
					<ActivityIndicator color={colors.maroon} />
				</View>
			</PaperBackground>
		);
	}

	return (
		<PaperBackground>
			<ScrollView contentContainerStyle={styles.scroll}>
				<View style={styles.topBar}>
					<Pressable onPress={() => router.back()} hitSlop={12}>
						<AppText color={colors.maroon} weight="bold">
							← {t("common.back")}
						</AppText>
					</Pressable>
				</View>

				<MangoFrame style={styles.card}>
					<AppText
						variant="h3"
						weight="bold"
						color={colors.maroon}
						align="center"
					>
						{t("notebook.title")}
					</AppText>
					<AppText
						variant="small"
						color={colors.inkSoft}
						align="center"
						style={{ marginTop: spacing.xs }}
					>
						{event?.event_name}
					</AppText>
					<KolamDivider compact />
					<AppText variant="small" color={colors.inkMuted} align="center">
						{t("notebook.intro")}
					</AppText>
				</MangoFrame>

				<View style={styles.actionRow}>
					<MaroonButton
						label={t("notebook.addPhotos")}
						variant="outline"
						onPress={pickPages}
						loading={busy}
						style={styles.actionBtn}
					/>
					<MaroonButton
						label={t("notebook.takePhoto")}
						variant="outline"
						onPress={capturePage}
						loading={busy}
						style={styles.actionBtn}
					/>
				</View>

				{pages.length === 0 ? (
					<View style={styles.empty}>
						<MaterialCommunityIcons
							name="notebook-outline"
							size={56}
							color={colors.gold}
						/>
						<AppText
							color={colors.inkMuted}
							align="center"
							style={{ marginTop: spacing.md, maxWidth: 280 }}
						>
							{t("notebook.emptyHint")}
						</AppText>
					</View>
				) : (
					<>
						<MaroonButton
							label={t("notebook.startTranscribing")}
							onPress={() =>
								router.push({
									pathname: "/modal/events/NotebookEntry",
									params: { eventId: String(eventId) },
								})
							}
							style={{ marginTop: spacing.lg }}
						/>

						{pages.map((page, index) => (
							<View key={page.id} style={styles.pageCard}>
								<Pressable onPress={() => toggleExpanded(page)}>
									<Image
										source={{ uri: page.file_uri }}
										style={styles.thumb}
										resizeMode="cover"
									/>
								</Pressable>

								<View style={styles.pageBar}>
									<AppText variant="small" color={colors.inkSoft}>
										{t("notebook.pageLabel", { index: index + 1 })} ·{" "}
										{t("notebook.entriesRecorded", {
											count: page.entry_count,
										})}
									</AppText>

									<View style={styles.pageActions}>
										<Pressable
											onPress={() =>
												router.push({
													pathname: "/modal/events/NotebookEntry",
													params: {
														eventId: String(eventId),
														pageId: page.id,
													},
												})
											}
											hitSlop={8}
											style={styles.pageAction}
										>
											<MaterialCommunityIcons
												name="pencil-plus-outline"
												size={20}
												color={colors.maroon}
											/>
										</Pressable>
										<Pressable
											onPress={() => confirmDeletePage(page)}
											hitSlop={8}
											style={styles.pageAction}
										>
											<MaterialCommunityIcons
												name="trash-can-outline"
												size={20}
												color={colors.inkMuted}
											/>
										</Pressable>
									</View>
								</View>

								{/* Entries taken from this page, so the recorded numbers can
								    always be checked against the original. */}
								{expanded === page.id && (
									<View style={styles.entryList}>
										{entries.length === 0 ? (
											<AppText variant="small" color={colors.inkMuted}>
												{t("notebook.noEntriesForPage")}
											</AppText>
										) : (
											entries.map((g) => (
												<View key={g.id} style={styles.entryRow}>
													<AppText
														color={colors.ink}
														numberOfLines={1}
														style={{ flex: 1 }}
													>
														{g.recipient_name}
													</AppText>
													<AppText
														variant="numeric"
														weight="bold"
														color={colors.maroon}
													>
														₹ {g.amount.toLocaleString("en-IN")}
													</AppText>
												</View>
											))
										)}
									</View>
								)}
							</View>
						))}
					</>
				)}
			</ScrollView>
		</PaperBackground>
	);
}

const styles = StyleSheet.create({
	scroll: {
		padding: spacing.lg,
		paddingBottom: spacing.xxxl,
	},
	topBar: {
		marginBottom: spacing.md,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	card: {
		marginHorizontal: spacing.xs,
	},
	actionRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.lg,
	},
	actionBtn: {
		flex: 1,
	},
	empty: {
		alignItems: "center",
		paddingVertical: spacing.xxxl,
	},
	pageCard: {
		marginTop: spacing.lg,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.gold,
		backgroundColor: colors.cream,
		overflow: "hidden",
	},
	thumb: {
		width: "100%",
		height: 180,
	},
	pageBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	pageActions: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	pageAction: {
		padding: spacing.xs,
	},
	entryList: {
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.md,
		gap: spacing.xs,
	},
	entryRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.xs,
		borderTopWidth: 1,
		borderTopColor: colors.divider,
	},
});
