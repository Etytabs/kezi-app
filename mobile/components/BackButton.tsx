import React from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface BackButtonProps {
  onPress?: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 0.6 : 1 },
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather
        name="chevron-left"
        size={28}
        color={theme.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: Platform.OS === "ios" ? 0 : Spacing.xs,
    padding: Spacing.xs,
  },
});
