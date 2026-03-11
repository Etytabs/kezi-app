import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { KeziColors, CycleWheelSpec, Spacing, Shadows } from "@/constants/theme";
import { CyclePhase } from "@/constants/theme";

interface CycleWheelProps {
  currentDay: number;
  totalDays: number;
  phase: CyclePhase;
}

const SIZE = CycleWheelSpec.size;
const STROKE_WIDTH = CycleWheelSpec.strokeWidth;
const RADIUS = CycleWheelSpec.radius;
const CIRCUMFERENCE = CycleWheelSpec.circumference;

const AnimatedView = Animated.createAnimatedComponent(View);

export function CycleWheel({ currentDay, totalDays, phase }: CycleWheelProps) {
  const { isDark } = useTheme();
  
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));
  
  const progress = currentDay / totalDays;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const ovulationDay = Math.round(totalDays / 2);
  const ovulationProgress = ovulationDay / totalDays;
  const ovulationAngle = ovulationProgress * 2 * Math.PI - Math.PI / 2;
  const ovulationX = SIZE / 2 + RADIUS * Math.cos(ovulationAngle);
  const ovulationY = SIZE / 2 + RADIUS * Math.sin(ovulationAngle);

  const knobAngle = progress * 2 * Math.PI - Math.PI / 2;
  const knobX = SIZE / 2 + RADIUS * Math.cos(knobAngle);
  const knobY = SIZE / 2 + RADIUS * Math.sin(knobAngle);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F472B6" />
            <Stop offset="100%" stopColor="#A855F7" />
          </LinearGradient>
        </Defs>
        
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={isDark ? "rgba(255,255,255,0.05)" : KeziColors.gray[100]}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeLinecap="round"
        />
        
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="url(#progressGradient)"
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        
        <Circle
          cx={ovulationX}
          cy={ovulationY}
          r={4}
          stroke={KeziColors.brand.purple600}
          strokeWidth={2}
          fill={isDark ? KeziColors.night.surface : "#FFFFFF"}
        />
      </Svg>

      <View style={[styles.knobContainer, { left: knobX - 10, top: knobY - 10 }]}>
        <AnimatedView 
          style={[
            styles.pulseRing, 
            pulseAnimatedStyle,
            { borderColor: KeziColors.brand.purple500 }
          ]} 
        />
        <View
          style={[
            styles.knob,
            {
              backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF",
              borderColor: KeziColors.brand.purple500,
            },
          ]}
        />
      </View>
      
      <View style={styles.centerContent}>
        <ThemedText type="displayNumber" style={styles.dayNumber}>
          {currentDay}
        </ThemedText>
        <ThemedText type="small" style={styles.dayLabel}>
          Day of {totalDays}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    marginBottom: -Spacing.xs,
  },
  dayLabel: {
    opacity: 0.6,
  },
  knobContainer: {
    position: "absolute",
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    ...Shadows.md,
  },
});
