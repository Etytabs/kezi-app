import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, KeziColors, Shadows } from "@/constants/theme";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

const MOCK_USERS: MockUser[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "user",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Emily Chen",
    email: "emily@example.com",
    role: "user",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "Admin User",
    email: "admin@jasmin.app",
    role: "admin",
    createdAt: "2024-01-01",
  },
  {
    id: "4",
    name: "Maria Garcia",
    email: "maria@example.com",
    role: "user",
    createdAt: "2024-03-10",
  },
];

export default function AdminScreen() {
  const { theme, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(MOCK_USERS);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === "admin").length;
    const regularUsers = totalUsers - adminCount;
    return { totalUsers, adminCount, regularUsers };
  }, [users]);

  const handleToggleRole = (userId: string) => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) return;

    if (userToUpdate.email === currentUser?.email) {
      Alert.alert("Cannot Modify", "You cannot change your own role.");
      return;
    }

    const newRole = userToUpdate.role === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "promote" : "demote";

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${userToUpdate.name} to ${newRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === userId ? { ...u, role: newRole } : u
              )
            );
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ScreenScrollView>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <View style={styles.statsRow}>
          <StatCard
            icon="users"
            value={stats.totalUsers}
            label="Total Users"
            color={KeziColors.brand.purple500}
            isDark={isDark}
          />
          <StatCard
            icon="shield"
            value={stats.adminCount}
            label="Admins"
            color={KeziColors.brand.pink500}
            isDark={isDark}
          />
          <StatCard
            icon="user"
            value={stats.regularUsers}
            label="Regular"
            color={KeziColors.brand.teal600}
            isDark={isDark}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          USER MANAGEMENT
        </ThemedText>
        {users.map((user, index) => (
          <Animated.View
            key={user.id}
            entering={FadeInDown.delay(index * 75).duration(400)}
            layout={Layout.springify()}
          >
            <GlassCard style={styles.userCard}>
              <View style={styles.userRow}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : user.role === "admin"
                        ? KeziColors.brand.pink100
                        : KeziColors.gray[100],
                    },
                  ]}
                >
                  <ThemedText type="body" style={styles.avatarText}>
                    {user.name.charAt(0)}
                  </ThemedText>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <ThemedText type="body" style={styles.userName}>
                      {user.name}
                    </ThemedText>
                    {user.email === currentUser?.email && (
                      <ThemedText type="small" style={styles.youBadge}>
                        (You)
                      </ThemedText>
                    )}
                  </View>
                  <ThemedText type="small" style={styles.userEmail}>
                    {user.email}
                  </ThemedText>
                  <ThemedText type="small" style={styles.userDate}>
                    Joined {formatDate(user.createdAt)}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={() => handleToggleRole(user.id)}
                  style={({ pressed }) => [
                    styles.roleBadge,
                    {
                      backgroundColor:
                        user.role === "admin"
                          ? KeziColors.brand.pink500
                          : isDark
                          ? KeziColors.night.deep
                          : KeziColors.gray[100],
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <Feather
                    name={user.role === "admin" ? "shield" : "user"}
                    size={14}
                    color={
                      user.role === "admin" ? "#FFFFFF" : KeziColors.gray[500]
                    }
                  />
                  <ThemedText
                    type="chip"
                    style={[
                      styles.roleText,
                      {
                        color:
                          user.role === "admin"
                            ? "#FFFFFF"
                            : KeziColors.gray[500],
                      },
                    ]}
                  >
                    {user.role.toUpperCase()}
                  </ThemedText>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <ThemedText type="small" style={styles.hint}>
          Tap on a role badge to change user permissions
        </ThemedText>
      </Animated.View>
    </ScreenScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  isDark,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: number;
  label: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: isDark
            ? KeziColors.night.surface
            : "#FFFFFF",
        },
        Shadows.sm,
      ]}
    >
      <View
        style={[styles.statIcon, { backgroundColor: color + "20" }]}
      >
        <Feather name={icon} size={18} color={color} />
      </View>
      <ThemedText type="h3" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    marginBottom: 2,
  },
  statLabel: {
    opacity: 0.6,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  userCard: {
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontWeight: "700",
    color: KeziColors.brand.pink500,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontWeight: "600",
  },
  youBadge: {
    marginLeft: Spacing.xs,
    color: KeziColors.brand.purple500,
    fontWeight: "600",
  },
  userEmail: {
    opacity: 0.6,
    marginTop: 2,
  },
  userDate: {
    opacity: 0.4,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  roleText: {
    fontWeight: "700",
  },
  hint: {
    textAlign: "center",
    opacity: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
