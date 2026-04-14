import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useTranslation } from "react-i18next";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/theme/tokens";

import { getDb } from "@/db";
import { useEventsStore } from "@/store/eventsStore";

export default function SettingsScreen() {
	const { t } = useTranslation();
	const refresh = useEventsStore((s) => s.refresh);

	const handleClearAll = () => {
		Alert.alert(t("settings.clearData"), t("settings.clearConfirm"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("settings.clearConfirmYes"),
				style: "destructive",
				onPress: async () => {
					const db = await getDb();
					// CASCADE takes care of gifts; drop events and start fresh.
					await db.execAsync("DELETE FROM events;");
					await refresh();
				},
			},
		]);
	};

	return (
		<PaperBackground>
			<ScrollView contentContainerStyle={styles.scroll}>
				<AppText
					variant="h2"
					weight="bold"
					color={colors.maroon}
					style={{ marginTop: spacing.xl }}
				>
					{t("settings.title")}
				</AppText>

				<MangoFrame style={styles.card}>
					<AppText
						variant="label"
						color={colors.inkSoft}
						style={{ marginBottom: spacing.sm, letterSpacing: 1 }}
					>
						{t("settings.language").toUpperCase()}
					</AppText>
					<LanguageToggle />

					<KolamDivider />

					<AppText
						variant="label"
						color={colors.inkSoft}
						style={{ marginBottom: spacing.sm, letterSpacing: 1 }}
					>
						{t("settings.about").toUpperCase()}
					</AppText>
					<AppText color={colors.inkSoft} style={{ lineHeight: 22 }}>
						{t("settings.aboutBody")}
					</AppText>
				</MangoFrame>

				<View style={{ marginTop: spacing.xl }}>
					<MaroonButton
						label={t("settings.clearData")}
						variant="outline"
						onPress={handleClearAll}
					/>
				</View>
			</ScrollView>
		</PaperBackground>
	);
}

const styles = StyleSheet.create({
	scroll: {
		padding: spacing.lg,
		paddingBottom: spacing.xxxl,
	},
	card: {
		marginTop: spacing.lg,
	},
});
