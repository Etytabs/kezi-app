import React, { useState, useEffect } from "react";
import { View, StyleSheet, Switch, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/services/storage";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

interface NotificationSettings {
  cycleReminders: boolean;
  periodPrediction: boolean;
  ovulationAlert: boolean;
  journalReminder: boolean;
  productDeals: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  cycleReminders: true,
  periodPrediction: true,
  ovulationAlert: true,
  journalReminder: false,
  productDeals: false,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function NotificationSettingsScreen() {
  const { theme, isDark } = useTheme();
  const [hasPermission, setHasPermission] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
    loadSettings();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === "web") {
      setHasPermission(false);
      return;
    }
    
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await storage.getNotificationSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Push notifications are only available on mobile devices. Try Kezi in Expo Go for the full experience."
      );
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === "granted");

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Enable notifications in your device settings to receive cycle reminders and alerts."
      );
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!hasPermission && value) {
      await requestPermission();
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await storage.setNotificationSettings(newSettings);

    if (value) {
      scheduleNotification(key);
    } else {
      cancelNotification(key);
    }
  };

  const scheduleNotification = async (type: keyof NotificationSettings) => {
    try {
      switch (type) {
        case "journalReminder":
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Time to Journal",
              body: "Take a moment to log how you're feeling today.",
            },
            trigger: {
              hour: 20,
              minute: 0,
              repeats: true,
            },
          });
          break;
      }
    } catch (error) {
      console.error("Failed to schedule notification:", error);
    }
  };

  const cancelNotification = async (type: keyof NotificationSettings) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const NotificationItem = ({
    icon,
    title,
    description,
    settingKey,
  }: {
    icon: React.ComponentProps<typeof Feather>["name"];
    title: string;
    description: string;
    settingKey: keyof NotificationSettings;
  }) => (
    <View style={styles.settingItem}>
      <View
        style={[
          styles.settingIcon,
          {
            backgroundColor: isDark
              ? KeziColors.night.deep
              : KeziColors.brand.pink50,
          },
        ]}
      >
        <Feather name={icon} size={20} color={KeziColors.brand.pink500} />
      </View>
      <View style={styles.settingInfo}>
        <ThemedText type="body" style={styles.settingTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" style={styles.settingDescription}>
          {description}
        </ThemedText>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={(value) => updateSetting(settingKey, value)}
        trackColor={{
          false: KeziColors.gray[300],
          true: KeziColors.brand.pink500,
        }}
        thumbColor={"#FFFFFF"}
        disabled={isLoading}
      />
    </View>
  );

  return (
    <ScreenScrollView>
      {!hasPermission && Platform.OS !== "web" ? (
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <Feather
                name="bell-off"
                size={24}
                color={KeziColors.functional.warning}
              />
              <ThemedText type="h4" style={styles.permissionTitle}>
                Notifications Disabled
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.permissionDescription}>
              Enable notifications to receive important cycle reminders and wellness alerts.
            </ThemedText>
            <GlassCard
              onPress={requestPermission}
              style={styles.enableButton}
            >
              <ThemedText type="body" style={styles.enableButtonText}>
                Enable Notifications
              </ThemedText>
            </GlassCard>
          </GlassCard>
        </Animated.View>
      ) : null}

      {Platform.OS === "web" ? (
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard style={styles.webNotice}>
            <Feather name="smartphone" size={20} color={KeziColors.brand.purple500} />
            <ThemedText type="small" style={styles.webNoticeText}>
              Push notifications are available on mobile devices. Scan the QR code to test in Expo Go.
            </ThemedText>
          </GlassCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          CYCLE ALERTS
        </ThemedText>
        <GlassCard style={styles.settingsCard}>
          <NotificationItem
            icon="calendar"
            title="Cycle Reminders"
            description="Daily phase updates and insights"
            settingKey="cycleReminders"
          />
          <View style={styles.divider} />
          <NotificationItem
            icon="droplet"
            title="Period Prediction"
            description="Alert 2 days before expected period"
            settingKey="periodPrediction"
          />
          <View style={styles.divider} />
          <NotificationItem
            icon="heart"
            title="Ovulation Alert"
            description="Fertility window notifications"
            settingKey="ovulationAlert"
          />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          WELLNESS
        </ThemedText>
        <GlassCard style={styles.settingsCard}>
          <NotificationItem
            icon="edit-3"
            title="Journal Reminder"
            description="Evening reminder to log your day"
            settingKey="journalReminder"
          />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          MARKETPLACE
        </ThemedText>
        <GlassCard style={styles.settingsCard}>
          <NotificationItem
            icon="tag"
            title="Product Deals"
            description="Personalized offers based on your cycle"
            settingKey="productDeals"
          />
        </GlassCard>
      </Animated.View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  permissionCard: {
    marginBottom: Spacing.xl,
  },
  permissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  permissionTitle: {
    flex: 1,
  },
  permissionDescription: {
    opacity: 0.7,
    marginBottom: Spacing.lg,
  },
  enableButton: {
    alignItems: "center",
    backgroundColor: KeziColors.brand.pink500,
  },
  enableButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  webNoticeText: {
    flex: 1,
    opacity: 0.7,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  settingsCard: {
    marginBottom: Spacing.lg,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: "600",
  },
  settingDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: Spacing.lg,
  },
});