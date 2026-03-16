import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Svg, { Circle, Path, G, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { storage } from "@/services/storage";
import { Spacing } from "@/design/spacing";
import { BorderRadius } from "@/design/radius";
import { KeziColors } from "@/design/colors";
import { AuthStackParamList } from "@/features/auth/navigation/AuthNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Onboarding">;
};

const ONBOARDING_SLIDES = [
  {
    id: "track",
    icon: "activity",
    title: "Track Your Cycle",
    description: "Log your periods and symptoms to understand your body\'s natural rhythm with precision and care.",
    gradient: [KeziColors.brand.pink400, KeziColors.brand.pink500],
    illustrationColor: KeziColors.brand.pink500,
  },
  {
    id: "insights",
    icon: "zap",
    title: "AI-Powered Insights",
    description: "Get personalized wellness recommendations and predictions powered by intelligent algorithms.",
    gradient: [KeziColors.brand.purple400, KeziColors.brand.purple500],
    illustrationColor: KeziColors.brand.purple500,
  },
  {
    id: "shop",
    icon: "shopping-bag",
    title: "Shop Smarter",
    description: "Discover products perfectly matched to your cycle phase from verified local merchants.",
    gradient: [KeziColors.brand.teal600, KeziColors.brand.emerald500],
    illustrationColor: KeziColors.brand.teal600,
  },
  {
    id: "privacy",
    icon: "shield",
    title: "Your Privacy, Protected",
    description: "Biometric lock, discreet mode, and end-to-end encryption keep your health data safe.",
    gradient: [KeziColors.brand.pink500, KeziColors.brand.purple500],
    illustrationColor: KeziColors.brand.purple500,
  },
];

function CycleIllustration({ color }: { color: string }) {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="cycleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={KeziColors.brand.pink400} />
          <Stop offset="100%" stopColor={KeziColors.brand.purple500} />
        </SvgGradient>
      </Defs>
      <Circle cx="100" cy="100" r="80" stroke="url(#cycleGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
      <Circle cx="100" cy="20" r="12" fill={color} />
      <Circle cx="100" cy="100" r="40" fill={`${color}20`} />
      <Path d="M80 100 Q100 80 120 100 Q100 120 80 100" fill={color} />
    </Svg>
  );
}

function InsightsIllustration({ color }: { color: string }) {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="insightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={KeziColors.brand.purple400} />
          <Stop offset="100%" stopColor={KeziColors.brand.purple600} />
        </SvgGradient>
      </Defs>
      <Circle cx="100" cy="100" r="70" fill={`${color}15`} />
      <Path d="M100 40 L120 80 L160 85 L130 115 L138 155 L100 135 L62 155 L70 115 L40 85 L80 80 Z" fill="url(#insightGrad)" />
      <Circle cx="100" cy="100" r="25" fill="white" />
      <Path d="M90 100 L98 108 L112 92" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShopIllustration({ color }: { color: string }) {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="shopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={KeziColors.brand.teal600} />
          <Stop offset="100%" stopColor={KeziColors.brand.emerald500} />
        </SvgGradient>
      </Defs>
      <Path d="M50 70 L60 50 L140 50 L150 70 L145 150 L55 150 Z" fill="url(#shopGrad)" />
      <Path d="M70 70 L70 50 Q70 30 100 30 Q130 30 130 50 L130 70" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" />
      <Circle cx="85" cy="105" r="15" fill="white" opacity="0.9" />
      <Circle cx="115" cy="105" r="15" fill="white" opacity="0.9" />
      <Path d="M80 130 L120 130" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </Svg>
  );
}

function PrivacyIllustration({ color }: { color: string }) {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="privacyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={KeziColors.brand.pink500} />
          <Stop offset="100%" stopColor={KeziColors.brand.purple500} />
        </SvgGradient>
      </Defs>
      <Path d="M100 30 L160 55 L160 95 Q160 140 100 170 Q40 140 40 95 L40 55 Z" fill="url(#privacyGrad)" />
      <Circle cx="100" cy="90" r="20" fill="white" />
      <Path d="M85 115 L85 130 Q85 145 100 145 Q115 145 115 130 L115 115" fill="white" />
      <Circle cx="100" cy="90" r="8" fill={color} />
    </Svg>
  );
}

const illustrations = [CycleIllustration, InsightsIllustration, ShopIllustration, PrivacyIllustration];

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  const updateIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToSlide = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, ONBOARDING_SLIDES.length - 1));
    translateX.value = withTiming(-clampedIndex * SCREEN_WIDTH, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    setCurrentIndex(clampedIndex);
  };

  const handleComplete = async () => {
    await storage.setOnboardingComplete(true);
    navigation.replace("Landing");
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
    })
    .onEnd((event) => {
      const velocityThreshold = 500;
      const positionThreshold = SCREEN_WIDTH / 3;

      let newIndex = currentIndex;

      if (event.velocityX < -velocityThreshold || event.translationX < -positionThreshold) {
        newIndex = Math.min(currentIndex + 1, ONBOARDING_SLIDES.length - 1);
      } else if (event.velocityX > velocityThreshold || event.translationX > positionThreshold) {
        newIndex = Math.max(currentIndex - 1, 0);
      }

      translateX.value = withTiming(-newIndex * SCREEN_WIDTH, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });

      runOnJS(updateIndex)(newIndex);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[KeziColors.brand.pink50, KeziColors.brand.purple50]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleComplete} style={styles.skipButton}>
          <ThemedText type="body" lightColor={KeziColors.gray[500]}>
            Skip
          </ThemedText>
        </Pressable>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.slidesContainer, animatedStyle]}>
          {ONBOARDING_SLIDES.map((slide, index) => {
            const IllustrationComponent = illustrations[index];
            return (
              <View key={slide.id} style={styles.slide}>
                <View style={styles.illustrationContainer}>
                  <View style={[styles.illustrationBg, { backgroundColor: `${slide.illustrationColor}10` }]}>
                    <IllustrationComponent color={slide.illustrationColor} />
                  </View>
                </View>

                <View style={styles.contentContainer}>
                  <View style={[styles.iconBadge, { backgroundColor: slide.gradient[0] }]}>
                    <Feather name={slide.icon as any} size={24} color="white" />
                  </View>

                  <ThemedText
                    type="h2"
                    lightColor={KeziColors.gray[900]}
                    style={styles.title}
                  >
                    {slide.title}
                  </ThemedText>

                  <ThemedText
                    type="body"
                    lightColor={KeziColors.gray[600]}
                    style={styles.description}
                  >
                    {slide.description}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </Animated.View>
      </GestureDetector>

      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <View style={styles.pagination}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <Pressable key={index} onPress={() => goToSlide(index)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentIndex
                        ? KeziColors.brand.pink500
                        : KeziColors.gray[300],
                    width: index === currentIndex ? 24 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          {currentIndex > 0 ? (
            <Pressable
              onPress={() => goToSlide(currentIndex - 1)}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={20} color={KeziColors.gray[600]} />
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}

          <Button
            onPress={isLastSlide ? handleComplete : () => goToSlide(currentIndex + 1)}
            style={styles.nextButton}
          >
            {isLastSlide ? "Get Started" : "Continue"}
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KeziColors.brand.pink50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.xl,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  slidesContainer: {
    flex: 1,
    flexDirection: "row",
    width: SCREEN_WIDTH * ONBOARDING_SLIDES.length,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  illustrationContainer: {
    marginBottom: Spacing["3xl"],
  },
  illustrationBg: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    shadowColor: KeziColors.brand.pink500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
    fontSize: 28,
    fontWeight: "700",
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    flex: 1,
  },
});
