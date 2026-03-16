import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, Modal, TextInput, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeIn, FadeInDown, SlideInRight } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassCard } from "@/components/GlassCard";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/Button";
import { MarketplaceOnboarding } from "@/components/MarketplaceOnboarding";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { PRODUCTS, MERCHANTS, Product } from "@/services/mockData";
import { calculateCycleInfo } from "@/services/cycleService";
import { storage, MarketplaceFilters } from "@/services/storage";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { useScrollContext } from "@/navigation/MainTabNavigator";

type FilterType = "all" | "menstrual" | "follicular" | "ovulation" | "luteal";

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "menstrual", label: "Period" },
  { id: "follicular", label: "Follicular" },
  { id: "ovulation", label: "Ovulation" },
  { id: "luteal", label: "Luteal" },
];

const CATEGORIES = ["All", "Contraceptives", "Hygiene", "Wellness", "Medicine"];

const DEFAULT_FILTERS: MarketplaceFilters = {
  priceRange: [0, 100],
  distanceRadius: 10,
  minRating: 0,
  categories: [],
  inStockOnly: false,
};

export default function ShopScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark, getPhaseColors } = useTheme();
  const { cycleConfig } = useAuth();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const layout = useResponsiveLayout();
  const { scrollHandler } = useScrollContext();
  
  const numColumns = layout.columns;
  const productWidth = (layout.width - (Spacing.xl * 2) - (Spacing.md * (numColumns - 1))) / numColumns;

  const cycleInfo = useMemo(() => calculateCycleInfo(cycleConfig), [cycleConfig]);
  const [activeFilter, setActiveFilter] = useState<FilterType>(cycleInfo.phase);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await storage.isMarketplaceOnboardingSeen();
      if (!seen) {
        setShowOnboarding(true);
      }
    };
    checkOnboarding();
  }, []);

  const filteredProducts = useMemo(() => {
    let products = PRODUCTS;

    if (activeFilter !== "all") {
      products = products.filter((product) => product.tags.includes(activeFilter));
    }

    if (advancedFilters.priceRange[1] < 100) {
      products = products.filter(
        (p) => p.price >= advancedFilters.priceRange[0] && p.price <= advancedFilters.priceRange[1]
      );
    }

    if (advancedFilters.inStockOnly) {
      products = products.filter((p) => p.inStock);
    }

    if (advancedFilters.categories.length > 0 && !advancedFilters.categories.includes("All")) {
      products = products.filter((p) =>
        advancedFilters.categories.some(
          (cat) => p.category.toLowerCase() === cat.toLowerCase()
        )
      );
    }

    return products;
  }, [activeFilter, advancedFilters]);

  const handleProductPress = (product: Product) => {
    navigation.navigate("ProductDetail", { productId: product.id });
  };

  const handleApplyFilters = async () => {
    await storage.setMarketplaceFilters(advancedFilters);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setAdvancedFilters(DEFAULT_FILTERS);
  };

  const toggleCategory = (category: string) => {
    setAdvancedFilters((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.priceRange[0] > 0 || advancedFilters.priceRange[1] < 100) count++;
    if (advancedFilters.inStockOnly) count++;
    if (advancedFilters.categories.length > 0) count++;
    return count;
  }, [advancedFilters]);

  const ListHeader = () => (
    <View style={styles.header}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <View style={styles.quickActions}>
          <GlassCard style={styles.syncCardSmall}>
            <View style={styles.syncHeader}>
              <Feather
                name="zap"
                size={18}
                color={KeziColors.brand.purple500}
              />
              <ThemedText type="small" style={styles.syncTitle}>
                Cycle-Synced for {cycleInfo.phase}
              </ThemedText>
            </View>
          </GlassCard>
          <Pressable
            onPress={() => navigation.navigate("MerchantDiscovery")}
            style={[
              styles.nearbyButton,
              {
                backgroundColor: isDark
                  ? KeziColors.night.surface
                  : KeziColors.brand.purple50,
              },
            ]}
          >
            <Feather
              name="map-pin"
              size={18}
              color={KeziColors.brand.purple500}
            />
            <ThemedText type="small" style={styles.nearbyText}>
              Nearby
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("Maternal")}
            style={[
              styles.maternalButton,
              {
                backgroundColor: isDark
                  ? KeziColors.night.surface
                  : KeziColors.brand.teal50,
              },
            ]}
          >
            <Feather
              name="heart"
              size={18}
              color={KeziColors.brand.teal600}
            />
            <ThemedText type="small" style={styles.maternalText}>
              Maternal
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            data={FILTERS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => {
              const isActive = activeFilter === item.id;
              const phaseColors =
                item.id !== "all" ? getPhaseColors(item.id as any) : null;

              return (
                <Pressable
                  onPress={() => setActiveFilter(item.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive
                        ? phaseColors?.primary || KeziColors.brand.pink500
                        : isDark
                        ? KeziColors.night.surface
                        : "#FFFFFF",
                      borderColor: isActive
                        ? "transparent"
                        : isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[200],
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={[
                      styles.filterLabel,
                      isActive && styles.activeFilterLabel,
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            }}
          />
          <Pressable
            onPress={() => setShowFilterModal(true)}
            style={[
              styles.filterButton,
              {
                backgroundColor: isDark
                  ? KeziColors.night.surface
                  : "#FFFFFF",
                borderColor: activeFilterCount > 0
                  ? KeziColors.brand.pink500
                  : isDark
                  ? KeziColors.night.deep
                  : KeziColors.gray[200],
              },
            ]}
          >
            <Feather
              name="sliders"
              size={18}
              color={
                activeFilterCount > 0
                  ? KeziColors.brand.pink500
                  : theme.text
              }
            />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <ThemedText type="chip" style={styles.filterBadgeText}>
                  {activeFilterCount}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
        </View>
      </Animated.View>

      <ThemedText type="sectionHeader" style={styles.sectionLabel}>
        {filteredProducts.length} PRODUCTS
      </ThemedText>
    </View>
  );

  const shopFeatures = [
    {
      icon: "shopping-bag" as const,
      title: "Curated Products",
      description: "Cycle-synced wellness products tailored to your phase",
    },
    {
      icon: "map-pin" as const,
      title: "Local Merchants",
      description: "Discover verified pharmacies and wellness stores nearby",
    },
    {
      icon: "credit-card" as const,
      title: "Easy Payments",
      description: "Mobile Money, card payments, and cash on delivery",
    },
    {
      icon: "truck" as const,
      title: "Fast Delivery",
      description: "Same-day delivery from local partners",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        key={`product-grid-${numColumns}`}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        ListHeaderComponent={ListHeader}
        onScroll={scrollHandler}
        renderItem={({ item, index }) => (
          <View style={[
            styles.productWrapper,
            { 
              width: productWidth,
              marginRight: (index + 1) % numColumns !== 0 ? Spacing.md : 0,
            }
          ]}>
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item)}
              index={index}
              compact={numColumns > 1}
            />
          </View>
        )}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={[
          styles.container,
          { paddingTop, paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: theme.backgroundRoot }}
      />

      <ComingSoonOverlay
        title="Wellness Shop"
        subtitle="Your personalized marketplace for cycle-synced health products is coming soon"
        features={shopFeatures}
        visible={showComingSoon}
        onPreview={() => setShowComingSoon(false)}
      />

      <MarketplaceOnboarding
        visible={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInRight.duration(300)}
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.backgroundDefault,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Filters</ThemedText>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.filterSection}>
                <ThemedText type="sectionHeader" style={styles.filterSectionLabel}>
                  PRICE RANGE
                </ThemedText>
                <View style={styles.priceInputs}>
                  <View style={styles.priceInput}>
                    <ThemedText type="small" style={styles.priceLabel}>
                      Min
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.priceField,
                        {
                          backgroundColor: isDark
                            ? KeziColors.night.deep
                            : KeziColors.gray[50],
                          color: theme.text,
                        },
                      ]}
                      value={advancedFilters.priceRange[0].toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          priceRange: [value, prev.priceRange[1]],
                        }));
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.placeholder}
                    />
                  </View>
                  <ThemedText type="body" style={styles.priceDivider}>
                    -
                  </ThemedText>
                  <View style={styles.priceInput}>
                    <ThemedText type="small" style={styles.priceLabel}>
                      Max
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.priceField,
                        {
                          backgroundColor: isDark
                            ? KeziColors.night.deep
                            : KeziColors.gray[50],
                          color: theme.text,
                        },
                      ]}
                      value={advancedFilters.priceRange[1].toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 100;
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          priceRange: [prev.priceRange[0], value],
                        }));
                      }}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor={theme.placeholder}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterSection}>
                <ThemedText type="sectionHeader" style={styles.filterSectionLabel}>
                  CATEGORIES
                </ThemedText>
                <View style={styles.categoryChips}>
                  {CATEGORIES.map((category) => {
                    const isActive = advancedFilters.categories.includes(category);
                    return (
                      <Pressable
                        key={category}
                        onPress={() => toggleCategory(category)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isActive
                              ? KeziColors.brand.pink500
                              : isDark
                              ? KeziColors.night.surface
                              : KeziColors.gray[50],
                            borderColor: isActive
                              ? KeziColors.brand.pink500
                              : isDark
                              ? KeziColors.night.deep
                              : KeziColors.gray[200],
                          },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={[
                            styles.categoryLabel,
                            isActive && { color: "#FFFFFF" },
                          ]}
                        >
                          {category}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Pressable
                  onPress={() =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      inStockOnly: !prev.inStockOnly,
                    }))
                  }
                  style={styles.checkboxRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: advancedFilters.inStockOnly
                          ? KeziColors.brand.pink500
                          : "transparent",
                        borderColor: advancedFilters.inStockOnly
                          ? KeziColors.brand.pink500
                          : theme.textMuted,
                      },
                    ]}
                  >
                    {advancedFilters.inStockOnly ? (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <ThemedText type="body" style={styles.checkboxLabel}>
                    Only show in-stock items
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Button
                variant="secondary"
                onPress={handleResetFilters}
                style={styles.modalButton}
              >
                Reset
              </Button>
              <Button onPress={handleApplyFilters} style={styles.modalButton}>
                Apply Filters
              </Button>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  syncCardSmall: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  nearbyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  nearbyText: {
    fontWeight: "600",
  },
  maternalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  maternalText: {
    fontWeight: "600",
    color: KeziColors.brand.purple500,
  },
  syncHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  syncTitle: {
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterList: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    flex: 1,
  },
  filterChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterLabel: {
    fontWeight: "600",
  },
  activeFilterLabel: {
    color: "#FFFFFF",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginLeft: Spacing.sm,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: KeziColors.brand.pink500,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  sectionLabel: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  productWrapper: {
    marginBottom: Spacing.md,
  },
  columnWrapper: {
    justifyContent: "flex-start",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalBody: {
    padding: Spacing.xl,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionLabel: {
    marginBottom: Spacing.md,
  },
  priceInputs: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.md,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    marginBottom: Spacing.xs,
    opacity: 0.6,
  },
  priceField: {
    height: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  priceDivider: {
    marginBottom: Spacing.sm,
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryLabel: {
    fontWeight: "500",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  checkboxLabel: {
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl + 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  modalButton: {
    flex: 1,
  },
});
