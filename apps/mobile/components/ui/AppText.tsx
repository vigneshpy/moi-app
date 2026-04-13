import React from "react";
import { Text, TextProps, TextStyle, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { bodyFont, headingFont, colors } from "@/theme/tokens";

type Variant = "h1" | "h2" | "h3" | "body" | "small" | "label" | "numeric";

interface Props extends TextProps {
	variant?: Variant;
	weight?: "regular" | "bold";
	color?: string;
	align?: "left" | "center" | "right";
}

const variants: Record<Variant, TextStyle> = {
	h1: { fontSize: 34, lineHeight: 42 },
	h2: { fontSize: 26, lineHeight: 34 },
	h3: { fontSize: 20, lineHeight: 28 },
	body: { fontSize: 16, lineHeight: 22 },
	small: { fontSize: 13, lineHeight: 18 },
	label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
	numeric: { fontSize: 18, lineHeight: 22, fontVariant: ["tabular-nums"] },
};

export function AppText({
	variant = "body",
	weight = "regular",
	color = colors.ink,
	align,
	style,
	children,
	...rest
}: Props) {
	const { i18n } = useTranslation();
	const lang = (i18n.language === "ta" ? "ta" : "en") as "en" | "ta";
	const isHeading =
		variant === "h1" || variant === "h2" || variant === "h3" || weight === "bold";
	const family = variant === "numeric"
		? undefined
		: isHeading
		? headingFont(lang)
		: bodyFont(lang);

	return (
		<Text
			{...rest}
			style={[
				variants[variant],
				{ fontFamily: family, color, textAlign: align },
				style,
			]}
		>
			{children}
		</Text>
	);
}

export const textStyles = StyleSheet.create({ // eslint-disable-line
});
