import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { PhaseIcon, getPhaseLabel, getPhaseDescription } from "@/components/PhaseIcon";
import { Spacing, BorderRadius, CyclePhase, PhaseGradients, KeziColors } from "@/constants/theme";

interface InsightCardProps {
  phase: CyclePhase;
  tip?: string;
  icon?: keyof typeof Feather.glyphMap;
  title?: string;
  onPress?: () => void;
  showPhaseIcon?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function InsightCard({ phase, tip, icon, title, onPress, showPhaseIcon = true }: InsightCardProps) {
  const scale = useSharedValue(1);
  const phaseGradient = PhaseGradients[phase];
  const gradientColors = phaseGradient.colors as [string, string];
  const displayTitle = title || `Daily Insight: ${getPhaseLabel(phase)}`;
  const displayTip = tip || getPhaseDescription(phase);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <View style={styles.cardWrapper}>
        <View style={[styles.accentBar, { backgroundColor: gradientColors[0] }]} />
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.card}
        >
          <View style={styles.header}>
            {showPhaseIcon ? (
              <View style={styles.iconBubble}>
                {Platform.OS !== "web" ? (
                  <BlurView intensity={10} style={StyleSheet.absoluteFill} />
                ) : null}
                <PhaseIcon phase={phase} size={24} />
              </View>
            ) : null}
            <View style={styles.textContent}>
              <ThemedText style={styles.title}>
                {displayTitle}
              </ThemedText>
              <ThemedText style={styles.body}>
                {displayTip}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
  },
  card: {
    flex: 1,
    padding: Spacing.lg,
    flexDirection: "row",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  body: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
});
