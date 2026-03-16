import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { AvatarPicker } from "@/components/AvatarPicker";
import { LogoHeader } from "@/components/LogoHeader";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { useScrollContext } from "@/navigation/MainTabNavigator";

interface MenuItemProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeColor?: string;
  isDark: boolean;
  textMuted: string;
}

function MenuItem({
  icon,
  label,
  onPress,
  showBadge,
  badgeColor,
  isDark,
  textMuted,
}: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: pressed
            ? isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)"
            : "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.menuIconContainer,
          {
            backgroundColor: isDark
              ? KeziColors.night.deep
              : KeziColors.brand.pink50,
          },
        ]}
      >
        <Feather name={icon} size={20} color={KeziColors.brand.pink500} />
      </View>
      <ThemedText type="body" style={styles.menuLabel}>
        {label}
      </ThemedText>
      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: badgeColor }]} />
      ) : null}
      <Feather name="chevron-right" size={20} color={textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { user, logout, updateAvatar } = useAuth();
  const { scrollHandler } = useScrollContext();

  const handleAvatarChange = async (uri: string) => {
    await updateAvatar(uri);
    Alert.alert("Photo Updated", "Your profile photo has been updated.");
  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) {
        await logout();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]);
    }
  };

  return (
    <ScreenScrollView onScroll={scrollHandler}>
      <LogoHeader showBackButton={false} />
      
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <AvatarPicker
              currentAvatar={user?.avatar}
              onAvatarChange={handleAvatarChange}
              size={100}
            />
            {user?.role === "admin" ? (
              <View style={styles.adminBadge}>
                <Feather name="shield" size={12} color="#FFFFFF" />
              </View>
            ) : null}
          </View>

          <ThemedText type="h3" style={styles.userName}>
            {user?.name || "Guest"}
          </ThemedText>
          <ThemedText type="small" style={styles.userEmail}>
            {user?.email || "No email"}
          </ThemedText>

          {user?.role === "admin" ? (
            <View style={styles.roleBadge}>
              <ThemedText type="chip" style={styles.roleText}>
                ADMIN
              </ThemedText>
            </View>
          ) : null}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          ACCOUNT
        </ThemedText>
        <GlassCard style={styles.menuCard} contentStyle={styles.menuContent}>
          <MenuItem
            icon="settings"
            label="Settings"
            onPress={() => navigation.navigate("Settings")}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
          <MenuItem
            icon="users"
            label="Manage Profiles"
            onPress={() => navigation.navigate("ManageProfiles")}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
          <MenuItem
            icon="heart"
            label="Wishlist"
            onPress={() => navigation.navigate("Wishlist")}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
          <MenuItem
            icon="bell"
            label="Notifications"
            onPress={() => navigation.navigate("NotificationSettings")}
            showBadge
            badgeColor={KeziColors.brand.pink500}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          HEALTH
        </ThemedText>
        <GlassCard style={styles.menuCard} contentStyle={styles.menuContent}>
          <MenuItem
            icon="file-text"
            label="Scan Prescription"
            onPress={() => navigation.navigate("PrescriptionScan")}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
          <MenuItem
            icon="download"
            label="Export Data"
            onPress={() => navigation.navigate("ExportData")}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
        </GlassCard>
      </Animated.View>

      {user?.role === "admin" ? (
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            ADMIN
          </ThemedText>
          <GlassCard style={styles.menuCard} contentStyle={styles.menuContent}>
            <MenuItem
              icon="users"
              label="Manage Users"
              onPress={() => navigation.navigate("Admin")}
              isDark={isDark}
              textMuted={theme.textMuted}
            />
          </GlassCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          SUPPORT
        </ThemedText>
        <GlassCard style={styles.menuCard} contentStyle={styles.menuContent}>
          <MenuItem
            icon="help-circle"
            label="Help Center"
            onPress={() => Alert.alert("Help", "Visit kezi.app/help")}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
          <MenuItem
            icon="message-circle"
            label="Contact Us"
            onPress={() => Alert.alert("Contact", "Email support@kezi.app")}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
          <MenuItem
            icon="info"
            label="About Kezi"
            onPress={() => Alert.alert("About", "Kezi v1.0.0")}
            isDark={isDark}
            textMuted={theme.textMuted}
          />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <Button
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Sign Out
        </Button>
      </Animated.View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  adminBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KeziColors.brand.purple600,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    opacity: 0.6,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    backgroundColor: KeziColors.brand.pink500,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    color: "#FFFFFF",
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  menuCard: {
    marginBottom: Spacing.lg,
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontWeight: "500",
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  logoutButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
