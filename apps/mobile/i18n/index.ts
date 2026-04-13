import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";

import en from "./en.json";
import ta from "./ta.json";

export type Language = "en" | "ta";

const LANG_KEY = "app.language";

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

// Hydrate persisted language choice on boot
SecureStore.getItemAsync(LANG_KEY).then((stored) => {
	if (stored === "en" || stored === "ta") {
		i18n.changeLanguage(stored);
	}
});

export async function setLanguage(lang: Language): Promise<void> {
	await i18n.changeLanguage(lang);
	await SecureStore.setItemAsync(LANG_KEY, lang);
}

export function getLanguage(): Language {
	return (i18n.language as Language) === "ta" ? "ta" : "en";
}

export default i18n;
