import { useState, useEffect } from "react";
import { Dimensions, ScaledSize } from "react-native";

interface ResponsiveLayout {
  width: number;
  height: number;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  columns: 1 | 2 | 3 | 4;
  contentMaxWidth: number;
  horizontalPadding: number;
}

const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

function calculateLayout(dimensions: ScaledSize): ResponsiveLayout {
  const { width, height } = dimensions;
  
  const isPhone = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  
  let columns: 1 | 2 | 3 | 4 = 1;
  if (width >= BREAKPOINTS.largeDesktop) {
    columns = 4;
  } else if (width >= BREAKPOINTS.desktop) {
    columns = 3;
  } else if (width >= BREAKPOINTS.tablet) {
    columns = 2;
  }
  
  let contentMaxWidth = width;
  if (width >= BREAKPOINTS.largeDesktop) {
    contentMaxWidth = 1200;
  } else if (width >= BREAKPOINTS.desktop) {
    contentMaxWidth = 960;
  } else if (width >= BREAKPOINTS.tablet) {
    contentMaxWidth = 720;
  }
  
  let horizontalPadding = 16;
  if (isDesktop) {
    horizontalPadding = 32;
  } else if (isTablet) {
    horizontalPadding = 24;
  }
  
  return {
    width,
    height,
    isPhone,
    isTablet,
    isDesktop,
    columns,
    contentMaxWidth,
    horizontalPadding,
  };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>(() => 
    calculateLayout(Dimensions.get("window"))
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setLayout(calculateLayout(window));
    });

    return () => subscription.remove();
  }, []);

  return layout;
}

export function getResponsiveValue<T>(
  layout: ResponsiveLayout,
  values: { phone?: T; tablet?: T; desktop?: T; default: T }
): T {
  if (layout.isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  if (layout.isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  if (layout.isPhone && values.phone !== undefined) {
    return values.phone;
  }
  return values.default;
}
