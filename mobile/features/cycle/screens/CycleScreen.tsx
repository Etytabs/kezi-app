import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { KeziBrandIcon } from "@/components/KeziBrandIcon";

import { CycleWheel } from "../components/CycleWheel";
import { CycleCalendar } from "../components/CycleCalendar";
import { PhaseChip } from "../components/PhaseChip";
import { InsightCard } from "../components/InsightCard";
import { QuickLog, SymptomType } from "../components/QuickLog";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfileContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

import { navigateToProfileTab, navigateToScreen } from "@/services/navigation";

import {
  calculateCycleInfo,
  getPhaseDescription,
  getPhaseForDay,
  CyclePhase,
} from "@/services/cycleService";

import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { useScrollContext } from "@/navigation/MainTabNavigator";

const AUTH_TOKEN_KEY = "@kezi/auth_token";

function getApiUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined" && !window.location.origin.includes("localhost")) {
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
  follicular: "Energy is rising — great time for new projects!",
  ovulation: "Peak fertility and energy. You may feel more social.",
  luteal: "Focus on self-care as your body prepares for a new cycle.",
};

export default function CycleScreen() {
  const { isAnonymous } = useAuth();
  const { activeProfile } = useProfiles();
  const layout = useResponsiveLayout();
  const { scrollHandler } = useScrollContext();

  const isWideScreen = layout.isTablet || layout.isDesktop;

  const cycleConfig = activeProfile?.cycleConfig ?? null;
  const profileName = activeProfile?.name ?? "You";

  const cycleInfo = useMemo(() => calculateCycleInfo(cycleConfig), [cycleConfig]);

  const totalDays = cycleConfig?.cycleLength ?? 28;
  const periodLength = cycleConfig?.periodLength ?? 5;

  const cycleStartDate = useMemo(() => {
    if (!cycleConfig?.lastPeriodDate) return new Date();
    return new Date(cycleConfig.lastPeriodDate);
  }, [cycleConfig]);

  const [selectedDay, setSelectedDay] = useState<number | null>(
    cycleInfo.hasData ? cycleInfo.currentDay : null
  );

  const [loggedDays, setLoggedDays] = useState<number[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  useEffect(() => {
    if (!cycleInfo.hasData || isAnonymous) return;
    loadPredictions();
  }, [cycleInfo.hasData, isAnonymous]);

  async function loadPredictions() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      const res = await fetch(`${getApiUrl()}/cycle/predictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions ?? []);
      }
    } catch {
      console.log("Failed to load predictions");
    }
  }

  async function generatePredictions() {
    setPredictionsLoading(true);

    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      const res = await fetch(`${getApiUrl()}/cycle/predictions/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions ?? []);
      }
    } finally {
      setPredictionsLoading(false);
    }
  }

  const selectedDayPhase = useMemo(() => {
    if (!selectedDay) return cycleInfo.phase;
    return getPhaseForDay(selectedDay, totalDays, periodLength);
  }, [selectedDay, totalDays, periodLength, cycleInfo.phase]);

  const handleDaySelect = useCallback((day: number) => {
    setSelectedDay(day);
  }, []);

  const handleLogSymptom = useCallback(
    (symptom: SymptomType) => {
      if (selectedDay && !loggedDays.includes(selectedDay)) {
        setLoggedDays((prev) => [...prev, selectedDay]);
      }
    },
    [selectedDay, loggedDays]
  );

  const handleSetupCycle = () => {
    if (activeProfile?.isPrimary) {
      navigateToProfileTab("Settings");
    } else {
      navigateToProfileTab("ManageProfiles");
    }
  };

  if (!cycleInfo.hasData) {
    return (
      <ScreenScrollView onScroll={scrollHandler}>
        <GlassCard style={styles.emptyCard}>
          <KeziBrandIcon size={80} showBackground />

          <ThemedText type="h3" style={styles.emptyTitle}>
            Start Tracking {profileName}'s Cycle
          </ThemedText>

          <Button onPress={handleSetupCycle} style={styles.setupButton}>
            Set Up Cycle
          </Button>
        </GlassCard>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView onScroll={scrollHandler}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GlassCard style={styles.mainCard}>
          <CycleWheel
            currentDay={cycleInfo.currentDay}
            totalDays={totalDays}
            phase={cycleInfo.phase}
          />

          <PhaseChip phase={cycleInfo.phase} />

          <ThemedText style={styles.phaseDesc}>
            {getPhaseDescription(cycleInfo.phase)}
          </ThemedText>
        </GlassCard>
      </Animated.View>

      <InsightCard
        phase={cycleInfo.phase}
        tip={PHASE_INSIGHTS[cycleInfo.phase]}
      />

      <QuickLog
        selectedDay={selectedDay ?? cycleInfo.currentDay}
        phase={selectedDayPhase}
        onLogSymptom={handleLogSymptom}
      />

      <CycleCalendar
        currentDay={cycleInfo.currentDay}
        totalDays={totalDays}
        periodLength={periodLength}
        cycleStartDate={cycleStartDate}
        selectedDay={selectedDay}
        onDaySelect={handleDaySelect}
        loggedDays={loggedDays}
      />

      {!isAnonymous && (
        <GlassCard style={styles.predictionsCard}>
          {predictionsLoading ? (
            <ActivityIndicator />
          ) : (
            <Button onPress={generatePredictions}>
              Generate Predictions
            </Button>
          )}
        </GlassCard>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    marginBottom: Spacing.xl,
  },

  phaseDesc: {
    textAlign: "center",
    marginTop: Spacing.md,
  },

  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },

  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  setupButton: {
    width: "100%",
  },

  predictionsCard: {
    marginTop: Spacing.xl,
  },
});