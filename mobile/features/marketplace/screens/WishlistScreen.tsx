import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { storage } from "@/services/storage";
import { PRODUCTS, Product } from "@/services/mockData";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

export default function WishlistScreen() {
  const { theme, isDark } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    const ids = await storage.getWishlist();
    setWishlistIds(ids);
    const wishlistProducts = PRODUCTS.filter(p => ids.includes(p.id));
    setProducts(wishlistProducts);
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    await storage.removeFromWishlist(productId);
    setWishlistIds(prev => prev.filter(id => id !== productId));
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      layout={Layout.springify()}
    >
      <GlassCard style={styles.productCard}>
        <View
          style={[
            styles.productImage,
            {
              backgroundColor: isDark
                ? KeziColors.night.deep
                : KeziColors.brand.pink50,
            },
          ]}
        >
          <Feather
            name="shopping-bag"
            size={24}
            color={KeziColors.brand.pink500}
          />
        </View>
        
        <View style={styles.productInfo}>
          <ThemedText type="body" style={styles.productName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={styles.productCategory}>
            {item.category}
          </ThemedText>
          <ThemedText type="body" style={styles.productPrice}>
            ${item.price.toFixed(2)}
          </ThemedText>
        </View>

        <Pressable
          onPress={() => handleRemoveFromWishlist(item.id)}
          style={({ pressed }) => [
            styles.removeButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="heart" size={20} color={KeziColors.brand.pink500} />
        </Pressable>
      </GlassCard>
    </Animated.View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: isDark
              ? KeziColors.night.surface
              : KeziColors.brand.pink50,
          },
        ]}
      >
        <Feather name="heart" size={40} color={KeziColors.brand.pink500} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        Your wishlist is empty
      </ThemedText>
      <ThemedText type="body" style={styles.emptyDescription}>
        Save your favorite products here to purchase later
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop, paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: "600",
  },
  productCategory: {
    opacity: 0.6,
    marginTop: 2,
  },
  productPrice: {
    fontWeight: "700",
    color: KeziColors.brand.pink500,
    marginTop: 4,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    textAlign: "center",
    opacity: 0.6,
    paddingHorizontal: Spacing.xl,
  },
});
