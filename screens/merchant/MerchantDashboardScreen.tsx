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
import { merchantsApi } from "@/services/api";

interface DashboardStats {
  activeProducts: number;
  pendingOrders: number;
  monthlyRevenue: number;
  activeStores: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  customerName: string;
  createdAt: string;
}

export default function MerchantDashboardScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [merchantName, setMerchantName] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await merchantsApi.getDashboard();
      if (data) {
        setMerchantName(data.merchant.business_name);
        setStats({
          activeProducts: parseInt(data.stats.active_products) || 0,
          pendingOrders: parseInt(data.stats.pending_orders) || 0,
          monthlyRevenue: parseFloat(data.stats.monthly_revenue) || 0,
          activeStores: parseInt(data.stats.active_stores) || 0,
        });
        setRecentOrders(data.recentOrders.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          totalAmount: parseFloat(o.total_amount),
          customerName: o.customer_name,
          createdAt: o.created_at,
        })));
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return KeziColors.phases.luteal.primary;
      case "confirmed":
        return KeziColors.maternal.teal600;
      case "processing":
        return KeziColors.brand.purple500;
      case "delivered":
        return KeziColors.maternal.emerald500;
      case "cancelled":
        return KeziColors.gray[400];
      default:
        return KeziColors.gray[500];
    }
  };

  return (
    <ScreenScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <ThemedText style={styles.greeting}>
          {t("common.welcome")}, {user?.name}
        </ThemedText>
        <ThemedText style={[styles.businessName, { color: KeziColors.maternal.teal600 }]}>
          {merchantName || "Your Business"}
        </ThemedText>
      </View>

      <View style={styles.statsGrid}>
        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.maternal.teal100 }]}>
            <Feather name="package" size={20} color={KeziColors.maternal.teal600} />
          </View>
          <ThemedText style={styles.statValue}>{stats?.activeProducts || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Products</ThemedText>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.phases.luteal.secondary }]}>
            <Feather name="clock" size={20} color={KeziColors.phases.luteal.primary} />
          </View>
          <ThemedText style={styles.statValue}>{stats?.pendingOrders || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Pending Orders</ThemedText>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.maternal.emerald100 }]}>
            <Feather name="trending-up" size={20} color={KeziColors.maternal.emerald500} />
          </View>
          <ThemedText style={styles.statValue}>{formatCurrency(stats?.monthlyRevenue || 0)}</ThemedText>
          <ThemedText style={styles.statLabel}>This Month</ThemedText>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.brand.purple100 }]}>
            <Feather name="map-pin" size={20} color={KeziColors.brand.purple600} />
          </View>
          <ThemedText style={styles.statValue}>{stats?.activeStores || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Stores</ThemedText>
        </GlassCard>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Recent Orders</ThemedText>
        {recentOrders.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Feather name="inbox" size={32} color={KeziColors.gray[400]} />
            <ThemedText style={styles.emptyText}>No orders yet</ThemedText>
          </GlassCard>
        ) : (
          recentOrders.slice(0, 5).map((order) => (
            <GlassCard key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <ThemedText style={styles.orderNumber}>#{order.orderNumber}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {order.status}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.customerName}>{order.customerName}</ThemedText>
              <View style={styles.orderFooter}>
                <ThemedText style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</ThemedText>
                <ThemedText style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
            </GlassCard>
          ))
        )}
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
    fontSize: 16,
    opacity: 0.7,
  },
  businessName: {
    fontSize: 24,
    fontWeight: "700",
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
    alignItems: "center",
    gap: Spacing.xs,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
  },
  orderCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  customerName: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: Spacing.sm,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: KeziColors.maternal.teal600,
  },
  orderDate: {
    fontSize: 12,
    opacity: 0.5,
  },
});
