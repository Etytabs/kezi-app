import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  SharingPrivacySettings,
  DEFAULT_SHARING_SETTINGS,
  sharingService,
} from "@/services/sharingService";

interface SharingPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (settings: SharingPrivacySettings) => void;
}

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon: keyof typeof Feather.glyphMap;
}

function SettingRow({ label, description, value, onValueChange, icon }: SettingRowProps) {
  const { theme, isDark } = useTheme();

  const handleChange = (newValue: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    onValueChange(newValue);
  };

  return (
    <View style={[styles.settingRow, { borderBottomColor: isDark ? KeziColors.gray[700] : KeziColors.gray[200] }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[50] }]}>
        <Feather name={icon} size={18} color={KeziColors.brand.pink500} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
        <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        trackColor={{ false: isDark ? KeziColors.gray[600] : KeziColors.gray[300], true: KeziColors.brand.pink500 }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function SharingPrivacyModal({ visible, onClose, onSave }: SharingPrivacyModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<SharingPrivacySettings>(DEFAULT_SHARING_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    setLoading(true);
    const saved = await sharingService.getPrivacySettings();
    setSettings(saved);
    setLoading(false);
  };

  const handleSave = async () => {
    await sharingService.savePrivacySettings(settings);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSave?.(settings);
    onClose();
  };

  const updateSetting = <K extends keyof SharingPrivacySettings>(
    key: K,
    value: SharingPrivacySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Sharing Privacy</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.infoCard, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[50] }]}>
            <Feather name="shield" size={20} color={KeziColors.brand.pink500} />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Control what information is included when you share wellness insights. 
              Your privacy is important - only share what you're comfortable with.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              CYCLE INFORMATION
            </ThemedText>
            <View style={[styles.card, { backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF" }]}>
              <SettingRow
                label="Share Phase"
                description="Include your current cycle phase"
                value={settings.sharePhase}
                onValueChange={(v) => updateSetting("sharePhase", v)}
                icon="activity"
              />
              <SettingRow
                label="Share Cycle Day"
                description="Include which day of your cycle you're on"
                value={settings.shareCycleDay}
                onValueChange={(v) => updateSetting("shareCycleDay", v)}
                icon="calendar"
              />
              <SettingRow
                label="Share Fertility Status"
                description="Include fertile window information"
                value={settings.shareFertilityStatus}
                onValueChange={(v) => updateSetting("shareFertilityStatus", v)}
                icon="heart"
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              JOURNAL ENTRIES
            </ThemedText>
            <View style={[styles.card, { backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF" }]}>
              <SettingRow
                label="Share Mood"
                description="Include how you're feeling"
                value={settings.shareMood}
                onValueChange={(v) => updateSetting("shareMood", v)}
                icon="smile"
              />
              <SettingRow
                label="Share Symptoms"
                description="Include tracked symptoms"
                value={settings.shareSymptoms}
                onValueChange={(v) => updateSetting("shareSymptoms", v)}
                icon="thermometer"
              />
              <SettingRow
                label="Share Notes"
                description="Include journal notes (truncated)"
                value={settings.shareNotes}
                onValueChange={(v) => updateSetting("shareNotes", v)}
                icon="edit-3"
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              PRIVACY MODE
            </ThemedText>
            <View style={[styles.card, { backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF" }]}>
              <SettingRow
                label="Anonymous Mode"
                description="Hide personal identifiers in shared content"
                value={settings.anonymousMode}
                onValueChange={(v) => updateSetting("anonymousMode", v)}
                icon="user-x"
              />
            </View>
          </View>

          <Button onPress={handleSave} style={styles.saveButton}>
            Save Settings
          </Button>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
});
