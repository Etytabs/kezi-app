import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

const AUTH_TOKEN_KEY = "@kezi/auth_token";
const PREGNANCY_KEY = "@kezi/pregnancy";

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

interface PregnancyData {
  id?: string;
  due_date: string;
  last_period_date?: string;
  baby_name?: string;
  status: string;
}

interface WeekData {
  week: number;
  trimester: 1 | 2 | 3;
  size: string;
  lengthCm: number;
  weightG: number;
  milestone: string;
}

const FETAL_DEVELOPMENT: WeekData[] = [
  { week: 1, trimester: 1, size: "Vanilla seed", lengthCm: 0.01, weightG: 0, milestone: "Fertilization occurs and the journey begins" },
  { week: 2, trimester: 1, size: "Pinhead", lengthCm: 0.02, weightG: 0, milestone: "The fertilized egg implants in the uterus" },
  { week: 3, trimester: 1, size: "Sesame seed", lengthCm: 0.05, weightG: 0, milestone: "The embryo begins to form three layers of cells" },
  { week: 4, trimester: 1, size: "Poppy seed", lengthCm: 0.1, weightG: 0, milestone: "The embryo implants in the uterine wall" },
  { week: 5, trimester: 1, size: "Apple seed", lengthCm: 0.2, weightG: 0, milestone: "The neural tube is forming" },
  { week: 6, trimester: 1, size: "Lentil", lengthCm: 0.4, weightG: 0, milestone: "The heart begins to beat" },
  { week: 7, trimester: 1, size: "Blueberry", lengthCm: 1.0, weightG: 0, milestone: "Arms and legs are beginning to form" },
  { week: 8, trimester: 1, size: "Raspberry", lengthCm: 1.6, weightG: 1, milestone: "Fingers and toes are forming" },
  { week: 9, trimester: 1, size: "Cherry", lengthCm: 2.3, weightG: 2, milestone: "Baby starts making tiny movements" },
  { week: 10, trimester: 1, size: "Kumquat", lengthCm: 3.1, weightG: 4, milestone: "All major organs are developing" },
  { week: 11, trimester: 1, size: "Fig", lengthCm: 4.1, weightG: 7, milestone: "Tooth buds and nail beds are forming" },
  { week: 12, trimester: 1, size: "Lime", lengthCm: 5.4, weightG: 14, milestone: "Baby can open and close fists" },
  { week: 13, trimester: 1, size: "Peach", lengthCm: 7.4, weightG: 23, milestone: "Vocal cords are developing" },
  { week: 14, trimester: 2, size: "Lemon", lengthCm: 8.7, weightG: 43, milestone: "Baby can make facial expressions" },
  { week: 15, trimester: 2, size: "Apple", lengthCm: 10.1, weightG: 70, milestone: "Baby is forming taste buds" },
  { week: 16, trimester: 2, size: "Avocado", lengthCm: 11.6, weightG: 100, milestone: "Baby can hear sounds" },
  { week: 17, trimester: 2, size: "Pear", lengthCm: 13.0, weightG: 140, milestone: "Baby's skeleton is hardening from cartilage to bone" },
  { week: 18, trimester: 2, size: "Bell pepper", lengthCm: 14.2, weightG: 190, milestone: "Baby starts to move and kick" },
  { week: 19, trimester: 2, size: "Mango", lengthCm: 15.3, weightG: 240, milestone: "Vernix caseosa coats baby's skin" },
  { week: 20, trimester: 2, size: "Banana", lengthCm: 16.4, weightG: 300, milestone: "Halfway there! Baby has eyebrows" },
  { week: 21, trimester: 2, size: "Carrot", lengthCm: 17.7, weightG: 360, milestone: "Baby's digestive system is maturing" },
  { week: 22, trimester: 2, size: "Papaya", lengthCm: 19.0, weightG: 430, milestone: "Baby's sense of touch develops" },
  { week: 23, trimester: 2, size: "Grapefruit", lengthCm: 20.0, weightG: 500, milestone: "Baby can hear your heartbeat" },
  { week: 24, trimester: 2, size: "Corn", lengthCm: 21.0, weightG: 600, milestone: "Lungs are developing surfactant" },
  { week: 25, trimester: 2, size: "Cauliflower", lengthCm: 22.0, weightG: 660, milestone: "Baby responds to familiar voices" },
  { week: 26, trimester: 2, size: "Lettuce", lengthCm: 23.0, weightG: 760, milestone: "Baby can open eyes" },
  { week: 27, trimester: 3, size: "Rutabaga", lengthCm: 24.0, weightG: 875, milestone: "Baby has regular sleep and wake cycles" },
  { week: 28, trimester: 3, size: "Eggplant", lengthCm: 25.0, weightG: 1000, milestone: "Baby can dream during REM sleep" },
  { week: 29, trimester: 3, size: "Butternut squash", lengthCm: 26.0, weightG: 1150, milestone: "Baby's muscles and lungs are maturing" },
  { week: 30, trimester: 3, size: "Cabbage", lengthCm: 27.0, weightG: 1300, milestone: "Baby's brain is growing rapidly" },
  { week: 31, trimester: 3, size: "Coconut", lengthCm: 28.0, weightG: 1500, milestone: "Baby can turn head from side to side" },
  { week: 32, trimester: 3, size: "Squash", lengthCm: 29.0, weightG: 1700, milestone: "Baby is practicing breathing" },
  { week: 33, trimester: 3, size: "Pineapple", lengthCm: 30.0, weightG: 1900, milestone: "Baby's bones are hardening" },
  { week: 34, trimester: 3, size: "Cantaloupe", lengthCm: 32.0, weightG: 2100, milestone: "Baby's immune system is maturing" },
  { week: 35, trimester: 3, size: "Honeydew melon", lengthCm: 33.0, weightG: 2400, milestone: "Baby's kidneys are fully developed" },
  { week: 36, trimester: 3, size: "Honeydew", lengthCm: 34.0, weightG: 2600, milestone: "Baby is gaining about 28g per day" },
  { week: 37, trimester: 3, size: "Swiss chard", lengthCm: 34.5, weightG: 2800, milestone: "Baby is considered early term" },
  { week: 38, trimester: 3, size: "Pumpkin", lengthCm: 35.0, weightG: 3000, milestone: "Baby is considered full term" },
  { week: 39, trimester: 3, size: "Mini watermelon", lengthCm: 35.5, weightG: 3200, milestone: "Baby's brain and lungs continue to mature" },
  { week: 40, trimester: 3, size: "Watermelon", lengthCm: 36.0, weightG: 3400, milestone: "Baby is ready to be born!" },
];

