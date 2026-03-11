import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Switch,
  Alert,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

const HEALTH_RECORDS_KEY = "@kezi/health_records";
const AUTH_TOKEN_KEY = "@kezi/auth_token";

function getApiBaseUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const origin = window.location.origin;
    if (!origin.includes("localhost")) {
      const url = new URL(origin);
      if (url.port === "" || url.port === "80" || url.port === "443") {
        return `${url.protocol}//${url.hostname}:3002/api`;
      }
      return `${origin}/api`;
    }
  }
  return "http://localhost:3001/api";
}

const API_BASE_URL = getApiBaseUrl();

type RecordType = "sleep" | "steps" | "heart_rate" | "weight" | "body_temperature";

interface HealthRecord {
  id?: string;
  record_type: RecordType;
  value: number;
  unit: string;
  source: string;
  recorded_at: string;
}

interface HealthConnection {
  id: string;
  provider: string;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_settings: any;
}

interface SyncSettings {
  sleep: boolean;
  steps: boolean;
  heartRate: boolean;
  calories: boolean;
}

const RECORD_TYPES: { type: RecordType; label: string; unit: string; icon: string }[] = [
  { type: "sleep", label: "Sleep", unit: "hours", icon: "moon" },
  { type: "steps", label: "Steps", unit: "steps", icon: "trending-up" },
  { type: "heart_rate", label: "Heart Rate", unit: "bpm", icon: "heart" },
  { type: "weight", label: "Weight", unit: "kg", icon: "user" },
  { type: "body_temperature", label: "Temperature", unit: "\u00B0C", icon: "thermometer" },
];

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || "Request failed" };
    }
    return { data };
  } catch (error: any) {
    return { error: error.message || "Network error" };
  }
}

