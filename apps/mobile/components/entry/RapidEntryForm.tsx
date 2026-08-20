import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	View,
	StyleSheet,
	TextInput,
	Pressable,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { InlineUndo, UndoSlot } from "@/components/ui/InlineUndo";
import { useGiftsStore } from "@/store/giftsStore";
import { suggestNames, type GiftRow, type NameSuggestion } from "@/db/gifts";
import type { Direction } from "@/db/events";
import { colors, radius, spacing } from "@/theme/tokens";

/** Common moi amounts — the ones that cover most entries at a function. */
const QUICK_AMOUNTS = [101, 501, 1001, 2001, 5001];

interface Props {
	eventId: string;
	direction: Direction;
	/** Set in notebook mode so entries are tied to the page they came from. */
	pageId?: string | null;
	/** Called after a successful save, e.g. to bump a per-page counter. */
	onSaved?: (row: GiftRow) => void;
	/** Called after an undo removes the last saved row. */
	onUndone?: (row: GiftRow) => void;
}

/**
 * The rapid entry form: name with autocomplete, amount with quick-tap values,
 * save, and an inline undo. No dialogs, no scrolling, and focus returns to the
 * name field after every save so the queue keeps moving.
 *
 * Shared by the fast-entry screen and the notebook split-screen so the two
 * can't drift apart.
 */
