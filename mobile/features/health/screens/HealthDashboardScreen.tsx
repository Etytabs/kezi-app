import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
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

const AUTH_TOKEN_KEY = "@kezi/auth_token";
const HEALTH_RECORDS_KEY = "@kezi/health_records";

function getApiUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined" && !window.location.origin.includes("localhost")) {
    const url = new URL(window.location.origin);
    if (url.port === "" || url.port === "80" || url.port === "443") {
      return `${url.protocol}//${url.hostname}:3002/api`;
    }
    return `${window.location.origin}/api`;
  }
  return "http://localhost:3001/api";
}

interface SummaryData {
  sleep: { avg: number; min: number; max: number; count: number };
  steps: { avg: number; min: number; max: number; count: number; total: number };
  heart_rate: { avg: number; min: number; max: number; count: number };
}

interface HealthRecord {
  id?: string;
  type?: string;
  record_type?: string;
  value: number;
  recorded_at?: string;
  recordedAt?: string;
  date?: string;
}

function getRecordType(r: HealthRecord): string {
  return r.type || r.record_type || "";
}

type DateRange = 7 | 14 | 30;

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: "7 Days", value: 7 },
  { label: "14 Days", value: 14 },
  { label: "30 Days", value: 30 },
];

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

function formatHours(num: number): string {
  return num.toFixed(1);
}

function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

