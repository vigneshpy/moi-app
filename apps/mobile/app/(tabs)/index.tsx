import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useEventsStore } from "@/store/eventsStore";
import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AppText } from "@/components/ui/AppText";
import { colors, radius, spacing } from "@/theme/tokens";

export default function HomeScreen() {
	const { t, i18n } = useTranslation();
	const events = useEventsStore((s) => s.events);
	const refresh = useEventsStore((s) => s.refresh);

	useEffect(() => {
		refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { grandTotal, totalEntries, upcoming, quickAddEvent } = useMemo(() => {
		const now = Date.now();
		let total = 0;
		let count = 0;
		for (const e of events) {
			total += e.total_collected;
			count += e.entry_count;
		}
		const upc = events
			.filter((e) => e.event_date && new Date(e.event_date).getTime() >= now)
			.sort(
				(a, b) =>
					new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime(),
			)
			.slice(0, 3);
		// Quick-add target: the nearest upcoming event, else the most recently
		// created event (events already arrive sorted by created_at DESC).
		const qa = upc[0] ?? events[0] ?? null;
		return {
			grandTotal: total,
			totalEntries: count,
			upcoming: upc,
			quickAddEvent: qa,
		};
	}, [events]);

	const hasNoEvents = events.length === 0;

	return (
		<PaperBackground>
			<ScrollView contentContainerStyle={styles.scroll}>
				<View style={styles.topBar}>
					<View>
						<AppText
							variant="label"
							color={colors.inkSoft}
							style={{ letterSpacing: 1 }}
						>
							வணக்கம்
						</AppText>
						<AppText variant="h2" weight="bold" color={colors.maroon}>
							{t("app.name")}
						</AppText>
					</View>
					<LanguageToggle />
				</View>

				<MangoFrame style={styles.summary}>
					<AppText
						variant="label"
						color={colors.inkSoft}
						align="center"
					>
						{t("ledger.totalCollected").toUpperCase()}
					</AppText>
					<AppText
						variant="h1"
						weight="bold"
						color={colors.maroon}
						align="center"
						style={{ marginTop: 4 }}
					>
						₹ {grandTotal.toLocaleString("en-IN")}
					</AppText>
					<KolamDivider compact />
					<View style={styles.metricsRow}>
						<Metric
							label={t("ledger.entries")}
							value={String(totalEntries)}
						/>
						<View style={styles.verticalRule} />
						<Metric
							label={t("events.title")}
							value={String(events.length)}
						/>
					</View>
				</MangoFrame>

				{quickAddEvent && (
					<Pressable
						style={({ pressed }) => [
							styles.quickAddCard,
							pressed && { opacity: 0.85 },
						]}
						onPress={() =>
							router.push({
								pathname: "/modal/events/Ledger",
								params: { eventId: quickAddEvent.id, openAdd: "1" },
							})
						}
					>
						<View style={styles.quickAddIcon}>
							<MaterialCommunityIcons
								name="plus"
								size={28}
								color={colors.gold}
							/>
						</View>
						<View style={{ flex: 1 }}>
							<AppText
								variant="label"
								color={colors.inkSoft}
								style={{ letterSpacing: 0.8 }}
							>
								{t("ledger.quickAdd").toUpperCase()}
							</AppText>
							<AppText
								weight="bold"
								color={colors.maroon}
								numberOfLines={1}
								style={{ marginTop: 2 }}
							>
								{quickAddEvent.event_name}
							</AppText>
						</View>
						<MaterialCommunityIcons
							name="chevron-right"
							size={24}
							color={colors.gold}
						/>
					</Pressable>
				)}

				<View style={{ marginTop: spacing.xl }}>
					<AppText
						variant="h3"
						weight="bold"
						color={colors.maroon}
						style={{ marginBottom: spacing.md }}
					>
						{t("events.upcoming")}
					</AppText>

					{hasNoEvents ? (
						<View style={styles.emptyBox}>
							<MaterialCommunityIcons
								name="notebook-outline"
								size={48}
								color={colors.gold}
							/>
							<AppText
								color={colors.inkMuted}
								align="center"
								style={{
									marginTop: spacing.sm,
									paddingHorizontal: spacing.md,
								}}
							>
								{t("events.emptyHint")}
							</AppText>
						</View>
					) : upcoming.length === 0 ? (
						<AppText color={colors.inkMuted}>
							{t("common.empty")}
						</AppText>
					) : (
						upcoming.map((e) => (
							<Pressable
								key={e.id}
								style={styles.upcomingRow}
								onPress={() =>
									router.push({
										pathname: "/modal/events/Ledger",
										params: { eventId: e.id },
									})
								}
							>
								<View style={{ flex: 1 }}>
									<AppText
										weight="bold"
										color={colors.ink}
										numberOfLines={1}
									>
										{e.event_name}
									</AppText>
									<AppText variant="small" color={colors.inkMuted}>
										{e.event_date
											? new Date(e.event_date).toLocaleDateString(
													i18n.language === "ta" ? "ta-IN" : "en-IN",
													{ day: "numeric", month: "short" },
											  )
											: ""}
										{e.location ? `  ·  ${e.location}` : ""}
									</AppText>
								</View>
								<AppText
									variant="numeric"
									weight="bold"
									color={colors.gold}
								>
									₹ {e.total_collected.toLocaleString("en-IN")}
								</AppText>
							</Pressable>
						))
					)}
				</View>

				<View style={{ marginTop: spacing.xl }}>
					<MaroonButton
						label={
							hasNoEvents
								? t("events.addFirst")
								: t("events.addAnother")
						}
						onPress={() => router.push("/modal/events/AddEvents")}
					/>
				</View>
			</ScrollView>
		</PaperBackground>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<View style={{ flex: 1, alignItems: "center" }}>
			<AppText
				variant="h3"
				weight="bold"
				color={colors.maroon}
			>
				{value}
			</AppText>
			<AppText variant="small" color={colors.inkMuted}>
				{label}
			</AppText>
		</View>
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
		marginTop: spacing.xl,
		marginBottom: spacing.lg,
	},
	summary: {
		marginHorizontal: spacing.xs,
	},
	quickAddCard: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.xl,
		padding: spacing.md,
		backgroundColor: colors.cream,
		borderRadius: radius.lg,
		borderWidth: 1.5,
		borderColor: colors.gold,
		gap: spacing.md,
	},
	quickAddIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.maroon,
		alignItems: "center",
		justifyContent: "center",
	},
	metricsRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	verticalRule: {
		width: 1,
		height: 32,
		backgroundColor: colors.divider,
	},
	emptyBox: {
		alignItems: "center",
		paddingVertical: spacing.xl,
		borderWidth: 1.5,
		borderStyle: "dashed",
		borderColor: colors.divider,
		borderRadius: radius.lg,
	},
	upcomingRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		backgroundColor: colors.cream,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.divider,
		marginBottom: spacing.sm,
	},
});
