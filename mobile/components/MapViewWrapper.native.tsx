import React from "react";
import MapView, { Marker, PROVIDER_DEFAULT, type Region, type MapMarkerProps } from "react-native-maps";

export { PROVIDER_DEFAULT };
export type { Region, MapMarkerProps };

export interface MapViewWrapperProps {
  region: Region;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  children?: React.ReactNode;
  style?: any;
  mapRef?: React.RefObject<MapView>;
}

export function MapViewWrapper({
  region,
  onRegionChangeComplete,
  showsUserLocation = false,
  children,
  style,
  mapRef,
}: MapViewWrapperProps) {
  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={region}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={showsUserLocation}
      provider={PROVIDER_DEFAULT}
    >
      {children}
    </MapView>
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

export function MarkerWrapper({
  coordinate,
  title,
  description,
  onPress,
  pinColor,
  children,
}: MarkerWrapperProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
      pinColor={pinColor}
    >
      {children}
    </Marker>
  );
}

export const isMapAvailable = true;
