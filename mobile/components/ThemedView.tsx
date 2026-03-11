import { View, type ViewProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { KeziColors } from "@/constants/theme";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const { theme, isDark } = useTheme();

  const backgroundColor =
    isDark && darkColor
      ? darkColor
      : !isDark && lightColor
        ? lightColor
        : isDark
          ? KeziColors.night.base
          : "#FFFFFF";

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
