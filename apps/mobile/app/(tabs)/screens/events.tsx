import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	View,
	StyleSheet,
	FlatList,
	Pressable,
	Image,
	Alert,
	ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Swipeable from "react-native-gesture-handler/Swipeable";
import {
	GestureHandlerRootView,
	RectButton,
} from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useEventsStore } from "@/store/eventsStore";
import type { EventWithTotals } from "@/db/events";
import { getUpcomingEvents, getPastEvents } from "./utils";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AppText } from "@/components/ui/AppText";
import { colors, radius, spacing } from "@/theme/tokens";

type Bucket = "upcoming" | "past";

export default function EventListScreen() {
	const { t, i18n } = useTranslation();
	const events = useEventsStore((s) => s.events);
	const loading = useEventsStore((s) => s.loading);
	const refresh = useEventsStore((s) => s.refresh);
	const remove = useEventsStore((s) => s.remove);

	const [bucket, setBucket] = useState<Bucket>("upcoming");
	const rowRefs = useRef(new Map<string, Swipeable>());

	useEffect(() => {
		refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { upcoming, past } = useMemo(() => {
		// utils expect rows with event_date
		const upc = getUpcomingEvents(events as any) as EventWithTotals[];
		const pst = getPastEvents(events as any) as EventWithTotals[];
		return { upcoming: upc, past: pst };
	}, [events]);

	const list = bucket === "upcoming" ? upcoming : past;

	const confirmDelete = (ev: EventWithTotals) => {
		Alert.alert(
			t("common.delete"),
			`"${ev.event_name}"?`,
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: () => remove(ev.id),
				},
			],
		);
	};

	const openDetails = (ev: EventWithTotals) => {
		router.push({
			pathname: "/modal/events/EventDetails",
			params: { eventId: ev.id },
		});
	};

	const openLedger = (ev: EventWithTotals) => {
		router.push({
			pathname: "/modal/events/Ledger",
			params: { eventId: ev.id },
		});
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<PaperBackground>
				<View style={styles.topBar}>
					<AppText variant="h2" weight="bold" color={colors.maroon}>
						{t("events.title")}
					</AppText>
					<LanguageToggle />
				</View>

				<View style={styles.tabRow}>
					<TabPill
						active={bucket === "upcoming"}
						label={t("events.upcoming")}
						count={upcoming.length}
						onPress={() => setBucket("upcoming")}
					/>
					<TabPill
						active={bucket === "past"}
						label={t("events.past")}
						count={past.length}
						onPress={() => setBucket("past")}
					/>
				</View>

				{loading && events.length === 0 ? (
					<View style={styles.centerFill}>
						<ActivityIndicator color={colors.maroon} />
					</View>
				) : list.length === 0 ? (
					<EmptyState
						titleKey="events.emptyTitle"
						hintKey="events.emptyHint"
					/>
				) : (
					<FlatList
						data={list}
						keyExtractor={(e) => e.id}
						contentContainerStyle={styles.listContent}
						ItemSeparatorComponent={() => (
							<View style={{ height: spacing.md }} />
						)}
						renderItem={({ item }) => (
							<Swipeable
								ref={(r) => {
									if (r) rowRefs.current.set(item.id, r);
									else rowRefs.current.delete(item.id);
								}}
								renderRightActions={() => (
									<RectButton
										style={styles.deleteAction}
										onPress={() => {
											rowRefs.current.get(item.id)?.close();
											confirmDelete(item);
										}}
									>
										<MaterialCommunityIcons
											name="delete"
											size={22}
											color={colors.cream}
										/>
										<AppText
											color={colors.cream}
											weight="bold"
											style={{ fontSize: 12, marginTop: 2 }}
										>
											{t("common.delete")}
										</AppText>
									</RectButton>
								)}
							>
								<EventCard
									event={item}
									lang={i18n.language}
									onPress={() => openLedger(item)}
									onDetails={() => openDetails(item)}
								/>
							</Swipeable>
						)}
					/>
				)}

				<View style={styles.fab}>
					<MaroonButton
						label={
							events.length === 0
								? t("events.addFirst")
								: t("events.addAnother")
						}
						onPress={() => router.push("/modal/events/AddEvents")}
					/>
				</View>
			</PaperBackground>
		</GestureHandlerRootView>
	);
}

function TabPill({
	active,
	label,
	count,
	onPress,
}: {
	active: boolean;
	label: string;
	count: number;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={[styles.tabPill, active && styles.tabPillActive]}
		>
			<AppText
				color={active ? colors.gold : colors.maroon}
				weight={active ? "bold" : "regular"}
			>
				{label} · {count}
			</AppText>
		</Pressable>
	);
}

