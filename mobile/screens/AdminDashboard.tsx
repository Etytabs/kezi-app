import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert, ScrollView, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInRight, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { storage, AdminAction, AdminActionType, InventoryAlert } from "@/services/storage";
import { PRODUCTS, MERCHANTS, Product, Merchant } from "@/services/mockData";
import { Spacing, BorderRadius, KeziColors, Shadows, Typography } from "@/constants/theme";

type AdminSection = "overview" | "users" | "merchants" | "inventory" | "ai" | "system";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  lastActive: string;
}

const MOCK_USERS: MockUser[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah@example.com", role: "user", createdAt: "2024-01-15", lastActive: "2 hours ago" },
  { id: "2", name: "Emily Chen", email: "emily@example.com", role: "user", createdAt: "2024-02-20", lastActive: "5 mins ago" },
  { id: "3", name: "Admin User", email: "admin@jasmin.app", role: "admin", createdAt: "2024-01-01", lastActive: "Online" },
  { id: "4", name: "Maria Garcia", email: "maria@example.com", role: "user", createdAt: "2024-03-10", lastActive: "1 day ago" },
  { id: "5", name: "Aisha Patel", email: "aisha@example.com", role: "user", createdAt: "2024-03-15", lastActive: "3 hours ago" },
];

