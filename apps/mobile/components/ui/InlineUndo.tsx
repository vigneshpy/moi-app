import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText } from "./AppText";
import { colors, radius, spacing } from "@/theme/tokens";

/**
 * Brief inline confirmation with an undo, shown in place of a dialog.
 *
 * The caller renders this inside a fixed-height slot so it never shifts the
 * form — at a live function the fields must not move under the user's thumb
 * between entries.
 */
export function InlineUndo({
	message,
	onUndo,
	onExpire,
	durationMs = 4000,
}: {
	message: string;
	onUndo: () => void;
	onExpire: () => void;
	durationMs?: number;
}) {
	const { t } = useTranslation();
	const opacity = useRef(new Animated.Value(0)).current;

	// Keep the latest onExpire without restarting the timer on every render.
	const expireRef = useRef(onExpire);
	expireRef.current = onExpire;

	useEffect(() => {
		opacity.setValue(0);
		Animated.timing(opacity, {
			toValue: 1,
			duration: 140,
			useNativeDriver: true,
		}).start();

		const timer = setTimeout(() => expireRef.current(), durationMs);
		return () => clearTimeout(timer);
	}, [message, durationMs, opacity]);

	return (
		<Animated.View style={[styles.strip, { opacity }]}>
			<MaterialCommunityIcons
				name="check-circle-outline"
				size={16}
				color={colors.success}
			/>
			<AppText
				variant="small"
				color={colors.inkSoft}
				numberOfLines={1}
				style={styles.message}
			>
				{message}
			</AppText>
			<Pressable onPress={onUndo} hitSlop={10} style={styles.undoBtn}>
				<AppText variant="small" weight="bold" color={colors.maroon}>
					{t("common.undo")}
				</AppText>
			</Pressable>
		</Animated.View>
	);
}

/**
 * Fixed-height container for the undo strip. Render it always; pass
 * `children` only while there is something to confirm.
 */
export function UndoSlot({ children }: { children?: React.ReactNode }) {
	return <View style={styles.slot}>{children}</View>;
}

const styles = StyleSheet.create({
	slot: {
		height: 34,
		justifyContent: "center",
	},
	strip: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.ivoryDeep,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.divider,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.md,
		gap: spacing.xs,
	},
	message: {
		flex: 1,
	},
	undoBtn: {
		paddingHorizontal: spacing.sm,
	},
});
