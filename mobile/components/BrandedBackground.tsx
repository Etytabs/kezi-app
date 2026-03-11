import React from "react";
import { View, StyleSheet, useColorScheme, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeziLogo } from "@/components/KeziLogo";
import { DeepLavender } from "@/constants/theme";

interface BrandedBackgroundProps {
  children: React.ReactNode;
  variant?: "default" | "subtle" | "prominent";
  showLogo?: boolean;
  style?: object;
}

const { width: screenWidth } = Dimensions.get("window");

export function BrandedBackground({
  children,
  variant = "default",
  showLogo = true,
  style,
}: BrandedBackgroundProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (isDark) {
      switch (variant) {
        case "subtle":
          return [DeepLavender.base, DeepLavender.surface];
        case "prominent":
          return [DeepLavender.deep, DeepLavender.base, DeepLavender.surface];
        default:
          return [DeepLavender.base, DeepLavender.surface];
      }
    } else {
      switch (variant) {
        case "subtle":
          return ["#FFFFFF", "#FDF2F8"];
        case "prominent":
          return ["#FCE7F3", "#FDF2F8", "#FFFFFF"];
        default:
          return ["#FDF2F8", "#FFFFFF"];
      }
    }
  };

  const logoOpacity = isDark ? 0.03 : 0.05;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={getGradientColors()}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {showLogo ? (
        <View style={[styles.logoContainer, { opacity: logoOpacity }]} pointerEvents="none">
          <KeziLogo size={screenWidth * 0.6} />
        </View>
      ) : null}
      
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
});
