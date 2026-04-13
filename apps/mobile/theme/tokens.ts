/**
 * Tamil wedding traditional theme — maroon, gold, ivory
 */
export const colors = {
	maroon: "#8B1A2A",
	maroonDeep: "#6B1220",
	maroonLight: "#A83043",
	gold: "#C9A96E",
	goldDeep: "#A88A4F",
	goldLight: "#E3C997",
	ivory: "#FAF4E8",
	ivoryDeep: "#F0E6D2",
	cream: "#FFF9EC",
	ink: "#2B1810",
	inkSoft: "#5A4437",
	inkMuted: "#8A7565",
	divider: "#D6C7A8",
	danger: "#B3261E",
	success: "#3E7B3E",
} as const;

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	xxxl: 48,
} as const;

export const radius = {
	sm: 4,
	md: 8,
	lg: 12,
	xl: 20,
	pill: 999,
} as const;

export const fonts = {
	// English serif — loaded via @expo-google-fonts/cormorant-garamond
	serif: "CormorantGaramond_500Medium",
	serifBold: "CormorantGaramond_700Bold",
	serifItalic: "CormorantGaramond_500Medium_Italic",

	// Tamil — loaded via @expo-google-fonts/anek-tamil
	tamil: "AnekTamil_400Regular",
	tamilMedium: "AnekTamil_500Medium",
	tamilBold: "AnekTamil_700Bold",

	// System fallback for numbers / body
	body: undefined as string | undefined,
} as const;

export const typography = {
	// Pick font by active language — returned from helper below
	h1: { fontSize: 32, lineHeight: 40 },
	h2: { fontSize: 24, lineHeight: 32 },
	h3: { fontSize: 20, lineHeight: 28 },
	body: { fontSize: 16, lineHeight: 22 },
	small: { fontSize: 13, lineHeight: 18 },
	label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
} as const;

/** Pick heading font by language */
export function headingFont(lang: "en" | "ta"): string {
	return lang === "ta" ? fonts.tamilBold : fonts.serifBold;
}

/** Pick body font by language */
export function bodyFont(lang: "en" | "ta"): string | undefined {
	return lang === "ta" ? fonts.tamil : fonts.serif;
}
