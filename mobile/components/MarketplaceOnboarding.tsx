import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/services/storage";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

interface OnboardingStep {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description: string;
  accent: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: "zap",
    title: "Cycle-Synced Recommendations",
    description:
      "Products are intelligently filtered based on your current cycle phase, ensuring you always find what your body needs.",
    accent: KeziColors.brand.purple500,
  },
  {
    icon: "map-pin",
    title: "Nearby Merchants",
    description:
      "Discover pharmacies, wellness centers, and clinics near you. Reserve products or get them delivered to your door.",
    accent: KeziColors.brand.teal600,
  },
  {
    icon: "shopping-bag",
    title: "Easy Checkout",
    description:
      "Choose between delivery or pickup. Pay with mobile money, card, or cash on delivery. Track your orders in real-time.",
    accent: KeziColors.brand.pink500,
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MarketplaceOnboardingProps {
  visible: boolean;
  onComplete: () => void;
}

export function MarketplaceOnboarding({
  visible,
  onComplete,
}: MarketplaceOnboardingProps) {
  const { theme, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await storage.setMarketplaceOnboardingSeen();
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = async () => {
    await storage.setMarketplaceOnboardingSeen();
    onComplete();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.modal,
            {
              backgroundColor: isDark
                ? KeziColors.night.surface
                : "#FFFFFF",
            },
          ]}
        >
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <ThemedText type="small" style={styles.skipText}>
              Skip
            </ThemedText>
          </Pressable>

          <Animated.View
            key={currentStep}
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.content}
          >
            <LinearGradient
              colors={[
                currentStepData.accent + "20",
                currentStepData.accent + "05",
              ]}
              style={[
                styles.iconContainer,
                { borderColor: currentStepData.accent + "30" },
              ]}
            >
              <Feather
                name={currentStepData.icon}
                size={48}
                color={currentStepData.accent}
              />
            </LinearGradient>

            <ThemedText type="h3" style={styles.title}>
              {currentStepData.title}
            </ThemedText>

            <ThemedText type="body" style={styles.description}>
              {currentStepData.description}
            </ThemedText>
          </Animated.View>

          <View style={styles.pagination}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentStep
                        ? currentStepData.accent
                        : isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[200],
                    width: index === currentStep ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <Button
            onPress={handleNext}
            style={[
              styles.nextButton,
              { backgroundColor: currentStepData.accent },
            ]}
          >
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingTop: Spacing["3xl"],
    alignItems: "center",
  },
  skipButton: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.sm,
  },
  skipText: {
    color: KeziColors.gray[400],
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    borderWidth: 2,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: "100%",
  },
});
