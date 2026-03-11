import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import {
  KeziColors,
  Spacing,
  BorderRadius,
  CyclePhase,
} from "@/constants/theme";

interface QuickLogProps {
  selectedDay: number;
  phase: CyclePhase;
  onLogSymptom: (symptom: SymptomType) => void;
}

export type SymptomType = 
  | "cramps"
  | "headache"
  | "fatigue"
  | "mood"
  | "bloating"
  | "spotting"
  | "sleep"
  | "exercise";

interface SymptomConfig {
  type: SymptomType;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

const SYMPTOMS: SymptomConfig[] = [
  { type: "cramps", label: "Cramps", icon: "activity", color: "#F472B6" },
  { type: "headache", label: "Headache", icon: "cloud", color: "#F97316" },
  { type: "fatigue", label: "Fatigue", icon: "battery", color: "#FBBF24" },
  { type: "mood", label: "Mood", icon: "heart", color: "#EC4899" },
  { type: "bloating", label: "Bloating", icon: "circle", color: "#60A5FA" },
  { type: "spotting", label: "Spotting", icon: "droplet", color: "#F43F5E" },
  { type: "sleep", label: "Sleep", icon: "moon", color: "#8B5CF6" },
  { type: "exercise", label: "Exercise", icon: "zap", color: "#10B981" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SymptomButtonProps {
  config: SymptomConfig;
  isDark: boolean;
  onPress: () => void;
}

function SymptomButton({ config, isDark, onPress }: SymptomButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.symptomButton,
        animatedStyle,
        {
          backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF",
          borderColor: isDark ? "rgba(255,255,255,0.05)" : KeziColors.gray[100],
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${config.color}20` }]}>
        <Feather name={config.icon} size={16} color={config.color} />
      </View>
      <ThemedText style={styles.symptomLabel}>{config.label}</ThemedText>
    </AnimatedPressable>
  );
}

export function QuickLog({ selectedDay, phase, onLogSymptom }: QuickLogProps) {
  const { isDark } = useTheme();
  
  const isPeriodDay = phase === "menstrual";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Day {selectedDay}</ThemedText>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isPeriodDay
                ? isDark
                  ? "rgba(244, 114, 182, 0.2)"
                  : KeziColors.brand.pink100
                : isDark
                ? "rgba(156, 163, 175, 0.2)"
                : KeziColors.gray[100],
            },
          ]}
        >
          <ThemedText
            style={[
              styles.badgeText,
              {
                color: isPeriodDay
                  ? isDark
                    ? KeziColors.brand.pink400
                    : KeziColors.brand.pink500
                  : isDark
                  ? KeziColors.gray[400]
                  : KeziColors.gray[500],
              },
            ]}
          >
            {isPeriodDay ? "PERIOD DAY" : "NORMAL DAY"}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.sectionTitle}>Quick Add</ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {SYMPTOMS.map((symptom) => (
          <SymptomButton
            key={symptom.type}
            config={symptom}
            isDark={isDark}
            onPress={() => onLogSymptom(symptom.type)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollView: {
    marginHorizontal: -Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  symptomButton: {
    minWidth: 72,
    width: 72,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  symptomLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
