import { useState, useEffect } from "react";
import { Dimensions, ScaledSize } from "react-native";
import { Breakpoints } from "@/constants/layout";

interface ResponsiveLayout {
  width: number;
  height: number;
  isSmall: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  columns: 1 | 2 | 3;
  contentMaxWidth: number;
  horizontalPadding: number;
}

const LARGE_DESKTOP_BREAKPOINT = 1440;

function calculateLayout(dimensions: ScaledSize): ResponsiveLayout {
  const { width, height } = dimensions;
  
  const isSmall = width < Breakpoints.small;
  const isPhone = width >= Breakpoints.small && width < Breakpoints.tablet;
  const isTablet = width >= Breakpoints.tablet && width < Breakpoints.desktop;
  const isDesktop = width >= Breakpoints.desktop;
  
  let columns: 1 | 2 | 3 = 1;
  if (isDesktop) {
    columns = 3;
  } else if (isTablet) {
    columns = 2;
  }
  
  let contentMaxWidth = width;
  if (width >= LARGE_DESKTOP_BREAKPOINT) {
    contentMaxWidth = 1200;
  } else if (isDesktop) {
    contentMaxWidth = 960;
  } else if (isTablet) {
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
    isSmall,
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
  if ((layout.isPhone || layout.isSmall) && values.phone !== undefined) {
    return values.phone;
  }
  return values.default;
}
