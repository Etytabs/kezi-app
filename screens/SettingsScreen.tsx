import React, { useState, useEffect } from "react";
import { View, StyleSheet, Switch, Alert, Platform, Pressable, Linking, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { LanguagePicker, LanguageSettingRow } from "@/components/LanguagePicker";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { storage } from "@/services/storage";
import { authApi } from "@/services/api";
import { useDiscreetMode } from "@/context/DiscreetModeContext";
import { biometricAuth } from "@/services/biometricAuth";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { ThemePreference } from "@/context/ThemeContext";
import { getFriendlyError } from "@/utils/errorMessages";

export default function SettingsScreen() {
  const { theme, isDark, themePreference, setThemePreference } = useTheme();
  const navigation = useNavigation();
  const { cycleConfig, updateCycleConfig, logout, isAnonymous } = useAuth();
  const { t } = useLanguage();
  const { isDiscreetMode, toggleDiscreetMode } = useDiscreetMode();
  const layout = useResponsiveLayout();
  const isWideScreen = layout.isTablet || layout.isDesktop;

  const [lastPeriodDate, setLastPeriodDate] = useState(
    cycleConfig ? new Date(cycleConfig.lastPeriodDate) : new Date()
  );
  const [cycleLength, setCycleLength] = useState(cycleConfig?.cycleLength || 28);
  const [periodLength, setPeriodLength] = useState(cycleConfig?.periodLength || 5);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("Biometric");

  useEffect(() => {
    loadBiometricSettings();
  }, []);

  const loadBiometricSettings = async () => {
    const capabilities = await biometricAuth.getCapabilities();
    setBiometricAvailable(capabilities.hasHardware && capabilities.isEnrolled);
    setBiometricEnabled(capabilities.isEnabled);
    if (capabilities.biometricType) {
      setBiometricType(capabilities.biometricType);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const success = await biometricAuth.enableBiometric();
      if (success) {
        setBiometricEnabled(true);
        Alert.alert("Enabled", `${biometricType} has been enabled for Kezi.`);
      }
    } else {
      const success = await biometricAuth.disableBiometric();
      if (success) {
        setBiometricEnabled(false);
        Alert.alert("Disabled", `${biometricType} has been disabled.`);
      }
    }
  };

  const handleSaveCycleSettings = async () => {
    setIsSaving(true);
    try {
      await updateCycleConfig({
        lastPeriodDate: lastPeriodDate.toISOString(),
        cycleLength,
        periodLength,
      });
      Alert.alert("Saved", "Your cycle settings have been updated.");
    } catch (error) {
      const friendly = getFriendlyError('server error');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your journal entries and reset your settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            await storage.clearAll();
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to permanently delete your account? This action cannot be undone. All your data including cycle history, journal entries, orders, and personal information will be permanently removed."
      );
      if (confirmed) {
        const reconfirm = window.confirm(
          "This is your final confirmation. Type 'DELETE' to proceed."
        );
        if (reconfirm) {
          performAccountDeletion();
        }
      }
    } else {
      Alert.alert(
        "Delete Account",
        "Are you sure you want to permanently delete your account?\n\nThis action cannot be undone. All your data including:\n\n• Cycle tracking history\n• Journal entries\n• Orders and purchases\n• Personal information\n\nwill be permanently removed.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Account",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Final Confirmation",
                "This is permanent and cannot be recovered. Are you absolutely sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Yes, Delete My Account",
                    style: "destructive",
                    onPress: performAccountDeletion,
                  },
                ]
              );
            },
          },
        ]
      );
    }
  };

  const performAccountDeletion = async () => {
    try {
      await authApi.deleteAccount();
      await storage.clearAll();
      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted. Thank you for using Kezi.",
        [{ text: "OK", onPress: () => logout() }]
      );
    } catch (error) {
      await storage.clearAll();
      await logout();
    }
  };

  const handleOpenPrivacyPolicy = () => {
    navigation.navigate("PrivacyPolicy" as never);
  };

  const handleOpenTerms = () => {
    Linking.openURL("https://kezi.app/terms");
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setLastPeriodDate(selectedDate);
    }
  };

  return (
    <ScreenScrollView>
      <View style={isWideScreen ? styles.wideScreenContainer : undefined}>
      <Animated.View entering={FadeInDown.delay(50).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          {t("settings.language").toUpperCase()}
        </ThemedText>
        <GlassCard style={styles.card}>
          {showLanguagePicker ? (
            <LanguagePicker onClose={() => setShowLanguagePicker(false)} />
          ) : (
            <LanguageSettingRow onPress={() => setShowLanguagePicker(true)} />
          )}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(75).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          APPEARANCE
        </ThemedText>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name={isDark ? "moon" : "sun"}
                size={20}
                color={KeziColors.brand.purple500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Theme
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  {themePreference === "system" ? "Follow system" : themePreference === "dark" ? "Dark mode" : "Light mode"}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.themeButtonsContainer}>
            {(["system", "light", "dark"] as ThemePreference[]).map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.themeButton,
                  themePreference === option && styles.themeButtonActive,
                ]}
                onPress={() => setThemePreference(option)}
              >
                <Feather
                  name={option === "system" ? "smartphone" : option === "dark" ? "moon" : "sun"}
                  size={16}
                  color={themePreference === option ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="small"
                  style={[
                    styles.themeButtonText,
                    themePreference === option && styles.themeButtonTextActive,
                  ]}
                >
                  {option === "system" ? "System" : option === "dark" ? "Dark" : "Light"}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          {t("profile.cycleSettings").toUpperCase()}
        </ThemedText>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name="calendar"
                size={20}
                color={KeziColors.brand.pink500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Last Period Start
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  {lastPeriodDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </ThemedText>
              </View>
            </View>
            <Button
              variant="ghost"
              size="small"
              onPress={() => setShowDatePicker(true)}
            >
              Edit
            </Button>
          </View>

          {showDatePicker ? (
            <DateTimePicker
              value={lastPeriodDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          ) : null}

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name="repeat"
                size={20}
                color={KeziColors.brand.purple500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Cycle Length
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  {cycleLength} days
                </ThemedText>
              </View>
            </View>
            <View style={styles.stepperContainer}>
              <Button
                variant="secondary"
                size="small"
                onPress={() => setCycleLength(Math.max(21, cycleLength - 1))}
                style={styles.stepperButton}
              >
                -
              </Button>
              <ThemedText type="body" style={styles.stepperValue}>
                {cycleLength}
              </ThemedText>
              <Button
                variant="secondary"
                size="small"
                onPress={() => setCycleLength(Math.min(35, cycleLength + 1))}
                style={styles.stepperButton}
              >
                +
              </Button>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name="droplet"
                size={20}
                color={KeziColors.brand.pink500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Period Length
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  {periodLength} days
                </ThemedText>
              </View>
            </View>
            <View style={styles.stepperContainer}>
              <Button
                variant="secondary"
                size="small"
                onPress={() => setPeriodLength(Math.max(3, periodLength - 1))}
                style={styles.stepperButton}
              >
                -
              </Button>
              <ThemedText type="body" style={styles.stepperValue}>
                {periodLength}
              </ThemedText>
              <Button
                variant="secondary"
                size="small"
                onPress={() => setPeriodLength(Math.min(7, periodLength + 1))}
                style={styles.stepperButton}
              >
                +
              </Button>
            </View>
          </View>

          <Button
            onPress={handleSaveCycleSettings}
            disabled={isSaving}
            style={styles.saveButton}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          SECURITY
        </ThemedText>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name={biometricType === "Face ID" ? "eye" : "lock"}
                size={20}
                color={KeziColors.brand.purple500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  {biometricType}
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  {biometricAvailable
                    ? biometricEnabled
                      ? "Required for profile switching and sensitive data"
                      : "Protect profile switching and data access"
                    : Platform.OS === "web"
                    ? "Available on mobile devices"
                    : "Not available on this device"}
                </ThemedText>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{
                false: KeziColors.gray[300],
                true: KeziColors.brand.pink500,
              }}
              thumbColor="#FFFFFF"
              disabled={!biometricAvailable}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name="eye-off"
                size={20}
                color={KeziColors.brand.purple500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Discreet Mode
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  Hide sensitive cycle information
                </ThemedText>
              </View>
            </View>
            <Switch
              value={isDiscreetMode}
              onValueChange={toggleDiscreetMode}
              trackColor={{
                false: KeziColors.gray[300],
                true: KeziColors.brand.purple500,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          NOTIFICATIONS
        </ThemedText>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name="bell"
                size={20}
                color={KeziColors.brand.teal600}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Push Notifications
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  Get reminders and insights
                </ThemedText>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: KeziColors.gray[300],
                true: KeziColors.brand.pink500,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(340).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          HEALTH INTEGRATION
        </ThemedText>
        <GlassCard style={styles.card}>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("HealthDashboard" as never)}>
            <View style={styles.settingInfo}>
              <Feather name="bar-chart-2" size={20} color={KeziColors.brand.purple500} />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Health Dashboard
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  View your health metrics and trends
                </ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={KeziColors.gray[400]} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("HealthIntegration" as never)}>
            <View style={styles.settingInfo}>
              <Feather name="activity" size={20} color={KeziColors.brand.purple500} />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Connected Devices
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  Manage health platforms and log data
                </ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={KeziColors.gray[400]} />
          </Pressable>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          PRIVACY & ENCRYPTION
        </ThemedText>
        <GlassCard style={styles.card}>
          {isAnonymous ? (
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="shield" size={20} color={KeziColors.functional.success} />
                <View style={styles.settingText}>
                  <ThemedText type="body" style={styles.settingLabel}>
                    Anonymous Mode Active
                  </ThemedText>
                  <ThemedText type="small" style={styles.settingValue}>
                    All data stays on this device only
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: KeziColors.functional.success + "20" }]}>
                <ThemedText type="small" style={[styles.statusText, { color: KeziColors.functional.success }]}>On</ThemedText>
              </View>
            </View>
          ) : null}

          {isAnonymous ? <View style={styles.divider} /> : null}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="lock" size={20} color={KeziColors.brand.purple500} />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Data Encryption
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  AES-256 encryption for all health data
                </ThemedText>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: KeziColors.functional.success + "20" }]}>
              <ThemedText type="small" style={[styles.statusText, { color: KeziColors.functional.success }]}>Active</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="wifi" size={20} color={KeziColors.brand.purple500} />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Secure Transit
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  TLS encryption for all network traffic
                </ThemedText>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: KeziColors.functional.success + "20" }]}>
              <ThemedText type="small" style={[styles.statusText, { color: KeziColors.functional.success }]}>Active</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="clock" size={20} color={KeziColors.brand.purple500} />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Session Timeout
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  Auto-logout after 15 min inactivity
                </ThemedText>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: KeziColors.functional.success + "20" }]}>
              <ThemedText type="small" style={[styles.statusText, { color: KeziColors.functional.success }]}>Active</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <Pressable style={styles.linkRow} onPress={handleOpenPrivacyPolicy}>
            <View style={styles.settingInfo}>
              <Feather name="file-text" size={20} color={KeziColors.brand.purple500} />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Privacy & Data Protection
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  HIPAA-aligned data handling practices
                </ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={KeziColors.gray[400]} />
          </Pressable>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          DATA & PRIVACY
        </ThemedText>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name="download"
                size={20}
                color={KeziColors.brand.purple500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Export Data
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  Download your cycle history
                </ThemedText>
              </View>
            </View>
            <Button
              variant="ghost"
              size="small"
              onPress={() => Alert.alert("Export", "Go to Profile > Export Data for full export options.")}
            >
              Export
            </Button>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name="trash-2"
                size={20}
                color={KeziColors.gray[500]}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Clear All Data
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  Delete all local data
                </ThemedText>
              </View>
            </View>
            <Button
              variant="ghost"
              size="small"
              onPress={handleClearData}
            >
              Clear
            </Button>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(450).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          LEGAL
        </ThemedText>
        <GlassCard style={styles.card}>
          <Pressable style={styles.linkRow} onPress={handleOpenPrivacyPolicy}>
            <View style={styles.settingInfo}>
              <Feather
                name="shield"
                size={20}
                color={KeziColors.brand.purple500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Privacy Policy
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  How we protect your data
                </ThemedText>
              </View>
            </View>
            <Feather name="external-link" size={18} color={KeziColors.gray[400]} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.linkRow} onPress={handleOpenTerms}>
            <View style={styles.settingInfo}>
              <Feather
                name="file-text"
                size={20}
                color={KeziColors.brand.purple500}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Terms of Service
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  User agreement and policies
                </ThemedText>
              </View>
            </View>
            <Feather name="external-link" size={18} color={KeziColors.gray[400]} />
          </Pressable>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <ThemedText type="sectionHeader" style={[styles.sectionLabel, { color: KeziColors.functional.danger }]}>
          DANGER ZONE
        </ThemedText>
        <GlassCard style={[styles.card, styles.dangerCard]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather
                name="user-x"
                size={20}
                color={KeziColors.functional.danger}
              />
              <View style={styles.settingText}>
                <ThemedText type="body" style={[styles.settingLabel, { color: KeziColors.functional.danger }]}>
                  Delete Account
                </ThemedText>
                <ThemedText type="small" style={styles.settingValue}>
                  Permanently delete your account and all data
                </ThemedText>
              </View>
            </View>
            <Button
              variant="ghost"
              size="small"
              onPress={handleDeleteAccount}
            >
              <ThemedText
                type="body"
                style={{ color: KeziColors.functional.danger }}
              >
                Delete
              </ThemedText>
            </Button>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <ThemedText type="small" style={styles.version}>
          Kezi v1.0.0
        </ThemedText>
      </Animated.View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  wideScreenContainer: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontWeight: "600",
  },
  settingValue: {
    opacity: 0.6,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: Spacing.lg,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepperButton: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
  },
  stepperValue: {
    width: 40,
    textAlign: "center",
    fontWeight: "600",
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
  version: {
    textAlign: "center",
    opacity: 0.5,
    marginBottom: Spacing.xl,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  themeButtonsContainer: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  themeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(0,0,0,0.05)",
    gap: Spacing.xs,
  },
  themeButtonActive: {
    backgroundColor: KeziColors.brand.purple500,
  },
  themeButtonText: {
    fontWeight: "500",
  },
  themeButtonTextActive: {
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontWeight: "600",
    fontSize: 12,
  },
});
