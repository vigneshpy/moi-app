import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { PaperBackground } from "@/components/ui/PaperBackground";
import { MangoFrame } from "@/components/ui/MangoFrame";
import { KolamDivider } from "@/components/ui/KolamDivider";
import { MaroonButton } from "@/components/ui/MaroonButton";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/theme/tokens";

import { getDb } from "@/db";
import {
	exportBackup,
	parseBackup,
	summarise,
	importBackup,
	BackupError,
	type ImportMode,
} from "@/db/backup";
import { cleanupOrphanedMedia } from "@/db/notebook";
import { useEventsStore } from "@/store/eventsStore";

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const refresh = useEventsStore((s) => s.refresh);
	const [busy, setBusy] = useState(false);

	const showBackupError = (e: unknown) => {
		if (e instanceof BackupError) {
			Alert.alert(t("backup.importFailed"), t(e.i18nKey));
		} else {
			console.error("backup operation failed", e);
			Alert.alert(t("backup.importFailed"), t("common.error"));
		}
	};

	const handleExport = async () => {
		try {
			setBusy(true);
			await exportBackup();
		} catch (e) {
			showBackupError(e);
		} finally {
			setBusy(false);
		}
	};

	const runImport = async (raw: string, mode: ImportMode) => {
		try {
			setBusy(true);
			const backup = parseBackup(raw);
			const result = await importBackup(backup, mode);
			// A replace can strand cover and page files the old rows referenced.
			await cleanupOrphanedMedia();
			await refresh();
			Alert.alert(
				t("backup.importDone"),
				t("backup.importResult", {
					events: result.eventsAdded,
					entries: result.giftsAdded,
					skipped: result.giftsSkipped,
				}),
			);
		} catch (e) {
			showBackupError(e);
		} finally {
			setBusy(false);
		}
	};

	const handleImport = async () => {
		try {
			const picked = await DocumentPicker.getDocumentAsync({
				type: ["application/json", "*/*"],
				copyToCacheDirectory: true,
			});
			if (picked.canceled) return;

			const uri = picked.assets[0].uri;
			const raw = await FileSystem.readAsStringAsync(uri, {
				encoding: FileSystem.EncodingType.UTF8,
			});

			// Validate and show what's in the file before writing anything — an
			// import can replace everything the user has.
			const backup = parseBackup(raw);
			const s = summarise(backup);
			const range =
				s.earliest && s.latest
					? t("backup.dateRange", {
							from: formatDate(s.earliest, i18n.language),
							to: formatDate(s.latest, i18n.language),
					  })
					: t("backup.noDateRange");

			Alert.alert(
				t("backup.confirmTitle"),
				t("backup.confirmBody", {
					events: s.eventCount,
					entries: s.giftCount,
					range,
				}),
				[
					{ text: t("common.cancel"), style: "cancel" },
					{
						text: t("backup.modeMerge"),
						onPress: () => runImport(raw, "merge"),
					},
					{
						text: t("backup.modeReplace"),
						style: "destructive",
						onPress: () =>
							Alert.alert(
								t("backup.replaceTitle"),
								t("backup.replaceBody"),
								[
									{ text: t("common.cancel"), style: "cancel" },
									{
										text: t("backup.replaceConfirm"),
										style: "destructive",
										onPress: () => runImport(raw, "replace"),
									},
								],
							),
					},
				],
			);
		} catch (e) {
			showBackupError(e);
		}
	};

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

				<MangoFrame style={styles.card}>
					<AppText
						variant="label"
						color={colors.inkSoft}
						style={{ marginBottom: spacing.sm, letterSpacing: 1 }}
					>
						{t("backup.title").toUpperCase()}
					</AppText>
					<AppText
						variant="small"
						color={colors.inkSoft}
						style={{ lineHeight: 20 }}
					>
						{t("backup.intro")}
					</AppText>

					<View style={styles.backupActions}>
						<MaroonButton
							label={t("backup.export")}
							onPress={handleExport}
							loading={busy}
						/>
						<MaroonButton
							label={t("backup.import")}
							variant="outline"
							onPress={handleImport}
							disabled={busy}
							style={{ marginTop: spacing.sm }}
						/>
					</View>

					{/* The file is plain JSON with no password on it — say so where
					    the user is about to create one, not buried in a help page. */}
					<View style={styles.warningRow}>
						<MaterialCommunityIcons
							name="lock-open-variant-outline"
							size={16}
							color={colors.inkMuted}
						/>
						<AppText
							variant="small"
							color={colors.inkMuted}
							style={styles.warningText}
						>
							{t("backup.notEncrypted")}
						</AppText>
					</View>
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

function formatDate(iso: string, lang: string): string {
	try {
		return new Date(iso).toLocaleDateString(
			lang === "ta" ? "ta-IN" : "en-IN",
			{ month: "short", year: "numeric" },
		);
	} catch {
		return iso.slice(0, 10);
	}
}

const styles = StyleSheet.create({
	scroll: {
		padding: spacing.lg,
		paddingBottom: spacing.xxxl,
	},
	card: {
		marginTop: spacing.lg,
	},
	backupActions: {
		marginTop: spacing.lg,
	},
	warningRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginTop: spacing.lg,
		gap: spacing.xs,
	},
	warningText: {
		flex: 1,
		lineHeight: 18,
	},
});
