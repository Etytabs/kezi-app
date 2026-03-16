import React, { useState } from "react";
import { View, StyleSheet, Pressable, FlatList, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/context/LanguageContext";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";
import { useScreenInsets } from "@/hooks/useScreenInsets";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
  paymentMethod: string;
}

const DEMO_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    customerName: "Marie Uwimana",
    customerPhone: "+250 788 123 456",
    status: "pending",
    items: [
      { name: "Prenatal Vitamins", quantity: 2, price: 15000 },
      { name: "Organic Cotton Pads", quantity: 3, price: 3500 },
    ],
    totalAmount: 40500,
    deliveryAddress: "KG 123 St, Kimihurura, Kigali",
    createdAt: new Date().toISOString(),
    paymentMethod: "Mobile Money",
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    customerName: "Diane Mukamana",
    customerPhone: "+250 788 789 012",
    status: "confirmed",
    items: [
      { name: "Menstrual Cup - Size M", quantity: 1, price: 8000 },
    ],
    totalAmount: 8000,
    deliveryAddress: "KN 5 Road, Nyamirambo, Kigali",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    paymentMethod: "Cash on Delivery",
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customerName: "Grace Ingabire",
    customerPhone: "+250 788 456 789",
    status: "processing",
    items: [
      { name: "Folic Acid Supplement", quantity: 1, price: 12000 },
      { name: "Prenatal Vitamins", quantity: 1, price: 15000 },
    ],
    totalAmount: 27000,
    deliveryAddress: "KK 10 Ave, Gikondo, Kigali",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    paymentMethod: "Mobile Money",
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customerName: "Claudine Nziza",
    customerPhone: "+250 788 234 567",
    status: "delivered",
    items: [
      { name: "Organic Cotton Pads", quantity: 5, price: 3500 },
    ],
    totalAmount: 17500,
    deliveryAddress: "KG 7 St, Remera, Kigali",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    paymentMethod: "Card",
  },
];