function getDayAbbr(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${month} ${day}, ${hours}:${mins}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

function getSleepBarColor(hours: number): string {
  if (hours < 6) return KeziColors.functional.danger;
  if (hours < 7) return KeziColors.functional.warning;
  return KeziColors.functional.success;
}

function getHeartRateDotColor(bpm: number): string {
  if (bpm < 60) return "#3B82F6";
  if (bpm <= 100) return KeziColors.functional.success;
  return KeziColors.functional.danger;
}

function computeLocalSummary(records: HealthRecord[], dateRange: DateRange): SummaryData {
  const now = new Date();
  const fromDate = new Date();
  fromDate.setDate(now.getDate() - dateRange);

  const filtered = records.filter((r) => {
    const d = new Date(r.recorded_at || r.recordedAt || r.date || "");
    return d >= fromDate && d <= now;
  });

  const sleepRecords = filtered.filter((r) => getRecordType(r) === "sleep");
  const stepRecords = filtered.filter((r) => getRecordType(r) === "steps");
  const hrRecords = filtered.filter((r) => getRecordType(r) === "heart_rate");

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const min = (arr: number[]) => (arr.length > 0 ? Math.min(...arr) : 0);
  const max = (arr: number[]) => (arr.length > 0 ? Math.max(...arr) : 0);
  const total = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const sleepVals = sleepRecords.map((r) => r.value);
  const stepVals = stepRecords.map((r) => r.value);
  const hrVals = hrRecords.map((r) => r.value);

  return {
    sleep: { avg: avg(sleepVals), min: min(sleepVals), max: max(sleepVals), count: sleepVals.length },
    steps: { avg: avg(stepVals), min: min(stepVals), max: max(stepVals), count: stepVals.length, total: total(stepVals) },
    heart_rate: { avg: avg(hrVals), min: min(hrVals), max: max(hrVals), count: hrVals.length },
  };
}

export default function HealthDashboardScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { isAnonymous } = useAuth();
  const layout = useResponsiveLayout();
  const isWideScreen = layout.isTablet || layout.isDesktop;

  const [dateRange, setDateRange] = useState<DateRange>(7);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [sleepRecords, setSleepRecords] = useState<HealthRecord[]>([]);
  const [heartRateRecords, setHeartRateRecords] = useState<HealthRecord[]>([]);
  const [stepRecords, setStepRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isAnonymous) {
        const raw = await AsyncStorage.getItem(HEALTH_RECORDS_KEY);
        const records: HealthRecord[] = raw ? JSON.parse(raw) : [];
        const localSummary = computeLocalSummary(records, dateRange);
        setSummary(localSummary);

        const now = new Date();
        const fromDate = new Date();
        fromDate.setDate(now.getDate() - dateRange);

        const filtered = records.filter((r) => {
          const d = new Date(r.recorded_at || r.recordedAt || r.date || "");
          return d >= fromDate && d <= now;
        });

        setSleepRecords(filtered.filter((r) => getRecordType(r) === "sleep").slice(-7));
        setHeartRateRecords(filtered.filter((r) => getRecordType(r) === "heart_rate").slice(-10));
        setStepRecords(filtered.filter((r) => getRecordType(r) === "steps").slice(-7));
      } else {
        const apiUrl = getApiUrl();
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const fromDate = getDateString(dateRange);
        const toDate = getDateString(0);

        const [summaryRes, sleepRes, hrRes, stepsRes] = await Promise.all([
          fetch(`${apiUrl}/health/summary?from=${fromDate}&to=${toDate}`, { headers }),
          fetch(`${apiUrl}/health/records?type=sleep&limit=7`, { headers }),
          fetch(`${apiUrl}/health/records?type=heart_rate&limit=10`, { headers }),
          fetch(`${apiUrl}/health/records?type=steps&limit=7`, { headers }),
        ]);

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData.summary || null);
        }

        if (sleepRes.ok) {
          const sleepData = await sleepRes.json();
          setSleepRecords(sleepData.records || []);
        }

        if (hrRes.ok) {
          const hrData = await hrRes.json();
          setHeartRateRecords(hrData.records || []);
        }

        if (stepsRes.ok) {
          const stepsData = await stepsRes.json();
          setStepRecords(stepsData.records || []);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, isAnonymous]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasData =
    summary &&
    (summary.sleep.count > 0 || summary.steps.count > 0 || summary.heart_rate.count > 0);

  const content = (
    <View style={isWideScreen ? styles.wideContainer : undefined}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <View style={styles.dateRangeRow}>
          {DATE_RANGES.map((range) => {
            const isActive = dateRange === range.value;
            return (
              <Pressable
                key={range.value}
                onPress={() => setDateRange(range.value)}
                style={[
                  styles.dateRangeChip,
                  {
                    backgroundColor: isActive
                      ? KeziColors.brand.purple500
                      : isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[100],
                  },
                ]}
              >
                <ThemedText
                  type="chip"
                  style={{
                    color: isActive ? "#FFFFFF" : theme.textMuted,
                    fontWeight: isActive ? "700" : "500",
                  }}
                >
                  {range.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={KeziColors.brand.purple500} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color={KeziColors.gray[400]} />
          <ThemedText type="body" style={styles.errorText}>
            {error}
          </ThemedText>
          <Button onPress={fetchData} variant="outline" size="small">
            Retry
          </Button>
        </View>
      ) : !hasData ? (
        <View style={styles.centerContainer}>
          <Feather name="bar-chart-2" size={48} color={KeziColors.gray[400]} />
          <ThemedText type="h3" style={styles.emptyTitle}>
            No health data yet
          </ThemedText>
          <ThemedText type="body" style={styles.emptySubtitle}>
            Start logging your health metrics or connect a health platform from Settings.
          </ThemedText>
          <Button
            onPress={() => navigation.goBack()}
            variant="primary"
            size="medium"
          >
            Log Health Data
          </Button>
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <ThemedText type="sectionHeader" style={styles.sectionTitle}>
              OVERVIEW
            </ThemedText>
            <View style={styles.metricCardsRow}>
              <GlassCard style={styles.metricCard}>
                <View style={styles.metricCardContent}>
                  <Feather name="moon" size={24} color={KeziColors.brand.purple500} />
                  <ThemedText type="h2" style={styles.metricValue}>
                    {formatHours(summary?.sleep.avg || 0)}
                  </ThemedText>
                  <ThemedText type="small" style={styles.metricSubtitle}>
                    avg per night
                  </ThemedText>
                </View>
              </GlassCard>
              <GlassCard style={styles.metricCard}>
                <View style={styles.metricCardContent}>
                  <Feather name="trending-up" size={24} color={KeziColors.brand.purple500} />
                  <ThemedText type="h2" style={styles.metricValue}>
                    {formatNumber(summary?.steps.total || 0)}
                  </ThemedText>
                  <ThemedText type="small" style={styles.metricSubtitle}>
                    total steps
                  </ThemedText>
                </View>
              </GlassCard>
              <GlassCard style={styles.metricCard}>
                <View style={styles.metricCardContent}>
                  <Feather name="heart" size={24} color={KeziColors.brand.purple500} />
                  <ThemedText type="h2" style={styles.metricValue}>
                    {Math.round(summary?.heart_rate.avg || 0)}
                  </ThemedText>
                  <ThemedText type="small" style={styles.metricSubtitle}>
                    avg bpm
                  </ThemedText>
                </View>
              </GlassCard>
            </View>
          </Animated.View>

          {sleepRecords.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <ThemedText type="sectionHeader" style={styles.sectionTitle}>
                SLEEP TREND
              </ThemedText>
              <GlassCard style={styles.sectionCard}>
                {sleepRecords.map((record, index) => {
                  const hours = record.value;
                  const barWidth = Math.min((hours / 12) * 100, 100);
                  const dateStr = record.recorded_at || record.recordedAt || record.date || "";
                  return (
                    <View key={record.id || index} style={styles.barRow}>
                      <ThemedText type="small" style={styles.barLabel}>
                        {getDayAbbr(dateStr)}
                      </ThemedText>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {
                              width: `${barWidth}%`,
                              backgroundColor: getSleepBarColor(hours),
                            },
                          ]}
                        />
                      </View>
                      <ThemedText type="small" style={styles.barValue}>
                        {formatHours(hours)}h
                      </ThemedText>
                    </View>
                  );
                })}
              </GlassCard>
            </Animated.View>
          ) : null}

          {heartRateRecords.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <ThemedText type="sectionHeader" style={styles.sectionTitle}>
                HEART RATE
              </ThemedText>
              <GlassCard style={styles.sectionCard}>
                {heartRateRecords.map((record, index) => {
                  const bpm = record.value;
                  const dateStr = record.recorded_at || record.recordedAt || record.date || "";
                  return (
                    <View key={record.id || index} style={styles.listRow}>
                      <ThemedText type="small" style={styles.listDate}>
                        {formatDateTime(dateStr)}
                      </ThemedText>
                      <View style={styles.listValueRow}>
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: getHeartRateDotColor(bpm) },
                          ]}
                        />
                        <ThemedText type="body" style={styles.listValue}>
                          {Math.round(bpm)} bpm
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </GlassCard>
            </Animated.View>
          ) : null}

          {stepRecords.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <ThemedText type="sectionHeader" style={styles.sectionTitle}>
                ACTIVITY
              </ThemedText>
              <GlassCard style={styles.sectionCard}>
                {stepRecords.map((record, index) => {
                  const steps = record.value;
                  const progress = Math.min(steps / 10000, 1);
                  const dateStr = record.recorded_at || record.recordedAt || record.date || "";
                  return (
                    <View key={record.id || index} style={styles.activityRow}>
                      <View style={styles.activityHeader}>
                        <ThemedText type="small" style={styles.listDate}>
                          {formatDate(dateStr)}
                        </ThemedText>
                        <ThemedText type="body" style={styles.listValue}>
                          {formatNumber(steps)} steps
                        </ThemedText>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${progress * 100}%`,
                              backgroundColor:
                                progress >= 1
                                  ? KeziColors.functional.success
                                  : KeziColors.brand.purple500,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </GlassCard>
            </Animated.View>
          ) : null}
        </>
      )}
    </View>
  );

  return <ScreenScrollView>{content}</ScreenScrollView>;
}

const styles = StyleSheet.create({
  wideContainer: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  dateRangeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  dateRangeChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
    letterSpacing: 1,
  },
  metricCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: 100,
  },
  metricCardContent: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  metricValue: {
    color: KeziColors.brand.purple500,
    marginTop: Spacing.sm,
    fontSize: 28,
    fontWeight: "700",
  },
  metricSubtitle: {
    marginTop: Spacing.xs,
  },
  sectionCard: {
    marginBottom: Spacing.sm,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  barLabel: {
    width: 36,
    fontWeight: "600",
  },
  barTrack: {
    flex: 1,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginHorizontal: Spacing.sm,
    overflow: "hidden",
  },
  bar: {
    height: 24,
    borderRadius: 12,
  },
  barValue: {
    width: 40,
    textAlign: "right",
    fontWeight: "600",
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  listDate: {
    flex: 1,
  },
  listValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  listValue: {
    fontWeight: "600",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  errorText: {
    textAlign: "center",
    marginVertical: Spacing.md,
  },
});