function EmptyState({
	titleKey,
	hintKey,
}: {
	titleKey: string;
	hintKey: string;
}) {
	const { t } = useTranslation();
	return (
		<View style={styles.centerFill}>
			<MaterialCommunityIcons
				name="notebook-outline"
				size={64}
				color={colors.gold}
			/>
			<AppText
				variant="h3"
				weight="bold"
				color={colors.maroon}
				align="center"
				style={{ marginTop: spacing.lg }}
			>
				{t(titleKey)}
			</AppText>
			<AppText
				color={colors.inkMuted}
				align="center"
				style={{
					marginTop: spacing.sm,
					maxWidth: 280,
					paddingHorizontal: spacing.md,
				}}
			>
				{t(hintKey)}
			</AppText>
		</View>
	);
}

function EventCard({
	event,
	lang,
	onPress,
	onDetails,
}: {
	event: EventWithTotals;
	lang: string;
	onPress: () => void;
	onDetails: () => void;
}) {
	return (
		<Pressable onPress={onPress} style={styles.card}>
			{event.cover_uri ? (
				<Image source={{ uri: event.cover_uri }} style={styles.cover} />
			) : (
				<View style={[styles.cover, styles.coverFallback]}>
					<MaterialCommunityIcons
						name="heart-multiple"
						size={40}
						color={colors.gold}
					/>
				</View>
			)}

			<View style={styles.cardBody}>
				<View style={{ flex: 1 }}>
					<AppText
						variant="h3"
						weight="bold"
						color={colors.maroon}
						numberOfLines={1}
					>
						{event.event_name}
					</AppText>
					<AppText
						variant="small"
						color={colors.inkMuted}
						style={{ marginTop: 2 }}
					>
						{event.event_date ? formatDate(event.event_date, lang) : ""}
						{event.location ? `  ·  ${event.location}` : ""}
					</AppText>
					<View style={styles.cardStats}>
						<AppText
							variant="numeric"
							weight="bold"
							color={colors.gold}
							style={{ fontSize: 16 }}
						>
							₹ {event.total_collected.toLocaleString("en-IN")}
						</AppText>
						<AppText variant="small" color={colors.inkMuted}>
							{event.entry_count}
						</AppText>
					</View>
				</View>
				<Pressable onPress={onDetails} hitSlop={10} style={styles.kebab}>
					<MaterialCommunityIcons
						name="information-outline"
						size={20}
						color={colors.inkSoft}
					/>
				</Pressable>
			</View>
		</Pressable>
	);
}

function formatDate(iso: string, lang: string): string {
	try {
		return new Date(iso).toLocaleDateString(
			lang === "ta" ? "ta-IN" : "en-IN",
			{ day: "numeric", month: "short", year: "numeric" },
		);
	} catch {
		return iso;
	}
}

const styles = StyleSheet.create({
	topBar: {
		paddingTop: spacing.xxl,
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	tabRow: {
		flexDirection: "row",
		paddingHorizontal: spacing.lg,
		gap: spacing.sm,
		marginBottom: spacing.md,
	},
	tabPill: {
		paddingVertical: spacing.xs + 2,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		borderWidth: 1.2,
		borderColor: colors.maroon,
	},
	tabPillActive: {
		backgroundColor: colors.maroon,
	},
	centerFill: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 120,
	},
	listContent: {
		padding: spacing.lg,
		paddingBottom: 120,
	},
	card: {
		backgroundColor: colors.cream,
		borderRadius: radius.lg,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: colors.gold,
	},
	cover: {
		width: "100%",
		height: 120,
	},
	coverFallback: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.ivoryDeep,
	},
	cardBody: {
		flexDirection: "row",
		padding: spacing.md,
		alignItems: "center",
	},
	cardStats: {
		flexDirection: "row",
		alignItems: "baseline",
		marginTop: spacing.sm,
		gap: spacing.sm,
	},
	kebab: {
		padding: spacing.xs,
	},
	deleteAction: {
		width: 80,
		backgroundColor: colors.maroonDeep,
		alignItems: "center",
		justifyContent: "center",
		borderTopRightRadius: radius.lg,
		borderBottomRightRadius: radius.lg,
	},
	fab: {
		position: "absolute",
		bottom: spacing.xl,
		left: spacing.xl,
		right: spacing.xl,
	},
});
