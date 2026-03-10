import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export const PROVIDER_DEFAULT = undefined;

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapMarkerProps = {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
};

export interface MapViewWrapperProps {
  region: Region;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  children?: React.ReactNode;
  style?: any;
  mapRef?: React.RefObject<any>;
}

export function MapViewWrapper({ style }: MapViewWrapperProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.iconContainer}>
        <Feather name="map" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText style={styles.title}>Map View</ThemedText>
      <ThemedText type="small" style={styles.description}>
        Interactive maps are available in the mobile app.
      </ThemedText>
      <ThemedText type="small" style={styles.hint}>
        Open in Expo Go to view merchant locations on the map.
      </ThemedText>
    </View>
  );
}

export interface MarkerWrapperProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  onPress?: () => void;
  pinColor?: string;
  children?: React.ReactNode;
}

export function MarkerWrapper(_props: MarkerWrapperProps) {
  return null;
}

export const isMapAvailable = false;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.md,
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
});
