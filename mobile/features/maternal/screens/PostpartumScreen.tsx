import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
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
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

const AUTH_TOKEN_KEY = "@kezi/auth_token";
const POSTPARTUM_LOGS_KEY = "@kezi/postpartum_logs";
const BREASTFEEDING_SESSIONS_KEY = "@kezi/breastfeeding_sessions";

function getApiUrl(): string {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    !window.location.origin.includes("localhost")
  ) {
    const url = new URL(window.location.origin);
    if (url.port === "" || url.port === "80" || url.port === "443") {
      return `${url.protocol}//${url.hostname}:3002/api`;
    }
    return `${window.location.origin}/api`;
  }
  return "http://localhost:3001/api";
}

type TabType = "recovery" | "feeding";
type BleedingLevel = "none" | "light" | "moderate" | "heavy" | "severe";
type MoodType = "happy" | "calm" | "tired" | "anxious" | "sad";
type FeedingSide = "left" | "right" | "bottle";

interface PostpartumLog {
  date: string;
  bleeding_level: BleedingLevel;
  pain_level: number;
  mood: MoodType;
  energy_level: number;
  notes: string;
}

interface FeedingSession {
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  side: FeedingSide;
  notes?: string;
}

const BLEEDING_OPTIONS: { value: BleedingLevel; label: string; color: string }[] = [
  { value: "none", label: "None", color: "#22C55E" },
  { value: "light", label: "Light", color: "#86EFAC" },
  { value: "moderate", label: "Moderate", color: "#FACC15" },
  { value: "heavy", label: "Heavy", color: "#F97316" },
  { value: "severe", label: "Severe", color: "#EF4444" },
];

const MOOD_OPTIONS: { value: MoodType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "happy", label: "Happy", icon: "smile" },
  { value: "calm", label: "Calm", icon: "minus-circle" },
  { value: "tired", label: "Tired", icon: "moon" },
  { value: "anxious", label: "Anxious", icon: "alert-circle" },
  { value: "sad", label: "Sad", icon: "frown" },
];

const SIDE_OPTIONS: { value: FeedingSide; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "bottle", label: "Bottle" },
];

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

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
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
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

