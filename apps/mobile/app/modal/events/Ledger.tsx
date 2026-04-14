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
	ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";

import { getEvent, type EventWithTotals } from "@/db/events";
import { useGiftsStore } from "@/store/giftsStore";
import type { GiftRow as DbGiftRow, PaymentMethod } from "@/db/gifts";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AppText } from "@/components/ui/AppText";
import { colors, radius, spacing } from "@/theme/tokens";

const EMPTY_GIFTS: import("@/db/gifts").GiftRow[] = [];

export default function LedgerScreen() {
	const { eventId } = useLocalSearchParams<{ eventId: string }>();
	const { t, i18n } = useTranslation();

	const gifts = useGiftsStore((s) =>
		eventId ? s.byEvent[eventId] ?? EMPTY_GIFTS : EMPTY_GIFTS,
	);
	const loadFor = useGiftsStore((s) => s.loadFor);

	const [event, setEvent] = useState<EventWithTotals | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAdd, setShowAdd] = useState(false);

	const total = useMemo(
		() => gifts.reduce((sum, g) => sum + (g.amount || 0), 0),
		[gifts],
	);

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

	return (
		<PaperBackground>
			<ScrollView contentContainerStyle={styles.scroll}>
				<View style={styles.topBar}>
					<Pressable onPress={() => router.back()} hitSlop={12}>
						<AppText color={colors.maroon} weight="bold">
							← {t("common.back")}
						</AppText>
					</Pressable>
					<LanguageToggle />
				</View>

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
					<>
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

						{gifts.length === 0 ? (
							<View style={styles.empty}>
								<AppText
									color={colors.inkMuted}
									align="center"
									variant="body"
								>
									{t("common.empty")}
								</AppText>
								<AppText
									color={colors.inkMuted}
									align="center"
									variant="small"
									style={{ marginTop: spacing.xs }}
								>
									{t("ledger.emptyHint")}
								</AppText>
							</View>
						) : (
							<FlatList
								data={gifts}
								scrollEnabled={false}
								keyExtractor={(g) => g.id}
								ItemSeparatorComponent={() => <View style={styles.sep} />}
								renderItem={({ item }) => <GiftItemRow gift={item} />}
							/>
						)}
					</>
				)}
			</ScrollView>

			<View style={styles.fab}>
				<MaroonButton
					label={t("ledger.addEntry")}
					onPress={() => setShowAdd(true)}
				/>
			</View>

			<AddEntryModal
				visible={showAdd}
				eventId={eventId || ""}
				onClose={() => setShowAdd(false)}
			/>
		</PaperBackground>
	);
}

function GiftItemRow({ gift }: { gift: DbGiftRow }) {
	return (
		<View style={styles.row}>
			<View style={{ flex: 1 }}>
				<AppText color={colors.ink} style={{ fontSize: 17 }}>
					{gift.recipient_name}
					{gift.partner_name ? ` & ${gift.partner_name}` : ""}
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
		</View>
	);
}

function AddEntryModal({
	visible,
	eventId,
	onClose,
}: {
	visible: boolean;
	eventId: string;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const addGift = useGiftsStore((s) => s.add);

	const [name, setName] = useState("");
	const [partner, setPartner] = useState("");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [method, setMethod] = useState<PaymentMethod>("Cash");
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const reset = () => {
		setName("");
		setPartner("");
		setAmount("");
		setNote("");
		setMethod("Cash");
		setErr(null);
	};

	const handleSave = async () => {
		const amt = Number(amount.replace(/[^\d.]/g, ""));
		if (!name.trim() || !amt || amt <= 0) {
			setErr(t("ledger.requiredFields"));
			return;
		}
		try {
			setSaving(true);
			setErr(null);
			await addGift({
				event_id: eventId,
				recipient_name: name.trim(),
				partner_name: partner.trim() || null,
				amount: amt,
				payment_method: method,
				note: note.trim() || null,
			});
			reset();
			onClose();
		} catch (e: any) {
			console.error("add gift failed", e);
			setErr(e?.message || t("common.error"));
		} finally {
			setSaving(false);
		}
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
					<AppText
						variant="h3"
						weight="bold"
						color={colors.maroon}
						align="center"
					>
						{t("ledger.addTitle")}
					</AppText>
					<KolamDivider compact />

					<Input
						placeholder={t("ledger.namePlaceholder")}
						value={name}
						onChangeText={setName}
						autoFocus
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
		left: spacing.xl,
		right: spacing.xl,
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
	modalActions: {
		flexDirection: "row",
		marginTop: spacing.xl,
	},
});
