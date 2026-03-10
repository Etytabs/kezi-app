import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { G, Path, Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

import { KeziColors } from "@/constants/theme";

interface KeziLogoProps {
  size?: number;
  animated?: boolean;
  animationType?: "spin" | "pulse" | "none";
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function KeziLogo({
  size = 24,
  animated = false,
  animationType = "none",
}: KeziLogoProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      if (animationType === "spin") {
        rotation.value = withRepeat(
          withTiming(360, { duration: 3000, easing: Easing.linear }),
          -1,
          false
        );
      } else if (animationType === "pulse") {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          false
        );
      }
    }
  }, [animated, animationType]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <AnimatedView style={[{ width: size, height: size }, animated ? animatedStyle : undefined]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <RadialGradient id="flowerCenterGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={KeziColors.brand.amber100} />
            <Stop offset="100%" stopColor={KeziColors.brand.amber500} />
          </RadialGradient>
        </Defs>
        <G transform="translate(12, 12)">
          {[0, 72, 144, 216, 288].map((angle, index) => (
            <Path
              key={index}
              d="M0 0 C-2.5 -5 -4.5 -9 0 -11 C4.5 -9 2.5 -5 0 0"
              fill={KeziColors.brand.yellow300}
              stroke={KeziColors.brand.yellow400}
              strokeWidth={0.5}
              transform={`rotate(${angle})`}
              opacity={0.9 + index * 0.02}
            />
          ))}
          <Circle cx={0} cy={0} r={2.5} fill="url(#flowerCenterGlow)" />
          <Circle cx={0} cy={0} r={1.5} fill={KeziColors.brand.amber500} />
          <Circle cx={0.8} cy={-0.8} r={0.4} fill={KeziColors.brand.amber100} opacity={0.9} />
        </G>
      </Svg>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
