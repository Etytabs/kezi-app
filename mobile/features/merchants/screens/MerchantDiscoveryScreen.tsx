import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Platform, Dimensions, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { MapViewWrapper, MarkerWrapper, isMapAvailable } from "@/components/MapViewWrapper";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/hooks/useLocation";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { MERCHANTS, PRODUCTS, Merchant } from "@/services/mockData";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const KIGALI_REGION: Region = {
  latitude: -1.9403,
  longitude: 29.8739,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

type MerchantWithDistance = Merchant & {
  calculatedDistance: number | null;
  productCount: number;
  inStockCount: number;
};

const MerchantListItem = React.memo(
  ({
    item,
    isDark,
    handleGetDirections,
  }: {
    item: MerchantWithDistance;
    isDark: boolean;
    handleGetDirections: (merchant: Merchant) => void;
  }) => {
    return (
      <Animated.View entering={FadeInDown.duration(400)} layout={Layout.springify()}>
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
              <Feather name="home" size={20} color={KeziColors.brand.purple500} />
            </View>

            <View style={styles.merchantInfo}>
              <ThemedText style={styles.merchantName}>{item.name}</ThemedText>

              <ThemedText style={styles.merchantAddress}>
                {item.address}
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={[
              styles.directionsButton,
              { backgroundColor: KeziColors.brand.teal600 },
            ]}
            onPress={() => handleGetDirections(item)}
          >
            <Feather name="navigation" size={14} color="#FFFFFF" />

            <ThemedText style={styles.directionsText}>
              Get Directions
            </ThemedText>
          </Pressable>
        </GlassCard>
      </Animated.View>
    );
  }
);

export default function MerchantDiscoveryScreen() {
  const { theme, isDark } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();

  const {
    latitude,
    longitude,
    isLoading: locationLoading,
    errorMsg,
    getCurrentLocation,
    calculateDistance,
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

  const merchantsWithDistance: MerchantWithDistance[] = useMemo(() => {
    return MERCHANTS.map((merchant) => {
      const distance = hasLocation
        ? calculateDistance(merchant.latitude, merchant.longitude)
        : null;

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

  const handleGetDirections = useCallback((merchant: Merchant) => {
    const destination = `${merchant.latitude},${merchant.longitude}`;
    const label = encodeURIComponent(merchant.name);

    if (Platform.OS === "web") {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        "_blank"
      );
    } else {
      const url = Platform.select({
        ios: `maps://app?daddr=${destination}&q=${label}`,
        android: `geo:${destination}?q=${destination}(${label})`,
      });

      if (url) {
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${destination}`
            );
          }
        });
      }
    }
  }, []);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "pharmacy":
        return KeziColors.brand.teal600;

      case "wellness":
        return KeziColors.brand.pink500;

      default:
        return KeziColors.brand.purple600;
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: MerchantWithDistance }) => (
      <MerchantListItem
        item={item}
        isDark={isDark}
        handleGetDirections={handleGetDirections}
      />
    ),
    [isDark, handleGetDirections]
  );

  return (
    <ThemedView style={[styles.container, { paddingTop }]}>
      {viewMode === "list" ? (
        <FlatList
          data={merchantsWithDistance}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom },
          ]}
        />
      ) : (
        <View style={styles.mapContainer}>
          {isMapAvailable ? (
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
          ) : (
            <View style={styles.mapPlaceholder}>
              <Feather name="map" size={64} color={KeziColors.gray[400]} />

              <ThemedText style={styles.mapPlaceholderTitle}>
                Map View
              </ThemedText>
            </View>
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

  listContent: {
    paddingHorizontal: Spacing.md,
  },

  merchantCard: {
    marginBottom: Spacing.md,
  },

  merchantHeader: {
    flexDirection: "row",
    alignItems: "center",
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
  },

  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
});