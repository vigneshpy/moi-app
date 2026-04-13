import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { colors } from "@/theme/tokens";

/** Ivory page background with a subtle warm gradient feel via layered Views. */
export function PaperBackground({ style, children, ...rest }: ViewProps) {
	return (
		<View style={[styles.root, style]} {...rest}>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: colors.ivory,
	},
});
