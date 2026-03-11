import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeziLogo } from "@/components/KeziLogo";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthNavigator";

type LandingScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Landing">;
};

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const insets = useSafeAreaInsets();
  const { loginAnonymous } = useAuth();

  return (
    <LinearGradient
      colors={[KeziColors.brand.pink50, KeziColors.brand.purple100]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + Spacing["3xl"] }]}>
        <Animated.View
          entering={FadeIn.delay(200).duration(800)}
          style={styles.logoContainer}
        >
          <View style={styles.iconWrapper}>
            <KeziLogo size={64} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.textContainer}
        >
          <ThemedText
            type="hero"
            lightColor={KeziColors.gray[800]}
            style={styles.title}
          >
            Welcome to Kezi
          </ThemedText>
          <ThemedText
            type="body"
            lightColor={KeziColors.gray[600]}
            style={styles.subtitle}
          >
            Your gentle companion for cycle tracking, wellness insights, and personalized care
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          style={styles.features}
        >
          <FeatureItem
            icon="activity"
            title="Track Your Cycle"
            description="Understand your body's natural rhythm"
          />
          <FeatureItem
            icon="heart"
            title="Wellness Insights"
            description="AI-powered tips tailored to you"
          />
          <FeatureItem
            icon="shopping-bag"
            title="Smart Marketplace"
            description="Products synced to your needs"
          />
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(800).duration(600)}
        style={[styles.actionZone, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <Button onPress={() => navigation.navigate("Login")} style={styles.button}>
          Get Started
        </Button>
        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={styles.signInLink}
        >
          <ThemedText type="body" lightColor={KeziColors.gray[600]}>
            Already have an account?{" "}
          </ThemedText>
          <ThemedText type="link">Sign in</ThemedText>
        </Pressable>

        <Pressable onPress={loginAnonymous} style={styles.anonymousLink}>
          <View style={styles.anonymousContent}>
            <Feather name="shield" size={16} color={KeziColors.brand.purple500} />
            <ThemedText type="body" lightColor={KeziColors.gray[600]} style={styles.anonymousText}>
              Continue without account
            </ThemedText>
          </View>
          <ThemedText type="small" lightColor={KeziColors.gray[400]} style={styles.anonymousSubtext}>
            Private tracking - data stays on your device only
          </ThemedText>
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Feather name={icon} size={20} color={KeziColors.brand.pink500} />
      </View>
      <View style={styles.featureText}>
        <ThemedText type="body" lightColor={KeziColors.gray[800]} style={styles.featureTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" lightColor={KeziColors.gray[500]}>
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.lg,
    backgroundColor: KeziColors.brand.pink100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: KeziColors.brand.pink500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
    opacity: 0.8,
  },
  features: {
    marginTop: Spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  actionZone: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  button: {
    marginBottom: Spacing.lg,
  },
  signInLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  anonymousLink: {
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  anonymousContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  anonymousText: {
    fontWeight: "500",
  },
  anonymousSubtext: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