export default function PostpartumScreen() {
  const { theme, isDark } = useTheme();
  const { isAnonymous } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("recovery");

  const [bleedingLevel, setBleedingLevel] = useState<BleedingLevel>("none");
  const [painLevel, setPainLevel] = useState(0);
  const [mood, setMood] = useState<MoodType>("calm");
  const [energyLevel, setEnergyLevel] = useState(5);
  const [notes, setNotes] = useState("");
  const [recentLogs, setRecentLogs] = useState<PostpartumLog[]>([]);
  const [isSavingLog, setIsSavingLog] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [feedingSide, setFeedingSide] = useState<FeedingSide>("left");
  const timerStartRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [quickDuration, setQuickDuration] = useState("");
  const [quickSide, setQuickSide] = useState<FeedingSide>("left");
  const [sessions, setSessions] = useState<FeedingSession[]>([]);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTimerRunning]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAnonymous) {
        const logsStr = await AsyncStorage.getItem(POSTPARTUM_LOGS_KEY);
        const sessStr = await AsyncStorage.getItem(BREASTFEEDING_SESSIONS_KEY);
        setRecentLogs(logsStr ? JSON.parse(logsStr) : []);
        setSessions(sessStr ? JSON.parse(sessStr) : []);
      } else {
        const [logsRes, sessRes] = await Promise.all([
          apiRequest("/cycle/postpartum"),
          apiRequest("/cycle/breastfeeding"),
        ]);
        if (logsRes.data) {
          setRecentLogs(
            Array.isArray(logsRes.data) ? logsRes.data : (logsRes.data as any).logs || []
          );
        }
        if (sessRes.data) {
          setSessions(
            Array.isArray(sessRes.data) ? sessRes.data : (sessRes.data as any).sessions || []
          );
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [isAnonymous]);

  const saveLog = useCallback(async () => {
    setIsSavingLog(true);
    const log: PostpartumLog = {
      date: getTodayString(),
      bleeding_level: bleedingLevel,
      pain_level: painLevel,
      mood,
      energy_level: energyLevel,
      notes,
    };
    try {
      if (isAnonymous) {
        const existing = [...recentLogs];
        const idx = existing.findIndex((l) => l.date === log.date);
        if (idx >= 0) {
          existing[idx] = log;
        } else {
          existing.unshift(log);
        }
        await AsyncStorage.setItem(POSTPARTUM_LOGS_KEY, JSON.stringify(existing));
        setRecentLogs(existing);
      } else {
        const res = await apiRequest("/cycle/postpartum", {
          method: "POST",
          body: JSON.stringify(log),
        });
        if (!res.error) {
          await loadData();
        }
      }
      setNotes("");
    } catch {
    } finally {
      setIsSavingLog(false);
    }
  }, [isAnonymous, bleedingLevel, painLevel, mood, energyLevel, notes, recentLogs, loadData]);

  const startTimer = useCallback(() => {
    timerStartRef.current = new Date().toISOString();
    setTimerSeconds(0);
    setIsTimerRunning(true);
  }, []);

  const stopTimer = useCallback(async () => {
    setIsTimerRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const durationMin = Math.max(1, Math.round(timerSeconds / 60));
    const session: FeedingSession = {
      start_time: timerStartRef.current || new Date().toISOString(),
      end_time: new Date().toISOString(),
      duration_minutes: durationMin,
      side: feedingSide,
    };
    await saveSession(session);
    setTimerSeconds(0);
  }, [timerSeconds, feedingSide]);

  const logQuickSession = useCallback(async () => {
    const dur = parseInt(quickDuration, 10);
    if (!dur || dur <= 0) return;
    setIsSavingSession(true);
    const now = new Date();
    const start = new Date(now.getTime() - dur * 60000);
    const session: FeedingSession = {
      start_time: start.toISOString(),
      end_time: now.toISOString(),
      duration_minutes: dur,
      side: quickSide,
    };
    await saveSession(session);
    setQuickDuration("");
    setIsSavingSession(false);
  }, [quickDuration, quickSide]);

  const saveSession = useCallback(
    async (session: FeedingSession) => {
      try {
        if (isAnonymous) {
          const updated = [session, ...sessions];
          await AsyncStorage.setItem(BREASTFEEDING_SESSIONS_KEY, JSON.stringify(updated));
          setSessions(updated);
        } else {
          const res = await apiRequest("/cycle/breastfeeding", {
            method: "POST",
            body: JSON.stringify(session),
          });
          if (!res.error) {
            await loadData();
          }
        }
      } catch {}
    },
    [isAnonymous, sessions, loadData]
  );

  const todaySessions = sessions.filter(
    (s) => s.start_time.split("T")[0] === getTodayString()
  );

  const totalFeedingMinutes = todaySessions.reduce(
    (sum, s) => sum + (s.duration_minutes || 0),
    0
  );

  const last7Logs = recentLogs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const moodIcon = (m: MoodType) =>
    MOOD_OPTIONS.find((o) => o.value === m)?.icon || "minus-circle";

  const bleedingColor = (b: BleedingLevel) =>
    BLEEDING_OPTIONS.find((o) => o.value === b)?.color || "#9CA3AF";

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={KeziColors.brand.primary} />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <View style={styles.tabRow}>
          {(["recovery", "feeding"] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabPill,
                {
                  backgroundColor:
                    activeTab === tab
                      ? KeziColors.brand.primary
                      : isDark
                      ? KeziColors.night.surface
                      : KeziColors.gray[100],
                },
              ]}
            >
              <ThemedText
                type="body"
                style={{
                  color: activeTab === tab ? "#FFFFFF" : theme.textMuted,
                  fontWeight: activeTab === tab ? "700" : "500",
                }}
              >
                {tab === "recovery" ? "Recovery" : "Feeding"}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {activeTab === "recovery" ? (
        <>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <GlassCard style={styles.card}>
              <ThemedText type="h3" style={styles.cardTitle}>
                Daily Recovery Log
              </ThemedText>

              <ThemedText type="small" style={styles.label}>
                Bleeding Level
              </ThemedText>
              <View style={styles.pillRow}>
                {BLEEDING_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setBleedingLevel(opt.value)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor:
                          bleedingLevel === opt.value
                            ? opt.color
                            : isDark
                            ? KeziColors.night.deep
                            : KeziColors.gray[100],
                        borderColor:
                          bleedingLevel === opt.value ? opt.color : "transparent",
                      },
                    ]}
                  >
                    <ThemedText
                      type="chip"
                      style={{
                        color:
                          bleedingLevel === opt.value
                            ? "#FFFFFF"
                            : theme.textMuted,
                      }}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <ThemedText type="small" style={styles.label}>
                Pain Level: {painLevel}/10
              </ThemedText>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => setPainLevel(Math.max(0, painLevel - 1))}
                  style={[
                    styles.stepperBtn,
                    {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[100],
                    },
                  ]}
                >
                  <Feather name="minus" size={20} color={theme.text} />
                </Pressable>
                <View style={styles.stepperValue}>
                  <ThemedText type="h3">{painLevel}</ThemedText>
                </View>
                <Pressable
                  onPress={() => setPainLevel(Math.min(10, painLevel + 1))}
                  style={[
                    styles.stepperBtn,
                    {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[100],
                    },
                  ]}
                >
                  <Feather name="plus" size={20} color={theme.text} />
                </Pressable>
              </View>

              <ThemedText type="small" style={styles.label}>
                Mood
              </ThemedText>
              <View style={styles.pillRow}>
                {MOOD_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setMood(opt.value)}
                    style={[
                      styles.moodPill,
                      {
                        backgroundColor:
                          mood === opt.value
                            ? KeziColors.brand.primary
                            : isDark
                            ? KeziColors.night.deep
                            : KeziColors.gray[100],
                      },
                    ]}
                  >
                    <Feather
                      name={opt.icon}
                      size={18}
                      color={mood === opt.value ? "#FFFFFF" : theme.textMuted}
                    />
                    <ThemedText
                      type="chip"
                      style={{
                        color:
                          mood === opt.value ? "#FFFFFF" : theme.textMuted,
                        marginLeft: 4,
                      }}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <ThemedText type="small" style={styles.label}>
                Energy Level: {energyLevel}/10
              </ThemedText>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => setEnergyLevel(Math.max(0, energyLevel - 1))}
                  style={[
                    styles.stepperBtn,
                    {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[100],
                    },
                  ]}
                >
                  <Feather name="minus" size={20} color={theme.text} />
                </Pressable>
                <View style={styles.stepperValue}>
                  <ThemedText type="h3">{energyLevel}</ThemedText>
                </View>
                <Pressable
                  onPress={() => setEnergyLevel(Math.min(10, energyLevel + 1))}
                  style={[
                    styles.stepperBtn,
                    {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[100],
                    },
                  ]}
                >
                  <Feather name="plus" size={20} color={theme.text} />
                </Pressable>
              </View>

              <ThemedText type="small" style={styles.label}>
                Notes
              </ThemedText>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="How are you feeling today?"
                placeholderTextColor={theme.placeholder}
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[50],
                    color: theme.text,
                    borderColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[200],
                  },
                ]}
              />

              <Button
                onPress={saveLog}
                loading={isSavingLog}
                style={styles.saveBtn}
              >
                Save Log
              </Button>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <GlassCard style={styles.card}>
              <ThemedText type="h3" style={styles.cardTitle}>
                Recent Logs
              </ThemedText>
              {last7Logs.length === 0 ? (
                <ThemedText type="small" style={{ textAlign: "center", marginTop: Spacing.md }}>
                  No recovery logs yet. Start by logging today.
                </ThemedText>
              ) : (
                last7Logs.map((log, i) => (
                  <View
                    key={log.date + i}
                    style={[
                      styles.logRow,
                      {
                        borderBottomColor: isDark
                          ? KeziColors.night.deep
                          : KeziColors.gray[200],
                        borderBottomWidth: i < last7Logs.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <View style={styles.logDate}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {formatDate(log.date)}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.bleedingBadge,
                        { backgroundColor: bleedingColor(log.bleeding_level) },
                      ]}
                    >
                      <ThemedText
                        type="chip"
                        style={{ color: "#FFFFFF", fontSize: 10 }}
                      >
                        {log.bleeding_level}
                      </ThemedText>
                    </View>
                    <View style={styles.logMetrics}>
                      <Feather
                        name="activity"
                        size={12}
                        color={theme.textMuted}
                      />
                      <ThemedText type="small" style={{ marginLeft: 2 }}>
                        {log.pain_level}
                      </ThemedText>
                      <Feather
                        name="zap"
                        size={12}
                        color={theme.textMuted}
                        style={{ marginLeft: 8 }}
                      />
                      <ThemedText type="small" style={{ marginLeft: 2 }}>
                        {log.energy_level}
                      </ThemedText>
                    </View>
                    <Feather
                      name={moodIcon(log.mood)}
                      size={18}
                      color={KeziColors.brand.primary}
                    />
                  </View>
                ))
              )}
            </GlassCard>
          </Animated.View>
        </>
      ) : (
        <>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <GlassCard style={styles.card}>
              <ThemedText type="h3" style={[styles.cardTitle, { textAlign: "center" }]}>
                Feeding Timer
              </ThemedText>

              <View style={styles.timerDisplay}>
                <ThemedText
                  type="displayNumber"
                  style={{
                    fontSize: 56,
                    color: KeziColors.brand.primary,
                    textAlign: "center",
                  }}
                >
                  {formatTimer(timerSeconds)}
                </ThemedText>
              </View>

              <View style={styles.sideRow}>
                {SIDE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setFeedingSide(opt.value)}
                    style={[
                      styles.sidePill,
                      {
                        backgroundColor:
                          feedingSide === opt.value
                            ? KeziColors.brand.primary
                            : isDark
                            ? KeziColors.night.deep
                            : KeziColors.gray[100],
                      },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color:
                          feedingSide === opt.value ? "#FFFFFF" : theme.textMuted,
                        fontWeight: feedingSide === opt.value ? "700" : "500",
                      }}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.timerBtnWrap}>
                <Pressable
                  onPress={isTimerRunning ? stopTimer : startTimer}
                  style={[
                    styles.timerBtn,
                    {
                      backgroundColor: isTimerRunning
                        ? KeziColors.functional.danger
                        : KeziColors.brand.primary,
                    },
                  ]}
                >
                  <Feather
                    name={isTimerRunning ? "square" : "play"}
                    size={32}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>
              <ThemedText
                type="small"
                style={{ textAlign: "center", marginTop: Spacing.sm }}
              >
                {isTimerRunning ? "Tap to stop and save" : "Start Feeding"}
              </ThemedText>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <GlassCard style={styles.card}>
              <ThemedText type="h3" style={styles.cardTitle}>
                Quick Log
              </ThemedText>

              <ThemedText type="small" style={styles.label}>
                Duration (minutes)
              </ThemedText>
              <TextInput
                value={quickDuration}
                onChangeText={setQuickDuration}
                keyboardType="numeric"
                placeholder="e.g. 15"
                placeholderTextColor={theme.placeholder}
                style={[
                  styles.durationInput,
                  {
                    backgroundColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[50],
                    color: theme.text,
                    borderColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[200],
                  },
                ]}
              />

              <ThemedText type="small" style={styles.label}>
                Side
              </ThemedText>
              <View style={styles.sideRow}>
                {SIDE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setQuickSide(opt.value)}
                    style={[
                      styles.sidePill,
                      {
                        backgroundColor:
                          quickSide === opt.value
                            ? KeziColors.brand.primary
                            : isDark
                            ? KeziColors.night.deep
                            : KeziColors.gray[100],
                      },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color:
                          quickSide === opt.value ? "#FFFFFF" : theme.textMuted,
                        fontWeight: quickSide === opt.value ? "700" : "500",
                      }}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <Button
                onPress={logQuickSession}
                loading={isSavingSession}
                style={styles.saveBtn}
              >
                Log Session
              </Button>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GlassCard style={styles.card}>
              <View style={styles.sessionHeader}>
                <ThemedText type="h3">Today's Sessions</ThemedText>
                <View
                  style={[
                    styles.totalBadge,
                    { backgroundColor: KeziColors.brand.teal100 },
                  ]}
                >
                  <ThemedText
                    type="chip"
                    style={{ color: KeziColors.brand.text, fontWeight: "700" }}
                  >
                    {totalFeedingMinutes} min total
                  </ThemedText>
                </View>
              </View>

              {todaySessions.length === 0 ? (
                <ThemedText
                  type="small"
                  style={{ textAlign: "center", marginTop: Spacing.md }}
                >
                  No feeding sessions today yet.
                </ThemedText>
              ) : (
                todaySessions.map((s, i) => (
                  <View
                    key={s.start_time + i}
                    style={[
                      styles.sessionRow,
                      {
                        borderBottomColor: isDark
                          ? KeziColors.night.deep
                          : KeziColors.gray[200],
                        borderBottomWidth:
                          i < todaySessions.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {formatTime(s.start_time)}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={{ marginRight: Spacing.md }}>
                      {s.duration_minutes} min
                    </ThemedText>
                    <View
                      style={[
                        styles.sideBadge,
                        {
                          backgroundColor: KeziColors.brand.emerald100,
                        },
                      ]}
                    >
                      <ThemedText
                        type="chip"
                        style={{
                          color: KeziColors.brand.text,
                          textTransform: "capitalize",
                        }}
                      >
                        {s.side}
                      </ThemedText>
                    </View>
                  </View>
                ))
              )}
            </GlassCard>
          </Animated.View>
        </>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tabPill: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  pill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    width: 48,
    alignItems: "center",
  },
  notesInput: {
    minHeight: 80,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    textAlignVertical: "top",
    fontSize: 14,
  },
  saveBtn: {
    marginTop: Spacing.lg,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  logDate: {
    width: 60,
  },
  bleedingBadge: {
    paddingHorizontal: Spacing.xs + 4,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  logMetrics: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: Spacing.xs,
  },
  timerDisplay: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  sideRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sidePill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  timerBtnWrap: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  timerBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  durationInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: 16,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  totalBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
  },
  sideBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
});
