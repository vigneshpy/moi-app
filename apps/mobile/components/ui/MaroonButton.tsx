import React from "react";
import {
	Pressable,
	StyleSheet,
	ActivityIndicator,
	ViewStyle,
	View,
} from "react-native";
import { AppText } from "./AppText";
import { colors, radius, spacing } from "@/theme/tokens";

interface Props {
	label: string;
	onPress?: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: "filled" | "outline";
	style?: ViewStyle;
}

export function MaroonButton({
	label,
	onPress,
	loading,
	disabled,
	variant = "filled",
	style,
}: Props) {
	const isOutline = variant === "outline";
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || loading}
			style={({ pressed }) => [
				styles.base,
				isOutline ? styles.outline : styles.filled,
				pressed && !disabled && styles.pressed,
				disabled && styles.disabled,
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator color={isOutline ? colors.maroon : colors.gold} />
			) : (
				<View style={styles.row}>
					<AppText
						weight="bold"
						color={isOutline ? colors.maroon : colors.gold}
						style={styles.label}
					>
						{label}
					</AppText>
				</View>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		borderRadius: radius.pill,
		paddingVertical: spacing.md + 2,
		paddingHorizontal: spacing.xl,
		alignItems: "center",
		justifyContent: "center",
	},
	filled: {
		backgroundColor: colors.maroon,
		borderWidth: 1,
		borderColor: colors.goldDeep,
	},
	outline: {
		backgroundColor: "transparent",
		borderWidth: 1.5,
		borderColor: colors.maroon,
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		opacity: 0.5,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
	},
	label: {
		fontSize: 16,
		letterSpacing: 0.3,
	},
});
