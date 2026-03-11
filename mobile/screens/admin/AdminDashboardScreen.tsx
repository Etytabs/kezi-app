import React, { useEffect, useState } from "react";
import { View, StyleSheet, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";
import { adminApi } from "@/services/api";

interface DashboardStats {
  totalUsers: number;
  newUsers30d: number;
  totalMerchants: number;
  pendingMerchants: number;
  verifiedMerchants: number;
  activeProducts: number;
  totalOrders: number;
  orders30d: number;
  totalRevenue: number;
  revenue30d: number;
  activeStores: number;
}

export default function AdminDashboardScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingMerchants, setPendingMerchants] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);

  const DEMO_STATS: DashboardStats = {
    totalUsers: 1247,
    newUsers30d: 89,
    totalMerchants: 34,
    pendingMerchants: 3,
    verifiedMerchants: 28,
    activeProducts: 156,
    totalOrders: 423,
    orders30d: 67,
    totalRevenue: 8456000,
    revenue30d: 1234000,
    activeStores: 42,
  };

  const DEMO_PENDING_MERCHANTS = [
    { id: "1", business_name: "Kigali Pharmacy Plus", email: "info@kigalipharmacy.rw", category: "Pharmacy", submitted_at: "2024-01-15" },
    { id: "2", business_name: "Mama's Wellness Shop", email: "mama.wellness@gmail.com", category: "Wellness", submitted_at: "2024-01-14" },
    { id: "3", business_name: "FemCare Rwanda", email: "contact@femcare.rw", category: "Health Products", submitted_at: "2024-01-13" },
  ];

  const DEMO_LOW_STOCK = [
    { id: "1", name: "Prenatal Vitamins", quantity: 5, business_name: "HealthFirst Pharmacy" },
    { id: "2", name: "Menstrual Cup (Size S)", quantity: 3, business_name: "Mama's Wellness Shop" },
    { id: "3", name: "Organic Cotton Pads", quantity: 8, business_name: "EcoFem Rwanda" },
  ];

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await adminApi.getDashboard();
      if (data) {
        setStats({
          totalUsers: parseInt(data.stats.total_users) || 0,
          newUsers30d: parseInt(data.stats.new_users_30d) || 0,
          totalMerchants: parseInt(data.stats.total_merchants) || 0,
          pendingMerchants: parseInt(data.stats.pending_merchants) || 0,
          verifiedMerchants: parseInt(data.stats.verified_merchants) || 0,
          activeProducts: parseInt(data.stats.active_products) || 0,
          totalOrders: parseInt(data.stats.total_orders) || 0,
          orders30d: parseInt(data.stats.orders_30d) || 0,
          totalRevenue: parseFloat(data.stats.total_revenue) || 0,
          revenue30d: parseFloat(data.stats.revenue_30d) || 0,
          activeStores: parseInt(data.stats.active_stores) || 0,
        });
        setPendingMerchants(data.pendingMerchants || []);
        setLowStockAlerts(data.lowStockAlerts || []);
      } else {
        setStats(DEMO_STATS);
        setPendingMerchants(DEMO_PENDING_MERCHANTS);
        setLowStockAlerts(DEMO_LOW_STOCK);
      }
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
      setStats(DEMO_STATS);
      setPendingMerchants(DEMO_PENDING_MERCHANTS);
      setLowStockAlerts(DEMO_LOW_STOCK);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  return (
    <ScreenScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <ThemedText style={styles.greeting}>Admin Panel</ThemedText>
        <ThemedText style={[styles.subtitle, { color: KeziColors.brand.purple600 }]}>
          {t("common.welcome")}, {user?.name}
        </ThemedText>
      </View>

      <View style={styles.statsGrid}>
        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.brand.purple100 }]}>
            <Feather name="users" size={20} color={KeziColors.brand.purple600} />
          </View>
          <ThemedText style={styles.statValue}>{stats?.totalUsers || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Users</ThemedText>
          <ThemedText style={styles.statDelta}>+{stats?.newUsers30d || 0} this month</ThemedText>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.maternal.teal100 }]}>
            <Feather name="briefcase" size={20} color={KeziColors.maternal.teal600} />
          </View>
          <ThemedText style={styles.statValue}>{stats?.totalMerchants || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Merchants</ThemedText>
          <ThemedText style={[styles.statDelta, { color: KeziColors.phases.luteal.primary }]}>
            {stats?.pendingMerchants || 0} pending
          </ThemedText>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.phases.menstrual.secondary }]}>
            <Feather name="shopping-bag" size={20} color={KeziColors.phases.menstrual.primary} />
          </View>
          <ThemedText style={styles.statValue}>{stats?.totalOrders || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Orders</ThemedText>
          <ThemedText style={styles.statDelta}>+{stats?.orders30d || 0} this month</ThemedText>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.maternal.emerald100 }]}>
            <Feather name="trending-up" size={20} color={KeziColors.maternal.emerald500} />
          </View>
          <ThemedText style={styles.statValue}>{formatCurrency(stats?.revenue30d || 0)}</ThemedText>
          <ThemedText style={styles.statLabel}>This Month</ThemedText>
          <ThemedText style={styles.statDelta}>Total: {formatCurrency(stats?.totalRevenue || 0)}</ThemedText>
        </GlassCard>
      </View>

      {pendingMerchants.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Pending Approvals</ThemedText>
            <View style={[styles.badge, { backgroundColor: KeziColors.phases.luteal.primary }]}>
              <ThemedText style={styles.badgeText}>{pendingMerchants.length}</ThemedText>
            </View>
          </View>
          {pendingMerchants.slice(0, 3).map((merchant) => (
            <GlassCard key={merchant.id} style={styles.merchantCard}>
              <View style={styles.merchantInfo}>
                <ThemedText style={styles.merchantName}>{merchant.business_name}</ThemedText>
                <ThemedText style={styles.merchantEmail}>{merchant.email}</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
            </GlassCard>
          ))}
        </View>
      )}

      {lowStockAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Low Stock Alerts</ThemedText>
            <View style={[styles.badge, { backgroundColor: KeziColors.phases.menstrual.primary }]}>
              <ThemedText style={styles.badgeText}>{lowStockAlerts.length}</ThemedText>
            </View>
          </View>
          {lowStockAlerts.slice(0, 3).map((alert) => (
            <GlassCard key={alert.id} style={styles.alertCard}>
              <View style={[styles.alertIcon, { backgroundColor: KeziColors.phases.menstrual.secondary }]}>
                <Feather name="alert-triangle" size={16} color={KeziColors.phases.menstrual.primary} />
              </View>
              <View style={styles.alertInfo}>
                <ThemedText style={styles.alertProduct}>{alert.name}</ThemedText>
                <ThemedText style={styles.alertMerchant}>{alert.business_name}</ThemedText>
              </View>
              <ThemedText style={[styles.alertStock, { color: KeziColors.phases.menstrual.primary }]}>
                {alert.quantity} left
              </ThemedText>
            </GlassCard>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Stats</ThemedText>
        <GlassCard style={styles.quickStats}>
          <View style={styles.quickStatRow}>
            <View style={styles.quickStat}>
              <Feather name="package" size={20} color={KeziColors.brand.purple600} />
              <ThemedText style={styles.quickStatValue}>{stats?.activeProducts || 0}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Products</ThemedText>
            </View>
            <View style={styles.quickStat}>
              <Feather name="map-pin" size={20} color={KeziColors.maternal.teal600} />
              <ThemedText style={styles.quickStatValue}>{stats?.activeStores || 0}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Stores</ThemedText>
            </View>
            <View style={styles.quickStat}>
              <Feather name="check-circle" size={20} color={KeziColors.maternal.emerald500} />
              <ThemedText style={styles.quickStatValue}>{stats?.verifiedMerchants || 0}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Verified</ThemedText>
            </View>
          </View>
        </GlassCard>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: "48%",
    padding: Spacing.md,
    gap: Spacing.xxs,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  statDelta: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: Spacing.xxs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  merchantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "600",
  },
  merchantEmail: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: Spacing.xxs,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  alertInfo: {
    flex: 1,
  },
  alertProduct: {
    fontSize: 14,
    fontWeight: "600",
  },
  alertMerchant: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: Spacing.xxs,
  },
  alertStock: {
    fontSize: 14,
    fontWeight: "600",
  },
  quickStats: {
    padding: Spacing.lg,
  },
  quickStatRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickStat: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  quickStatLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
});
