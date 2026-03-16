import React from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useDiscreetMode } from "@/context/DiscreetModeContext";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

interface PrivacyVeilProps {
  children: React.ReactNode;
  sensitiveLevel?: "high" | "medium" | "low";
  placeholder?: string;
  showPlaceholder?: boolean;
  style?: any;
}

export function PrivacyVeil({
  children,
  sensitiveLevel = "high",
  placeholder = "Private",
  showPlaceholder = true,
  style,
}: PrivacyVeilProps) {
  const { isDark } = useTheme();
  const { isDiscreetMode, toggleDiscreetMode } = useDiscreetMode();

  if (!isDiscreetMode) {
    return <View style={style}>{children}</View>;
  }

  const blurIntensity = sensitiveLevel === "high" ? 20 : sensitiveLevel === "medium" ? 15 : 10;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.hiddenContent}>{children}</View>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={StyleSheet.absoluteFill}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={blurIntensity}
            tint={isDark ? "dark" : "light"}
            style={[styles.blurOverlay, styles.centered]}
          >
            {showPlaceholder ? (
              <Pressable onLongPress={toggleDiscreetMode} style={styles.placeholderContent}>
                <Feather
                  name="eye-off"
                  size={18}
                  color={isDark ? KeziColors.gray[400] : KeziColors.gray[500]}
                />
                <ThemedText style={styles.placeholderText}>{placeholder}</ThemedText>
              </Pressable>
            ) : null}
          </BlurView>
        ) : (
          <View
            style={[
              styles.fallbackOverlay,
              {
                backgroundColor: isDark
                  ? "rgba(26, 16, 37, 0.95)"
                  : "rgba(255, 255, 255, 0.95)",
              },
              styles.centered,
            ]}
          >
            {showPlaceholder ? (
              <Pressable onLongPress={toggleDiscreetMode} style={styles.placeholderContent}>
                <Feather
                  name="eye-off"
                  size={18}
                  color={isDark ? KeziColors.gray[400] : KeziColors.gray[500]}
                />
                <ThemedText style={styles.placeholderText}>{placeholder}</ThemedText>
              </Pressable>
            ) : null}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

type TextType = "link" | "small" | "body" | "h1" | "h2" | "h3" | "h4" | "logotype" | "hero" | "sectionHeader" | "chip" | "displayNumber";

interface SensitiveTextProps {
  children: React.ReactNode;
  style?: any;
  mask?: string;
  type?: TextType;
}

export function SensitiveText({
  children,
  style,
  mask = "***",
  type,
}: SensitiveTextProps) {
  const { isDiscreetMode } = useDiscreetMode();

  if (isDiscreetMode) {
    return <ThemedText style={[style, styles.maskedText]} type={type}>{mask}</ThemedText>;
  }

  return <ThemedText style={style} type={type}>{children}</ThemedText>;
}

export function DiscreetModeToggle({ compact = false }: { compact?: boolean }) {
  const { isDark } = useTheme();
  const { isDiscreetMode, toggleDiscreetMode } = useDiscreetMode();

  return (
    <Pressable
      onPress={toggleDiscreetMode}
      style={({ pressed }) => [
        compact ? styles.compactToggle : styles.toggleButton,
        {
          backgroundColor: isDiscreetMode
            ? KeziColors.brand.purple500
            : isDark
              ? KeziColors.night.surface
              : KeziColors.gray[100],
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather
        name={isDiscreetMode ? "eye-off" : "eye"}
        size={compact ? 16 : 20}
        color={
          isDiscreetMode
            ? "#FFFFFF"
            : isDark
              ? KeziColors.gray[400]
              : KeziColors.gray[600]
        }
      />
      {!compact ? (
        <ThemedText
          style={[
            styles.toggleText,
            isDiscreetMode && styles.toggleTextActive,
          ]}
        >
          {isDiscreetMode ? "Discreet Mode" : "Show All"}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  hiddenContent: {
    opacity: 0,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.md,
  },
  fallbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.md,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  placeholderText: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: "500",
  },
  maskedText: {
    letterSpacing: 2,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  compactToggle: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
});
