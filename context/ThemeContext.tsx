import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";

interface ThemeContextType {
  themePreference: ThemePreference;
  colorScheme: ColorScheme;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
}

const THEME_STORAGE_KEY = "jasmin-theme-preference";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved === "system" || saved === "light" || saved === "dark")) {
        setThemePreferenceState(saved as ThemePreference);
      }
    } catch (error) {
    }
  };

  const setThemePreference = async (preference: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      setThemePreferenceState(preference);
    } catch (error) {
    }
  };

  const colorScheme: ColorScheme = 
    themePreference === "system" 
      ? (systemColorScheme ?? "light") 
      : themePreference;

  return (
    <ThemeContext.Provider value={{ themePreference, colorScheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themePreference: "system" as ThemePreference,
      colorScheme: "light" as ColorScheme,
      setThemePreference: async () => {},
    };
  }
  return context;
}