const MOCK_AI_LOGS = [
  { id: "1", type: "inspiration", query: "Menstrual phase energy tips", tokens: 245, timestamp: "10 mins ago" },
  { id: "2", type: "summary", query: "Weekly cycle summary", tokens: 312, timestamp: "1 hour ago" },
  { id: "3", type: "inspiration", query: "Fertility window guidance", tokens: 198, timestamp: "2 hours ago" },
  { id: "4", type: "summary", query: "Journal mood analysis", tokens: 456, timestamp: "5 hours ago" },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_TABLET = SCREEN_WIDTH >= 768;

export default function AdminDashboard() {
  const { theme, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [users, setUsers] = useState(MOCK_USERS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(!IS_TABLET);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.lastActive === "Online" || u.lastActive.includes("min")).length;
    const adminCount = users.filter((u) => u.role === "admin").length;
    const lowStockItems = PRODUCTS.filter((p) => p.stockLevel < 15).length;
    const outOfStock = PRODUCTS.filter((p) => !p.inStock).length;
    return { totalUsers, activeUsers, adminCount, lowStockItems, outOfStock, totalMerchants: MERCHANTS.length };
  }, [users]);

  const inventoryAlerts = useMemo<InventoryAlert[]>(() => {
    return PRODUCTS
      .filter((p) => p.stockLevel < 20)
      .map((p) => {
        const merchant = MERCHANTS.find((m) => m.id === p.merchantId);
        const severity: InventoryAlert["severity"] = p.stockLevel === 0 ? "critical" : p.stockLevel < 10 ? "warning" : "low";
        return {
          productId: p.id,
          productName: p.name,
          merchantId: p.merchantId,
          merchantName: merchant?.name || "Unknown",
          currentStock: p.stockLevel,
          threshold: 20,
          severity,
        };
      })
      .sort((a, b) => a.currentStock - b.currentStock);
  }, []);

  const logAction = useCallback(async (
    actionType: AdminActionType,
    targetId: string,
    targetType: AdminAction["targetType"],
    description: string
  ) => {
    if (!currentUser) return;
    const action: AdminAction = {
      id: Date.now().toString(),
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      actionType,
      targetId,
      targetType,
      description,
      timestamp: new Date().toISOString(),
    };
    await storage.logAdminAction(action);
  }, [currentUser]);

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
          onPress: async () => {
            setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
            await logAction(
              newRole === "admin" ? "promote_user" : "demote_user",
              userId,
              "user",
              `${action}d ${userToUpdate.name} to ${newRole}`
            );
          },
        },
      ]
    );
  };

  const sidebarItems: { key: AdminSection; icon: React.ComponentProps<typeof Feather>["name"]; label: string }[] = [
    { key: "overview", icon: "grid", label: "Overview" },
    { key: "users", icon: "users", label: "Users" },
    { key: "merchants", icon: "shopping-bag", label: "Merchants" },
    { key: "inventory", icon: "package", label: "Inventory" },
    { key: "ai", icon: "cpu", label: "AI Insights" },
    { key: "system", icon: "activity", label: "System" },
  ];

  const renderSidebar = () => (
    <Animated.View
      entering={FadeInRight.duration(400)}
      style={[
        styles.sidebar,
        {
          backgroundColor: isDark ? KeziColors.night.base : "rgba(255,255,255,0.95)",
          width: sidebarCollapsed ? 60 : 180,
        },
      ]}
    >
      <Pressable
        onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={styles.collapseButton}
      >
        <Feather
          name={sidebarCollapsed ? "chevron-right" : "chevron-left"}
          size={18}
          color={theme.textMuted}
        />
      </Pressable>

      {sidebarItems.map((item, index) => (
        <Pressable
          key={item.key}
          onPress={() => setActiveSection(item.key)}
          style={({ pressed }) => [
            styles.sidebarItem,
            {
              backgroundColor:
                activeSection === item.key
                  ? isDark
                    ? KeziColors.night.surface
                    : KeziColors.brand.purple100
                  : "transparent",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather
            name={item.icon}
            size={20}
            color={
              activeSection === item.key
                ? KeziColors.brand.purple500
                : theme.textMuted
            }
          />
          {!sidebarCollapsed && (
            <ThemedText
              type="body"
              style={[
                styles.sidebarLabel,
                {
                  color:
                    activeSection === item.key
                      ? KeziColors.brand.purple500
                      : theme.text,
                },
              ]}
            >
              {item.label}
            </ThemedText>
          )}
        </Pressable>
      ))}

      <View style={styles.sidebarFooter}>
        <View
          style={[
            styles.adminBadge,
            { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.pink100 },
          ]}
        >
          <Feather name="shield" size={14} color={KeziColors.brand.pink500} />
          {!sidebarCollapsed && (
            <ThemedText type="chip" style={styles.adminBadgeText}>
              GOD MODE
            </ThemedText>
          )}
        </View>
      </View>
    </Animated.View>
  );

  const renderOverview = () => (
    <View style={styles.bentoGrid}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.bentoRow}>
        <BentoCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          icon="users"
          color={KeziColors.brand.purple500}
          isDark={isDark}
          subtitle={`${stats.activeUsers} active now`}
        />
        <BentoCard
          title="Active Cycles"
          value={(stats.totalUsers - stats.adminCount).toString()}
          icon="activity"
          color={KeziColors.brand.pink500}
          isDark={isDark}
          subtitle="Tracking health"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.bentoRow}>
        <BentoCard
          title="Merchants"
          value={stats.totalMerchants.toString()}
          icon="shopping-bag"
          color={KeziColors.brand.teal600}
          isDark={isDark}
          subtitle="Active partners"
        />
        <BentoCard
          title="Low Stock"
          value={stats.lowStockItems.toString()}
          icon="alert-triangle"
          color={stats.lowStockItems > 3 ? KeziColors.functional.warning : KeziColors.functional.success}
          isDark={isDark}
          subtitle={`${stats.outOfStock} out of stock`}
          isAlert={stats.lowStockItems > 3}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <GlassCard style={styles.quickActionsCard}>
          <ThemedText type="sectionHeader" style={styles.cardTitle}>
            QUICK ACTIONS
          </ThemedText>
          <View style={styles.quickActionsRow}>
            <QuickActionButton icon="user-plus" label="Add User" onPress={() => Alert.alert("Add User", "User creation form")} isDark={isDark} />
            <QuickActionButton icon="plus-circle" label="Add Merchant" onPress={() => Alert.alert("Add Merchant", "Merchant creation form")} isDark={isDark} />
            <QuickActionButton icon="refresh-cw" label="Sync Data" onPress={() => Alert.alert("Sync", "Syncing data...")} isDark={isDark} />
            <QuickActionButton icon="download" label="Export" onPress={() => Alert.alert("Export", "Exporting reports...")} isDark={isDark} />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <GlassCard style={styles.alertsCard}>
          <View style={styles.alertsHeader}>
            <ThemedText type="sectionHeader" style={styles.cardTitle}>
              INVENTORY ALERTS
            </ThemedText>
            <View style={[styles.alertBadge, { backgroundColor: KeziColors.functional.warning + "30" }]}>
              <ThemedText type="chip" style={{ color: KeziColors.functional.warning }}>
                {inventoryAlerts.length}
              </ThemedText>
            </View>
          </View>
          {inventoryAlerts.slice(0, 3).map((alert, index) => (
            <AlertRow key={alert.productId} alert={alert} isDark={isDark} index={index} />
          ))}
          {inventoryAlerts.length > 3 && (
            <Pressable
              onPress={() => setActiveSection("inventory")}
              style={styles.viewAllButton}
            >
              <ThemedText type="small" style={{ color: KeziColors.brand.purple500 }}>
                View all {inventoryAlerts.length} alerts
              </ThemedText>
              <Feather name="chevron-right" size={14} color={KeziColors.brand.purple500} />
            </Pressable>
          )}
        </GlassCard>
      </Animated.View>
    </View>
  );

  const renderUsers = () => (
    <View>
      <View style={styles.sectionHeader}>
        <ThemedText type="h4">User Management</ThemedText>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          {users.length} total users
        </ThemedText>
      </View>

      {users.map((user, index) => (
        <Animated.View
          key={user.id}
          entering={FadeInDown.delay(index * 50).duration(300)}
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
                <View style={styles.userMeta}>
                  <View style={styles.metaItem}>
                    <Feather name="clock" size={10} color={theme.textMuted} />
                    <ThemedText type="small" style={styles.metaText}>
                      {user.lastActive}
                    </ThemedText>
                  </View>
                </View>
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
                  color={user.role === "admin" ? "#FFFFFF" : KeziColors.gray[500]}
                />
                <ThemedText
                  type="chip"
                  style={[
                    styles.roleText,
                    { color: user.role === "admin" ? "#FFFFFF" : KeziColors.gray[500] },
                  ]}
                >
                  {user.role.toUpperCase()}
                </ThemedText>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>
      ))}
    </View>
  );

  const renderMerchants = () => (
    <View>
      <View style={styles.sectionHeader}>
        <ThemedText type="h4">Merchant Management</ThemedText>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          {MERCHANTS.length} active merchants
        </ThemedText>
      </View>

      {MERCHANTS.map((merchant, index) => (
        <Animated.View
          key={merchant.id}
          entering={FadeInDown.delay(index * 50).duration(300)}
        >
          <GlassCard style={styles.merchantCard}>
            <View style={styles.merchantRow}>
              <View
                style={[
                  styles.merchantIcon,
                  { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.teal50 },
                ]}
              >
                <Feather
                  name={merchant.type === "pharmacy" ? "plus-circle" : merchant.type === "wellness" ? "heart" : "home"}
                  size={20}
                  color={KeziColors.brand.teal600}
                />
              </View>
              <View style={styles.merchantInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {merchant.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  {merchant.address}
                </ThemedText>
                <View style={styles.merchantMeta}>
                  <View style={styles.ratingBadge}>
                    <Feather name="star" size={10} color={KeziColors.functional.warning} />
                    <ThemedText type="chip">{merchant.rating}</ThemedText>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[100] }]}>
                    <ThemedText type="chip" style={{ textTransform: "capitalize" }}>
                      {merchant.type}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.merchantActions}>
                <Pressable style={styles.actionIcon}>
                  <Feather name="edit-2" size={16} color={KeziColors.brand.purple500} />
                </Pressable>
                <Pressable style={styles.actionIcon}>
                  <Feather name="map-pin" size={16} color={KeziColors.brand.teal600} />
                </Pressable>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      ))}

      <Pressable
        style={[
          styles.addMerchantButton,
          { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[50] },
        ]}
      >
        <Feather name="plus" size={20} color={KeziColors.brand.teal600} />
        <ThemedText type="body" style={{ color: KeziColors.brand.teal600 }}>
          Add New Merchant
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderInventory = () => (
    <View>
      <View style={styles.sectionHeader}>
        <ThemedText type="h4">Inventory Alerts</ThemedText>
        <View style={[styles.alertCountBadge, { backgroundColor: KeziColors.functional.warning + "20" }]}>
          <Feather name="alert-triangle" size={12} color={KeziColors.functional.warning} />
          <ThemedText type="chip" style={{ color: KeziColors.functional.warning }}>
            {inventoryAlerts.length} items need attention
          </ThemedText>
        </View>
      </View>

      {inventoryAlerts.map((alert, index) => (
        <Animated.View
          key={alert.productId}
          entering={FadeInDown.delay(index * 50).duration(300)}
        >
          <GlassCard style={styles.inventoryCard}>
            <View style={styles.inventoryRow}>
              <View
                style={[
                  styles.severityIndicator,
                  {
                    backgroundColor:
                      alert.severity === "critical"
                        ? KeziColors.functional.danger
                        : alert.severity === "warning"
                        ? KeziColors.functional.warning
                        : KeziColors.functional.success,
                  },
                ]}
              />
              <View style={styles.inventoryInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {alert.productName}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  {alert.merchantName}
                </ThemedText>
              </View>
              <View style={styles.stockInfo}>
                <ThemedText
                  type="h4"
                  style={{
                    color:
                      alert.severity === "critical"
                        ? KeziColors.functional.danger
                        : alert.severity === "warning"
                        ? KeziColors.functional.warning
                        : theme.text,
                  }}
                >
                  {alert.currentStock}
                </ThemedText>
                <ThemedText type="chip" style={{ color: theme.textMuted }}>
                  in stock
                </ThemedText>
              </View>
              <Pressable
                style={[styles.restockButton, { backgroundColor: KeziColors.brand.teal600 }]}
              >
                <Feather name="plus" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>
      ))}
    </View>
  );

  const renderAI = () => (
    <View>
      <View style={styles.sectionHeader}>
        <ThemedText type="h4">AI Insights Log</ThemedText>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          Gemini 2.5-flash usage
        </ThemedText>
      </View>

      <GlassCard style={styles.aiStatsCard}>
        <View style={styles.aiStatsRow}>
          <View style={styles.aiStat}>
            <ThemedText type="h3" style={{ color: KeziColors.brand.purple500 }}>
              1,211
            </ThemedText>
            <ThemedText type="chip" style={{ color: theme.textMuted }}>
              Total Tokens Today
            </ThemedText>
          </View>
          <View style={styles.aiStatDivider} />
          <View style={styles.aiStat}>
            <ThemedText type="h3" style={{ color: KeziColors.brand.teal600 }}>
              94%
            </ThemedText>
            <ThemedText type="chip" style={{ color: theme.textMuted }}>
              Quota Remaining
            </ThemedText>
          </View>
        </View>
      </GlassCard>

      {MOCK_AI_LOGS.map((log, index) => (
        <Animated.View
          key={log.id}
          entering={FadeInDown.delay(index * 50).duration(300)}
        >
          <GlassCard style={styles.aiLogCard}>
            <View style={styles.aiLogRow}>
              <View
                style={[
                  styles.aiLogIcon,
                  {
                    backgroundColor: log.type === "inspiration"
                      ? KeziColors.brand.purple100
                      : KeziColors.brand.teal50,
                  },
                ]}
              >
                <Feather
                  name={log.type === "inspiration" ? "zap" : "file-text"}
                  size={16}
                  color={log.type === "inspiration" ? KeziColors.brand.purple500 : KeziColors.brand.teal600}
                />
              </View>
              <View style={styles.aiLogInfo}>
                <ThemedText type="body">{log.query}</ThemedText>
                <View style={styles.aiLogMeta}>
                  <ThemedText type="chip" style={{ color: theme.textMuted }}>
                    {log.tokens} tokens
                  </ThemedText>
                  <ThemedText type="chip" style={{ color: theme.textMuted }}>
                    {log.timestamp}
                  </ThemedText>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      ))}
    </View>
  );

  const renderSystem = () => (
    <View>
      <View style={styles.sectionHeader}>
        <ThemedText type="h4">System Health</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: KeziColors.functional.success + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: KeziColors.functional.success }]} />
          <ThemedText type="chip" style={{ color: KeziColors.functional.success }}>
            All Systems Operational
          </ThemedText>
        </View>
      </View>

      <View style={styles.systemGrid}>
        <SystemMetric label="API Latency" value="45ms" status="good" isDark={isDark} />
        <SystemMetric label="Database" value="99.9%" status="good" isDark={isDark} />
        <SystemMetric label="Storage" value="62%" status="warning" isDark={isDark} />
        <SystemMetric label="Memory" value="41%" status="good" isDark={isDark} />
      </View>

      <GlassCard style={styles.auditCard}>
        <ThemedText type="sectionHeader" style={styles.cardTitle}>
          RECENT ADMIN ACTIONS
        </ThemedText>
        <View style={styles.auditPlaceholder}>
          <Feather name="file-text" size={24} color={theme.textMuted} />
          <ThemedText type="small" style={{ color: theme.textMuted, marginTop: Spacing.sm }}>
            Admin actions will appear here
          </ThemedText>
        </View>
      </GlassCard>
    </View>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return renderOverview();
      case "users": return renderUsers();
      case "merchants": return renderMerchants();
      case "inventory": return renderInventory();
      case "ai": return renderAI();
      case "system": return renderSystem();
      default: return renderOverview();
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop }]}>
      <View style={styles.layout}>
        {renderSidebar()}
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="h3">
              {sidebarItems.find((i) => i.key === activeSection)?.label}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Welcome back, {currentUser?.name}
            </ThemedText>
          </View>
          {renderContent()}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

