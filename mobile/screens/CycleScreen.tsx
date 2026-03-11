import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { CycleWheel } from "@/components/CycleWheel";
import { CycleCalendar } from "@/components/CycleCalendar";
import { PhaseChip } from "@/components/PhaseChip";
import { InsightCard } from "@/components/InsightCard";
import { QuickLog, SymptomType } from "@/components/QuickLog";
import { Button } from "@/components/Button";
import { KeziBrandIcon } from "@/components/KeziBrandIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfileContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { navigateToProfileTab, navigateToScreen } from "@/services/navigation";
import {
  calculateCycleInfo,
  getPhaseDescription,
  getPhaseForDay,
} from "@/services/cycleService";
import { Spacing, BorderRadius, CyclePhase, KeziColors } from "@/constants/theme";

const AUTH_TOKEN_KEY = "@kezi/auth_token";

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

interface Prediction {
  id: string;
  predicted_period_start: string;
  predicted_period_end: string;
  predicted_ovulation: string;
  fertile_window_start: string;
  fertile_window_end: string;
  confidence: number;
  based_on_cycles: number;
}

const PHASE_INSIGHTS: Record<CyclePhase, string> = {
  menstrual: "Rest and gentle movement can help with comfort today.",
  follicular: "Energy is rising - great time for new projects!",
  ovulation: "Peak fertility and energy. You may feel more social.",
  luteal: "Focus on self-care as your body prepares for a new cycle.",
};

