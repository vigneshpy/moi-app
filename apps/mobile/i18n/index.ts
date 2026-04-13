import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import en from "./en.json";
import ta from "./ta.json";

export type Language = "en" | "ta";

const LANG_KEY = "app.language";

// expo-secure-store is native-only; fall back to localStorage on web and
// no-op on any other platform.
const storage = {
	async get(key: string): Promise<string | null> {
		try {
			if (Platform.OS === "web") {
				return typeof localStorage !== "undefined"
					? localStorage.getItem(key)
					: null;
			}
			return await SecureStore.getItemAsync(key);
		} catch {
			return null;
		}
	},
	async set(key: string, value: string): Promise<void> {
		try {
			if (Platform.OS === "web") {
				if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
				return;
			}
			await SecureStore.setItemAsync(key, value);
		} catch {
			// swallow — persistence is best-effort
		}
	},
};

const deviceLocale = Localization.getLocales()[0]?.languageCode;
const initial: Language = deviceLocale === "ta" ? "ta" : "en";

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		ta: { translation: ta },
	},
	lng: initial,
	fallbackLng: "en",
	interpolation: { escapeValue: false },
	compatibilityJSON: "v4",
});

// Hydrate persisted language choice on boot (best-effort, never throws)
storage.get(LANG_KEY).then((stored) => {
	if (stored === "en" || stored === "ta") {
		i18n.changeLanguage(stored);
	}
});

export async function setLanguage(lang: Language): Promise<void> {
	await i18n.changeLanguage(lang);
	await storage.set(LANG_KEY, lang);
}

export function getLanguage(): Language {
	return (i18n.language as Language) === "ta" ? "ta" : "en";
}

export default i18n;
