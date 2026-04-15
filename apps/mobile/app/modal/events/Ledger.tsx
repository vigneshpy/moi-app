import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	View,
	StyleSheet,
	FlatList,
	Modal,
	TextInput,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
	ToastAndroid,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getEvent, type EventWithTotals } from "@/db/events";
import { useGiftsStore } from "@/store/giftsStore";
import type { GiftRow as DbGiftRow, PaymentMethod } from "@/db/gifts";
import { exportCSV, exportPDF } from "@/db/export";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AppText } from "@/components/ui/AppText";
import { colors, radius, spacing } from "@/theme/tokens";

const EMPTY_GIFTS: import("@/db/gifts").GiftRow[] = [];
const PAGE_SIZE = 20;

type FilterKey = "all" | "Cash" | "UPI";
type SortKey = "newest" | "oldest" | "amt_desc" | "amt_asc" | "name";

export default function LedgerScreen() {
	const { eventId, openAdd } = useLocalSearchParams<{
		eventId: string;
		openAdd?: string;
	}>();
	const { t, i18n } = useTranslation();

	const gifts = useGiftsStore((s) =>
		eventId ? s.byEvent[eventId] ?? EMPTY_GIFTS : EMPTY_GIFTS,
	);
	const loadFor = useGiftsStore((s) => s.loadFor);

	const [event, setEvent] = useState<EventWithTotals | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAdd, setShowAdd] = useState(false);
	const [editing, setEditing] = useState<DbGiftRow | null>(null);

	// Search / filter / sort / pagination state
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<FilterKey>("all");
	const [sort, setSort] = useState<SortKey>("newest");
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

	// If the screen was opened with ?openAdd=1 (from Home Quick Add), pop the
	// entry modal once the event is loaded.
	useEffect(() => {
		if (openAdd === "1" && event && !showAdd && !editing) {
			setShowAdd(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openAdd, event]);

	const total = useMemo(
		() => gifts.reduce((sum, g) => sum + (g.amount || 0), 0),
		[gifts],
	);

	// Apply search + filter + sort on top of the in-memory list.
	const filteredSorted = useMemo(() => {
		const q = query.trim().toLowerCase();
		let out = gifts;
		if (filter !== "all") {
			out = out.filter((g) => g.payment_method === filter);
		}
		if (q) {
			out = out.filter(
				(g) =>
					g.recipient_name.toLowerCase().includes(q) ||
					(g.partner_name ?? "").toLowerCase().includes(q) ||
					(g.note ?? "").toLowerCase().includes(q),
			);
		}
		// Sort (create a shallow copy before mutating).
		out = [...out];
		switch (sort) {
			case "oldest":
				out.sort((a, b) => a.gift_date - b.gift_date);
				break;
			case "amt_desc":
				out.sort((a, b) => b.amount - a.amount);
				break;
			case "amt_asc":
				out.sort((a, b) => a.amount - b.amount);
				break;
			case "name":
				out.sort((a, b) =>
					a.recipient_name.localeCompare(b.recipient_name, undefined, {
						sensitivity: "base",
					}),
				);
				break;
			case "newest":
			default:
				out.sort((a, b) => b.gift_date - a.gift_date);
				break;
		}
		return out;
	}, [gifts, query, filter, sort]);

	const paged = useMemo(
		() => filteredSorted.slice(0, visibleCount),
		[filteredSorted, visibleCount],
	);

	// Reset pagination when filters / search / sort change.
	useEffect(() => {
		setVisibleCount(PAGE_SIZE);
	}, [query, filter, sort]);

	const load = useCallback(async () => {
		if (!eventId) return;
		try {
			setLoading(true);
			setError(null);
			const [e] = await Promise.all([
				getEvent(eventId),
				loadFor(eventId),
			]);
			setEvent(e);
		} catch (e) {
			console.error("ledger load failed", e);
			setError(t("common.error"));
		} finally {
			setLoading(false);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps -- `t` intentionally
	// excluded: it produces a new ref every render and is only used for the
	// error string, not for the data-fetching logic.
	}, [eventId, loadFor]);

	useEffect(() => {
		load();
	}, [load]);

	const openSort = () => {
		Alert.alert(t("ledger.sortTitle"), undefined, [
			{ text: t("ledger.sortNewest"), onPress: () => setSort("newest") },
			{ text: t("ledger.sortOldest"), onPress: () => setSort("oldest") },
			{ text: t("ledger.sortAmountDesc"), onPress: () => setSort("amt_desc") },
			{ text: t("ledger.sortAmountAsc"), onPress: () => setSort("amt_asc") },
			{ text: t("ledger.sortName"), onPress: () => setSort("name") },
			{ text: t("common.cancel"), style: "cancel" },
		]);
	};

	const sortLabel: Record<SortKey, string> = {
		newest: t("ledger.sortNewest"),
		oldest: t("ledger.sortOldest"),
		amt_desc: t("ledger.sortAmountDesc"),
		amt_asc: t("ledger.sortAmountAsc"),
		name: t("ledger.sortName"),
	};

	const header = (
		<>
			<View style={styles.topBar}>
				<Pressable onPress={() => router.back()} hitSlop={12}>
					<AppText color={colors.maroon} weight="bold">
						← {t("common.back")}
					</AppText>
				</Pressable>
				<View style={styles.topActions}>
					{event && gifts.length > 0 && (
						<Pressable
							onPress={() => {
								Alert.alert(t("ledger.export"), t("ledger.exportChoose"), [
									{
										text: "CSV",
										onPress: () =>
											exportCSV(event, gifts).catch((e) =>
												console.error("csv export failed", e),
											),
									},
									{
										text: "PDF",
										onPress: () =>
											exportPDF(event, gifts).catch((e) =>
												console.error("pdf export failed", e),
											),
									},
									{ text: t("common.cancel"), style: "cancel" },
								]);
							}}
							hitSlop={10}
							style={styles.exportBtn}
						>
							<MaterialCommunityIcons
								name="export-variant"
								size={22}
								color={colors.maroon}
							/>
						</Pressable>
					)}
					<LanguageToggle />
				</View>
			</View>

			<MangoFrame style={styles.cover}>
				<AppText
					variant="h2"
					weight="bold"
					color={colors.maroon}
					align="center"
				>
					{event?.event_name || t("ledger.title")}
				</AppText>
				{!!event?.event_date && (
					<AppText
						variant="small"
						color={colors.inkSoft}
						align="center"
						style={{ marginTop: 4 }}
					>
						{formatDate(event.event_date, i18n.language)}
						{event?.location ? `  ·  ${event.location}` : ""}
					</AppText>
				)}

				<KolamDivider />

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
							₹ {total.toLocaleString("en-IN")}
						</AppText>
						<AppText
							variant="small"
							color={colors.goldLight}
							align="center"
							style={{ marginTop: 2 }}
						>
							{gifts.length}{" "}
							{i18n.language === "ta"
								? t("ledger.people")
								: t("ledger.entries")}
						</AppText>
					</View>
				</View>
			</MangoFrame>

			<KolamDivider compact />

			{gifts.length > 0 && (
				<View style={styles.controls}>
					<View style={styles.searchWrap}>
						<MaterialCommunityIcons
							name="magnify"
							size={20}
							color={colors.inkMuted}
						/>
						<TextInput
							placeholder={t("ledger.searchPlaceholder")}
							placeholderTextColor={colors.inkMuted}
							value={query}
							onChangeText={setQuery}
							style={styles.searchInput}
						/>
						{query.length > 0 && (
							<Pressable onPress={() => setQuery("")} hitSlop={8}>
								<MaterialCommunityIcons
									name="close-circle"
									size={18}
									color={colors.inkMuted}
								/>
							</Pressable>
						)}
					</View>

					<View style={styles.filterRow}>
						<FilterPill
							active={filter === "all"}
							label={t("ledger.filterAll")}
							onPress={() => setFilter("all")}
						/>
						<FilterPill
							active={filter === "Cash"}
							label={t("ledger.paymentCash")}
							onPress={() => setFilter("Cash")}
						/>
						<FilterPill
							active={filter === "UPI"}
							label={t("ledger.paymentUpi")}
							onPress={() => setFilter("UPI")}
						/>
						<Pressable onPress={openSort} style={styles.sortBtn} hitSlop={6}>
							<MaterialCommunityIcons
								name="sort"
								size={16}
								color={colors.maroon}
							/>
							<AppText
								variant="small"
								color={colors.maroon}
								weight="bold"
								style={{ marginLeft: 4 }}
							>
								{sortLabel[sort]}
							</AppText>
						</Pressable>
					</View>
				</View>
			)}
		</>
	);

	const emptyComponent = (
		<View style={styles.empty}>
			<AppText color={colors.inkMuted} align="center" variant="body">
				{gifts.length === 0
					? t("common.empty")
					: t("ledger.noMatches")}
			</AppText>
			{gifts.length === 0 && (
				<AppText
					color={colors.inkMuted}
					align="center"
					variant="small"
					style={{ marginTop: spacing.xs }}
				>
					{t("ledger.emptyHint")}
				</AppText>
			)}
		</View>
	);

	return (
		<PaperBackground>
			{loading && !event ? (
				<View style={styles.center}>
					<ActivityIndicator color={colors.maroon} />
				</View>
			) : error ? (
				<View style={styles.center}>
					<AppText color={colors.danger}>{error}</AppText>
					<MaroonButton
						label={t("common.retry")}
						onPress={load}
						variant="outline"
						style={{ marginTop: spacing.md }}
					/>
				</View>
			) : (
				<FlatList
					data={paged}
					keyExtractor={(g) => g.id}
					contentContainerStyle={styles.scroll}
					ListHeaderComponent={header}
					ListEmptyComponent={emptyComponent}
					ItemSeparatorComponent={() => <View style={styles.sep} />}
					renderItem={({ item }) => (
						<GiftItemRow gift={item} onPress={() => setEditing(item)} />
					)}
					onEndReached={() => {
						if (visibleCount < filteredSorted.length) {
							setVisibleCount((c) => c + PAGE_SIZE);
						}
					}}
					onEndReachedThreshold={0.4}
					initialNumToRender={PAGE_SIZE}
					windowSize={7}
					removeClippedSubviews
				/>
			)}

			<Pressable
				style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
				onPress={() => setShowAdd(true)}
				accessibilityLabel={t("ledger.addEntry")}
				hitSlop={8}
			>
				<MaterialCommunityIcons name="plus" size={32} color={colors.gold} />
			</Pressable>

			<EntryModal
				mode="add"
				visible={showAdd}
				eventId={eventId || ""}
				onClose={() => setShowAdd(false)}
			/>

			<EntryModal
				mode="edit"
				visible={!!editing}
				eventId={eventId || ""}
				existing={editing}
				onClose={() => setEditing(null)}
			/>
		</PaperBackground>
	);
}

function GiftItemRow({
	gift,
	onPress,
}: {
	gift: DbGiftRow;
	onPress?: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
		>
			<View style={{ flex: 1 }}>
				<AppText color={colors.ink} style={{ fontSize: 17 }}>
					{gift.recipient_name}
					{gift.partner_name ? ` - ${gift.partner_name}` : ""}
				</AppText>
				{!!gift.note && (
					<AppText
						variant="small"
						color={colors.inkMuted}
						style={{ marginTop: 2 }}
					>
						{gift.note}
					</AppText>
				)}
			</View>
			<View style={{ alignItems: "flex-end" }}>
				<AppText
					variant="numeric"
					color={colors.maroon}
					weight="bold"
					style={{ fontSize: 18 }}
				>
					₹ {gift.amount.toLocaleString("en-IN")}
				</AppText>
				<AppText variant="label" color={colors.inkMuted}>
					{gift.payment_method}
				</AppText>
			</View>
		</Pressable>
	);
}

function EntryModal({
	mode,
	visible,
	eventId,
	existing,
	onClose,
}: {
	mode: "add" | "edit";
	visible: boolean;
	eventId: string;
	existing?: DbGiftRow | null;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const addGift = useGiftsStore((s) => s.add);
	const updateEntry = useGiftsStore((s) => s.update);
	const removeGift = useGiftsStore((s) => s.remove);

	const [name, setName] = useState("");
	const [partner, setPartner] = useState("");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [method, setMethod] = useState<PaymentMethod>("Cash");
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	// Re-hydrate fields when the modal opens (new add → blank; edit → existing).
	useEffect(() => {
		if (!visible) return;
		if (mode === "edit" && existing) {
			setName(existing.recipient_name);
			setPartner(existing.partner_name ?? "");
			setAmount(String(existing.amount));
			setNote(existing.note ?? "");
			setMethod(existing.payment_method);
		} else {
			setName("");
			setPartner("");
			setAmount("");
			setNote("");
			setMethod("Cash");
		}
		setErr(null);
	}, [visible, mode, existing]);

	const handleSave = async () => {
		const amt = Number(amount.replace(/[^\d.]/g, ""));
		if (!name.trim() || !amt || amt <= 0) {
			setErr(t("ledger.requiredFields"));
			return;
		}
		try {
			setSaving(true);
			setErr(null);
			if (mode === "edit" && existing) {
				await updateEntry(existing.id, eventId, {
					recipient_name: name.trim(),
					partner_name: partner.trim() || null,
					amount: amt,
					payment_method: method,
					note: note.trim() || null,
				});
			} else {
				await addGift({
					event_id: eventId,
					recipient_name: name.trim(),
					partner_name: partner.trim() || null,
					amount: amt,
					payment_method: method,
					note: note.trim() || null,
				});
			}
			onClose();
		} catch (e: any) {
			console.error("save gift failed", e);
			setErr(e?.message || t("common.error"));
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = () => {
		if (!existing) return;
		Alert.alert(
			t("ledger.deleteTitle"),
			t("ledger.deleteConfirm"),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: async () => {
						try {
							await removeGift(existing.id, eventId);
							onClose();
							if (Platform.OS === "android") {
								ToastAndroid.show(
									t("ledger.deletedToast"),
									ToastAndroid.SHORT,
								);
							}
						} catch (e) {
							console.error("delete gift failed", e);
						}
					},
				},
			],
		);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.modalBackdrop}
			>
				<Pressable style={styles.modalDismiss} onPress={onClose} />
				<View style={styles.modalCard}>
					<View style={styles.modalHeader}>
						<View style={{ width: 28 }} />
						<AppText
							variant="h3"
							weight="bold"
							color={colors.maroon}
							align="center"
							style={{ flex: 1 }}
						>
							{mode === "edit"
								? t("ledger.editTitle")
								: t("ledger.addTitle")}
						</AppText>
						{mode === "edit" ? (
							<Pressable
								onPress={handleDelete}
								hitSlop={10}
								style={{ width: 28, alignItems: "flex-end" }}
							>
								<MaterialCommunityIcons
									name="trash-can-outline"
									size={22}
									color={colors.danger}
								/>
							</Pressable>
						) : (
							<View style={{ width: 28 }} />
						)}
					</View>
					<KolamDivider compact />

					<Input
						placeholder={t("ledger.namePlaceholder")}
						value={name}
						onChangeText={setName}
						autoFocus={mode === "add"}
					/>
					<Input
						placeholder={t("ledger.partnerPlaceholder")}
						value={partner}
						onChangeText={setPartner}
					/>
					<Input
						placeholder={t("ledger.amountPlaceholder")}
						value={amount}
						onChangeText={setAmount}
						keyboardType="numeric"
					/>
					<Input
						placeholder={t("ledger.notePlaceholder")}
						value={note}
						onChangeText={setNote}
					/>

					<View style={styles.methodRow}>
						<MethodPill
							active={method === "Cash"}
							label={t("ledger.paymentCash")}
							onPress={() => setMethod("Cash")}
						/>
						<MethodPill
							active={method === "UPI"}
							label={t("ledger.paymentUpi")}
							onPress={() => setMethod("UPI")}
						/>
					</View>

					{err && (
						<AppText
							variant="small"
							color={colors.danger}
							align="center"
							style={{ marginTop: spacing.sm }}
						>
							{err}
						</AppText>
					)}

					<View style={styles.modalActions}>
						<MaroonButton
							label={t("common.cancel")}
							variant="outline"
							onPress={onClose}
							style={{ flex: 1, marginRight: spacing.sm }}
						/>
						<MaroonButton
							label={t("common.save")}
							onPress={handleSave}
							loading={saving}
							style={{ flex: 1, marginLeft: spacing.sm }}
						/>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

function Input(props: React.ComponentProps<typeof TextInput>) {
	return (
		<TextInput
			{...props}
			placeholderTextColor={colors.inkMuted}
			style={styles.input}
		/>
	);
}

function MethodPill({
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
			style={[styles.methodPill, active && styles.methodPillActive]}
		>
			<AppText
				color={active ? colors.gold : colors.maroon}
				weight={active ? "bold" : "regular"}
				style={{ fontSize: 14 }}
			>
				{label}
			</AppText>
		</Pressable>
	);
}

function FilterPill({
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
			style={[styles.filterPill, active && styles.filterPillActive]}
			hitSlop={4}
		>
			<AppText
				variant="small"
				color={active ? colors.gold : colors.maroon}
				weight={active ? "bold" : "regular"}
			>
				{label}
			</AppText>
		</Pressable>
	);
}

function formatDate(iso: string, lang: string): string {
	try {
		const d = new Date(iso);
		return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	} catch {
		return iso;
	}
}

const styles = StyleSheet.create({
	scroll: {
		padding: spacing.lg,
		paddingBottom: 120,
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.lg,
	},
	topActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	exportBtn: {
		padding: spacing.xs,
	},
	center: {
		marginTop: spacing.xxxl,
		alignItems: "center",
	},
	cover: {
		marginHorizontal: spacing.xs,
		marginTop: spacing.sm,
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
	empty: {
		paddingVertical: spacing.xxxl,
		alignItems: "center",
	},
	sep: {
		height: 1,
		backgroundColor: colors.divider,
		marginVertical: spacing.md,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
	},
	fab: {
		position: "absolute",
		bottom: spacing.xl,
		right: spacing.xl,
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: colors.maroon,
		borderWidth: 1.5,
		borderColor: colors.goldDeep,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.25,
		shadowRadius: 5,
		elevation: 6,
	},
	fabPressed: {
		opacity: 0.85,
		transform: [{ scale: 0.96 }],
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(43, 24, 16, 0.45)",
		justifyContent: "flex-end",
	},
	modalDismiss: {
		flex: 1,
	},
	modalCard: {
		backgroundColor: colors.cream,
		borderTopLeftRadius: radius.xl,
		borderTopRightRadius: radius.xl,
		padding: spacing.xl,
		borderTopWidth: 2,
		borderColor: colors.gold,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
	},
	input: {
		borderBottomWidth: 1,
		borderColor: colors.divider,
		paddingVertical: spacing.md,
		marginTop: spacing.sm,
		fontSize: 16,
		color: colors.ink,
	},
	methodRow: {
		flexDirection: "row",
		marginTop: spacing.lg,
		gap: spacing.sm,
	},
	methodPill: {
		flex: 1,
		paddingVertical: spacing.md,
		alignItems: "center",
		borderRadius: radius.pill,
		borderWidth: 1.5,
		borderColor: colors.maroon,
	},
	methodPillActive: {
		backgroundColor: colors.maroon,
	},
	controls: {
		marginTop: spacing.md,
	},
	searchWrap: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.cream,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.divider,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		gap: spacing.sm,
	},
	searchInput: {
		flex: 1,
		paddingVertical: spacing.sm,
		fontSize: 15,
		color: colors.ink,
	},
	filterRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.sm,
		gap: spacing.sm,
		flexWrap: "wrap",
	},
	filterPill: {
		paddingVertical: 6,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.maroon,
	},
	filterPillActive: {
		backgroundColor: colors.maroon,
	},
	sortBtn: {
		flexDirection: "row",
		alignItems: "center",
		marginLeft: "auto",
		paddingVertical: 4,
		paddingHorizontal: spacing.sm,
	},
	modalActions: {
		flexDirection: "row",
		marginTop: spacing.xl,
	},
});
