import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/context/LanguageContext";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";

interface TimeRange {
  label: string;
  value: "7d" | "30d" | "90d" | "1y";
}

const TIME_RANGES: TimeRange[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "1 Year", value: "1y" },
];

const DEMO_METRICS = {
  "7d": {
    newUsers: 23,
    activeUsers: 156,
    cycleEntries: 892,
    ordersPlaced: 34,
    revenue: 456000,
    avgOrderValue: 13411,
  },
  "30d": {
    newUsers: 89,
    activeUsers: 423,
    cycleEntries: 3456,
    ordersPlaced: 134,
    revenue: 1890000,
    avgOrderValue: 14104,
  },
  "90d": {
    newUsers: 234,
    activeUsers: 678,
    cycleEntries: 9876,
    ordersPlaced: 412,
    revenue: 5670000,
    avgOrderValue: 13762,
  },
  "1y": {
    newUsers: 1247,
    activeUsers: 945,
    cycleEntries: 45678,
    ordersPlaced: 1567,
    revenue: 23450000,
    avgOrderValue: 14963,
  },
};

const DEMO_TOP_PRODUCTS = [
  { name: "Prenatal Vitamins", sales: 234, revenue: 1170000 },
  { name: "Organic Cotton Pads", sales: 189, revenue: 567000 },
  { name: "Menstrual Cup", sales: 156, revenue: 1248000 },
  { name: "Iron Supplements", sales: 123, revenue: 369000 },
  { name: "Fertility Test Kit", sales: 98, revenue: 784000 },
];

const DEMO_TOP_MERCHANTS = [
  { name: "HealthFirst Pharmacy", orders: 123, revenue: 1845000 },
  { name: "EcoFem Rwanda", orders: 89, revenue: 1335000 },
  { name: "Mama's Wellness Shop", orders: 67, revenue: 1005000 },
  { name: "Kigali Pharmacy Plus", orders: 45, revenue: 675000 },
];