const STATUS_OPTIONS = ["All", "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function MerchantOrdersScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const { paddingBottom } = useScreenInsets();
  
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === "All") return true;
    return order.status.toLowerCase() === selectedStatus.toLowerCase();
  });

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} RWF`;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return KeziColors.phases.luteal.primary;
      case "confirmed":
        return KeziColors.brand.purple500;
      case "processing":
        return KeziColors.brand.teal600;
      case "shipped":
        return KeziColors.phases.ovulation.primary;
      case "delivered":
        return KeziColors.brand.emerald500;
      case "cancelled":
        return KeziColors.gray[400];
      default:
        return KeziColors.gray[500];
    }
  };

  const getNextStatus = (current: string): Order["status"] | null => {
    const flow: { [key: string]: Order["status"] } = {
      pending: "confirmed",
      confirmed: "processing",
      processing: "shipped",
      shipped: "delivered",
    };
    return flow[current] || null;
  };

  const handleUpdateStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(orders.map((o) => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
  };

  const handleCancelOrder = (orderId: string) => {
    const confirmCancel = () => {
      setOrders(orders.map((o) => 
        o.id === orderId ? { ...o, status: "cancelled" } : o
      ));
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to cancel this order?")) {
        confirmCancel();
      }
    } else {
      Alert.alert(
        "Cancel Order",
        "Are you sure you want to cancel this order?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes, Cancel", style: "destructive", onPress: confirmCancel },
        ]
      );
    }
  };

  const getStatusStats = () => ({
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => ["confirmed", "processing"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "delivered").length,
  });

  const stats = getStatusStats();

  const renderOrder = ({ item }: { item: Order }) => {
    const isExpanded = expandedOrder === item.id;
    const nextStatus = getNextStatus(item.status);

    return (
      <GlassCard style={styles.orderCard}>
        <Pressable 
          style={styles.orderHeader}
          onPress={() => setExpandedOrder(isExpanded ? null : item.id)}
        >
          <View style={styles.orderInfo}>
            <ThemedText style={styles.orderNumber}>{item.orderNumber}</ThemedText>
            <ThemedText style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </ThemedText>
          </View>
          <Feather 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={KeziColors.gray[400]} 
          />
        </Pressable>

        <View style={styles.customerRow}>
          <Feather name="user" size={16} color={KeziColors.gray[400]} />
          <ThemedText style={styles.customerName}>{item.customerName}</ThemedText>
          <ThemedText style={styles.orderAmount}>{formatCurrency(item.totalAmount)}</ThemedText>
        </View>

        {isExpanded ? (
          <View style={styles.orderDetails}>
            <View style={styles.divider} />
            
            <View style={styles.detailSection}>
              <ThemedText style={styles.detailLabel}>Items</ThemedText>
              {item.items.map((orderItem, index) => (
                <View key={index} style={styles.itemRow}>
                  <ThemedText style={styles.itemName}>
                    {orderItem.quantity}x {orderItem.name}
                  </ThemedText>
                  <ThemedText style={styles.itemPrice}>
                    {formatCurrency(orderItem.price * orderItem.quantity)}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.detailSection}>
              <ThemedText style={styles.detailLabel}>Delivery Address</ThemedText>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color={KeziColors.gray[400]} />
                <ThemedText style={styles.detailValue}>{item.deliveryAddress}</ThemedText>
              </View>
            </View>

            <View style={styles.detailSection}>
              <ThemedText style={styles.detailLabel}>Contact</ThemedText>
              <View style={styles.detailRow}>
                <Feather name="phone" size={14} color={KeziColors.gray[400]} />
                <ThemedText style={styles.detailValue}>{item.customerPhone}</ThemedText>
              </View>
            </View>

            <View style={styles.detailSection}>
              <ThemedText style={styles.detailLabel}>Payment</ThemedText>
              <View style={styles.detailRow}>
                <Feather name="credit-card" size={14} color={KeziColors.gray[400]} />
                <ThemedText style={styles.detailValue}>{item.paymentMethod}</ThemedText>
              </View>
            </View>

            {item.status !== "delivered" && item.status !== "cancelled" ? (
              <View style={styles.orderActions}>
                {nextStatus ? (
                  <Pressable 
                    style={[styles.actionButton, styles.primaryAction]}
                    onPress={() => handleUpdateStatus(item.id, nextStatus)}
                  >
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.primaryActionText}>
                      Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                    </ThemedText>
                  </Pressable>
                ) : null}
                {item.status === "pending" ? (
                  <Pressable 
                    style={[styles.actionButton, styles.cancelAction]}
                    onPress={() => handleCancelOrder(item.id)}
                  >
                    <Feather name="x" size={16} color={KeziColors.phases.menstrual.primary} />
                    <ThemedText style={[styles.actionButtonText, { color: KeziColors.phases.menstrual.primary }]}>
                      Cancel
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </GlassCard>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.phases.luteal.secondary }]}>
            <Feather name="clock" size={16} color={KeziColors.phases.luteal.primary} />
          </View>
          <ThemedText style={styles.statValue}>{stats.pending}</ThemedText>
          <ThemedText style={styles.statLabel}>Pending</ThemedText>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.brand.teal100 }]}>
            <Feather name="loader" size={16} color={KeziColors.brand.teal600} />
          </View>
          <ThemedText style={styles.statValue}>{stats.processing}</ThemedText>
          <ThemedText style={styles.statLabel}>Processing</ThemedText>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: KeziColors.brand.emerald100 }]}>
            <Feather name="check-circle" size={16} color={KeziColors.brand.emerald500} />
          </View>
          <ThemedText style={styles.statValue}>{stats.completed}</ThemedText>
          <ThemedText style={styles.statLabel}>Delivered</ThemedText>
        </GlassCard>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_OPTIONS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                selectedStatus === item && styles.filterChipActive,
                { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[100] }
              ]}
              onPress={() => setSelectedStatus(item)}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  selectedStatus === item && styles.filterChipTextActive
                ]}
              >
                {item}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[styles.ordersList, { paddingBottom: paddingBottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={KeziColors.gray[400]} />
            <ThemedText style={styles.emptyTitle}>No orders found</ThemedText>
            <ThemedText style={styles.emptyText}>
              {selectedStatus === "All" 
                ? "Customer orders will appear here when they make purchases"
                : `No ${selectedStatus.toLowerCase()} orders at the moment`}
            </ThemedText>
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
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: "center",
    gap: Spacing.xxs,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  filterContainer: {
    marginBottom: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  filterChipActive: {
    backgroundColor: KeziColors.brand.teal600,
  },
  filterChipText: {
    fontSize: 13,
    opacity: 0.7,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    opacity: 1,
  },
  ordersList: {
    paddingHorizontal: Spacing.md,
  },
  orderCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderDate: {
    fontSize: 12,
    opacity: 0.6,
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
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  customerName: {
    flex: 1,
    fontSize: 14,
    opacity: 0.8,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: KeziColors.brand.teal600,
  },
  orderDetails: {
    marginTop: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: KeziColors.gray[200],
    marginBottom: Spacing.md,
  },
  detailSection: {
    marginBottom: Spacing.md,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xxs,
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
  },
  orderActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  primaryAction: {
    backgroundColor: KeziColors.brand.teal600,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  cancelAction: {
    flex: 0,
    paddingHorizontal: Spacing.lg,
    backgroundColor: KeziColors.phases.menstrual.secondary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
});