function calculateCurrentWeek(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const gestationMs = 280 * 24 * 60 * 60 * 1000;
  const conceptionDate = new Date(due.getTime() - gestationMs);
  return Math.max(1, Math.min(40, Math.floor((today.getTime() - conceptionDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1));
}

function getDaysRemaining(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export default function PregnancyTrackerScreen() {
  const { theme, isDark } = useTheme();
  const { isAnonymous } = useAuth();

  const [pregnancy, setPregnancy] = useState<PregnancyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewWeek, setViewWeek] = useState<number>(1);
  const [editDueDate, setEditDueDate] = useState("");
  const [editBabyName, setEditBabyName] = useState("");
  const [setupDueDate, setSetupDueDate] = useState("");

  const apiUrl = useMemo(() => getApiUrl(), []);

  const currentWeek = useMemo(() => {
    if (!pregnancy) return 1;
    return calculateCurrentWeek(pregnancy.due_date);
  }, [pregnancy]);

  const daysRemaining = useMemo(() => {
    if (!pregnancy) return 0;
    return getDaysRemaining(pregnancy.due_date);
  }, [pregnancy]);

  const weekData = useMemo(() => {
    return FETAL_DEVELOPMENT[viewWeek - 1] || FETAL_DEVELOPMENT[0];
  }, [viewWeek]);

  const progress = useMemo(() => viewWeek / 40, [viewWeek]);

  const loadPregnancy = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAnonymous) {
        const stored = await AsyncStorage.getItem(PREGNANCY_KEY);
        if (stored) {
          const data = JSON.parse(stored) as PregnancyData;
          setPregnancy(data);
          const week = calculateCurrentWeek(data.due_date);
          setViewWeek(week);
          setEditDueDate(data.due_date);
          setEditBabyName(data.baby_name || "");
        }
      } else {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(`${apiUrl}/cycle/pregnancy`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          const pregnancyData = data.pregnancy || data;
          if (pregnancyData && pregnancyData.due_date) {
            setPregnancy(pregnancyData);
            const week = calculateCurrentWeek(pregnancyData.due_date);
            setViewWeek(week);
            setEditDueDate(pregnancyData.due_date);
            setEditBabyName(pregnancyData.baby_name || "");
          }
        }
      }
    } catch (e) {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [isAnonymous, apiUrl]);

  useEffect(() => {
    loadPregnancy();
  }, [loadPregnancy]);

  const savePregnancy = useCallback(async (data: PregnancyData) => {
    setIsSaving(true);
    try {
      if (isAnonymous) {
        await AsyncStorage.setItem(PREGNANCY_KEY, JSON.stringify(data));
      } else {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        await fetch(`${apiUrl}/cycle/pregnancy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(data),
        });
      }
      setPregnancy(data);
      const week = calculateCurrentWeek(data.due_date);
      setViewWeek(week);
    } catch (e) {
      // silently fail
    } finally {
      setIsSaving(false);
    }
  }, [isAnonymous, apiUrl]);

  const handleSaveDetails = useCallback(() => {
    if (!editDueDate) return;
    const updated: PregnancyData = {
      ...pregnancy,
      due_date: editDueDate,
      baby_name: editBabyName || undefined,
      status: pregnancy?.status || "active",
    };
    savePregnancy(updated);
  }, [editDueDate, editBabyName, pregnancy, savePregnancy]);

  const handleBeginTracking = useCallback(() => {
    if (!setupDueDate) return;
    const data: PregnancyData = {
      due_date: setupDueDate,
      status: "active",
    };
    savePregnancy(data);
    setEditDueDate(setupDueDate);
    setSetupDueDate("");
  }, [setupDueDate, savePregnancy]);

  const handlePrevWeek = useCallback(() => {
    setViewWeek((w) => Math.max(1, w - 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setViewWeek((w) => Math.min(40, w + 1));
  }, []);

  const getWeightDisplay = (g: number): string => {
    if (g === 0) return "<1g";
    if (g >= 1000) return `${(g / 1000).toFixed(1)}kg`;
    return `${g}g`;
  };

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KeziColors.brand.primary} />
          <ThemedText type="body" style={styles.loadingText}>
            Loading pregnancy data...
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  if (!pregnancy) {
    return (
      <ScreenScrollView>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: KeziColors.brand.surface }]}>
              <Feather name="heart" size={48} color={KeziColors.brand.primary} />
            </View>
            <ThemedText type="h2" style={styles.emptyTitle}>
              Start Pregnancy Tracking
            </ThemedText>
            <ThemedText type="body" style={styles.emptySubtitle}>
              Enter your due date to begin tracking your pregnancy journey week by week.
            </ThemedText>

            <View style={styles.setupForm}>
              <ThemedText type="small" style={styles.inputLabel}>
                Due Date (YYYY-MM-DD)
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50],
                    color: theme.text,
                    borderColor: isDark ? KeziColors.night.deep : KeziColors.gray[200],
                  },
                ]}
                value={setupDueDate}
                onChangeText={setSetupDueDate}
                placeholder="2026-08-15"
                placeholderTextColor={theme.textMuted}
                keyboardType="default"
                autoCapitalize="none"
              />
              <Button
                onPress={handleBeginTracking}
                disabled={!setupDueDate || setupDueDate.length < 10}
                style={styles.beginButton}
              >
                Begin Tracking
              </Button>
            </View>

            <View style={[styles.privacyNote, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.brand.surface }]}>
              <Feather name="lock" size={14} color={KeziColors.brand.primary} />
              <ThemedText type="small" style={styles.privacyText}>
                Your data is stored privately and securely on your device.
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <LinearGradient
          colors={[KeziColors.brand.primary, KeziColors.brand.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="h1" style={styles.weekTitle}>
                {"Week " + viewWeek}
              </ThemedText>
              <ThemedText type="body" style={styles.trimesterSubtitle}>
                {"Trimester " + weekData.trimester}
              </ThemedText>
            </View>
            <View style={styles.countdownBadge}>
              <ThemedText type="h3" style={styles.countdownNumber}>
                {String(daysRemaining)}
              </ThemedText>
              <ThemedText type="small" style={styles.countdownLabel}>
                days left
              </ThemedText>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <ThemedText type="small" style={styles.progressText}>
              {viewWeek + " of 40 weeks"}
            </ThemedText>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <GlassCard style={styles.developmentCard}>
          <View style={styles.developmentHeader}>
            <View style={[styles.sizeIconContainer, { backgroundColor: KeziColors.brand.surface }]}>
              <Feather name="award" size={28} color={KeziColors.brand.primary} />
            </View>
            <View style={styles.developmentHeaderInfo}>
              <ThemedText type="h3">
                {weekData.size}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                Size comparison
              </ThemedText>
            </View>
          </View>

          <View style={styles.measurementsRow}>
            <View style={styles.measurementItem}>
              <Feather name="maximize-2" size={16} color={KeziColors.brand.primary} />
              <ThemedText type="body" style={[styles.measurementValue, { color: KeziColors.brand.primary }]}>
                {weekData.lengthCm + " cm"}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                Length
              </ThemedText>
            </View>
            <View style={[styles.measurementDivider, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[200] }]} />
            <View style={styles.measurementItem}>
              <Feather name="package" size={16} color={KeziColors.brand.secondary} />
              <ThemedText type="body" style={[styles.measurementValue, { color: KeziColors.brand.secondary }]}>
                {getWeightDisplay(weekData.weightG)}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                Weight
              </ThemedText>
            </View>
          </View>

          <View style={[styles.milestoneContainer, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.surface }]}>
            <Feather name="star" size={16} color={KeziColors.brand.primary} />
            <ThemedText type="body" style={styles.milestoneText}>
              {weekData.milestone}
            </ThemedText>
          </View>

          <View style={styles.growthIndicator}>
            <View style={[styles.growthBar, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[100] }]}>
              <View
                style={[
                  styles.growthFill,
                  {
                    width: `${(viewWeek / 40) * 100}%`,
                    backgroundColor: KeziColors.brand.primary,
                  },
                ]}
              />
            </View>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Baby growth progress
            </ThemedText>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <GlassCard style={styles.navigatorCard}>
          <View style={styles.navigator}>
            <Pressable onPress={handlePrevWeek} style={[styles.navButton, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.surface }]}>
              <Feather name="chevron-left" size={20} color={KeziColors.brand.primary} />
            </Pressable>
            <View style={styles.navCenter}>
              <ThemedText type="h4" style={{ color: KeziColors.brand.primary }}>
                {"Week " + viewWeek}
              </ThemedText>
              {viewWeek === currentWeek ? (
                <View style={[styles.currentBadge, { backgroundColor: KeziColors.brand.primary }]}>
                  <ThemedText type="small" style={styles.currentBadgeText}>
                    Current
                  </ThemedText>
                </View>
              ) : (
                <Pressable onPress={() => setViewWeek(currentWeek)}>
                  <ThemedText type="small" style={{ color: KeziColors.brand.primary }}>
                    Go to current week
                  </ThemedText>
                </Pressable>
              )}
            </View>
            <Pressable onPress={handleNextWeek} style={[styles.navButton, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.surface }]}>
              <Feather name="chevron-right" size={20} color={KeziColors.brand.primary} />
            </Pressable>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <GlassCard style={styles.detailsCard}>
          <ThemedText type="h4" style={styles.detailsTitle}>
            Pregnancy Details
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.inputLabel}>
              Due Date (YYYY-MM-DD)
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50],
                  color: theme.text,
                  borderColor: isDark ? KeziColors.night.deep : KeziColors.gray[200],
                },
              ]}
              value={editDueDate}
              onChangeText={setEditDueDate}
              placeholder="2026-08-15"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.inputLabel}>
              Baby Name (optional)
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50],
                  color: theme.text,
                  borderColor: isDark ? KeziColors.night.deep : KeziColors.gray[200],
                },
              ]}
              value={editBabyName}
              onChangeText={setEditBabyName}
              placeholder="Enter baby name"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <Button
            onPress={handleSaveDetails}
            loading={isSaving}
            disabled={!editDueDate || editDueDate.length < 10}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <View style={styles.quickInfoRow}>
          <GlassCard style={styles.quickInfoCard}>
            <View style={[styles.quickInfoIcon, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.surface }]}>
              <Feather name="clock" size={18} color={KeziColors.brand.primary} />
            </View>
            <ThemedText type="h4" style={{ color: KeziColors.brand.primary }}>
              {String(daysRemaining)}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Days left
            </ThemedText>
          </GlassCard>

          <GlassCard style={styles.quickInfoCard}>
            <View style={[styles.quickInfoIcon, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.surface }]}>
              <Feather name="package" size={18} color={KeziColors.brand.secondary} />
            </View>
            <ThemedText type="h4" style={{ color: KeziColors.brand.secondary }}>
              {getWeightDisplay(weekData.weightG)}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Weight
            </ThemedText>
          </GlassCard>

          <GlassCard style={styles.quickInfoCard}>
            <View style={[styles.quickInfoIcon, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.surface }]}>
              <Feather name="maximize-2" size={18} color={KeziColors.brand.teal600} />
            </View>
            <ThemedText type="h4" style={{ color: KeziColors.brand.teal600 }}>
              {weekData.lengthCm + "cm"}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Length
            </ThemedText>
          </GlassCard>
        </View>
      </Animated.View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 4,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  setupForm: {
    width: "100%",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  beginButton: {
    marginTop: Spacing.md,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
  },
  privacyText: {
    flex: 1,
    opacity: 0.7,
  },
  headerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  weekTitle: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  trimesterSubtitle: {
    color: "rgba(255,255,255,0.8)",
  },
  countdownBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    minWidth: 72,
  },
  countdownNumber: {
    color: "#FFFFFF",
  },
  countdownLabel: {
    color: "rgba(255,255,255,0.8)",
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  progressText: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "right",
  },
  developmentCard: {
    marginBottom: Spacing.lg,
  },
  developmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sizeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  developmentHeaderInfo: {
    flex: 1,
  },
  measurementsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  measurementItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  measurementValue: {
    fontWeight: "700",
  },
  measurementDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.md,
  },
  milestoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  milestoneText: {
    flex: 1,
  },
  growthIndicator: {
    gap: Spacing.xs,
  },
  growthBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  growthFill: {
    height: "100%",
    borderRadius: 3,
  },
  navigatorCard: {
    marginBottom: Spacing.lg,
  },
  navigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  navCenter: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xl,
  },
  currentBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  detailsCard: {
    marginBottom: Spacing.lg,
  },
  detailsTitle: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
  quickInfoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickInfoCard: {
    flex: 1,
    alignItems: "center",
  },
  quickInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
});
