import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { PhaseIcon, getPhaseLabel } from "@/components/PhaseIcon";
import { Spacing, BorderRadius, CyclePhase, PhaseGradients, KeziColors } from "@/constants/theme";
import { ShareableInsight, sharingService } from "@/services/sharingService";

interface ShareableInsightCardProps {
  phase: CyclePhase;
  insight: ShareableInsight;
  title?: string;
  subtitle?: string;
  showPhaseIcon?: boolean;
  onShareSuccess?: () => void;
  onShareError?: (error: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ShareableInsightCard({
  phase,
  insight,
  title,
  subtitle,
  showPhaseIcon = true,
  onShareSuccess,
  onShareError,
}: ShareableInsightCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const scale = useSharedValue(1);
  const shareButtonScale = useSharedValue(1);
  const phaseGradient = PhaseGradients[phase];
  const gradientColors = phaseGradient.colors as [string, string];

  const displayTitle = title || insight.title;
  const displaySubtitle = subtitle || insight.message.split("\n")[0];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shareButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareButtonScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const setShareState = useCallback((sharing: boolean) => {
    setIsSharing(sharing);
  }, []);

  const handleSuccessCallback = useCallback(() => {
    if (onShareSuccess) onShareSuccess();
  }, [onShareSuccess]);

  const handleErrorCallback = useCallback((error: string) => {
    if (onShareError) onShareError(error);
  }, [onShareError]);

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    shareButtonScale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    try {
      const success = await sharingService.shareInsight(insight);
      if (success) {
        handleSuccessCallback();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to share";
      handleErrorCallback(errorMessage);
    } finally {
      setShareState(false);
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <View style={styles.cardWrapper}>
        <View style={[styles.accentBar, { backgroundColor: gradientColors[0] }]} />
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.card}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              {showPhaseIcon ? (
                <View style={styles.iconBubble}>
                  {Platform.OS !== "web" ? (
                    <BlurView intensity={10} style={StyleSheet.absoluteFill} />
                  ) : null}
                  <PhaseIcon phase={phase} size={24} />
                </View>
              ) : null}
              <View style={styles.textContent}>
                <ThemedText style={styles.title}>{displayTitle}</ThemedText>
                <ThemedText style={styles.body} numberOfLines={2}>
                  {displaySubtitle}
                </ThemedText>
              </View>
            </View>
            <AnimatedPressable
              onPress={handleShare}
              style={[styles.shareButton, shareButtonStyle]}
              disabled={isSharing}
            >
              {Platform.OS !== "web" ? (
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />
              ) : null}
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="share-2" size={18} color="#FFFFFF" />
              )}
            </AnimatedPressable>
          </View>
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
  },
  card: {
    flex: 1,
    padding: Spacing.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  textContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  body: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
