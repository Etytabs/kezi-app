import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { CyclePhase, KeziColors } from "@/constants/theme";

interface PhaseIconProps {
  phase: CyclePhase;
  size?: number;
  showBackground?: boolean;
}

export function PhaseIcon({ phase, size = 24, showBackground = false }: PhaseIconProps) {
  const getColors = () => {
    switch (phase) {
      case "menstrual":
        return {
          primary: KeziColors.brand.pink500,
          secondary: KeziColors.brand.pink300,
          background: KeziColors.brand.pink100,
        };
      case "follicular":
        return {
          primary: KeziColors.brand.teal600,
          secondary: KeziColors.brand.teal400,
          background: KeziColors.brand.teal50,
        };
      case "ovulation":
        return {
          primary: KeziColors.brand.purple600,
          secondary: KeziColors.brand.purple400,
          background: KeziColors.brand.purple100,
        };
      case "luteal":
        return {
          primary: KeziColors.gray[600],
          secondary: KeziColors.gray[400],
          background: KeziColors.gray[100],
        };
    }
  };

  const colors = getColors();
  const iconSize = showBackground ? size * 0.6 : size;

  const renderIcon = () => {
    switch (phase) {
      case "menstrual":
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Defs>
              <LinearGradient id="dropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.secondary} />
                <Stop offset="100%" stopColor={colors.primary} />
              </LinearGradient>
            </Defs>
            <Path
              d="M12 2C12 2 5 10 5 15C5 18.866 8.134 22 12 22C15.866 22 19 18.866 19 15C19 10 12 2 12 2Z"
              fill="url(#dropGradient)"
            />
            <Path
              d="M9 15C9 13.343 10.343 12 12 12"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity={0.6}
            />
          </Svg>
        );

      case "follicular":
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Defs>
              <LinearGradient id="babyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.secondary} />
                <Stop offset="100%" stopColor={colors.primary} />
              </LinearGradient>
            </Defs>
            <Circle cx="12" cy="12" r="10" fill="url(#babyGradient)" />
            <Circle cx="9" cy="10" r="1.5" fill="white" />
            <Circle cx="15" cy="10" r="1.5" fill="white" />
            <Path
              d="M9 15C9 15 10.5 17 12 17C13.5 17 15 15 15 15"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </Svg>
        );

      case "ovulation":
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Defs>
              <LinearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.secondary} />
                <Stop offset="100%" stopColor={colors.primary} />
              </LinearGradient>
            </Defs>
            <Path
              d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
              fill="url(#starGradient)"
            />
            <Circle cx="12" cy="11" r="3" fill="white" opacity={0.3} />
          </Svg>
        );

      case "luteal":
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Defs>
              <LinearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.secondary} />
                <Stop offset="100%" stopColor={colors.primary} />
              </LinearGradient>
            </Defs>
            <Path
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
              fill="url(#moonGradient)"
            />
            <Circle cx="14" cy="9" r="1" fill="white" opacity={0.3} />
            <Circle cx="10" cy="14" r="1.5" fill="white" opacity={0.2} />
          </Svg>
        );
    }
  };

  if (showBackground) {
    return (
      <View style={[styles.background, { width: size, height: size, backgroundColor: colors.background }]}>
        {renderIcon()}
      </View>
    );
  }

  return renderIcon();
}

export function getPhaseLabel(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual":
      return "Period";
    case "follicular":
      return "Fertile Window";
    case "ovulation":
      return "Ovulation Day";
    case "luteal":
      return "Luteal Phase";
  }
}

export function getPhaseDescription(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual":
      return "Rest and take care of yourself. Your body is renewing.";
    case "follicular":
      return "High chance of conception. Energy levels are usually high.";
    case "ovulation":
      return "Peak fertility and energy. You may feel more confident.";
    case "luteal":
      return "Wind down and prepare. Focus on self-care and relaxation.";
  }
}

const styles = StyleSheet.create({
  background: {
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
