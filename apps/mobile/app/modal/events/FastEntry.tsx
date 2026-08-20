import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	StyleSheet,
	Pressable,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getEvent, type EventWithTotals } from "@/db/events";
import { useGiftsStore } from "@/store/giftsStore";
import { PaperBackground } from "@/components/ui/PaperBackground";
import { AppText } from "@/components/ui/AppText";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { RapidEntryForm } from "@/components/entry/RapidEntryForm";
import { colors, spacing } from "@/theme/tokens";

const EMPTY: import("@/db/gifts").GiftRow[] = [];

/**
 * Fast entry: one screen, name + amount + save, nothing else in the way.
 *
 * Entry happens live with a queue of people waiting, so the whole form sits
 * above the keyboard with no scrolling, and the running count and total stay
 * visible in a compact header.
 */
export default function FastEntryScreen() {
	const { eventId } = useLocalSearchParams<{ eventId: string }>();
	const { t } = useTranslation();

	const gifts = useGiftsStore((s) =>
		eventId ? s.byEvent[eventId] ?? EMPTY : EMPTY,
	);
	const loadFor = useGiftsStore((s) => s.loadFor);

	const [event, setEvent] = useState<EventWithTotals | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!eventId) return;
		try {
			setLoading(true);
			setError(null);
			const [row] = await Promise.all([getEvent(eventId), loadFor(eventId)]);
			setEvent(row);
		} catch (e) {
			console.error("fast entry load failed", e);
			setError(t("common.error"));
		} finally {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `t` excluded: it
		// changes identity every render and only supplies the error string.
	}, [eventId, loadFor]);

	useEffect(() => {
		load();
	}, [load]);

	// Running figures come straight from the store, so an undo takes them back
	// down immediately.
	const count = gifts.length;
	const total = gifts.reduce((sum, g) => sum + (g.amount || 0), 0);

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

	return (
		<PaperBackground>
			<KeyboardAvoidingView
				style={styles.fill}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<CompactHeader
					title={event.event_name}
					count={count}
					total={total}
					onBack={() => router.back()}
				/>

				<RapidEntryForm eventId={event.id} direction={event.direction} />
			</KeyboardAvoidingView>
		</PaperBackground>
	);
}

/**
 * One-line header: back, function name, and the running count + total. Kept
 * short so the form clears the keyboard without scrolling.
 */
export function CompactHeader({
	title,
	count,
	total,
	onBack,
	right,
}: {
	title: string;
	count: number;
	total: number;
	onBack: () => void;
	right?: React.ReactNode;
}) {
	const { t } = useTranslation();
	return (
		<View style={styles.header}>
			<Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
				<MaterialCommunityIcons
					name="chevron-left"
					size={26}
					color={colors.maroon}
				/>
			</Pressable>

			<View style={styles.headerText}>
				<AppText
					weight="bold"
					color={colors.maroon}
					numberOfLines={1}
					style={styles.headerTitle}
				>
					{title}
				</AppText>
				<AppText variant="small" color={colors.inkSoft} numberOfLines={1}>
					{t("fastEntry.runningTally", {
						entries: count,
						total: total.toLocaleString("en-IN"),
					})}
				</AppText>
			</View>

			{right}
		</View>
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
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingTop: spacing.xxl,
		paddingBottom: spacing.sm,
		paddingHorizontal: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.divider,
		backgroundColor: colors.cream,
		gap: spacing.xs,
	},
	backBtn: {
		padding: spacing.xs,
	},
	headerText: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 17,
	},
});
