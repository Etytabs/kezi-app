import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import Svg, { G, Path, Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { KeziColors } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface BrandedSplashScreenProps {
  onAnimationComplete?: () => void;
}

export function BrandedSplashScreen({ onAnimationComplete }: BrandedSplashScreenProps) {
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });
    
    logoRotation.value = withSequence(
      withTiming(10, { duration: 200 }),
      withTiming(-5, { duration: 150 }),
      withTiming(0, { duration: 100 })
    );

    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(0.6, { duration: 500 }),
        withTiming(0.3, { duration: 500 })
      )
    );

    textOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(
      500,
      withSpring(0, { damping: 15, stiffness: 80 })
    );

    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

    pulseScale.value = withDelay(
      1000,
      withSequence(
        withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      )
    );

    if (onAnimationComplete) {
      const timeout = setTimeout(() => {
        onAnimationComplete();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, []);

  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <LinearGradient
      colors={[
        KeziColors.night.base,
        KeziColors.night.surface,
        KeziColors.night.deep,
      ]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient
            colors={[
              "transparent",
              `${KeziColors.brand.pink500}20`,
              `${KeziColors.brand.purple600}30`,
              "transparent",
            ]}
            style={styles.glow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        <Animated.View style={[styles.logoWrapper, pulseStyle]}>
          <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
            <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
              <Defs>
                <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
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

                <Circle cx={0} cy={0} r={2.5} fill="url(#centerGlow)" />
                <Circle cx={0} cy={0} r={1.5} fill={KeziColors.brand.amber500} />
                <Circle cx={0.8} cy={-0.8} r={0.4} fill={KeziColors.brand.amber100} opacity={0.9} />
              </G>
            </Svg>
          </Animated.View>
        </Animated.View>

        <Animated.Text style={[styles.brandName, textStyle]}>Kezi</Animated.Text>

        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Your Wellness Companion
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={150} />
          <LoadingDot delay={300} />
        </View>
      </View>
    </LinearGradient>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withSequence(
        withDelay(delay, withTiming(1, { duration: 300 })),
        withTiming(0.3, { duration: 300 })
      );
      scale.value = withSequence(
        withDelay(delay, withTiming(1, { duration: 300 })),
        withTiming(0.8, { duration: 300 })
      );
    }, 900);

    return () => clearInterval(interval);
  }, [delay]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowContainer: {
    position: "absolute",
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    width: "100%",
    height: "100%",
    borderRadius: 150,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
      ios: {
        shadowColor: KeziColors.brand.pink500,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  brandName: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 8,
    textShadowColor: KeziColors.brand.pink500,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: KeziColors.night.text,
    opacity: 0.7,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KeziColors.brand.pink500,
  },
});
