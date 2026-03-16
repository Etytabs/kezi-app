import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, Alert, Platform, TextInput, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/context/LanguageContext";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "merchant" | "admin";
  status: "active" | "inactive" | "suspended";
  created_at: string;
  last_active: string;
  cycle_entries: number;
  orders: number;
}

const ROLE_FILTERS = ["All", "Users", "Merchants", "Admins"] as const;
type RoleFilter = typeof ROLE_FILTERS[number];

const DEMO_USERS: User[] = [
  {
    id: "1",
    name: "Marie Uwimana",
    email: "marie.u@gmail.com",
    role: "user",
    status: "active",
    created_at: "2024-01-10",
    last_active: "Today",
    cycle_entries: 45,
    orders: 3,
  },
  {
    id: "2",
    name: "Chantal Mukiza",
    email: "chantal.m@yahoo.com",
    role: "user",
    status: "active",
    created_at: "2024-01-08",
    last_active: "Yesterday",
    cycle_entries: 28,
    orders: 1,
  },
  {
    id: "3",
    name: "Grace Ishimwe",
    email: "grace.i@outlook.com",
    role: "user",
    status: "active",
    created_at: "2024-01-05",
    last_active: "2 days ago",
    cycle_entries: 67,
    orders: 5,
  },
  {
    id: "4",
    name: "HealthFirst Admin",
    email: "admin@healthfirst.rw",
    role: "merchant",
    status: "active",
    created_at: "2024-01-01",
    last_active: "Today",
    cycle_entries: 0,
    orders: 123,
  },
  {
    id: "5",
    name: "EcoFem Manager",
    email: "manager@ecofem.rw",
    role: "merchant",
    status: "active",
    created_at: "2023-12-15",
    last_active: "Today",
    cycle_entries: 0,
    orders: 89,
  },
  {
    id: "6",
    name: "Admin Kezi",
    email: "admin@kezi.app",
    role: "admin",
    status: "active",
    created_at: "2023-11-01",
    last_active: "Today",
    cycle_entries: 0,
    orders: 0,
  },
  {
    id: "7",
    name: "Diane Ingabire",
    email: "diane.i@gmail.com",
    role: "user",
    status: "inactive",
    created_at: "2023-12-20",
    last_active: "2 weeks ago",
    cycle_entries: 12,
    orders: 0,
  },
  {
    id: "8",
    name: "Alice Mutesi",
    email: "alice.m@gmail.com",
    role: "user",
    status: "suspended",
    created_at: "2023-11-15",
    last_active: "1 month ago",
    cycle_entries: 5,
    orders: 0,
  },
];

