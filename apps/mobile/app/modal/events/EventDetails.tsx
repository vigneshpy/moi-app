import React, { useEffect, useState } from "react";
import {
	View,
	StyleSheet,
	Image,
	ScrollView,
	Pressable,
	ActivityIndicator,
	Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getEvent, type EventWithTotals } from "@/db/events";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AppText } from "@/components/ui/AppText";
import { colors, radius, spacing } from "@/theme/tokens";

export default function EventDetailScreen() {
	const { eventId } = useLocalSearchParams<{ eventId: string }>();
	const { t, i18n } = useTranslation();

	const [event, setEvent] = useState<EventWithTotals | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!eventId) return;
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const row = await getEvent(eventId);
				if (!cancelled) setEvent(row);
			} catch (e) {
				if (!cancelled) setError(t("common.error"));
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventId]);

	const handleShare = async () => {
		if (!event) return;
		const dateStr = event.event_date
			? formatDate(event.event_date, i18n.language)
			: "";
		const lines = [
			event.event_name,
			dateStr && event.location
				? `${dateStr} · ${event.location}`
				: dateStr || event.location || "",
			event.description || "",
			"",
			`₹ ${event.total_collected.toLocaleString("en-IN")} collected · ${event.entry_count} entries`,
		].filter(Boolean);

		try {
			await Share.share({ message: lines.join("\n") });
		} catch {
			// user cancelled
		}
	};

	if (loading) {
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
						onPress={() => {
							setLoading(true);
							getEvent(eventId!).then(setEvent).finally(() => setLoading(false));
						}}
						style={{ marginTop: spacing.md }}
					/>
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
					<View style={styles.topActions}>
						<Pressable onPress={handleShare} hitSlop={10} style={styles.iconBtn}>
							<MaterialCommunityIcons
								name="share-variant-outline"
								size={22}
								color={colors.maroon}
							/>
						</Pressable>
						<LanguageToggle />
					</View>
				</View>

				{/* Cover image or fallback */}
				{event.cover_uri ? (
					<Image
						source={{ uri: event.cover_uri }}
						style={styles.cover}
						resizeMode="cover"
					/>
				) : (
					<View style={[styles.cover, styles.coverFallback]}>
						<MaterialCommunityIcons
							name="heart-multiple"
							size={64}
							color={colors.gold}
						/>
					</View>
				)}

				<MangoFrame style={styles.card}>
					<AppText
						variant="h2"
						weight="bold"
						color={colors.maroon}
						align="center"
					>
						{event.event_name}
					</AppText>

					{event.description ? (
						<AppText
							color={colors.inkSoft}
							align="center"
							style={{ marginTop: spacing.xs }}
						>
							{event.description}
						</AppText>
					) : null}

					<KolamDivider compact />

					{/* Details rows */}
					<View style={styles.detailsSection}>
						{event.event_date ? (
							<DetailRow
								icon="calendar-month-outline"
								text={formatDate(event.event_date, i18n.language)}
							/>
						) : null}
						{event.location ? (
							<DetailRow icon="map-marker-outline" text={event.location} />
						) : null}
						{event.event_type ? (
							<DetailRow icon="tag-outline" text={capitalize(event.event_type)} />
						) : null}
					</View>

					<KolamDivider compact />

					{/* Stats */}
					<View style={styles.statsRow}>
						<View style={styles.statTile}>
							<AppText
								variant="label"
								color={colors.goldLight}
								align="center"
							>
								{t("ledger.totalCollected").toUpperCase()}
							</AppText>
							<AppText
								variant="h1"
								weight="bold"
								color={colors.gold}
								align="center"
								style={{ marginTop: 4 }}
							>
								₹ {event.total_collected.toLocaleString("en-IN")}
							</AppText>
							<AppText
								variant="small"
								color={colors.goldLight}
								align="center"
								style={{ marginTop: 2 }}
							>
								{event.entry_count}{" "}
								{i18n.language === "ta"
									? t("ledger.people")
									: t("ledger.entries")}
							</AppText>
						</View>
					</View>
				</MangoFrame>

				<View style={styles.actions}>
					<MaroonButton
						label={t("events.openLedger")}
						onPress={() =>
							router.push({
								pathname: "/modal/events/Ledger",
								params: { eventId: String(eventId) },
							})
						}
					/>
				</View>
			</ScrollView>
		</PaperBackground>
	);
}

function DetailRow({ icon, text }: { icon: string; text: string }) {
	return (
		<View style={styles.detailRow}>
			<MaterialCommunityIcons
				name={icon as any}
				size={18}
				color={colors.gold}
			/>
			<AppText color={colors.ink} style={{ marginLeft: spacing.sm }}>
				{text}
			</AppText>
		</View>
	);
}

function formatDate(iso: string, lang: string): string {
	try {
		return new Date(iso).toLocaleDateString(
			lang === "ta" ? "ta-IN" : "en-IN",
			{ weekday: "short", day: "numeric", month: "long", year: "numeric" },
		);
	} catch {
		return iso;
	}
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
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
		marginBottom: spacing.md,
	},
	topActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	iconBtn: {
		padding: spacing.xs,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	cover: {
		width: "100%",
		height: 200,
		borderRadius: radius.lg,
		overflow: "hidden",
		marginBottom: spacing.lg,
	},
	coverFallback: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.ivoryDeep,
	},
	card: {
		marginHorizontal: spacing.xs,
	},
	detailsSection: {
		gap: spacing.sm,
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	statsRow: {
		alignItems: "center",
	},
	statTile: {
		backgroundColor: colors.maroon,
		borderRadius: radius.lg,
		paddingVertical: spacing.lg,
		paddingHorizontal: spacing.xl,
		minWidth: 240,
		borderWidth: 1,
		borderColor: colors.goldDeep,
	},
	actions: {
		marginTop: spacing.xl,
	},
});
