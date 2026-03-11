import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/Button";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useTheme } from "@/hooks/useTheme";
import { PRODUCTS, MERCHANTS, Product } from "@/services/mockData";
import { Order, OrderType } from "@/services/storage";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { ShopStackParamList } from "@/navigation/ShopStackNavigator";
import { formatRWF } from "@/utils/currency";

type MerchantDetailRouteProp = RouteProp<ShopStackParamList, "MerchantDetail">;

interface CartItem {
  product: Product;
  quantity: number;
}

export default function MerchantDetailScreen() {
  const route = useRoute<MerchantDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("delivery");

  const merchant = useMemo(
    () => MERCHANTS.find((m) => m.id === route.params.merchantId),
    [route.params.merchantId]
  );

  const merchantProducts = useMemo(
    () => PRODUCTS.filter((p) => p.merchantId === route.params.merchantId),
    [route.params.merchantId]
  );

  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const handleReserve = useCallback(() => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart first.");
      return;
    }
    setOrderType("reservation");
    setShowCheckout(true);
  }, [cartItems]);

  const handleOrder = useCallback(() => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart first.");
      return;
    }
    setOrderType("delivery");
    setShowCheckout(true);
  }, [cartItems]);

  const handleOrderComplete = useCallback((order: Order) => {
    setShowCheckout(false);
    setCartItems([]);
    Alert.alert(
      "Order Placed",
      `Your order #${order.id.slice(-6)} has been placed successfully! ${
        order.orderType === "delivery"
          ? "It will be delivered to your address."
          : "You can pick it up from the store."
      }`,
      [{ text: "OK" }]
    );
  }, []);

  if (!merchant) {
    return (
      <ScreenScrollView>
        <ThemedText type="h3">Store not found</ThemedText>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GlassCard style={styles.headerCard}>
          <View
            style={[
              styles.iconContainer,
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
              size={32}
              color={
                merchant.type === "pharmacy"
                  ? KeziColors.brand.pink500
                  : merchant.type === "wellness"
                  ? KeziColors.brand.teal600
                  : KeziColors.brand.purple600
              }
            />
          </View>

          <ThemedText type="h3" style={styles.merchantName}>
            {merchant.name}
          </ThemedText>

          <View style={styles.infoRow}>
            <Feather name="map-pin" size={16} color={theme.textMuted} />
            <ThemedText type="body" style={styles.address}>
              {merchant.address}
            </ThemedText>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="star" size={16} color={KeziColors.functional.warning} />
              <ThemedText type="body" style={styles.statValue}>
                {merchant.rating}
              </ThemedText>
              <ThemedText type="small" style={styles.statLabel}>
                Rating
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Feather name="navigation" size={16} color={KeziColors.brand.teal600} />
              <ThemedText type="body" style={styles.statValue}>
                {merchant.distance} km
              </ThemedText>
              <ThemedText type="small" style={styles.statLabel}>
                Distance
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Feather name="package" size={16} color={KeziColors.brand.purple500} />
              <ThemedText type="body" style={styles.statValue}>
                {merchantProducts.length}
              </ThemedText>
              <ThemedText type="small" style={styles.statLabel}>
                Products
              </ThemedText>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          AVAILABLE PRODUCTS
        </ThemedText>
        {merchantProducts.map((product, index) => (
          <View key={product.id} style={styles.productRow}>
            <View style={styles.productCardWrapper}>
              <ProductCard
                product={product}
                onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
                index={index}
              />
            </View>
            <Pressable
              onPress={() => addToCart(product)}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: isDark
                    ? KeziColors.night.surface
                    : KeziColors.brand.pink50,
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                },
              ]}
            >
              <Feather name="plus" size={20} color={KeziColors.brand.pink500} />
            </Pressable>
          </View>
        ))}
      </Animated.View>

      {cartItems.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.cartBar,
            { backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF" },
          ]}
        >
          <View style={styles.cartInfo}>
            <View style={styles.cartBadge}>
              <ThemedText type="chip" style={styles.cartCount}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </ThemedText>
            </View>
            <View>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                Cart Total
              </ThemedText>
              <ThemedText type="h4" style={{ color: KeziColors.brand.pink500 }}>
                {formatRWF(cartTotal * 1200)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.cartActions}>
            <Pressable
              onPress={handleReserve}
              style={[
                styles.cartButton,
                styles.reserveButton,
                { borderColor: KeziColors.brand.teal600 },
              ]}
            >
              <Feather name="calendar" size={16} color={KeziColors.brand.teal600} />
              <ThemedText type="small" style={{ color: KeziColors.brand.teal600, fontWeight: "600" }}>
                Reserve
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleOrder}
              style={[styles.cartButton, styles.orderButton]}
            >
              <Feather name="shopping-bag" size={16} color="#FFFFFF" />
              <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Order
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      )}

      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={cartItems}
        merchant={merchant}
        orderType={orderType}
        onOrderComplete={handleOrderComplete}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  merchantName: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  address: {
    marginLeft: Spacing.sm,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontWeight: "700",
    marginVertical: 4,
  },
  statLabel: {
    opacity: 0.6,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  productCardWrapper: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
    marginTop: Spacing.xl,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cartInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cartBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KeziColors.brand.pink500,
    alignItems: "center",
    justifyContent: "center",
  },
  cartCount: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cartActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  reserveButton: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  orderButton: {
    backgroundColor: KeziColors.brand.pink500,
  },
});
