import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, KeziColors, Shadows } from "@/constants/theme";
import { Product } from "@/services/mockData";
import { formatRWF } from "@/utils/currency";

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  index?: number;
  compact?: boolean;
}

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({ product, onPress, index = 0, compact = false }: ProductCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: scale.value === 1 ? 0 : -2 }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getStockColor = () => {
    if (!product.inStock) return KeziColors.functional.danger;
    if (product.stockLevel < 10) return KeziColors.functional.warning;
    return KeziColors.functional.success;
  };

  const getStockText = () => {
    if (!product.inStock) return "Out of Stock";
    if (product.stockLevel < 10) return "Low Stock";
    return "In Stock";
  };

  const iconName = PRODUCT_ICONS[product.image] || "package";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={FadeIn.delay(index * 75).duration(400)}
      style={animatedStyle}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? KeziColors.night.surface
              : "#FFFFFF",
          },
          Shadows.sm,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark
                ? KeziColors.night.deep
                : KeziColors.brand.pink50,
            },
          ]}
        >
          <Feather
            name={iconName}
            size={24}
            color={KeziColors.brand.pink500}
          />
        </View>

        <View style={styles.content}>
          <ThemedText type="body" style={styles.name} numberOfLines={1}>
            {product.name}
          </ThemedText>
          <ThemedText type="small" style={styles.category}>
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </ThemedText>
        </View>

        <View style={styles.rightContent}>
          <ThemedText type="h4" style={styles.price}>
            {formatRWF(product.price * 1200)}
          </ThemedText>
          <View style={styles.stockBadge}>
            <View
              style={[styles.stockDot, { backgroundColor: getStockColor() }]}
            />
            <ThemedText
              type="small"
              style={[styles.stockText, { color: getStockColor() }]}
            >
              {getStockText()}
            </ThemedText>
          </View>
        </View>

        <Feather
          name="chevron-right"
          size={20}
          color={theme.textMuted}
          style={styles.chevron}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    marginBottom: 2,
  },
  category: {
    opacity: 0.6,
  },
  rightContent: {
    alignItems: "flex-end",
    marginRight: Spacing.sm,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  stockText: {
    fontSize: 10,
    fontWeight: "600",
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
