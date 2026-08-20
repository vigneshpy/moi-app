import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	StyleSheet,
	TextInput,
	Pressable,
	ScrollView,
	ActivityIndicator,
	Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
	searchPeople,
	getReciprocity,
	type PersonSummary,
	type ReciprocityResult,
	type ReciprocityEntry,
	type ReciprocitySide,
} from "@/db/reciprocity";
import { mergeNames } from "@/db/households";
import { presentDayEquivalent } from "@/db/inflation";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AppText } from "@/components/ui/AppText";
import { colors, radius, spacing } from "@/theme/tokens";

/**
 * Reciprocity: search a person or household and see both directions.
 *
 * Deliberately not framed as a debt — there is no balance, no "owed", and no
 * red. Two histories side by side; the user decides what they mean.
 */
export default function ReciprocityScreen() {
	const { t, i18n } = useTranslation();

	const [query, setQuery] = useState("");
	const [results, setResults] = useState<PersonSummary[]>([]);
	const [selected, setSelected] = useState<ReciprocityResult | null>(null);
	const [loading, setLoading] = useState(false);

	// Debounced partial search; matching is case-insensitive and spans both
	// scripts via the normalised key.
	useEffect(() => {
		const q = query.trim();
		if (!q) {
			setResults([]);
			return;
		}
		let cancelled = false;
		const handle = setTimeout(async () => {
			try {
				const rows = await searchPeople(q);
				if (!cancelled) setResults(rows);
			} catch (e) {
				console.error("people search failed", e);
			}
		}, 160);
		return () => {
			cancelled = true;
			clearTimeout(handle);
		};
	}, [query]);

	const open = useCallback(async (displayName: string) => {
		try {
			setLoading(true);
			const res = await getReciprocity(displayName);
			setSelected(res);
		} catch (e) {
			console.error("reciprocity load failed", e);
		} finally {
			setLoading(false);
		}
	}, []);

	const promptMerge = useCallback(
		(result: ReciprocityResult) => {
			// Only offer a merge when there is more than one spelling to pick from.
			if (result.spellings.length < 2) return;
			const [first, ...rest] = result.spellings;
			Alert.alert(
				t("reciprocity.mergeTitle"),
				t("reciprocity.mergeBody", { name: first }),
				[
					...rest.slice(0, 3).map((other) => ({
						text: other,
						onPress: async () => {
							try {
								await mergeNames(other, first);
								await open(first);
							} catch (e) {
								console.error("merge failed", e);
							}
						},
					})),
					{ text: t("common.cancel"), style: "cancel" as const },
				],
			);
		},
		[open, t],
	);

	return (
		<PaperBackground>
			<View style={styles.topBar}>
				<AppText variant="h2" weight="bold" color={colors.maroon}>
					{t("reciprocity.title")}
				</AppText>
				<LanguageToggle />
			</View>

			<View style={styles.searchWrap}>
				<MaterialCommunityIcons
					name="magnify"
					size={20}
					color={colors.inkMuted}
				/>
				<TextInput
					value={query}
					onChangeText={(v) => {
						setQuery(v);
						if (selected) setSelected(null);
					}}
					placeholder={t("reciprocity.searchPlaceholder")}
					placeholderTextColor={colors.inkMuted}
					style={styles.searchInput}
					autoCorrect={false}
				/>
				{query.length > 0 && (
					<Pressable
						onPress={() => {
							setQuery("");
							setSelected(null);
						}}
						hitSlop={8}
					>
						<MaterialCommunityIcons
							name="close-circle"
							size={18}
							color={colors.inkMuted}
						/>
					</Pressable>
				)}
			</View>

			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator color={colors.maroon} />
				</View>
			) : selected ? (
				<ScrollView contentContainerStyle={styles.scroll}>
					<ResultHeader result={selected} onMerge={() => promptMerge(selected)} />

					<Section
						titleKey="reciprocity.theyGave"
						side={selected.receivedFromThem}
						lang={i18n.language}
					/>

					<KolamDivider />

					<Section
						titleKey="reciprocity.weGave"
						side={selected.gaveToThem}
						lang={i18n.language}
					/>

					<AppText
						variant="small"
						color={colors.inkMuted}
						align="center"
						style={styles.footnote}
					>
						{t("reciprocity.historyNote")}
					</AppText>
				</ScrollView>
			) : query.trim() ? (
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
				>
					{results.length === 0 ? (
						<AppText
							color={colors.inkMuted}
							align="center"
							style={{ marginTop: spacing.xxl }}
						>
							{t("reciprocity.noMatches")}
						</AppText>
					) : (
						results.map((p) => (
							<Pressable
								key={`${p.name_key}-${p.display_name}`}
								onPress={() => open(p.display_name)}
								style={({ pressed }) => [
									styles.personRow,
									pressed && { opacity: 0.7 },
								]}
							>
								<View style={{ flex: 1 }}>
									<AppText color={colors.ink} style={{ fontSize: 17 }}>
										{p.display_name}
									</AppText>
									<AppText variant="small" color={colors.inkMuted}>
										{t("reciprocity.entryCount", { count: p.entry_count })}
									</AppText>
								</View>
								<MaterialCommunityIcons
									name="chevron-right"
									size={22}
									color={colors.gold}
								/>
							</Pressable>
						))
					)}
				</ScrollView>
			) : (
				<View style={styles.center}>
					<MaterialCommunityIcons
						name="account-search-outline"
						size={64}
						color={colors.gold}
					/>
					<AppText
						color={colors.inkMuted}
						align="center"
						style={{ marginTop: spacing.lg, maxWidth: 280 }}
					>
						{t("reciprocity.emptyHint")}
					</AppText>
				</View>
			)}
		</PaperBackground>
	);
}

