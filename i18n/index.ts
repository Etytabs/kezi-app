import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./translations/en";
import fr from "./translations/fr";
import rw from "./translations/rw";

export type SupportedLanguage = "en" | "fr" | "rw";

export const LANGUAGES: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda" },
];

const i18n = new I18n({
  en,
  fr,
  rw,
});

i18n.defaultLocale = "en";
i18n.enableFallback = true;

const LANGUAGE_STORAGE_KEY = "@kezi/language";

export const getStoredLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && ["en", "fr", "rw"].includes(storedLanguage)) {
      return storedLanguage as SupportedLanguage;
    }
    return null;
  } catch (error) {
    console.error("Error getting stored language:", error);
    return null;
  }
};

export const setStoredLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error("Error storing language:", error);
  }
};

export const getDeviceLanguage = (): SupportedLanguage => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || "en";
  
  if (deviceLocale === "fr") return "fr";
  if (deviceLocale === "rw") return "rw";
  
  return "en";
};

export const initializeLanguage = async (): Promise<SupportedLanguage> => {
  const storedLanguage = await getStoredLanguage();
  
  if (storedLanguage) {
    i18n.locale = storedLanguage;
    return storedLanguage;
  }
  
  const deviceLanguage = getDeviceLanguage();
  i18n.locale = deviceLanguage;
  await setStoredLanguage(deviceLanguage);
  return deviceLanguage;
};

export const setLanguage = async (language: SupportedLanguage): Promise<void> => {
  i18n.locale = language;
  await setStoredLanguage(language);
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.locale as SupportedLanguage;
};

export const t = (scope: string, options?: object): string => {
  return i18n.t(scope, options);
};

export default i18n;