export function RapidEntryForm({
	eventId,
	direction,
	pageId = null,
	onSaved,
	onUndone,
}: Props) {
	const { t } = useTranslation();
	const addGift = useGiftsStore((s) => s.add);
	const removeGift = useGiftsStore((s) => s.remove);

	const nameRef = useRef<TextInput>(null);
	const amountRef = useRef<TextInput>(null);

	const [name, setName] = useState("");
	const [amount, setAmount] = useState("");
	const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);
	const [lastSaved, setLastSaved] = useState<GiftRow | null>(null);

	// A suggestion the user just tapped shouldn't immediately re-query and
	// re-open the list underneath them.
	const skipNextLookup = useRef(false);

	useEffect(() => {
		if (skipNextLookup.current) {
			skipNextLookup.current = false;
			setSuggestions([]);
			return;
		}
		const q = name.trim();
		if (q.length < 1) {
			setSuggestions([]);
			return;
		}
		let cancelled = false;
		const handle = setTimeout(async () => {
			try {
				const rows = await suggestNames(q);
				if (!cancelled) setSuggestions(rows);
			} catch (e) {
				console.error("name suggest failed", e);
			}
		}, 120);
		return () => {
			cancelled = true;
			clearTimeout(handle);
		};
	}, [name]);

	const pickSuggestion = (s: NameSuggestion) => {
		skipNextLookup.current = true;
		setName(s.recipient_name);
		setSuggestions([]);
		// Straight to the amount — the keyboard never drops, it just switches
		// to the number pad.
		amountRef.current?.focus();
	};

	const handleSave = useCallback(async () => {
		const trimmed = name.trim();
		const amt = Number(amount.replace(/[^\d.]/g, ""));
		if (!trimmed || !amt || amt <= 0) {
			setErr(t("ledger.requiredFields"));
			return;
		}
		try {
			setSaving(true);
			setErr(null);
			const row = await addGift({
				event_id: eventId,
				recipient_name: trimmed,
				amount: amt,
				page_id: pageId,
			});
			setName("");
			setAmount("");
			setSuggestions([]);
			setLastSaved(row);
			onSaved?.(row);
			// Back to the top of the form for the next person in the queue.
			requestAnimationFrame(() => nameRef.current?.focus());
		} catch (e: unknown) {
			console.error("fast entry save failed", e);
			setErr((e as Error)?.message || t("common.error"));
		} finally {
			setSaving(false);
		}
	}, [name, amount, eventId, pageId, addGift, onSaved, t]);

	const handleUndo = useCallback(async () => {
		const row = lastSaved;
		if (!row) return;
		setLastSaved(null);
		try {
			await removeGift(row.id, row.event_id);
			onUndone?.(row);
			// Put the entry back in the fields so a mistyped one can be fixed
			// rather than retyped from scratch.
			skipNextLookup.current = true;
			setName(row.recipient_name);
			setAmount(String(row.amount));
			nameRef.current?.focus();
		} catch (e) {
			console.error("undo failed", e);
		}
	}, [lastSaved, removeGift, onUndone]);

	const nameLabel =
		direction === "ATTENDED"
			? t("fastEntry.nameGiven")
			: t("fastEntry.nameReceived");

	return (
		<View style={styles.root}>
			<AppText variant="label" color={colors.inkSoft} style={styles.label}>
				{nameLabel.toUpperCase()}
			</AppText>
			<TextInput
				ref={nameRef}
				value={name}
				onChangeText={(v) => {
					setName(v);
					if (err) setErr(null);
				}}
				placeholder={t("ledger.namePlaceholder")}
				placeholderTextColor={colors.inkMuted}
				style={styles.nameInput}
				autoFocus
				autoCorrect={false}
				autoCapitalize="words"
				returnKeyType="next"
				// Keeps the keyboard up while focus moves to the amount.
				blurOnSubmit={false}
				onSubmitEditing={() => amountRef.current?.focus()}
			/>

			{/* Autocomplete across every function, most recent first. Horizontal
			    so it never pushes the amount field off-screen. */}
			<View style={styles.suggestionSlot}>
				{suggestions.length > 0 && (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						keyboardShouldPersistTaps="always"
						contentContainerStyle={styles.suggestionRow}
					>
						{suggestions.map((s) => (
							<Pressable
								key={s.recipient_name}
								onPress={() => pickSuggestion(s)}
								style={styles.suggestionChip}
							>
								<AppText variant="small" color={colors.maroon} numberOfLines={1}>
									{s.recipient_name}
								</AppText>
							</Pressable>
						))}
					</ScrollView>
				)}
			</View>

			<AppText variant="label" color={colors.inkSoft} style={styles.label}>
				{t("ledger.amountPlaceholder").toUpperCase()}
			</AppText>
			<View style={styles.amountRow}>
				<AppText variant="h2" weight="bold" color={colors.maroon}>
					₹
				</AppText>
				<TextInput
					ref={amountRef}
					value={amount}
					onChangeText={(v) => {
						setAmount(v.replace(/[^\d]/g, ""));
						if (err) setErr(null);
					}}
					placeholder="0"
					placeholderTextColor={colors.inkMuted}
					style={styles.amountInput}
					// Number pad rather than an in-app grid: focus moves between two
					// real inputs, so the keyboard stays up for the whole entry.
					keyboardType="number-pad"
					returnKeyType="done"
					onSubmitEditing={handleSave}
				/>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				keyboardShouldPersistTaps="always"
				contentContainerStyle={styles.quickRow}
			>
				{QUICK_AMOUNTS.map((v) => (
					<Pressable
						key={v}
						onPress={() => {
							setAmount(String(v));
							if (err) setErr(null);
						}}
						style={[
							styles.quickChip,
							amount === String(v) && styles.quickChipActive,
						]}
					>
						<AppText
							variant="small"
							weight={amount === String(v) ? "bold" : "regular"}
							color={amount === String(v) ? colors.gold : colors.maroon}
						>
							{v.toLocaleString("en-IN")}
						</AppText>
					</Pressable>
				))}
			</ScrollView>

			<Pressable
				onPress={handleSave}
				disabled={saving}
				style={({ pressed }) => [
					styles.saveBtn,
					pressed && styles.savePressed,
					saving && styles.saveDisabled,
				]}
			>
				{saving ? (
					<ActivityIndicator color={colors.gold} />
				) : (
					<AppText weight="bold" color={colors.gold} style={styles.saveLabel}>
						{t("fastEntry.saveNext")}
					</AppText>
				)}
			</Pressable>

			{/* Fixed-height slot: the confirmation appearing must not move the
			    fields under the user's thumb. */}
			<UndoSlot>
				{err ? (
					<AppText variant="small" color={colors.danger} align="center">
						{err}
					</AppText>
				) : lastSaved ? (
					<InlineUndo
						message={t("fastEntry.savedConfirm", {
							name: lastSaved.recipient_name,
							amount: lastSaved.amount.toLocaleString("en-IN"),
						})}
						onUndo={handleUndo}
						onExpire={() => setLastSaved(null)}
					/>
				) : null}
			</UndoSlot>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingHorizontal: spacing.lg,
	},
	label: {
		marginTop: spacing.sm,
		marginBottom: 2,
	},
	nameInput: {
		borderBottomWidth: 1.5,
		borderColor: colors.divider,
		paddingVertical: spacing.sm,
		fontSize: 20,
		color: colors.ink,
	},
	suggestionSlot: {
		height: 38,
		justifyContent: "center",
	},
	suggestionRow: {
		gap: spacing.sm,
		paddingVertical: spacing.xs,
	},
	suggestionChip: {
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.gold,
		backgroundColor: colors.cream,
		maxWidth: 200,
	},
	amountRow: {
		flexDirection: "row",
		alignItems: "center",
		borderBottomWidth: 1.5,
		borderColor: colors.divider,
		gap: spacing.sm,
	},
	amountInput: {
		flex: 1,
		paddingVertical: spacing.sm,
		fontSize: 26,
		color: colors.ink,
		fontVariant: ["tabular-nums"],
	},
	quickRow: {
		gap: spacing.sm,
		paddingVertical: spacing.sm,
	},
	quickChip: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		borderRadius: radius.pill,
		borderWidth: 1.2,
		borderColor: colors.maroon,
	},
	quickChipActive: {
		backgroundColor: colors.maroon,
	},
	saveBtn: {
		borderRadius: radius.pill,
		backgroundColor: colors.maroon,
		borderWidth: 1,
		borderColor: colors.goldDeep,
		paddingVertical: spacing.md,
		alignItems: "center",
		justifyContent: "center",
		marginTop: spacing.xs,
	},
	savePressed: {
		opacity: 0.85,
	},
	saveDisabled: {
		opacity: 0.6,
	},
	saveLabel: {
		fontSize: 17,
		letterSpacing: 0.3,
	},
});