function ResultHeader({
	result,
	onMerge,
}: {
	result: ReciprocityResult;
	onMerge: () => void;
}) {
	const { t } = useTranslation();
	return (
		<MangoFrame style={styles.headerCard}>
			<AppText variant="h3" weight="bold" color={colors.maroon} align="center">
				{result.householdName ?? result.query}
			</AppText>
			{result.householdName && (
				<AppText variant="small" color={colors.inkSoft} align="center">
					{t("reciprocity.householdLabel")}
				</AppText>
			)}
			{result.spellings.length > 1 && (
				<Pressable onPress={onMerge} style={styles.mergeBtn} hitSlop={6}>
					<MaterialCommunityIcons
						name="vector-link"
						size={16}
						color={colors.maroon}
					/>
					<AppText
						variant="small"
						weight="bold"
						color={colors.maroon}
						style={{ marginLeft: spacing.xs }}
					>
						{t("reciprocity.mergeAction", {
							count: result.spellings.length,
						})}
					</AppText>
				</Pressable>
			)}
		</MangoFrame>
	);
}

function Section({
	titleKey,
	side,
	lang,
}: {
	titleKey: string;
	side: ReciprocitySide;
	lang: string;
}) {
	const { t } = useTranslation();

	return (
		<View style={styles.section}>
			<AppText variant="label" color={colors.inkSoft} style={styles.sectionTitle}>
				{t(titleKey).toUpperCase()}
			</AppText>

			<View style={styles.totalRow}>
				<AppText variant="h3" weight="bold" color={colors.maroon}>
					₹ {side.total.toLocaleString("en-IN")}
				</AppText>
				<AppText variant="small" color={colors.inkMuted}>
					{t("reciprocity.acrossEntries", { count: side.entries.length })}
				</AppText>
			</View>

			{side.mostRecent && (
				<AppText variant="small" color={colors.inkSoft} style={styles.recent}>
					{t("reciprocity.mostRecent", {
						year: side.mostRecent.year,
						event: side.mostRecent.event_name,
					})}
				</AppText>
			)}

			{side.entries.length === 0 ? (
				<AppText
					variant="small"
					color={colors.inkMuted}
					style={{ marginTop: spacing.sm }}
				>
					{t("reciprocity.noneThisSide")}
				</AppText>
			) : (
				side.entries.map((e) => <EntryRow key={e.gift_id} entry={e} lang={lang} />)
			)}
		</View>
	);
}

function EntryRow({ entry, lang }: { entry: ReciprocityEntry; lang: string }) {
	const { t } = useTranslation();
	const equivalent = presentDayEquivalent(entry.amount, entry.year);

	return (
		<View style={styles.entryRow}>
			<View style={styles.yearBadge}>
				<AppText variant="small" weight="bold" color={colors.inkSoft}>
					{entry.year}
				</AppText>
			</View>

			<View style={{ flex: 1 }}>
				<AppText color={colors.ink} numberOfLines={1}>
					{entry.event_name}
				</AppText>
				<AppText variant="small" color={colors.inkMuted}>
					{formatDate(entry.gift_date, lang)} · {entry.payment_method}
					{entry.given_by ? ` · ${entry.given_by}` : ""}
				</AppText>
			</View>

			<View style={{ alignItems: "flex-end" }}>
				<AppText variant="numeric" weight="bold" color={colors.maroon}>
					₹ {entry.amount.toLocaleString("en-IN")}
				</AppText>
				{/* Approximate present-day equivalent — always labelled, never
				    presented as an exact figure. */}
				{equivalent !== null && (
					<AppText variant="small" color={colors.inkMuted}>
						{t("reciprocity.approxToday", {
							amount: equivalent.toLocaleString("en-IN"),
						})}
					</AppText>
				)}
			</View>
		</View>
	);
}

function formatDate(ts: number, lang: string): string {
	try {
		return new Date(ts).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	} catch {
		return String(new Date(ts).getFullYear());
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
	searchWrap: {
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: spacing.lg,
		backgroundColor: colors.cream,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.divider,
		paddingHorizontal: spacing.md,
		gap: spacing.sm,
	},
	searchInput: {
		flex: 1,
		paddingVertical: spacing.md,
		fontSize: 16,
		color: colors.ink,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 80,
	},
	scroll: {
		padding: spacing.lg,
		paddingBottom: 120,
	},
	headerCard: {
		marginBottom: spacing.lg,
		paddingVertical: spacing.lg,
	},
	mergeBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: spacing.sm,
	},
	section: {
		marginBottom: spacing.sm,
	},
	sectionTitle: {
		letterSpacing: 1,
		marginBottom: spacing.xs,
	},
	totalRow: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
	},
	recent: {
		marginTop: 2,
		marginBottom: spacing.sm,
	},
	personRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.divider,
	},
	entryRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.divider,
		gap: spacing.sm,
	},
	yearBadge: {
		minWidth: 46,
		alignItems: "center",
		paddingVertical: 2,
		paddingHorizontal: spacing.xs,
		borderRadius: radius.sm,
		backgroundColor: colors.ivoryDeep,
		borderWidth: 1,
		borderColor: colors.divider,
	},
	footnote: {
		marginTop: spacing.xl,
		paddingHorizontal: spacing.lg,
	},
});