function BentoCard({
  title,
  value,
  icon,
  color,
  isDark,
  subtitle,
  isAlert,
}: {
  title: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  isDark: boolean;
  subtitle?: string;
  isAlert?: boolean;
}) {
  return (
    <View
      style={[
        styles.bentoCard,
        {
          backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF",
          borderColor: isAlert ? color + "50" : "transparent",
          borderWidth: isAlert ? 1 : 0,
        },
        Shadows.sm,
      ]}
    >
      <View style={[styles.bentoIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <ThemedText type="h3" style={styles.bentoValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={styles.bentoTitle}>
        {title}
      </ThemedText>
      {subtitle && (
        <ThemedText type="chip" style={styles.bentoSubtitle}>
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

function QuickActionButton({
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
          backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50],
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Feather name={icon} size={18} color={KeziColors.brand.purple500} />
      <ThemedText type="chip" style={styles.quickActionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function AlertRow({ alert, isDark, index }: { alert: InventoryAlert; isDark: boolean; index: number }) {
  return (
    <View style={styles.alertRow}>
      <View
        style={[
          styles.alertDot,
          {
            backgroundColor:
              alert.severity === "critical"
                ? KeziColors.functional.danger
                : alert.severity === "warning"
                ? KeziColors.functional.warning
                : KeziColors.functional.success,
          },
        ]}
      />
      <View style={styles.alertInfo}>
        <ThemedText type="small" style={{ fontWeight: "600" }}>
          {alert.productName}
        </ThemedText>
        <ThemedText type="chip" style={{ color: KeziColors.gray[400] }}>
          {alert.merchantName}
        </ThemedText>
      </View>
      <ThemedText
        type="body"
        style={{
          color:
            alert.severity === "critical"
              ? KeziColors.functional.danger
              : alert.severity === "warning"
              ? KeziColors.functional.warning
              : KeziColors.gray[500],
          fontWeight: "700",
        }}
      >
        {alert.currentStock}
      </ThemedText>
    </View>
  );
}

function SystemMetric({
  label,
  value,
  status,
  isDark,
}: {
  label: string;
  value: string;
  status: "good" | "warning" | "critical";
  isDark: boolean;
}) {
  const color =
    status === "good"
      ? KeziColors.functional.success
      : status === "warning"
      ? KeziColors.functional.warning
      : KeziColors.functional.danger;

  return (
    <View
      style={[
        styles.systemMetric,
        { backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF" },
        Shadows.sm,
      ]}
    >
      <View style={[styles.metricIndicator, { backgroundColor: color }]} />
      <ThemedText type="h4" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="chip" style={{ color: KeziColors.gray[400] }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(0,0,0,0.1)",
  },
  collapseButton: {
    alignSelf: "flex-end",
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  sidebarLabel: {
    fontWeight: "500",
  },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  adminBadgeText: {
    color: KeziColors.brand.pink500,
    fontWeight: "700",
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  bentoGrid: {
    gap: Spacing.md,
  },
  bentoRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  bentoCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "flex-start",
  },
  bentoIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  bentoValue: {
    marginBottom: 2,
  },
  bentoTitle: {
    opacity: 0.6,
  },
  bentoSubtitle: {
    opacity: 0.4,
    marginTop: 2,
  },
  quickActionsCard: {
    marginTop: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.md,
    opacity: 0.6,
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  quickActionLabel: {
    textAlign: "center",
  },
  alertsCard: {
    marginTop: Spacing.md,
  },
  alertsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  alertBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  alertInfo: {
    flex: 1,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
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
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    opacity: 0.5,
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
  merchantCard: {
    marginBottom: Spacing.md,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  merchantIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  merchantActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionIcon: {
    padding: Spacing.sm,
  },
  addMerchantButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: KeziColors.brand.teal600 + "50",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  alertCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  inventoryCard: {
    marginBottom: Spacing.md,
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  severityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  inventoryInfo: {
    flex: 1,
  },
  stockInfo: {
    alignItems: "flex-end",
    marginRight: Spacing.md,
  },
  restockButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  aiStatsCard: {
    marginBottom: Spacing.lg,
  },
  aiStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiStat: {
    flex: 1,
    alignItems: "center",
  },
  aiStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: Spacing.lg,
  },
  aiLogCard: {
    marginBottom: Spacing.md,
  },
  aiLogRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiLogIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  aiLogInfo: {
    flex: 1,
  },
  aiLogMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  systemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  systemMetric: {
    flex: 1,
    minWidth: 80,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  metricIndicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  auditCard: {
    marginTop: Spacing.md,
  },
  auditPlaceholder: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    opacity: 0.5,
  },
});
