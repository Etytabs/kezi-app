import React, { useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { CycleWheel } from "@/components/CycleWheel";
import { PhaseChip } from "@/components/PhaseChip";
import { ShareableInsightCard } from "@/components/ShareableInsightCard";
import { AIChatModal } from "@/components/AIChatModal";
import { SharingPrivacyModal } from "@/components/SharingPrivacyModal";
import { KeziBrandIcon } from "@/components/KeziBrandIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { calculateCycleInfo, getPhaseDescription, getPhaseName, getPhaseIcon } from "@/services/cycleService";
import { DAILY_TIPS, DAILY_INSPIRATIONS } from "@/services/mockData";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { sharingService, SharingPrivacySettings, DEFAULT_SHARING_SETTINGS } from "@/services/sharingService";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark, getPhaseColors } = useTheme();
  const { user, cycleConfig } = useAuth();
  const insets = useSafeAreaInsets();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<SharingPrivacySettings>(DEFAULT_SHARING_SETTINGS);

  const cycleInfo = useMemo(() => calculateCycleInfo(cycleConfig), [cycleConfig]);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    const settings = await sharingService.getPrivacySettings();
    setPrivacySettings(settings);
  };

  const shareableInsight = useMemo(() => {
    return sharingService.createCycleInsightMessage(cycleInfo, privacySettings);
  }, [cycleInfo, privacySettings]);
  const phaseColors = getPhaseColors(cycleInfo.phase);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const dailyTip = useMemo(() => {
    const tips = DAILY_TIPS[cycleInfo.phase];
    return tips[Math.floor(Math.random() * tips.length)];
  }, [cycleInfo.phase]);

  const dailyInspiration = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return DAILY_INSPIRATIONS[dayOfYear % DAILY_INSPIRATIONS.length];
  }, []);

  return (
    <ScreenScrollView
  onScrollDirectionChange={(direction) => {
    console.log(direction);
  }}
>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <ThemedText type="hero" style={styles.greeting}>
          {greeting}, {user?.name?.split(" ")[0] || "there"}
        </ThemedText>
        <View style={styles.chipRow}>
          <PhaseChip phase={cycleInfo.phase} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <GlassCard style={styles.cycleCard}>
          <View style={styles.cycleCardHeader}>
            <View
              style={[
                styles.phaseIcon,
                { backgroundColor: phaseColors.background },
              ]}
            >
              <Feather
                name={getPhaseIcon(cycleInfo.phase) as any}
                size={24}
                color={phaseColors.primary}
              />
            </View>
            <View style={styles.phaseInfo}>
              <ThemedText type="h4">Cycle Journey</ThemedText>
              <ThemedText type="small" style={styles.phaseDescription}>
                {getPhaseName(cycleInfo.phase)}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => navigation.navigate("CycleTab")}
              style={styles.chevronButton}
            >
              <Feather name="chevron-right" size={24} color={theme.textMuted} />
            </Pressable>
          </View>

          <View style={styles.wheelContainer}>
            <CycleWheel
              currentDay={cycleInfo.currentDay}
              totalDays={cycleConfig?.cycleLength || 28}
              phase={cycleInfo.phase}
            />
          </View>

          <View style={styles.statsRow}>
            <StatItem
              label="Until Period"
              value={`${cycleInfo.daysUntilPeriod} days`}
              color={KeziColors.brand.pink500}
            />
            <StatItem
              label="Ovulation"
              value={`${cycleInfo.daysUntilOvulation} days`}
              color={KeziColors.brand.purple500}
            />
            <StatItem
              label="Fertile"
              value={cycleInfo.fertileWindow ? "Yes" : "No"}
              color={KeziColors.brand.teal600}
            />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <View style={styles.sectionHeader}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            DAILY INSIGHT
          </ThemedText>
          <Pressable
            onPress={() => setShowPrivacySettings(true)}
            style={styles.privacyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="shield" size={16} color={theme.textMuted} />
          </Pressable>
        </View>
        <ShareableInsightCard
          phase={cycleInfo.phase}
          insight={shareableInsight}
          title={`Daily Insight: ${getPhaseName(cycleInfo.phase)}`}
          subtitle={dailyTip}
          onShareSuccess={() => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          DAILY INSPIRATION
        </ThemedText>
        <GlassCard style={styles.inspirationCard}>
          <View style={styles.inspirationQuoteContainer}>
            <Feather name="sun" size={20} color={KeziColors.brand.amber500} style={styles.inspirationIcon} />
            <ThemedText style={styles.inspirationQuote}>
              "{dailyInspiration.quote}"
            </ThemedText>
          </View>
          <ThemedText style={styles.inspirationAuthor}>
            - {dailyInspiration.author}
          </ThemedText>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          ESSENTIALS & HYGIENE
        </ThemedText>
        <View style={styles.essentialsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.essentialCard,
              {
                backgroundColor: isDark ? KeziColors.night.surface : KeziColors.brand.pink50,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={() => navigation.navigate("ShopTab")}
          >
            <View style={[styles.essentialIcon, { backgroundColor: KeziColors.brand.pink100 }]}>
              <Feather name="package" size={24} color={KeziColors.brand.pink500} />
            </View>
            <ThemedText type="body" style={styles.essentialTitle}>Menstrual Products</ThemedText>
            <ThemedText type="small" style={styles.essentialSubtitle}>Pads, tampons, cups</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.essentialCard,
              {
                backgroundColor: isDark ? KeziColors.night.surface : KeziColors.brand.teal50,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={() => navigation.navigate("MomTab")}
          >
            <View style={[styles.essentialIcon, { backgroundColor: KeziColors.brand.teal50 }]}>
              <Feather name="heart" size={24} color={KeziColors.brand.teal600} />
            </View>
            <ThemedText type="body" style={styles.essentialTitle}>Maternal Care</ThemedText>
            <ThemedText type="small" style={styles.essentialSubtitle}>Prenatal vitamins, relief</ThemedText>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(450).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          QUICK ACTIONS
        </ThemedText>
        <View style={styles.quickActions}>
          <QuickAction
            icon="edit-3"
            label="Journal"
            onPress={() => navigation.navigate("CycleTab", { screen: "Journal" })}
            isDark={isDark}
          />
          <QuickAction
            icon="shopping-bag"
            label="Shop"
            onPress={() => navigation.navigate("ShopTab")}
            isDark={isDark}
          />
          <QuickAction
            icon="calendar"
            label="Calendar"
            onPress={() => navigation.navigate("CycleTab")}
            isDark={isDark}
          />
          <QuickAction
            icon="settings"
            label="Settings"
            onPress={() => navigation.navigate("ProfileTab", { screen: "Settings" })}
            isDark={isDark}
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(500).duration(300)}
        style={[
          styles.fabContainer,
          { bottom: insets.bottom + 100 },
        ]}
      >
        <Pressable
          onPress={() => setShowAIChat(true)}
          style={({ pressed }) => [
            styles.fab,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={[KeziColors.brand.purple500, KeziColors.brand.purple600]}
            style={styles.fabGradient}
          >
            <KeziBrandIcon size={28} animated animationType="pulse" />
          </LinearGradient>
        </Pressable>
        <ThemedText style={styles.fabLabel}>Ask Kezi</ThemedText>
      </Animated.View>

      <AIChatModal visible={showAIChat} onClose={() => setShowAIChat(false)} />
      <SharingPrivacyModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        onSave={(settings) => {
          setPrivacySettings(settings);
          setShowPrivacySettings(false);
        }}
      />
    </ScreenScrollView>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <ThemedText type="small" style={styles.statLabel}>
        {label}
      </ThemedText>
      <ThemedText type="body" style={[styles.statValue, { color }]}>
        {value}
      </ThemedText>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  isDark,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: isDark
            ? KeziColors.night.surface
            : "#FFFFFF",
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.quickActionIcon,
          {
            backgroundColor: isDark
              ? KeziColors.night.deep
              : KeziColors.brand.pink50,
          },
        ]}
      >
        <Feather name={icon} size={20} color={KeziColors.brand.pink500} />
      </View>
      <ThemedText type="small" style={styles.quickActionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  cycleCard: {
    marginBottom: Spacing.xl,
  },
  cycleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  phaseIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
  chevronButton: {
    padding: Spacing.sm,
  },
  wheelContainer: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    opacity: 0.6,
    marginBottom: 2,
  },
  statValue: {
    fontWeight: "600",
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
  },
  privacyButton: {
    padding: Spacing.sm,
  },
  essentialsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  essentialCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  essentialIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  essentialTitle: {
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
  },
  essentialSubtitle: {
    opacity: 0.6,
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  quickAction: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontWeight: "600",
  },
  inspirationCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  inspirationQuoteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  inspirationIcon: {
    marginTop: 2,
  },
  inspirationQuote: {
    flex: 1,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
    opacity: 0.85,
  },
  inspirationAuthor: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "right",
    marginTop: Spacing.sm,
  },
  fabContainer: {
    position: "absolute",
    right: Spacing.lg,
    alignItems: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: KeziColors.brand.purple600,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: Spacing.xs,
    color: KeziColors.brand.purple600,
  },
});
