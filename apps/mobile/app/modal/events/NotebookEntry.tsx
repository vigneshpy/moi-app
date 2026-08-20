import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	StyleSheet,
	Pressable,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getEvent, type EventWithTotals } from "@/db/events";
import { listPages, type NotebookPageWithCount } from "@/db/notebook";
import { countForPage } from "@/db/gifts";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { AppText } from "@/components/ui/AppText";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { RapidEntryForm } from "@/components/entry/RapidEntryForm";
import { ZoomablePhoto } from "@/components/entry/ZoomablePhoto";
import { colors, radius, spacing } from "@/theme/tokens";

/**
 * Split-screen transcription: the notebook page on top, the entry form below.
 *
 * No handwriting recognition — the user reads their own page and types. The
 * photo holds its zoom and pan between saves so they can work steadily down a
 * column, and a per-page counter lets them check their count against the page.
 */
export default function NotebookEntryScreen() {
	const { eventId, pageId } = useLocalSearchParams<{
		eventId: string;
		pageId?: string;
	}>();
	const { t } = useTranslation();

	const [event, setEvent] = useState<EventWithTotals | null>(null);
	const [pages, setPages] = useState<NotebookPageWithCount[]>([]);
	const [activeIndex, setActiveIndex] = useState(0);
	const [pageCount, setPageCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Transform state lives here, above the photo component, so it survives the
	// re-render each save causes. That's what keeps the zoom position.
	const scale = useSharedValue(1);
	const savedScale = useSharedValue(1);
	const x = useSharedValue(0);
	const y = useSharedValue(0);
	const savedX = useSharedValue(0);
	const savedY = useSharedValue(0);
	const transform = { scale, savedScale, x, y, savedX, savedY };

	const load = useCallback(async () => {
		if (!eventId) return;
		try {
			setLoading(true);
			setError(null);
			const [ev, pgs] = await Promise.all([
				getEvent(eventId),
				listPages(eventId),
			]);
			setEvent(ev);
			setPages(pgs);

			const startIndex = pageId
				? Math.max(0, pgs.findIndex((p) => p.id === pageId))
				: 0;
			setActiveIndex(startIndex);
			setPageCount(pgs[startIndex]?.entry_count ?? 0);
		} catch (e) {
			console.error("notebook entry load failed", e);
			setError(t("common.error"));
		} finally {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `t` excluded: it
		// changes identity every render and only supplies the error string.
	}, [eventId, pageId]);

	useEffect(() => {
		load();
	}, [load]);

	const activePage = pages[activeIndex] ?? null;

	const switchPage = useCallback(
		async (index: number) => {
			const page = pages[index];
			if (!page) return;
			setActiveIndex(index);
			// A new page starts from a fitted view — the held zoom belongs to the
			// page the user was working on.
			scale.value = 1;
			savedScale.value = 1;
			x.value = 0;
			y.value = 0;
			savedX.value = 0;
			savedY.value = 0;
			setPageCount(await countForPage(page.id));
		},
		[pages, scale, savedScale, x, y, savedX, savedY],
	);

	if (loading && !event) {
		return (
			<PaperBackground>
				<View style={styles.center}>
					<ActivityIndicator color={colors.maroon} />
				</View>
			</PaperBackground>
		);
	}

	if (error || !event) {
		return (
			<PaperBackground>
				<View style={styles.center}>
					<AppText color={colors.danger}>{error || t("common.error")}</AppText>
					<MaroonButton
						label={t("common.retry")}
						variant="outline"
						onPress={load}
						style={{ marginTop: spacing.md }}
					/>
				</View>
			</PaperBackground>
		);
	}

	if (!activePage) {
		return (
			<PaperBackground>
				<View style={styles.center}>
					<MaterialCommunityIcons
						name="image-off-outline"
						size={56}
						color={colors.gold}
					/>
					<AppText
						color={colors.inkMuted}
						align="center"
						style={{ marginTop: spacing.lg, maxWidth: 280 }}
					>
						{t("notebook.noPages")}
					</AppText>
					<MaroonButton
						label={t("common.back")}
						variant="outline"
						onPress={() => router.back()}
						style={{ marginTop: spacing.lg }}
					/>
				</View>
			</PaperBackground>
		);
	}

	return (
		<GestureHandlerRootView style={styles.fill}>
			<PaperBackground>
				<KeyboardAvoidingView
					style={styles.fill}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					{/* Top half: the page itself, pinch and pan, zoom held. */}
					<View style={styles.photoHalf}>
						<ZoomablePhoto uri={activePage.file_uri} transform={transform} />

						<Pressable
							onPress={() => router.back()}
							hitSlop={12}
							style={styles.backChip}
						>
							<MaterialCommunityIcons
								name="chevron-left"
								size={22}
								color={colors.maroon}
							/>
						</Pressable>

						{/* Running count for this page, to check against the page. */}
						<View style={styles.countChip}>
							<AppText variant="small" weight="bold" color={colors.gold}>
								{t("notebook.pageTally", {
									page: activeIndex + 1,
									total: pages.length,
									entries: pageCount,
								})}
							</AppText>
						</View>
					</View>

					{pages.length > 1 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							keyboardShouldPersistTaps="always"
							contentContainerStyle={styles.pageStrip}
						>
							{pages.map((p, i) => (
								<Pressable
									key={p.id}
									onPress={() => switchPage(i)}
									style={[
										styles.pageChip,
										i === activeIndex && styles.pageChipActive,
									]}
								>
									<AppText
										variant="small"
										weight={i === activeIndex ? "bold" : "regular"}
										color={i === activeIndex ? colors.gold : colors.maroon}
									>
										{i + 1}
									</AppText>
								</Pressable>
							))}
						</ScrollView>
					)}

					{/* Bottom half: the same rapid entry form as fast entry mode. */}
					<View style={styles.formHalf}>
						<RapidEntryForm
							eventId={event.id}
							direction={event.direction}
							pageId={activePage.id}
							onSaved={() => setPageCount((c) => c + 1)}
							onUndone={() => setPageCount((c) => Math.max(0, c - 1))}
						/>
					</View>
				</KeyboardAvoidingView>
			</PaperBackground>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.lg,
	},
	photoHalf: {
		flex: 1,
		minHeight: 160,
		borderBottomWidth: 1,
		borderBottomColor: colors.gold,
	},
	backChip: {
		position: "absolute",
		top: spacing.xxl,
		left: spacing.md,
		backgroundColor: colors.cream,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.gold,
		padding: spacing.xs,
	},
	countChip: {
		position: "absolute",
		top: spacing.xxl,
		right: spacing.md,
		backgroundColor: colors.maroon,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.goldDeep,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.md,
	},
	pageStrip: {
		gap: spacing.xs,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
	},
	pageChip: {
		minWidth: 32,
		alignItems: "center",
		paddingVertical: 2,
		paddingHorizontal: spacing.sm,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.maroon,
	},
	pageChipActive: {
		backgroundColor: colors.maroon,
	},
	formHalf: {
		backgroundColor: colors.ivory,
		paddingBottom: spacing.sm,
	},
});