export default function AdminUsersScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredUsers = users.filter((u) => {
    let matchesRole = true;
    if (roleFilter === "Users") matchesRole = u.role === "user";
    else if (roleFilter === "Merchants") matchesRole = u.role === "merchant";
    else if (roleFilter === "Admins") matchesRole = u.role === "admin";
    
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const totalUsers = users.filter((u) => u.role === "user").length;
  const totalMerchants = users.filter((u) => u.role === "merchant").length;
  const totalActive = users.filter((u) => u.status === "active").length;

  const handleSuspend = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    const confirmAction = () => {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "suspended" as const } : u))
      );
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Suspend ${user.name}? They will not be able to access the app.`)) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Suspend User",
        `Suspend ${user.name}? They will not be able to access the app.`,
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Suspend", style: "destructive", onPress: confirmAction },
        ]
      );
    }
  };

  const handleReactivate = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    const confirmAction = () => {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "active" as const } : u))
      );
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Reactivate ${user.name}?`)) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Reactivate User",
        `Reactivate ${user.name}?`,
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Reactivate", onPress: confirmAction },
        ]
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "user": return KeziColors.brand.purple600;
      case "merchant": return KeziColors.brand.teal600;
      case "admin": return KeziColors.phases.menstrual.primary;
    }
  };

  const getRoleBg = (role: User["role"]) => {
    switch (role) {
      case "user": return KeziColors.brand.purple100;
      case "merchant": return KeziColors.brand.teal100;
      case "admin": return KeziColors.phases.menstrual.secondary;
    }
  };

  const getStatusIcon = (status: User["status"]) => {
    switch (status) {
      case "active": return "check-circle";
      case "inactive": return "clock";
      case "suspended": return "slash";
    }
  };

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "active": return KeziColors.brand.emerald500;
      case "inactive": return KeziColors.gray[400];
      case "suspended": return KeziColors.phases.menstrual.primary;
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isExpanded = expandedId === item.id;
    
    return (
      <GlassCard style={styles.userCard}>
        <Pressable onPress={() => setExpandedId(isExpanded ? null : item.id)}>
          <View style={styles.userHeader}>
            <View style={[styles.avatar, { backgroundColor: getRoleBg(item.role) }]}>
              <ThemedText style={[styles.avatarText, { color: getRoleColor(item.role) }]}>
                {item.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.userTitleRow}>
                <ThemedText style={styles.userName}>{item.name}</ThemedText>
                <Feather
                  name={getStatusIcon(item.status)}
                  size={14}
                  color={getStatusColor(item.status)}
                />
              </View>
              <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
              <View style={[styles.roleBadge, { backgroundColor: getRoleBg(item.role) }]}>
                <ThemedText style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                  {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                </ThemedText>
              </View>
            </View>
            <Feather
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={KeziColors.gray[400]}
            />
          </View>
        </Pressable>

        {isExpanded && (
          <View style={styles.userDetails}>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Feather name="calendar" size={14} color={KeziColors.gray[400]} />
                <ThemedText style={styles.detailText}>Joined {item.created_at}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <Feather name="clock" size={14} color={KeziColors.gray[400]} />
                <ThemedText style={styles.detailText}>Last active: {item.last_active}</ThemedText>
              </View>
            </View>

            {item.role === "user" && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Feather name="activity" size={16} color={KeziColors.brand.purple600} />
                  <ThemedText style={styles.statValue}>{item.cycle_entries}</ThemedText>
                  <ThemedText style={styles.statLabel}>Cycle Entries</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <Feather name="shopping-bag" size={16} color={KeziColors.brand.teal600} />
                  <ThemedText style={styles.statValue}>{item.orders}</ThemedText>
                  <ThemedText style={styles.statLabel}>Orders</ThemedText>
                </View>
              </View>
            )}

            {item.role === "merchant" && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Feather name="shopping-bag" size={16} color={KeziColors.brand.teal600} />
                  <ThemedText style={styles.statValue}>{item.orders}</ThemedText>
                  <ThemedText style={styles.statLabel}>Total Orders</ThemedText>
                </View>
              </View>
            )}

            {item.role !== "admin" && (
              <View style={styles.actionButtons}>
                {item.status === "active" || item.status === "inactive" ? (
                  <Pressable
                    style={[styles.actionButtonOutline, { borderColor: KeziColors.phases.menstrual.primary }]}
                    onPress={() => handleSuspend(item.id)}
                  >
                    <Feather name="slash" size={16} color={KeziColors.phases.menstrual.primary} />
                    <ThemedText style={[styles.actionButtonText, { color: KeziColors.phases.menstrual.primary }]}>
                      Suspend
                    </ThemedText>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: KeziColors.brand.teal600 }]}
                    onPress={() => handleReactivate(item.id)}
                  >
                    <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                    <ThemedText style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                      Reactivate
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100] }]}>
          <Feather name="search" size={18} color={KeziColors.gray[400]} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
            placeholder="Search users..."
            placeholderTextColor={KeziColors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statChip, { backgroundColor: KeziColors.brand.purple100 }]}>
          <ThemedText style={[styles.statChipValue, { color: KeziColors.brand.purple600 }]}>{totalUsers}</ThemedText>
          <ThemedText style={styles.statChipLabel}>Users</ThemedText>
        </View>
        <View style={[styles.statChip, { backgroundColor: KeziColors.brand.teal100 }]}>
          <ThemedText style={[styles.statChipValue, { color: KeziColors.brand.teal600 }]}>{totalMerchants}</ThemedText>
          <ThemedText style={styles.statChipLabel}>Merchants</ThemedText>
        </View>
        <View style={[styles.statChip, { backgroundColor: KeziColors.brand.emerald100 }]}>
          <ThemedText style={[styles.statChipValue, { color: KeziColors.brand.emerald500 }]}>{totalActive}</ThemedText>
          <ThemedText style={styles.statChipLabel}>Active</ThemedText>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={ROLE_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                roleFilter === item && styles.filterChipActive,
              ]}
              onPress={() => setRoleFilter(item)}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  roleFilter === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Feather name="users" size={48} color={KeziColors.gray[400]} />
            <ThemedText style={styles.emptyText}>No users found</ThemedText>
          </GlassCard>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statChipValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statChipLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 2,
  },
  filtersContainer: {
    marginBottom: Spacing.sm,
  },
  filtersList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: KeziColors.gray[200],
  },
  filterChipActive: {
    backgroundColor: KeziColors.brand.purple600,
  },
  filterChipText: {
    fontSize: 12,
    color: KeziColors.gray[600],
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  userCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  userDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KeziColors.gray[200],
  },
  detailsGrid: {
    gap: Spacing.xs,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 13,
    opacity: 0.7,
  },
  statItem: {
    alignItems: "center",
    gap: Spacing.xxs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
