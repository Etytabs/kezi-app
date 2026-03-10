import { useState, useEffect, useCallback } from "react";
import { Platform, Alert } from "react-native";
import * as Location from "expo-location";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  errorMsg: string | null;
  isLoading: boolean;
  hasPermission: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    errorMsg: null,
    isLoading: false,
    hasPermission: false,
  });

  const [permission, requestPermission] = Location.useForegroundPermissions();

  useEffect(() => {
    if (permission?.granted) {
      setLocation((prev) => ({ ...prev, hasPermission: true }));
    }
  }, [permission]);

  const getCurrentLocation = useCallback(async () => {
    if (Platform.OS === "web") {
      setLocation((prev) => ({
        ...prev,
        errorMsg: "Run in Expo Go to use location",
        isLoading: false,
      }));
      return null;
    }

    if (!permission?.granted) {
      if (permission?.canAskAgain) {
        const result = await requestPermission();
        if (!result.granted) {
          setLocation((prev) => ({
            ...prev,
            errorMsg: "Location permission denied",
          }));
          return null;
        }
      } else {
        Alert.alert(
          "Location Required",
          "Enable location in Settings to find nearby merchants."
        );
        return null;
      }
    }

    setLocation((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        errorMsg: null,
        isLoading: false,
        hasPermission: true,
      });

      return {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      };
    } catch (error) {
      setLocation((prev) => ({
        ...prev,
        errorMsg: "Failed to get location",
        isLoading: false,
      }));
      return null;
    }
  }, [permission, requestPermission]);

  const calculateDistance = useCallback(
    (merchantLat: number, merchantLng: number): number | null => {
      if (!location.latitude || !location.longitude) return null;

      const R = 3959;
      const dLat = ((merchantLat - location.latitude) * Math.PI) / 180;
      const dLon = ((merchantLng - location.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((location.latitude * Math.PI) / 180) *
          Math.cos((merchantLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return Math.round(distance * 10) / 10;
    },
    [location.latitude, location.longitude]
  );

  return {
    ...location,
    getCurrentLocation,
    calculateDistance,
    requestPermission,
  };
}
