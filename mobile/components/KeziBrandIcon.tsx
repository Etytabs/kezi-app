import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { KeziLogo } from "./KeziLogo";
import { KeziColors } from "@/constants/theme";

interface KeziBrandIconProps {
  size?: number;
  animated?: boolean;
  animationType?: "spin" | "pulse" | "none";
  showBackground?: boolean;
}

export function KeziBrandIcon({
  size = 24,
  animated = false,
  animationType = "none",
  showBackground = false,
}: KeziBrandIconProps) {
  const logo = (
    <KeziLogo
      size={size}
      animated={animated}
      animationType={animationType}
    />
  );

  if (showBackground) {
    const containerSize = size * 1.6;
    const borderRadiusValue = containerSize / 4;

    if (Platform.OS === "ios") {
      return (
        <View style={[styles.backgroundContainer, { width: containerSize, height: containerSize, borderRadius: borderRadiusValue }]}>
          <BlurView
            intensity={20}
            tint="light"
            style={[styles.blurBackground, { borderRadius: borderRadiusValue }]}
          >
            <View style={styles.tintOverlay} />
            {logo}
          </BlurView>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.fallbackBackground,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: borderRadiusValue,
          },
        ]}
      >
        {logo}
      </View>
    );
  }

  return logo;
}

const styles = StyleSheet.create({
  backgroundContainer: {
    overflow: "hidden",
  },
  blurBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(253, 242, 248, 0.5)",
  },
  fallbackBackground: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KeziColors.brand.pink100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
});

export { KeziLogo };
