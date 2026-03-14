import React from "react";
import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing } from "@/constants/theme";

type Props = React.PropsWithChildren<
  ScrollViewProps & {
    onScrollDirectionChange?: (direction: "up" | "down") => void;
  }
>;


export function ScreenScrollView({
  children,
  contentContainerStyle,
  style,
  onScrollDirectionChange,
  ...scrollViewProps
}: Props) {
  const { theme } = useTheme();
  const { paddingTop, paddingBottom, scrollInsetBottom } = useScreenInsets();

  const lastOffset = React.useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;

    if (currentOffset > lastOffset.current + 5) {
      onScrollDirectionChange?.("down");
    } else if (currentOffset < lastOffset.current - 5) {
      onScrollDirectionChange?.("up");
    }

    lastOffset.current = currentOffset;
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot },
        style,
      ]}
      contentContainerStyle={[
        {
          paddingTop,
          paddingBottom,
        },
        styles.contentContainer,
        contentContainerStyle,
      ]}
      scrollIndicatorInsets={{ bottom: scrollInsetBottom }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
  },
});

