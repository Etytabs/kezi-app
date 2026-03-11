import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, CyclePhase } from "@/constants/theme";
import { getPhaseName, getPhaseIcon } from "@/services/cycleService";

interface PhaseChipProps {
  phase: CyclePhase;
  size?: "small" | "medium";
}

export function PhaseChip({ phase, size = "medium" }: PhaseChipProps) {
  const { getPhaseColors } = useTheme();
  const phaseColors = getPhaseColors(phase);
  const iconName = getPhaseIcon(phase) as React.ComponentProps<typeof Feather>["name"];

  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: phaseColors.background,
          paddingVertical: isSmall ? Spacing.xs : Spacing.sm,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
        },
      ]}
    >
      <Feather
        name={iconName}
        size={isSmall ? 12 : 14}
        color={phaseColors.primary}
        style={styles.icon}
      />
      <ThemedText
        type="chip"
        style={[styles.label, { color: phaseColors.primary }]}
      >
        {getPhaseName(phase).toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: "700",
  },
});
