import React from "react";
import { View, StyleSheet, ViewProps, Text } from "react-native";
import { colors, radius, spacing } from "@/theme/tokens";

/**
 * Card wrapper with gold border + mango-paisley motif at the four corners.
 * Uses ❀ as a simple mango/flower stand-in (no SVG dep).
 */
export function MangoFrame({ style, children, ...rest }: ViewProps) {
	return (
		<View style={[styles.frame, style]} {...rest}>
			<Text style={[styles.corner, styles.tl]}>❀</Text>
			<Text style={[styles.corner, styles.tr]}>❀</Text>
			<Text style={[styles.corner, styles.bl]}>❀</Text>
			<Text style={[styles.corner, styles.br]}>❀</Text>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	frame: {
		borderWidth: 1.5,
		borderColor: colors.gold,
		borderRadius: radius.lg,
		backgroundColor: colors.cream,
		padding: spacing.xl,
		position: "relative",
	},
	corner: {
		position: "absolute",
		color: colors.goldDeep,
		fontSize: 16,
	},
	tl: { top: -10, left: 12, backgroundColor: colors.cream, paddingHorizontal: 4 },
	tr: { top: -10, right: 12, backgroundColor: colors.cream, paddingHorizontal: 4 },
	bl: { bottom: -10, left: 12, backgroundColor: colors.cream, paddingHorizontal: 4 },
	br: { bottom: -10, right: 12, backgroundColor: colors.cream, paddingHorizontal: 4 },
});
