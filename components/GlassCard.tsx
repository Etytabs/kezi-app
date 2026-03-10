import React, { ReactNode } from "react";
import { StyleSheet, Pressable, View, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, GlassMaterial, DeepLavender, Animations } from "@/constants/theme";

interface GlassCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  blurIntensity?: number;
  disabled?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: Animations.spring.damping,
  mass: Animations.spring.mass,
  stiffness: Animations.spring.stiffness,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  onPress,
  style,
  contentStyle,
  blurIntensity = DeepLavender.glass.blur,
  disabled = false,
}: GlassCardProps) {
  const { isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && onPress) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && onPress) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getMaterialStyle = () => {
    if (isDark) {
      return {
        backgroundColor: `rgba(46, 32, 53, ${DeepLavender.glass.opacity})`,
        borderColor: DeepLavender.innerGlow,
        borderWidth: 1,
      };
    }
    return {
      backgroundColor: GlassMaterial.light.backgroundColor,
      borderColor: GlassMaterial.light.borderColor,
      borderWidth: GlassMaterial.light.borderWidth,
    };
  };

  const materialStyle = getMaterialStyle();

  const cardContent = (
    <View
      style={[
        styles.content,
        materialStyle,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.card,
          !isDark && Shadows.md,
          style,
          animatedStyle
        ]}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={[
      styles.card,
      !isDark && Shadows.sm,
      style,
      animatedStyle
    ]}>
      {cardContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  content: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
});