export default function AdminAnalyticsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const [selectedRange, setSelectedRange] = useState<TimeRange["value"]>("30d");
  const [exporting, setExporting] = useState(false);

  const metrics = DEMO_METRICS[selectedRange];

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M RWF`;
    }
    return `${amount.toLocaleString()} RWF`;
  };

  const generateReportHTML = () => {
    const today = new Date().toLocaleDateString();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kezi Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #9333EA; }
          h2 { color: #0D9488; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; }
          .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .metric-card { background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #9333EA; }
          .metric-label { font-size: 12px; color: #666; }
          .footer { margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <h1>Kezi Platform Analytics Report</h1>
        <p>Report Period: Last ${selectedRange === "7d" ? "7 Days" : selectedRange === "30d" ? "30 Days" : selectedRange === "90d" ? "90 Days" : "Year"}</p>
        <p>Generated: ${today}</p>
        
        <h2>Key Metrics</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-value">${metrics.newUsers}</div>
            <div class="metric-label">New Users</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.activeUsers}</div>
            <div class="metric-label">Active Users</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.cycleEntries}</div>
            <div class="metric-label">Cycle Entries</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.ordersPlaced}</div>
            <div class="metric-label">Orders</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatCurrency(metrics.revenue)}</div>
            <div class="metric-label">Revenue</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatCurrency(metrics.avgOrderValue)}</div>
            <div class="metric-label">Avg Order</div>
          </div>
        </div>
        
        <h2>Top Products</h2>
        <table>
          <tr><th>Product</th><th>Sales</th><th>Revenue</th></tr>
          ${DEMO_TOP_PRODUCTS.map(p => `<tr><td>${p.name}</td><td>${p.sales}</td><td>${formatCurrency(p.revenue)}</td></tr>`).join('')}
        </table>
        
        <h2>Top Merchants</h2>
        <table>
          <tr><th>Merchant</th><th>Orders</th><th>Revenue</th></tr>
          ${DEMO_TOP_MERCHANTS.map(m => `<tr><td>${m.name}</td><td>${m.orders}</td><td>${formatCurrency(m.revenue)}</td></tr>`).join('')}
        </table>
        
        <div class="footer">
          <p>This report is generated for Ministry of Health compliance and internal analytics purposes.</p>
          <p>Kezi - Cycle Tracking & Wellness Marketplace</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const html = generateReportHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === "web") {
        Alert.alert("Export Complete", "Report has been generated successfully.");
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Kezi Analytics Report",
          });
        } else {
          Alert.alert("Export Complete", `Report saved to: ${uri}`);
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      if (Platform.OS === "web") {
        alert("Failed to export report. Please try again.");
      } else {
        Alert.alert("Export Error", "Failed to generate report. Please try again.");
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Analytics & Reports</ThemedText>
        <ThemedText style={styles.subtitle}>Ministry of Health Compliance Data</ThemedText>
      </View>

      <View style={styles.timeRangeContainer}>
        {TIME_RANGES.map((range) => (
          <Pressable
            key={range.value}
            style={[
              styles.timeRangeButton,
              selectedRange === range.value && styles.timeRangeButtonActive,
            ]}
            onPress={() => setSelectedRange(range.value)}
          >
            <ThemedText
              style={[
                styles.timeRangeText,
                selectedRange === range.value && styles.timeRangeTextActive,
              ]}
            >
              {range.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.metricsGrid}>
        <GlassCard style={styles.metricCard}>
          <Feather name="user-plus" size={20} color={KeziColors.brand.purple600} />
          <ThemedText style={styles.metricValue}>{metrics.newUsers}</ThemedText>
          <ThemedText style={styles.metricLabel}>New Users</ThemedText>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <Feather name="users" size={20} color={KeziColors.brand.teal600} />
          <ThemedText style={styles.metricValue}>{metrics.activeUsers}</ThemedText>
          <ThemedText style={styles.metricLabel}>Active Users</ThemedText>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <Feather name="activity" size={20} color={KeziColors.phases.menstrual.primary} />
          <ThemedText style={styles.metricValue}>{metrics.cycleEntries}</ThemedText>
          <ThemedText style={styles.metricLabel}>Cycle Entries</ThemedText>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <Feather name="shopping-bag" size={20} color={KeziColors.brand.emerald500} />
          <ThemedText style={styles.metricValue}>{metrics.ordersPlaced}</ThemedText>
          <ThemedText style={styles.metricLabel}>Orders</ThemedText>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <Feather name="trending-up" size={20} color={KeziColors.brand.purple600} />
          <ThemedText style={styles.metricValue}>{formatCurrency(metrics.revenue)}</ThemedText>
          <ThemedText style={styles.metricLabel}>Revenue</ThemedText>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <Feather name="credit-card" size={20} color={KeziColors.brand.teal600} />
          <ThemedText style={styles.metricValue}>{formatCurrency(metrics.avgOrderValue)}</ThemedText>
          <ThemedText style={styles.metricLabel}>Avg Order</ThemedText>
        </GlassCard>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Top Products</ThemedText>
        <GlassCard style={styles.tableCard}>
          {DEMO_TOP_PRODUCTS.map((product, index) => (
            <View key={product.name} style={[styles.tableRow, index > 0 && styles.tableRowBorder]}>
              <View style={[styles.rankBadge, { backgroundColor: index < 3 ? KeziColors.brand.purple100 : KeziColors.gray[100] }]}>
                <ThemedText style={[styles.rankText, { color: index < 3 ? KeziColors.brand.purple600 : KeziColors.gray[500] }]}>
                  #{index + 1}
                </ThemedText>
              </View>
              <View style={styles.productInfo}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <ThemedText style={styles.productSales}>{product.sales} sold</ThemedText>
              </View>
              <ThemedText style={styles.productRevenue}>{formatCurrency(product.revenue)}</ThemedText>
            </View>
          ))}
        </GlassCard>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Top Merchants</ThemedText>
        <GlassCard style={styles.tableCard}>
          {DEMO_TOP_MERCHANTS.map((merchant, index) => (
            <View key={merchant.name} style={[styles.tableRow, index > 0 && styles.tableRowBorder]}>
              <View style={[styles.rankBadge, { backgroundColor: index < 3 ? KeziColors.brand.teal100 : KeziColors.gray[100] }]}>
                <ThemedText style={[styles.rankText, { color: index < 3 ? KeziColors.brand.teal600 : KeziColors.gray[500] }]}>
                  #{index + 1}
                </ThemedText>
              </View>
              <View style={styles.productInfo}>
                <ThemedText style={styles.productName}>{merchant.name}</ThemedText>
                <ThemedText style={styles.productSales}>{merchant.orders} orders</ThemedText>
              </View>
              <ThemedText style={styles.productRevenue}>{formatCurrency(merchant.revenue)}</ThemedText>
            </View>
          ))}
        </GlassCard>
      </View>

      <View style={styles.exportSection}>
        <ThemedText style={styles.exportTitle}>Export Report</ThemedText>
        <ThemedText style={styles.exportText}>
          Generate a PDF report for Ministry of Health compliance or internal review.
        </ThemedText>
        <Button
          onPress={handleExportPDF}
          style={styles.exportButton}
          disabled={exporting}
        >
          <Feather name="download" size={18} color="#FFFFFF" />
          <ThemedText style={styles.exportButtonText}>
            {exporting ? "Generating..." : "Export PDF Report"}
          </ThemedText>
        </Button>
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
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: Spacing.xxs,
  },
  timeRangeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: KeziColors.gray[200],
    alignItems: "center",
  },
  timeRangeButtonActive: {
    backgroundColor: KeziColors.brand.purple600,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: "600",
    color: KeziColors.gray[600],
  },
  timeRangeTextActive: {
    color: "#FFFFFF",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: "31%",
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  metricLabel: {
    fontSize: 10,
    opacity: 0.6,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  tableCard: {
    padding: 0,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tableRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KeziColors.gray[200],
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "600",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
  },
  productSales: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: "600",
    color: KeziColors.brand.emerald500,
  },
  exportSection: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: KeziColors.brand.purple100,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  exportText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
