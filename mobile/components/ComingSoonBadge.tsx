import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

interface ComingSoonBadgeProps {
  size?: "small" | "medium";
  style?: any;
}

export function ComingSoonBadge({ size = "small", style }: ComingSoonBadgeProps) {
  const isSmall = size === "small";

  return (
    <LinearGradient
      colors={[KeziColors.brand.pink500, KeziColors.brand.purple600]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.badge,
        isSmall ? styles.badgeSmall : styles.badgeMedium,
        style,
      ]}
    >
      <Feather 
        name="clock" 
        size={isSmall ? 10 : 12} 
        color="#FFFFFF" 
      />
      <ThemedText style={[styles.text, isSmall ? styles.textSmall : styles.textMedium]}>
        Soon
      </ThemedText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  badgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeMedium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
});