export default function CycleScreen() {
  const { theme, isDark } = useTheme();
  const { isAnonymous } = useAuth();
  const { activeProfile } = useProfiles();
  const layout = useResponsiveLayout();
  const isWideScreen = layout.isTablet || layout.isDesktop;

  const cycleConfig = activeProfile?.cycleConfig || null;
  const profileName = activeProfile?.name || "You";

  const cycleInfo = useMemo(() => calculateCycleInfo(cycleConfig), [cycleConfig]);

  const cycleStartDate = useMemo(() => {
    if (!cycleConfig?.lastPeriodDate) return new Date();
    return new Date(cycleConfig.lastPeriodDate);
  }, [cycleConfig]);

  const totalDays = cycleConfig?.cycleLength || 28;
  const periodLength = cycleConfig?.periodLength || 5;

  const [selectedDay, setSelectedDay] = useState<number | null>(cycleInfo.hasData ? cycleInfo.currentDay : null);
  const [loggedDays, setLoggedDays] = useState<number[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  useEffect(() => {
    if (!cycleInfo.hasData || isAnonymous) return;
    loadPredictions();
  }, [cycleInfo.hasData, isAnonymous]);

  const loadPredictions = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;
      const res = await fetch(`${getApiUrl()}/cycle/predictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || []);
      }
    } catch (e) {
      console.log("Failed to load predictions");
    }
  };

  const generatePredictions = async () => {
    setPredictionsLoading(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;
      const res = await fetch(`${getApiUrl()}/cycle/predictions/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || []);
      }
    } catch (e) {
      console.log("Failed to generate predictions");
    } finally {
      setPredictionsLoading(false);
    }
  };

  const formatPredictionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.5) return "Medium";
    return "Low";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return KeziColors.functional.success;
    if (confidence >= 0.5) return KeziColors.functional.warning;
    return KeziColors.gray[400];
  };

  const selectedDayPhase = useMemo(() => {
    if (selectedDay === null) return cycleInfo.phase;
    return getPhaseForDay(selectedDay, totalDays, periodLength);
  }, [selectedDay, totalDays, periodLength, cycleInfo.phase]);

  const handleDaySelect = useCallback((day: number) => {
    setSelectedDay(day);
  }, []);

  const handleLogSymptom = useCallback((symptom: SymptomType) => {
    if (selectedDay !== null && !loggedDays.includes(selectedDay)) {
      setLoggedDays((prev) => [...prev, selectedDay]);
    }
  }, [selectedDay, loggedDays]);

  const handleSetupCycle = () => {
    if (activeProfile?.isPrimary) {
      navigateToProfileTab("Settings");
    } else {
      navigateToProfileTab("ManageProfiles");
    }
  };

  if (!cycleInfo.hasData) {
    return (
      <ScreenScrollView>
        {!activeProfile?.isPrimary ? (
          <Animated.View entering={FadeInDown.delay(50).duration(500)}>
            <GlassCard style={styles.profileBanner}>
              <View style={[styles.profileAvatar, { backgroundColor: KeziColors.brand.purple100 }]}>
                <ThemedText type="h4" style={{ color: KeziColors.brand.purple600 }}>
                  {profileName.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.profileBannerInfo}>
                <ThemedText type="body" style={styles.profileBannerName}>
                  {profileName}'s Cycle
                </ThemedText>
                <ThemedText type="small" style={styles.profileBannerSubtext}>
                  Tracking for {activeProfile?.relation || "Dependent"}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => navigateToProfileTab("ManageProfiles")}
                style={styles.switchButton}
              >
                <Feather name="users" size={18} color={KeziColors.brand.purple500} />
              </Pressable>
            </GlassCard>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <KeziBrandIcon size={80} showBackground />
            </View>
            
            <ThemedText type="h3" style={styles.emptyTitle}>
              Start Tracking {activeProfile?.isPrimary ? "Your" : `${profileName}'s`} Cycle
            </ThemedText>
            
            <ThemedText type="body" style={styles.emptyDescription}>
              Set up cycle information to get personalized insights, predictions, and wellness recommendations.
            </ThemedText>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: KeziColors.brand.pink100 }]}>
                  <Feather name="calendar" size={20} color={KeziColors.brand.pink500} />
                </View>
                <ThemedText type="body" style={styles.featureText}>
                  Track period and fertile days
                </ThemedText>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: KeziColors.brand.purple100 }]}>
                  <Feather name="zap" size={20} color={KeziColors.brand.purple600} />
                </View>
                <ThemedText type="body" style={styles.featureText}>
                  Get phase-specific wellness tips
                </ThemedText>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: KeziColors.brand.teal50 }]}>
                  <Feather name="heart" size={20} color={KeziColors.brand.teal600} />
                </View>
                <ThemedText type="body" style={styles.featureText}>
                  Log symptoms and moods daily
                </ThemedText>
              </View>
            </View>

            <Button
              onPress={handleSetupCycle}
              style={styles.setupButton}
            >
              Set Up Cycle
            </Button>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard style={styles.privacyNote}>
            <Feather name="shield" size={20} color={KeziColors.brand.teal600} />
            <ThemedText type="small" style={styles.privacyText}>
              Your data stays private and secure. Only you can see cycle information.
            </ThemedText>
          </GlassCard>
        </Animated.View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      {!activeProfile?.isPrimary ? (
        <Animated.View entering={FadeInDown.delay(50).duration(500)}>
          <GlassCard style={styles.profileBanner}>
            <View style={[styles.profileAvatar, { backgroundColor: KeziColors.brand.purple100 }]}>
              <ThemedText type="h4" style={{ color: KeziColors.brand.purple600 }}>
                {profileName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.profileBannerInfo}>
              <ThemedText type="body" style={styles.profileBannerName}>
                {profileName}'s Cycle
              </ThemedText>
              <ThemedText type="small" style={styles.profileBannerSubtext}>
                Day {cycleInfo.currentDay} of {totalDays}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => navigateToProfileTab("ManageProfiles")}
              style={styles.switchButton}
            >
              <Feather name="users" size={18} color={KeziColors.brand.purple500} />
            </Pressable>
          </GlassCard>
        </Animated.View>
      ) : null}

      {isWideScreen ? (
        <View style={styles.wideScreenRow}>
          <View style={styles.wideScreenColumn}>
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <GlassCard style={styles.mainCard}>
                <View style={styles.wheelSection}>
                  <CycleWheel
                    currentDay={cycleInfo.currentDay}
                    totalDays={totalDays}
                    phase={cycleInfo.phase}
                  />
                </View>

                <View style={styles.phaseSection}>
                  <PhaseChip phase={cycleInfo.phase} />
                  <ThemedText type="body" style={styles.phaseDesc}>
                    {getPhaseDescription(cycleInfo.phase)}
                  </ThemedText>
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <InsightCard
                phase={cycleInfo.phase}
                tip={PHASE_INSIGHTS[cycleInfo.phase]}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.quickLogSection}>
              <QuickLog
                selectedDay={selectedDay || cycleInfo.currentDay}
                phase={selectedDayPhase}
                onLogSymptom={handleLogSymptom}
              />
            </Animated.View>
          </View>

          <View style={styles.wideScreenColumn}>
            <Animated.View entering={FadeInDown.delay(250).duration(500)}>
              <ThemedText type="sectionHeader" style={styles.sectionLabel}>
                CALENDAR
              </ThemedText>
              <CycleCalendar
                currentDay={cycleInfo.currentDay}
                totalDays={totalDays}
                periodLength={periodLength}
                cycleStartDate={cycleStartDate}
                selectedDay={selectedDay}
                onDaySelect={handleDaySelect}
                loggedDays={loggedDays}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Button
                onPress={() => navigateToScreen("CycleTab", "Journal")}
                style={styles.journalButton}
              >
                Add Journal Entry
              </Button>
            </Animated.View>
          </View>
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <GlassCard style={styles.mainCard}>
              <View style={styles.wheelSection}>
                <CycleWheel
                  currentDay={cycleInfo.currentDay}
                  totalDays={totalDays}
                  phase={cycleInfo.phase}
                />
              </View>

              <View style={styles.phaseSection}>
                <PhaseChip phase={cycleInfo.phase} />
                <ThemedText type="body" style={styles.phaseDesc}>
                  {getPhaseDescription(cycleInfo.phase)}
                </ThemedText>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <InsightCard
              phase={cycleInfo.phase}
              tip={PHASE_INSIGHTS[cycleInfo.phase]}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.quickLogSection}>
            <QuickLog
              selectedDay={selectedDay || cycleInfo.currentDay}
              phase={selectedDayPhase}
              onLogSymptom={handleLogSymptom}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.calendarSection}>
            <ThemedText type="sectionHeader" style={styles.sectionLabel}>
              CALENDAR
            </ThemedText>
            <CycleCalendar
              currentDay={cycleInfo.currentDay}
              totalDays={totalDays}
              periodLength={periodLength}
              cycleStartDate={cycleStartDate}
              selectedDay={selectedDay}
              onDaySelect={handleDaySelect}
              loggedDays={loggedDays}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Button
              onPress={() => navigateToScreen("CycleTab", "Journal")}
              style={styles.journalButton}
            >
              Add Journal Entry
            </Button>
          </Animated.View>

          {!isAnonymous ? (
            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <ThemedText type="sectionHeader" style={styles.sectionLabel}>
                PREDICTIONS
              </ThemedText>
              {predictions.length > 0 ? (
                <GlassCard style={styles.predictionsCard}>
                  <View style={styles.predictionHeader}>
                    <View style={styles.predictionTitleRow}>
                      <Feather name="trending-up" size={18} color={KeziColors.brand.purple600} />
                      <ThemedText type="h4" style={styles.predictionTitle}>
                        Cycle Predictions
                      </ThemedText>
                    </View>
                    <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(Number(predictions[0]?.confidence || 0)) + "20" }]}>
                      <ThemedText type="small" style={[styles.confidenceText, { color: getConfidenceColor(Number(predictions[0]?.confidence || 0)) }]}>
                        {getConfidenceLabel(Number(predictions[0]?.confidence || 0))} confidence
                      </ThemedText>
                    </View>
                  </View>
                  {predictions.slice(0, 3).map((pred, index) => (
                    <View key={pred.id || index} style={[styles.predictionItem, index > 0 ? styles.predictionItemBorder : null]}>
                      <View style={styles.predictionCycle}>
                        <View style={[styles.predictionDot, { backgroundColor: KeziColors.phases.menstrual.primary }]} />
                        <View style={styles.predictionDates}>
                          <ThemedText type="body" style={styles.predictionLabel}>
                            {index === 0 ? "Next Period" : `Cycle +${index + 1}`}
                          </ThemedText>
                          <ThemedText type="small" style={styles.predictionDateRange}>
                            {formatPredictionDate(pred.predicted_period_start)} - {formatPredictionDate(pred.predicted_period_end)}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.predictionDetails}>
                        <View style={styles.predictionDetailItem}>
                          <Feather name="zap" size={12} color={KeziColors.phases.ovulation.primary} />
                          <ThemedText type="small" style={styles.predictionDetailText}>
                            Ovulation: {formatPredictionDate(pred.predicted_ovulation)}
                          </ThemedText>
                        </View>
                        <View style={styles.predictionDetailItem}>
                          <Feather name="heart" size={12} color={KeziColors.brand.pink500} />
                          <ThemedText type="small" style={styles.predictionDetailText}>
                            Fertile: {formatPredictionDate(pred.fertile_window_start)} - {formatPredictionDate(pred.fertile_window_end)}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  ))}
                  <Pressable onPress={generatePredictions} style={styles.refreshButton}>
                    {predictionsLoading ? (
                      <ActivityIndicator size="small" color={KeziColors.brand.purple600} />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={14} color={KeziColors.brand.purple600} />
                        <ThemedText type="small" style={styles.refreshText}>
                          Refresh predictions
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                </GlassCard>
              ) : (
                <GlassCard style={styles.predictionsCard}>
                  <View style={styles.emptyPredictions}>
                    <Feather name="trending-up" size={32} color={KeziColors.brand.purple400} />
                    <ThemedText type="body" style={styles.emptyPredictionsTitle}>
                      AI Predictions
                    </ThemedText>
                    <ThemedText type="small" style={styles.emptyPredictionsDesc}>
                      Track at least 2 cycles to unlock AI-powered predictions for your period, ovulation, and fertile window.
                    </ThemedText>
                    <Button onPress={generatePredictions} style={styles.generateButton}>
                      {predictionsLoading ? "Generating..." : "Generate Predictions"}
                    </Button>
                  </View>
                </GlassCard>
              )}
            </Animated.View>
          ) : null}
        </>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  wideScreenRow: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  wideScreenColumn: {
    flex: 1,
  },
  mainCard: {
    marginBottom: Spacing.xl,
  },
  wheelSection: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  phaseSection: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  phaseDesc: {
    textAlign: "center",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    opacity: 0.7,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  quickLogSection: {
    marginTop: Spacing.xl,
  },
  calendarSection: {
    marginTop: Spacing.xl,
  },
  journalButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  emptyDescription: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  featureList: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
    opacity: 0.8,
  },
  setupButton: {
    width: "100%",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  privacyText: {
    flex: 1,
    marginLeft: Spacing.md,
    color: KeziColors.brand.teal600,
    opacity: 0.9,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBannerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileBannerName: {
    fontWeight: "600",
  },
  profileBannerSubtext: {
    opacity: 0.6,
    marginTop: 2,
  },
  switchButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: KeziColors.brand.purple50,
  },
  predictionsCard: {
    marginBottom: Spacing.xl,
  },
  predictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  predictionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  predictionTitle: {
    marginLeft: 4,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  confidenceText: {
    fontWeight: "600",
    fontSize: 11,
  },
  predictionItem: {
    paddingVertical: Spacing.md,
  },
  predictionItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  predictionCycle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  predictionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  predictionDates: {
    flex: 1,
  },
  predictionLabel: {
    fontWeight: "600",
  },
  predictionDateRange: {
    opacity: 0.6,
    marginTop: 2,
  },
  predictionDetails: {
    marginLeft: 18,
    gap: 4,
  },
  predictionDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  predictionDetailText: {
    opacity: 0.7,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
    gap: 6,
  },
  refreshText: {
    color: KeziColors.brand.purple600,
    fontWeight: "500",
  },
  emptyPredictions: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  emptyPredictionsTitle: {
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptyPredictionsDesc: {
    textAlign: "center",
    opacity: 0.6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    lineHeight: 20,
  },
  generateButton: {
    minWidth: 200,
  },
});
