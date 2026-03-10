import React from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

import { KeziColors, Typography } from "@/constants/theme";

interface GradientLogotypeProps {
  size?: "small" | "medium" | "large";
}

const SIZES = {
  small: 18,
  medium: 24,
  large: 32,
};

export function GradientLogotype({ size = "medium" }: GradientLogotypeProps) {
  const fontSize = SIZES[size];
  const letterSpacing = -0.025 * fontSize;

  if (Platform.OS === "web") {
    return (
      <Text
        style={[
          styles.text,
          {
            fontSize,
            letterSpacing,
            backgroundImage: `linear-gradient(to right, ${KeziColors.brand.pink500}, ${KeziColors.brand.purple600})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          } as any,
        ]}
      >
        Kezi
      </Text>
    );
  }

  return (
    <MaskedView
      style={{ height: fontSize * 1.2 }}
      maskElement={
        <Text
          style={[
            styles.text,
            {
              fontSize,
              letterSpacing,
              color: "#000",
            },
          ]}
        >
          Kezi
        </Text>
      }
    >
      <ExpoLinearGradient
        colors={[KeziColors.brand.pink500, KeziColors.brand.purple600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, height: fontSize * 1.2 }}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: "700",
  },
});
