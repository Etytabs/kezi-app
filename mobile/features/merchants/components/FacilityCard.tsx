import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Merchant } from "@/services/mockData";
import { Spacing, BorderRadius, KeziColors, Shadows } from "@/constants/theme";

interface FacilityCardProps {
  merchant: Merchant;
  index?: number;
  onReserve: (merchant: Merchant) => void;
  onOrder: (merchant: Merchant) => void;
  onPress?: (merchant: Merchant) => void;
  showDistance?: boolean;
}

export function FacilityCard({
  merchant,
  index = 0,
  onReserve,
  onOrder,
  onPress,
  showDistance = true,
}: FacilityCardProps) {
  const { theme, isDark } = useTheme();

  const getMerchantIcon = (): React.ComponentProps<typeof Feather>["name"] => {
    switch (merchant.type) {
      case "pharmacy":
        return "plus-circle";
      case "wellness":
        return "heart";
      case "clinic":
        return "home";
      default:
        return "shopping-bag";
    }
  };

  const getTypeLabel = () => {
    switch (merchant.type) {
      case "pharmacy":
        return "Pharmacy";
      case "wellness":
        return "Wellness";
      case "clinic":
        return "Clinic";
      default:
        return merchant.type;
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 75).duration(400)}>
      <GlassCard
        onPress={onPress ? () => onPress(merchant) : undefined}
        style={styles.card}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark
                  ? KeziColors.night.deep
                  : KeziColors.brand.teal50,
              },
            ]}
          >
            <Feather
              name={getMerchantIcon()}
              size={22}
              color={KeziColors.brand.teal600}
            />
          </View>

          <View style={styles.info}>
            <ThemedText type="body" style={styles.name}>
              {merchant.name}
            </ThemedText>
            <View style={styles.metaRow}>
              <View style={styles.ratingBadge}>
                <Feather
                  name="star"
                  size={12}
                  color={KeziColors.functional.warning}
                />
                <ThemedText type="chip" style={styles.rating}>
                  {merchant.rating}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[100],
                  },
                ]}
              >
                <ThemedText type="chip" style={styles.typeText}>
                  {getTypeLabel()}
                </ThemedText>
              </View>
              {showDistance && merchant.distance !== undefined && (
                <View style={styles.distanceBadge}>
                  <Feather
                    name="map-pin"
                    size={10}
                    color={KeziColors.brand.purple500}
                  />
                  <ThemedText type="chip" style={styles.distanceText}>
                    {merchant.distance.toFixed(1)} km
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText type="small" style={styles.address}>
              {merchant.address}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => onReserve(merchant)}
            style={({ pressed }) => [
              styles.actionButton,
              styles.reserveButton,
              {
                backgroundColor: isDark
                  ? KeziColors.brand.teal600 + "20"
                  : KeziColors.brand.teal50,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Feather
              name="calendar"
              size={16}
              color={KeziColors.brand.teal600}
            />
            <ThemedText
              type="small"
              style={[styles.actionText, { color: KeziColors.brand.teal600 }]}
            >
              Reserve
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => onOrder(merchant)}
            style={({ pressed }) => [
              styles.actionButton,
              styles.orderButton,
              {
                backgroundColor: KeziColors.brand.pink500,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Feather name="shopping-bag" size={16} color="#FFFFFF" />
            <ThemedText type="small" style={[styles.actionText, { color: "#FFFFFF" }]}>
              Order
            </ThemedText>
          </Pressable>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontWeight: "600",
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    textTransform: "capitalize",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  distanceText: {
    color: KeziColors.brand.purple500,
    fontWeight: "600",
  },
  address: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  reserveButton: {
    borderWidth: 1,
    borderColor: KeziColors.brand.teal600 + "40",
  },
  orderButton: {},
  actionText: {
    fontWeight: "600",
  },
});
