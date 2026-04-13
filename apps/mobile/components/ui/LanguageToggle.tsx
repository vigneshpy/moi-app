import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "./AppText";
import { setLanguage, type Language } from "@/i18n";
import { colors, radius, spacing } from "@/theme/tokens";

export function LanguageToggle() {
	const { i18n } = useTranslation();
	const current = (i18n.language === "ta" ? "ta" : "en") as Language;

	const pick = (lang: Language) => {
		if (lang !== current) setLanguage(lang);
	};

	return (
		<View style={styles.row}>
			<Pill active={current === "en"} label="EN" onPress={() => pick("en")} />
			<Pill active={current === "ta"} label="தமிழ்" onPress={() => pick("ta")} />
		</View>
	);
}

function Pill({
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
			style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
		>
			<AppText
				weight={active ? "bold" : "regular"}
				color={active ? colors.gold : colors.maroon}
				style={{ fontSize: 13 }}
			>
				{label}
			</AppText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.gold,
		overflow: "hidden",
		alignSelf: "flex-start",
	},
	pill: {
		paddingVertical: spacing.xs + 2,
		paddingHorizontal: spacing.md,
		minWidth: 58,
		alignItems: "center",
	},
	pillActive: {
		backgroundColor: colors.maroon,
	},
	pillIdle: {
		backgroundColor: "transparent",
	},
});
