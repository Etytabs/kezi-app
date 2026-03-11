import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, KeziColors } from "@/constants/theme";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "medium",
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(0.95, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getHeight = () => {
    switch (size) {
      case "small":
        return 40;
      case "large":
        return 56;
      default:
        return 52;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 13;
      case "large":
        return 16;
      default:
        return 14;
    }
  };

  const renderContent = () => {
    const textColor = variant === "primary" ? "#FFFFFF" : 
                     variant === "outline" || variant === "ghost" ? theme.link : 
                     theme.text;

    if (loading) {
      return <ActivityIndicator size="small" color={textColor} />;
    }

    return (
      <ThemedText
        type="body"
        style={[
          styles.buttonText,
          { color: textColor, fontSize: getFontSize() },
        ]}
      >
        {children}
      </ThemedText>
    );
  };

  if (variant === "primary") {
    return (
      <AnimatedPressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[animatedStyle, style]}
      >
        <LinearGradient
          colors={[KeziColors.brand.pink500, KeziColors.brand.purple600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            { height: getHeight(), opacity: isDisabled ? 0.5 : 1 },
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  const getButtonStyle = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[100],
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: theme.link,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      default:
        return {};
    }
  };

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.button,
        { height: getHeight(), opacity: isDisabled ? 0.5 : 1 },
        getButtonStyle(),
        style,
        animatedStyle,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    fontWeight: "600",
  },
});
