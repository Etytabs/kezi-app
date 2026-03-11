import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, KeziColors } from "@/constants/theme";

interface CardProps {
  children?: ReactNode;
  elevation?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const getBackgroundColorForElevation = (
  elevation: number,
  isDark: boolean,
): string => {
  if (isDark) {
    switch (elevation) {
      case 1:
        return KeziColors.night.surface;
      case 2:
        return KeziColors.night.deep;
      case 3:
        return "#4D3A5C";
      default:
        return KeziColors.night.base;
    }
  }
  switch (elevation) {
    case 1:
      return KeziColors.gray[50];
    case 2:
      return KeziColors.gray[100];
    case 3:
      return KeziColors.gray[200];
    default:
      return "#FFFFFF";
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ children, elevation = 1, onPress, style }: CardProps) {
  const { isDark } = useTheme();
  const scale = useSharedValue(1);

  const cardBackgroundColor = getBackgroundColorForElevation(elevation, isDark);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, springConfig);
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[
        styles.card,
        Shadows.sm,
        {
          backgroundColor: cardBackgroundColor,
        },
        style,
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
});
