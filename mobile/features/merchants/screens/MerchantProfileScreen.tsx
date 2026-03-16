import React from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { LogoHeader } from "@/components/LogoHeader";
import { AvatarPicker } from "@/components/AvatarPicker";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";

export default function MerchantProfileScreen() {
  const { theme, isDark } = useTheme();
  const { user, logout, updateAvatar } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert(
        t("profile.logout"),
        "Are you sure you want to log out?",
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("profile.logout"), style: "destructive", onPress: logout },
        ]
      );
    }
  };

  const handleAvatarChange = async (uri: string) => {
    await updateAvatar(uri);
    Alert.alert("Photo Updated", "Your profile photo has been updated.");
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.container}>
      <LogoHeader showBackButton={false} />
      
      <GlassCard style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <AvatarPicker
            currentAvatar={user?.avatar}
            onAvatarChange={handleAvatarChange}
            size={80}
          />
        </View>
        <ThemedText style={styles.name}>{user?.name}</ThemedText>
        <ThemedText style={styles.email}>{user?.email}</ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: KeziColors.brand.teal600 }]}>
          <ThemedText style={styles.roleText}>Merchant</ThemedText>
        </View>
      </GlassCard>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Account</ThemedText>
        
        <GlassCard style={styles.menuCard}>
          <Pressable style={styles.menuItem}>
            <Feather name="edit-3" size={20} color={KeziColors.brand.teal600} />
            <ThemedText style={styles.menuText}>Edit Profile</ThemedText>
            <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.menuItem}>
            <Feather name="briefcase" size={20} color={KeziColors.brand.teal600} />
            <ThemedText style={styles.menuText}>Business Settings</ThemedText>
            <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.menuItem}>
            <Feather name="credit-card" size={20} color={KeziColors.brand.teal600} />
            <ThemedText style={styles.menuText}>Payment Settings</ThemedText>
            <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.menuItem}>
            <Feather name="bell" size={20} color={KeziColors.brand.teal600} />
            <ThemedText style={styles.menuText}>Notifications</ThemedText>
            <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
          </Pressable>
        </GlassCard>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color={KeziColors.phases.menstrual.primary} />
        <ThemedText style={styles.logoutText}>{t("profile.logout")}</ThemedText>
      </Pressable>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  profileCard: {
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: KeziColors.brand.teal600,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: KeziColors.gray[200],
    marginLeft: Spacing.md + 20 + Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: KeziColors.phases.menstrual.primary,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: KeziColors.phases.menstrual.primary,
  },
});
