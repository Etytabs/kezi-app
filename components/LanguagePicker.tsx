import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { SupportedLanguage } from "@/i18n";

interface LanguagePickerProps {
  onClose?: () => void;
}

export function LanguagePicker({ onClose }: LanguagePickerProps) {
  const { language, languages, setLanguage, t } = useLanguage();
  const { isDark } = useTheme();

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    await setLanguage(code);
    onClose?.();
  };

  return (
    <View style={styles.container}>
      <ThemedText type="sectionHeader" style={styles.header}>
        {t("settings.selectLanguage")}
      </ThemedText>
      
      {languages.map((lang) => (
        <Pressable
          key={lang.code}
          onPress={() => handleSelectLanguage(lang.code)}
          style={({ pressed }) => [
            styles.languageItem,
            {
              backgroundColor: isDark 
                ? pressed ? KeziColors.night.surface : "transparent"
                : pressed ? KeziColors.gray[100] : "transparent",
            },
          ]}
        >
          <View style={styles.languageInfo}>
            <ThemedText type="body" style={styles.languageName}>
              {lang.nativeName}
            </ThemedText>
            <ThemedText type="small" style={styles.languageSubtitle}>
              {lang.name}
            </ThemedText>
          </View>
          
          {language === lang.code ? (
            <View style={styles.checkmark}>
              <Feather 
                name="check" 
                size={20} 
                color={KeziColors.brand.pink500} 
              />
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

interface LanguageSettingRowProps {
  onPress: () => void;
}

export function LanguageSettingRow({ onPress }: LanguageSettingRowProps) {
  const { language, languages, t } = useLanguage();
  const { isDark } = useTheme();
  
  const currentLanguage = languages.find(l => l.code === language);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        {
          backgroundColor: isDark 
            ? pressed ? KeziColors.night.surface : KeziColors.night.deep
            : pressed ? KeziColors.gray[100] : "#FFFFFF",
        },
      ]}
    >
      <View style={styles.settingIcon}>
        <Feather name="globe" size={20} color={KeziColors.brand.purple500} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText type="body">{t("settings.language")}</ThemedText>
        <ThemedText type="small" style={styles.settingValue}>
          {currentLanguage?.nativeName || "English"}
        </ThemedText>
      </View>
      <Feather 
        name="chevron-right" 
        size={20} 
        color={isDark ? KeziColors.gray[400] : KeziColors.gray[500]} 
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontWeight: "600",
  },
  languageSubtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingValue: {
    opacity: 0.6,
    marginTop: 2,
  },
});