export default function HealthIntegrationScreen() {
  const { theme, isDark } = useTheme();
  const { isAnonymous } = useAuth();
  const layout = useResponsiveLayout();
  const isWideScreen = layout.isTablet || layout.isDesktop;

  const [connections, setConnections] = useState<HealthConnection[]>([]);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    sleep: true,
    steps: true,
    heartRate: true,
    calories: false,
  });
  const [selectedType, setSelectedType] = useState<RecordType>("sleep");
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const hasConnectedPlatform = connections.some((c) => c.is_connected);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isAnonymous) {
        const stored = await AsyncStorage.getItem(HEALTH_RECORDS_KEY);
        if (stored) {
          setEntries(JSON.parse(stored));
        }
      } else {
        const [connectionsRes, recordsRes] = await Promise.all([
          apiRequest("/health/connections"),
          apiRequest("/health/records?limit=5&source=manual"),
        ]);
        if (connectionsRes.data?.connections) {
          setConnections(connectionsRes.data.connections);
        }
        if (recordsRes.data?.records) {
          setEntries(recordsRes.data.records);
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConnection = async (provider: string) => {
    const existing = connections.find((c) => c.provider === provider);
    const newState = !(existing?.is_connected);

    if (isAnonymous) {
      Alert.alert("Not Available", "Health platform connections require a registered account.");
      return;
    }

    const { data, error } = await apiRequest("/health/connections", {
      method: "POST",
      body: JSON.stringify({
        provider,
        is_connected: newState,
        sync_settings: syncSettings,
      }),
    });

    if (error) {
      Alert.alert("Error", error);
    } else if (data?.connection) {
      setConnections((prev) => {
        const idx = prev.findIndex((c) => c.provider === provider);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data.connection;
          return updated;
        }
        return [...prev, data.connection];
      });
      Alert.alert("Success", newState ? `${provider} connected.` : `${provider} disconnected.`);
    }
  };

  const handleSyncSettingChange = (key: keyof SyncSettings, val: boolean) => {
    setSyncSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleLogEntry = async () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      Alert.alert("Invalid Value", "Please enter a valid numeric value.");
      return;
    }

    const recordType = RECORD_TYPES.find((r) => r.type === selectedType);
    if (!recordType) return;

    const record: HealthRecord = {
      record_type: selectedType,
      value: numValue,
      unit: recordType.unit,
      source: "manual",
      recorded_at: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      if (isAnonymous) {
        const stored = await AsyncStorage.getItem(HEALTH_RECORDS_KEY);
        const existing: HealthRecord[] = stored ? JSON.parse(stored) : [];
        const updated = [{ ...record, id: Date.now().toString() }, ...existing].slice(0, 50);
        await AsyncStorage.setItem(HEALTH_RECORDS_KEY, JSON.stringify(updated));
        setEntries(updated.slice(0, 5));
        Alert.alert("Saved", "Health record saved locally.");
      } else {
        const { data, error } = await apiRequest("/health/records", {
          method: "POST",
          body: JSON.stringify({ records: [record] }),
        });
        if (error) {
          Alert.alert("Error", error);
        } else {
          Alert.alert("Saved", "Health record logged successfully.");
          loadData();
        }
      }
      setValue("");
    } catch {
      Alert.alert("Error", "Failed to save health record.");
    } finally {
      setIsSaving(false);
    }
  };

  const getRecordIcon = (type: string): string => {
    const found = RECORD_TYPES.find((r) => r.type === type);
    return (found?.icon as string) || "activity";
  };

  const getRecordUnit = (type: string): string => {
    const found = RECORD_TYPES.find((r) => r.type === type);
    return found?.unit || "";
  };

  const formatTimestamp = (ts: string): string => {
    try {
      const date = new Date(ts);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const isConnected = (provider: string) => {
    return connections.find((c) => c.provider === provider)?.is_connected || false;
  };

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={[isWideScreen ? styles.wideScreenContainer : undefined, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={KeziColors.brand.pink500} />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={isWideScreen ? styles.wideScreenContainer : undefined}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard style={styles.card}>
            <View style={styles.bannerRow}>
              <Feather name="info" size={18} color={KeziColors.brand.purple500} />
              <ThemedText type="small" style={styles.bannerText}>
                Health platform sync requires the full Kezi app. You can manually log your health data below.
              </ThemedText>
            </View>
          </GlassCard>
        </Animated.View>

        {isAnonymous ? (
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <GlassCard style={styles.card}>
              <View style={styles.bannerRow}>
                <Feather name="lock" size={18} color={KeziColors.brand.amber500} />
                <ThemedText type="small" style={styles.bannerText}>
                  Health data is stored locally in anonymous mode.
                </ThemedText>
              </View>
            </GlassCard>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            HEALTH PLATFORMS
          </ThemedText>

          {Platform.OS === "web" ? (
            <GlassCard style={styles.card}>
              <View style={styles.bannerRow}>
                <Feather name="smartphone" size={18} color={theme.textMuted} />
                <ThemedText type="small" style={styles.bannerText}>
                  Health platform sync is available when using the Kezi app on your mobile device.
                </ThemedText>
              </View>
            </GlassCard>
          ) : (
            <>
              {Platform.OS === "ios" ? (
                <GlassCard style={styles.card}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={[styles.platformIcon, { backgroundColor: KeziColors.brand.pink100 }]}>
                        <Feather name="heart" size={20} color={KeziColors.brand.pink500} />
                      </View>
                      <View style={styles.settingText}>
                        <ThemedText type="body" style={styles.settingLabel}>
                          Apple Health
                        </ThemedText>
                        <ThemedText type="small" style={styles.settingValue}>
                          {isConnected("apple_health") ? "Connected" : "Not Connected"}
                        </ThemedText>
                      </View>
                    </View>
                    <Button
                      variant={isConnected("apple_health") ? "outline" : "primary"}
                      size="small"
                      onPress={() => handleToggleConnection("apple_health")}
                    >
                      {isConnected("apple_health") ? "Disconnect" : "Connect"}
                    </Button>
                  </View>
                </GlassCard>
              ) : (
                <GlassCard style={styles.card}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={[styles.platformIcon, { backgroundColor: KeziColors.brand.pink100 }]}>
                        <Feather name="heart" size={20} color={KeziColors.brand.pink500} />
                      </View>
                      <View style={styles.settingText}>
                        <ThemedText type="body" style={styles.settingLabel}>
                          Apple Health
                        </ThemedText>
                        <ThemedText type="small" style={styles.settingValue}>
                          Available on iOS
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              )}

              {Platform.OS === "android" ? (
                <GlassCard style={styles.card}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={[styles.platformIcon, { backgroundColor: KeziColors.brand.teal50 }]}>
                        <Feather name="activity" size={20} color={KeziColors.brand.teal600} />
                      </View>
                      <View style={styles.settingText}>
                        <ThemedText type="body" style={styles.settingLabel}>
                          Health Connect
                        </ThemedText>
                        <ThemedText type="small" style={styles.settingValue}>
                          {isConnected("health_connect") ? "Connected" : "Not Connected"}
                        </ThemedText>
                      </View>
                    </View>
                    <Button
                      variant={isConnected("health_connect") ? "outline" : "primary"}
                      size="small"
                      onPress={() => handleToggleConnection("health_connect")}
                    >
                      {isConnected("health_connect") ? "Disconnect" : "Connect"}
                    </Button>
                  </View>
                </GlassCard>
              ) : (
                <GlassCard style={styles.card}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={[styles.platformIcon, { backgroundColor: KeziColors.brand.teal50 }]}>
                        <Feather name="activity" size={20} color={KeziColors.brand.teal600} />
                      </View>
                      <View style={styles.settingText}>
                        <ThemedText type="body" style={styles.settingLabel}>
                          Health Connect
                        </ThemedText>
                        <ThemedText type="small" style={styles.settingValue}>
                          Available on Android
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              )}
            </>
          )}
        </Animated.View>

        {hasConnectedPlatform ? (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <ThemedText type="sectionHeader" style={styles.sectionLabel}>
              SYNC SETTINGS
            </ThemedText>
            <GlassCard style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Feather name="moon" size={18} color={theme.text} />
                  <View style={styles.settingText}>
                    <ThemedText type="body" style={styles.settingLabel}>
                      Sleep Data
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={syncSettings.sleep}
                  onValueChange={(val) => handleSyncSettingChange("sleep", val)}
                  trackColor={{ false: KeziColors.gray[300], true: KeziColors.brand.pink300 }}
                  thumbColor={syncSettings.sleep ? KeziColors.brand.pink500 : KeziColors.gray[100]}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Feather name="trending-up" size={18} color={theme.text} />
                  <View style={styles.settingText}>
                    <ThemedText type="body" style={styles.settingLabel}>
                      Steps & Activity
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={syncSettings.steps}
                  onValueChange={(val) => handleSyncSettingChange("steps", val)}
                  trackColor={{ false: KeziColors.gray[300], true: KeziColors.brand.pink300 }}
                  thumbColor={syncSettings.steps ? KeziColors.brand.pink500 : KeziColors.gray[100]}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Feather name="heart" size={18} color={theme.text} />
                  <View style={styles.settingText}>
                    <ThemedText type="body" style={styles.settingLabel}>
                      Heart Rate
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={syncSettings.heartRate}
                  onValueChange={(val) => handleSyncSettingChange("heartRate", val)}
                  trackColor={{ false: KeziColors.gray[300], true: KeziColors.brand.pink300 }}
                  thumbColor={syncSettings.heartRate ? KeziColors.brand.pink500 : KeziColors.gray[100]}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Feather name="zap" size={18} color={theme.text} />
                  <View style={styles.settingText}>
                    <ThemedText type="body" style={styles.settingLabel}>
                      Calories
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={syncSettings.calories}
                  onValueChange={(val) => handleSyncSettingChange("calories", val)}
                  trackColor={{ false: KeziColors.gray[300], true: KeziColors.brand.pink300 }}
                  thumbColor={syncSettings.calories ? KeziColors.brand.pink500 : KeziColors.gray[100]}
                />
              </View>
            </GlassCard>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(hasConnectedPlatform ? 400 : 300).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            MANUAL ENTRY
          </ThemedText>
          <GlassCard style={styles.card}>
            <ThemedText type="body" style={[styles.settingLabel, { marginBottom: Spacing.md }]}>
              Log Health Data
            </ThemedText>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillsScroll}
              contentContainerStyle={styles.pillsContainer}
            >
              {RECORD_TYPES.map((rt) => {
                const isSelected = selectedType === rt.type;
                return (
                  <Pressable
                    key={rt.type}
                    onPress={() => setSelectedType(rt.type)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected
                          ? KeziColors.brand.pink500
                          : isDark
                          ? KeziColors.night.deep
                          : KeziColors.gray[100],
                      },
                    ]}
                  >
                    <Feather
                      name={rt.icon as any}
                      size={14}
                      color={isSelected ? "#FFFFFF" : theme.textMuted}
                    />
                    <ThemedText
                      type="small"
                      style={[
                        styles.pillText,
                        { color: isSelected ? "#FFFFFF" : theme.text },
                      ]}
                    >
                      {rt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50],
                    color: theme.text,
                    borderColor: isDark ? KeziColors.night.surface : KeziColors.gray[200],
                  },
                ]}
                placeholder={`Enter value (${getRecordUnit(selectedType)})`}
                placeholderTextColor={theme.textMuted}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.dateRow}>
              <Feather name="clock" size={16} color={theme.textMuted} />
              <ThemedText type="small" style={styles.dateText}>
                {formatTimestamp(new Date().toISOString())}
              </ThemedText>
            </View>

            <Button
              onPress={handleLogEntry}
              loading={isSaving}
              disabled={!value.trim()}
              style={styles.logButton}
            >
              Log Entry
            </Button>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(hasConnectedPlatform ? 500 : 400).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            RECENT ENTRIES
          </ThemedText>
          {entries.length === 0 ? (
            <GlassCard style={styles.card}>
              <View style={styles.emptyState}>
                <Feather name="clipboard" size={32} color={theme.textMuted} />
                <ThemedText type="small" style={styles.emptyText}>
                  No health records yet. Use the form above to log your first entry.
                </ThemedText>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={styles.card}>
              {entries.slice(0, 5).map((entry, index) => (
                <React.Fragment key={entry.id || index}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.entryRow}>
                    <View style={[styles.entryIcon, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[100] }]}>
                      <Feather
                        name={getRecordIcon(entry.record_type) as any}
                        size={16}
                        color={KeziColors.brand.pink500}
                      />
                    </View>
                    <View style={styles.entryInfo}>
                      <ThemedText type="body" style={styles.settingLabel}>
                        {RECORD_TYPES.find((r) => r.type === entry.record_type)?.label || entry.record_type}
                      </ThemedText>
                      <ThemedText type="small" style={styles.settingValue}>
                        {formatTimestamp(entry.recorded_at)}
                      </ThemedText>
                    </View>
                    <ThemedText type="body" style={styles.entryValue}>
                      {entry.value} {entry.unit}
                    </ThemedText>
                  </View>
                </React.Fragment>
              ))}
            </GlassCard>
          )}
        </Animated.View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  wideScreenContainer: {
    maxWidth: 800,
    alignSelf: "center" as const,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  bannerText: {
    flex: 1,
    lineHeight: 20,
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
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: Spacing.lg,
  },
  pillsScroll: {
    marginBottom: Spacing.lg,
  },
  pillsContainer: {
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  pillText: {
    fontWeight: "500",
  },
  inputRow: {
    marginBottom: Spacing.md,
  },
  input: {
    height: 52,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateText: {
    opacity: 0.7,
  },
  logButton: {
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  entryInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  entryValue: {
    fontWeight: "600",
  },
});
