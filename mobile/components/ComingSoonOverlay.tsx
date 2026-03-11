import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

interface FeatureItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

interface ComingSoonOverlayProps {
  title: string;
  subtitle: string;
  features: FeatureItem[];
  visible?: boolean;
  onPreview?: () => void;
}

export function ComingSoonOverlay({
  title,
  subtitle,
  features,
  visible = true,
  onPreview,
}: ComingSoonOverlayProps) {
  const { theme, isDark } = useTheme();

  const handlePreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPreview?.();
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      
      <LinearGradient
        colors={
          isDark
            ? ["rgba(26, 16, 37, 0.85)", "rgba(46, 32, 53, 0.9)"]
            : ["rgba(255, 255, 255, 0.85)", "rgba(252, 231, 243, 0.9)"]
        }
        style={StyleSheet.absoluteFill}
      />

      <Animated.View 
        entering={FadeIn.duration(400)}
        style={styles.content}
      >
        <Animated.View 
          entering={FadeInUp.delay(100).duration(500)}
          style={styles.badge}
        >
          <LinearGradient
            colors={[KeziColors.brand.pink500, KeziColors.brand.purple600]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badgeGradient}
          >
            <Feather name="clock" size={16} color="#FFFFFF" />
            <ThemedText style={styles.badgeText}>Coming Soon</ThemedText>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        </Animated.View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInUp.delay(300 + index * 100).duration(500)}
              style={[
                styles.featureCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(255, 255, 255, 0.7)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(236, 72, 153, 0.2)",
                },
              ]}
            >
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(236, 72, 153, 0.2)"
                      : "rgba(236, 72, 153, 0.1)",
                  },
                ]}
              >
                <Feather
                  name={feature.icon}
                  size={20}
                  color={KeziColors.brand.pink500}
                />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={[styles.featureTitle, { color: theme.text }]}>
                  {feature.title}
                </ThemedText>
                <ThemedText
                  style={[styles.featureDescription, { color: theme.textMuted }]}
                >
                  {feature.description}
                </ThemedText>
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View 
          entering={FadeInUp.delay(600).duration(500)}
          style={styles.footer}
        >
          <View style={[styles.notifyContainer, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(236, 72, 153, 0.08)" }]}>
            <Feather name="bell" size={18} color={KeziColors.brand.pink500} />
            <ThemedText style={[styles.notifyText, { color: theme.textSecondary }]}>
              We'll notify you when this feature is available
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(700).duration(500)}
          style={styles.previewSection}
        >
          <Pressable 
            style={[styles.previewButton, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]} 
            onPress={handlePreview}
          >
            <Feather name="eye" size={18} color={theme.text} />
            <ThemedText style={[styles.previewButtonText, { color: theme.text }]}>
              Preview Experience
            </ThemedText>
            <Feather name="chevron-right" size={18} color={theme.textMuted} />
          </Pressable>
          <ThemedText style={[styles.previewHint, { color: theme.textMuted }]}>
            Explore the interface while we prepare this feature
          </ThemedText>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  badge: {
    marginBottom: Spacing.lg,
  },
  badgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  featuresContainer: {
    width: "100%",
    gap: Spacing.sm,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: Spacing.xl,
    width: "100%",
  },
  notifyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  notifyText: {
    fontSize: 13,
    textAlign: "center",
  },
  previewSection: {
    marginTop: Spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    width: "100%",
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  previewHint: {
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
