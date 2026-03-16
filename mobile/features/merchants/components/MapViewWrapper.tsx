import React from "react";
import { Platform, View, Text, StyleSheet } from "react-native";

let MapView: any = null;
let Marker: any = null;

export let isMapAvailable = false;

/**
 * Region type compatible with react-native-maps
 */
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/**
 * Load react-native-maps only on native platforms
 */
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  isMapAvailable = true;
}

/**
 * Map wrapper component
 */
export const MapViewWrapper = ({
  children,
  mapRef,
  ...props
}: any) => {
  if (!isMapAvailable) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>Map not available on web</Text>
        <Text style={styles.placeholderText}>
          Open the app in Expo Go to use the interactive map.
        </Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      {...props}
    >
      {children}
    </MapView>
  );
};

/**
 * Marker wrapper component
 */
export const MarkerWrapper = (props: any) => {
  if (!isMapAvailable) {
    return null;
  }

  return <Marker {...props} />;
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  placeholderText: {
    textAlign: "center",
    opacity: 0.7,
  },
});