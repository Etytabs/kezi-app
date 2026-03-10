import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, FlatList, Pressable, Platform, Dimensions, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  MapViewWrapper,
  MarkerWrapper,
  isMapAvailable,
  type Region,
} from "@/components/MapViewWrapper";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/hooks/useLocation";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { MERCHANTS, PRODUCTS, Merchant } from "@/services/mockData";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const KIGALI_REGION: Region = {
  latitude: -1.9403,
  longitude: 29.8739,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MerchantDiscoveryScreen() {
  const { theme, isDark } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const { 
    latitude, 
    longitude, 
    isLoading: locationLoading, 
    errorMsg, 
    getCurrentLocation, 
    calculateDistance 
  } = useLocation();
  const mapRef = useRef<any>(null);

  const hasLocation = latitude !== null && longitude !== null;
  const [sortBy, setSortBy] = useState<"distance" | "rating">("rating");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const hasAutoSwitchedToDistance = useRef(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (hasLocation && !hasAutoSwitchedToDistance.current) {
      hasAutoSwitchedToDistance.current = true;
      setSortBy("distance");
    }
  }, [hasLocation]);

  const merchantsWithDistance = useMemo(() => {
    return MERCHANTS.map((merchant) => {
      const distance = hasLocation ? calculateDistance(merchant.latitude, merchant.longitude) : null;
      const products = PRODUCTS.filter((p) => p.merchantId === merchant.id);
      return {
        ...merchant,
        calculatedDistance: distance,
        productCount: products.length,
        inStockCount: products.filter((p) => p.inStock).length,
      };
    }).sort((a, b) => {
      if (sortBy === "distance" && hasLocation) {
        return (a.calculatedDistance ?? 0) - (b.calculatedDistance ?? 0);
      }
      return b.rating - a.rating;
    });
  }, [calculateDistance, sortBy, hasLocation]);

  const mapRegion = useMemo(() => {
    if (hasLocation) {
      return {
        latitude,
        longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    return KIGALI_REGION;
  }, [hasLocation, latitude, longitude]);

  const handleMarkerPress = (merchantId: string) => {
    setSelectedMerchant(merchantId === selectedMerchant ? null : merchantId);
  };

  const handleGetDirections = (merchant: Merchant) => {
    const destination = `${merchant.latitude},${merchant.longitude}`;
    const label = encodeURIComponent(merchant.name);
    
    if (Platform.OS === "web") {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${label}`, "_blank");
    } else {
      const url = Platform.select({
        ios: `maps://app?daddr=${destination}&ll=${destination}&q=${label}`,
        android: `geo:${destination}?q=${destination}(${label})`,
      });
      
      if (url) {
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
          }
        });
      }
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "pharmacy": return KeziColors.maternal.teal600;
      case "wellness": return KeziColors.brand.pink500;
      default: return KeziColors.brand.purple600;
    }
  };

  const renderMerchant = ({ item, index }: { item: typeof merchantsWithDistance[0]; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 75).duration(400)}
      layout={Layout.springify()}
    >
      <GlassCard style={styles.merchantCard}>
        <View style={styles.merchantHeader}>
          <View
            style={[
              styles.merchantIcon,
              {
                backgroundColor: isDark
                  ? KeziColors.night.deep
                  : KeziColors.brand.purple100,
              },
            ]}
          >
            <Feather
              name={item.type === "pharmacy" ? "plus-circle" : item.type === "wellness" ? "heart" : "home"}
              size={20}
              color={KeziColors.brand.purple500}
            />
          </View>
          <View style={styles.merchantInfo}>
            <ThemedText type="body" style={styles.merchantName}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" style={styles.merchantAddress}>
              {item.address}
            </ThemedText>
          </View>
          {item.calculatedDistance !== null ? (
            <View style={styles.distanceBadge}>
              <Feather name="map-pin" size={12} color={theme.textMuted} />
              <ThemedText type="chip" style={styles.distanceText}>
                {item.calculatedDistance.toFixed(1)} mi
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.merchantStats}>
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Feather name="star" size={14} color={KeziColors.functional.warning} />
              <ThemedText type="body" style={styles.ratingText}>
                {item.rating}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <ThemedText type="small" style={styles.statLabel}>
              Products
            </ThemedText>
            <ThemedText type="body" style={styles.statValue}>
              {item.productCount}
            </ThemedText>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <ThemedText type="small" style={styles.statLabel}>
              In Stock
            </ThemedText>
            <ThemedText
              type="body"
              style={[
                styles.statValue,
                {
                  color:
                    item.inStockCount > 0
                      ? KeziColors.functional.success
                      : KeziColors.functional.danger,
                },
              ]}
            >
              {item.inStockCount}
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={[styles.directionsButton, { backgroundColor: KeziColors.maternal.teal600 }]}
          onPress={() => handleGetDirections(item)}
        >
          <Feather name="navigation" size={14} color="#FFFFFF" />
          <ThemedText style={styles.directionsText}>Get Directions</ThemedText>
        </Pressable>
      </GlassCard>
    </Animated.View>
  );

  const selectedMerchantData = selectedMerchant 
    ? merchantsWithDistance.find(m => m.id === selectedMerchant)
    : null;

  return (
    <ThemedView style={[styles.container, { paddingTop }]}>
      <View style={styles.header}>
        <GlassCard style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Feather
              name="map-pin"
              size={20}
              color={hasLocation ? KeziColors.functional.success : theme.textMuted}
            />
            <ThemedText type="body" style={styles.locationTitle}>
              {locationLoading
                ? "Finding your location..."
                : hasLocation
                ? "Location enabled"
                : "Location unavailable"}
            </ThemedText>
            {!hasLocation && !locationLoading ? (
              <Button
                onPress={getCurrentLocation}
                style={styles.retryButton}
                variant="outline"
              >
                Retry
              </Button>
            ) : null}
          </View>
          {Platform.OS === "web" ? (
            <View style={styles.webCallout}>
              <Feather name="smartphone" size={14} color={theme.textMuted} />
              <ThemedText type="small" style={styles.webCalloutText}>
                Run in Expo Go to use your device's location
              </ThemedText>
            </View>
          ) : null}
        </GlassCard>

        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          layout={Layout.springify()}
        >
          <View style={styles.controlsRow}>
            <View style={styles.viewModeButtons}>
              <Pressable
                style={[
                  styles.viewModeButton,
                  viewMode === "list" && styles.viewModeButtonActive,
                ]}
                onPress={() => setViewMode("list")}
              >
                <Feather
                  name="list"
                  size={18}
                  color={viewMode === "list" ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  style={[
                    styles.viewModeText,
                    viewMode === "list" && styles.viewModeTextActive,
                  ]}
                >
                  List
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.viewModeButton,
                  viewMode === "map" && styles.viewModeButtonActive,
                ]}
                onPress={() => setViewMode("map")}
              >
                <Feather
                  name="map"
                  size={18}
                  color={viewMode === "map" ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  style={[
                    styles.viewModeText,
                    viewMode === "map" && styles.viewModeTextActive,
                  ]}
                >
                  Map
                </ThemedText>
              </Pressable>
            </View>

            {viewMode === "list" && (
              <View style={styles.sortButtons}>
                <Pressable
                  style={[
                    styles.sortButton,
                    {
                      backgroundColor:
                        sortBy === "distance"
                          ? KeziColors.maternal.teal600
                          : isDark
                          ? KeziColors.night.surface
                          : KeziColors.gray[100],
                    },
                  ]}
                  onPress={() => setSortBy("distance")}
                  disabled={!hasLocation}
                >
                  <Feather
                    name="navigation"
                    size={14}
                    color={sortBy === "distance" ? "#FFFFFF" : hasLocation ? theme.text : KeziColors.gray[300]}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.sortButton,
                    {
                      backgroundColor:
                        sortBy === "rating"
                          ? KeziColors.maternal.teal600
                          : isDark
                          ? KeziColors.night.surface
                          : KeziColors.gray[100],
                    },
                  ]}
                  onPress={() => setSortBy("rating")}
                >
                  <Feather
                    name="star"
                    size={14}
                    color={sortBy === "rating" ? "#FFFFFF" : theme.text}
                  />
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      {viewMode === "list" ? (
        <FlatList
          data={merchantsWithDistance}
          keyExtractor={(item) => item.id}
          renderItem={renderMerchant}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.mapContainer}>
          {isMapAvailable ? (
            <>
              <MapViewWrapper
                mapRef={mapRef}
                style={styles.map}
                region={mapRegion}
                showsUserLocation={hasLocation}
              >
                {merchantsWithDistance.map((merchant) => (
                  <MarkerWrapper
                    key={merchant.id}
                    coordinate={{
                      latitude: merchant.latitude,
                      longitude: merchant.longitude,
                    }}
                    title={merchant.name}
                    description={merchant.address}
                    pinColor={getMarkerColor(merchant.type)}
                    onPress={() => handleMarkerPress(merchant.id)}
                  />
                ))}
              </MapViewWrapper>

              {selectedMerchantData && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={[styles.selectedMerchantCard, { paddingBottom: paddingBottom + Spacing.md }]}
                >
                  <GlassCard style={styles.floatingCard}>
                    <View style={styles.floatingCardHeader}>
                      <View
                        style={[
                          styles.merchantIcon,
                          { backgroundColor: KeziColors.brand.purple100 },
                        ]}
                      >
                        <Feather
                          name={selectedMerchantData.type === "pharmacy" ? "plus-circle" : selectedMerchantData.type === "wellness" ? "heart" : "home"}
                          size={20}
                          color={getMarkerColor(selectedMerchantData.type)}
                        />
                      </View>
                      <View style={styles.merchantInfo}>
                        <ThemedText style={styles.merchantName}>{selectedMerchantData.name}</ThemedText>
                        <ThemedText style={styles.merchantAddress}>{selectedMerchantData.address}</ThemedText>
                      </View>
                      <Pressable onPress={() => setSelectedMerchant(null)}>
                        <Feather name="x" size={20} color={KeziColors.gray[400]} />
                      </Pressable>
                    </View>
                    <View style={styles.floatingCardStats}>
                      <View style={styles.floatingStatItem}>
                        <Feather name="star" size={14} color={KeziColors.functional.warning} />
                        <ThemedText style={styles.floatingStatValue}>{selectedMerchantData.rating}</ThemedText>
                      </View>
                      <View style={styles.floatingStatItem}>
                        <Feather name="package" size={14} color={KeziColors.brand.purple600} />
                        <ThemedText style={styles.floatingStatValue}>{selectedMerchantData.productCount} products</ThemedText>
                      </View>
                      {selectedMerchantData.calculatedDistance !== null && (
                        <View style={styles.floatingStatItem}>
                          <Feather name="map-pin" size={14} color={KeziColors.maternal.teal600} />
                          <ThemedText style={styles.floatingStatValue}>{selectedMerchantData.calculatedDistance.toFixed(1)} mi</ThemedText>
                        </View>
                      )}
                    </View>
                    <Pressable
                      style={[styles.directionsButton, { backgroundColor: KeziColors.maternal.teal600 }]}
                      onPress={() => handleGetDirections(selectedMerchantData)}
                    >
                      <Feather name="navigation" size={14} color="#FFFFFF" />
                      <ThemedText style={styles.directionsText}>Get Directions</ThemedText>
                    </Pressable>
                  </GlassCard>
                </Animated.View>
              )}

              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: KeziColors.maternal.teal600 }]} />
                  <ThemedText style={styles.legendText}>Pharmacy</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: KeziColors.brand.pink500 }]} />
                  <ThemedText style={styles.legendText}>Wellness</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: KeziColors.brand.purple600 }]} />
                  <ThemedText style={styles.legendText}>Store</ThemedText>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.mapPlaceholder}>
                <Feather name="map" size={64} color={KeziColors.gray[400]} />
                <ThemedText style={styles.mapPlaceholderTitle}>Map View</ThemedText>
                <ThemedText style={styles.mapPlaceholderText}>
                  Run in Expo Go on your device to view the interactive map with merchant locations in Rwanda.
                </ThemedText>
                <View style={styles.mapMerchantList}>
                  {merchantsWithDistance.slice(0, 5).map((merchant) => (
                    <Pressable
                      key={merchant.id}
                      style={[
                        styles.mapMerchantItem,
                        selectedMerchant === merchant.id && styles.mapMerchantItemSelected,
                      ]}
                      onPress={() => handleMarkerPress(merchant.id)}
                    >
                      <View style={[styles.mapMarkerDot, { backgroundColor: getMarkerColor(merchant.type) }]} />
                      <ThemedText style={styles.mapMerchantName}>{merchant.name}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {selectedMerchantData ? (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={[styles.selectedMerchantCard, { paddingBottom: paddingBottom + Spacing.md }]}
                >
                  <GlassCard style={styles.floatingCard}>
                    <View style={styles.floatingCardHeader}>
                      <View
                        style={[
                          styles.merchantIcon,
                          { backgroundColor: KeziColors.brand.purple100 },
                        ]}
                      >
                        <Feather
                          name={selectedMerchantData.type === "pharmacy" ? "plus-circle" : selectedMerchantData.type === "wellness" ? "heart" : "home"}
                          size={20}
                          color={getMarkerColor(selectedMerchantData.type)}
                        />
                      </View>
                      <View style={styles.merchantInfo}>
                        <ThemedText style={styles.merchantName}>{selectedMerchantData.name}</ThemedText>
                        <ThemedText style={styles.merchantAddress}>{selectedMerchantData.address}</ThemedText>
                      </View>
                      <Pressable onPress={() => setSelectedMerchant(null)}>
                        <Feather name="x" size={20} color={KeziColors.gray[400]} />
                      </Pressable>
                    </View>
                    <View style={styles.floatingCardStats}>
                      <View style={styles.floatingStatItem}>
                        <Feather name="star" size={14} color={KeziColors.functional.warning} />
                        <ThemedText style={styles.floatingStatValue}>{selectedMerchantData.rating}</ThemedText>
                      </View>
                      <View style={styles.floatingStatItem}>
                        <Feather name="package" size={14} color={KeziColors.brand.purple600} />
                        <ThemedText style={styles.floatingStatValue}>{selectedMerchantData.productCount} products</ThemedText>
                      </View>
                      {selectedMerchantData.calculatedDistance !== null ? (
                        <View style={styles.floatingStatItem}>
                          <Feather name="map-pin" size={14} color={KeziColors.maternal.teal600} />
                          <ThemedText style={styles.floatingStatValue}>{selectedMerchantData.calculatedDistance.toFixed(1)} mi</ThemedText>
                        </View>
                      ) : null}
                    </View>
                    <Pressable
                      style={[styles.directionsButton, { backgroundColor: KeziColors.maternal.teal600 }]}
                      onPress={() => handleGetDirections(selectedMerchantData)}
                    >
                      <Feather name="navigation" size={14} color="#FFFFFF" />
                      <ThemedText style={styles.directionsText}>Get Directions</ThemedText>
                    </Pressable>
                  </GlassCard>
                </Animated.View>
              ) : null}

              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: KeziColors.maternal.teal600 }]} />
                  <ThemedText style={styles.legendText}>Pharmacy</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: KeziColors.brand.pink500 }]} />
                  <ThemedText style={styles.legendText}>Wellness</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: KeziColors.brand.purple600 }]} />
                  <ThemedText style={styles.legendText}>Store</ThemedText>
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
  },
  locationCard: {
    marginBottom: Spacing.lg,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  locationTitle: {
    fontWeight: "600",
    flex: 1,
  },
  retryButton: {
    marginTop: Spacing.md,
  },
  webCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  webCalloutText: {
    flex: 1,
    opacity: 0.8,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  viewModeButtons: {
    flexDirection: "row",
    backgroundColor: KeziColors.gray[200],
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  viewModeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  viewModeButtonActive: {
    backgroundColor: KeziColors.maternal.teal600,
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewModeTextActive: {
    color: "#FFFFFF",
  },
  sortButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  merchantCard: {
    marginBottom: Spacing.md,
  },
  merchantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  merchantIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontWeight: "600",
  },
  merchantAddress: {
    opacity: 0.6,
    marginTop: 2,
    fontSize: 12,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    opacity: 0.7,
  },
  merchantStats: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    opacity: 0.6,
    marginBottom: 2,
  },
  statValue: {
    fontWeight: "600",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontWeight: "600",
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  directionsText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: KeziColors.gray[100],
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  mapPlaceholderText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    marginBottom: Spacing.xl,
  },
  mapMerchantList: {
    gap: Spacing.sm,
    width: "100%",
    maxWidth: 300,
  },
  mapMerchantItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
  },
  mapMerchantItemSelected: {
    backgroundColor: KeziColors.brand.purple100,
    borderWidth: 1,
    borderColor: KeziColors.brand.purple500,
  },
  mapMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mapMerchantName: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectedMerchantCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  floatingCard: {
    padding: Spacing.md,
  },
  floatingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  floatingCardStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KeziColors.gray[200],
  },
  floatingStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  floatingStatValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  mapLegend: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
