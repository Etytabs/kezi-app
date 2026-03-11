import React, { useState, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { PRODUCTS, MERCHANTS } from "@/services/mockData";
import { storage } from "@/services/storage";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { ShopStackParamList } from "@/navigation/ShopStackNavigator";
import { formatRWF } from "@/utils/currency";

type ProductDetailRouteProp = RouteProp<ShopStackParamList, "ProductDetail">;

const PRODUCT_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  pad: "box",
  cup: "coffee",
  pill: "heart",
  heat: "thermometer",
  vitamin: "plus-circle",
  tea: "coffee",
  oil: "droplet",
  mag: "zap",
  underwear: "layers",
  roller: "wind",
};

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const { theme, isDark } = useTheme();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  const product = useMemo(
    () => PRODUCTS.find((p) => p.id === route.params.productId),
    [route.params.productId]
  );

  const merchant = useMemo(
    () => MERCHANTS.find((m) => m.id === product?.merchantId),
    [product?.merchantId]
  );

  if (!product) {
    return (
      <ScreenScrollView>
        <ThemedText type="h3">Product not found</ThemedText>
      </ScreenScrollView>
    );
  }

  const handleWishlist = async () => {
    if (isWishlisted) {
      await storage.removeFromWishlist(product.id);
    } else {
      await storage.addToWishlist(product.id);
    }
    setIsWishlisted(!isWishlisted);
  };

  const handleReserve = async () => {
    if (!product.inStock) {
      Alert.alert("Out of Stock", "This product is currently unavailable.");
      return;
    }

    setIsReserving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsReserving(false);
    Alert.alert(
      "Reserved!",
      `${product.name} has been reserved at ${merchant?.name}. Pick it up within 2 hours.`
    );
  };

  const getStockColor = () => {
    if (!product.inStock) return KeziColors.functional.danger;
    if (product.stockLevel < 10) return KeziColors.functional.warning;
    return KeziColors.functional.success;
  };

  const getStockText = () => {
    if (!product.inStock) return "Out of Stock";
    if (product.stockLevel < 10) return `Only ${product.stockLevel} left`;
    return `${product.stockLevel} in stock`;
  };

  const iconName = PRODUCT_ICONS[product.image] || "package";

  return (
    <ScreenScrollView>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: isDark
                ? KeziColors.night.surface
                : KeziColors.brand.pink50,
            },
          ]}
        >
          <Feather
            name={iconName}
            size={64}
            color={KeziColors.brand.pink500}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="h3" style={styles.title}>
              {product.name}
            </ThemedText>
            <Button
              variant="ghost"
              size="small"
              onPress={handleWishlist}
              style={styles.wishlistButton}
            >
              <Feather
                name={isWishlisted ? "heart" : "heart"}
                size={24}
                color={isWishlisted ? KeziColors.brand.pink500 : theme.textMuted}
              />
            </Button>
          </View>

          <View style={styles.priceRow}>
            <ThemedText type="h2" style={styles.price}>
              {formatRWF(product.price * 1200)}
            </ThemedText>
            <View style={[styles.stockBadge, { backgroundColor: getStockColor() + "20" }]}>
              <View style={[styles.stockDot, { backgroundColor: getStockColor() }]} />
              <ThemedText type="small" style={[styles.stockText, { color: getStockColor() }]}>
                {getStockText()}
              </ThemedText>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <GlassCard style={styles.descriptionCard}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            DESCRIPTION
          </ThemedText>
          <ThemedText type="body" style={styles.description}>
            {product.description}
          </ThemedText>

          <View style={styles.tags}>
            {product.tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  {
                    backgroundColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.brand.pink50,
                  },
                ]}
              >
                <ThemedText type="small" style={styles.tagText}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      {merchant && (
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <GlassCard style={styles.merchantCard}>
            <ThemedText type="sectionHeader" style={styles.sectionLabel}>
              AVAILABLE AT
            </ThemedText>
            <View style={styles.merchantInfo}>
              <View
                style={[
                  styles.merchantIcon,
                  {
                    backgroundColor:
                      merchant.type === "pharmacy"
                        ? KeziColors.brand.pink50
                        : merchant.type === "wellness"
                        ? KeziColors.brand.teal50
                        : KeziColors.brand.purple50,
                  },
                ]}
              >
                <Feather
                  name={
                    merchant.type === "pharmacy"
                      ? "plus-square"
                      : merchant.type === "wellness"
                      ? "heart"
                      : "activity"
                  }
                  size={20}
                  color={
                    merchant.type === "pharmacy"
                      ? KeziColors.brand.pink500
                      : merchant.type === "wellness"
                      ? KeziColors.brand.teal600
                      : KeziColors.brand.purple600
                  }
                />
              </View>
              <View style={styles.merchantDetails}>
                <ThemedText type="body" style={styles.merchantName}>
                  {merchant.name}
                </ThemedText>
                <ThemedText type="small" style={styles.merchantAddress}>
                  {merchant.address} - {merchant.distance} km away
                </ThemedText>
              </View>
              <View style={styles.ratingBadge}>
                <Feather name="star" size={12} color={KeziColors.functional.warning} />
                <ThemedText type="small" style={styles.rating}>
                  {merchant.rating}
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <Button
          onPress={handleReserve}
          disabled={!product.inStock || isReserving}
          style={styles.reserveButton}
        >
          {isReserving ? "Reserving..." : product.inStock ? "Reserve Now" : "Out of Stock"}
        </Button>
      </Animated.View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: 200,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    marginRight: Spacing.md,
  },
  wishlistButton: {
    padding: 0,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  price: {
    marginRight: Spacing.md,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stockText: {
    fontWeight: "600",
  },
  descriptionCard: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  description: {
    opacity: 0.8,
    marginBottom: Spacing.lg,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    color: KeziColors.brand.pink500,
    fontWeight: "600",
  },
  merchantCard: {
    marginBottom: Spacing.xl,
  },
  merchantInfo: {
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
  merchantDetails: {
    flex: 1,
  },
  merchantName: {
    fontWeight: "600",
  },
  merchantAddress: {
    opacity: 0.6,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 4,
    fontWeight: "600",
  },
  reserveButton: {
    marginBottom: Spacing.xl,
  },
});
