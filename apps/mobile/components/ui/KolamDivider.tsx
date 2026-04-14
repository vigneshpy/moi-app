import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { colors, spacing } from "@/theme/tokens";

/**
 * Decorative kolam-dot divider — a horizontal row of gold dots with a
 * central diamond motif. Pure text, no SVG deps.
 */
export function KolamDivider({ compact = false }: { compact?: boolean }) {
	return (
		<View style={[styles.row, compact && styles.compact]}>
			<View style={styles.line} />
			<Text style={styles.glyph}>✦</Text>
			<Text style={styles.dots}>· · ·</Text>
			<Text style={styles.diamond}>◈</Text>
			<Text style={styles.dots}>· · ·</Text>
			<Text style={styles.glyph}>✦</Text>
			<View style={styles.line} />
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginVertical: spacing.lg,
	},
	compact: {
		marginVertical: spacing.sm,
	},
	line: {
		flex: 1,
		height: 1,
		backgroundColor: colors.divider,
		marginHorizontal: spacing.sm,
	},
	glyph: {
		color: colors.gold,
		fontSize: 14,
		marginHorizontal: 2,
	},
	diamond: {
		color: colors.goldDeep,
		fontSize: 16,
		marginHorizontal: 4,
	},
	dots: {
		color: colors.gold,
		fontSize: 14,
		letterSpacing: 2,
	},
});
