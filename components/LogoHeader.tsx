import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { KeziBrandIcon } from "@/components/KeziBrandIcon";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";

interface LogoHeaderProps {
  showBackButton?: boolean;
  title?: string;
  onBackPress?: () => void;
}

export function LogoHeader({ 
  showBackButton = true, 
  title,
  onBackPress 
}: LogoHeaderProps) {
  const navigation = useNavigation();
  const { isDark } = useTheme();

  const handlePress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Pressable 
      style={styles.container} 
      onPress={handlePress}
      disabled={!showBackButton}
    >
      <View style={styles.logoRow}>
        {showBackButton ? (
          <View style={[
            styles.backButton,
            { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100] }
          ]}>
            <Feather 
              name="chevron-left" 
              size={20} 
              color={isDark ? KeziColors.night.text : KeziColors.gray[600]} 
            />
          </View>
        ) : null}
        <View style={styles.logoContainer}>
          <KeziBrandIcon size={32} />
          <ThemedText style={styles.logoText}>Kezi</ThemedText>
        </View>
        {title ? (
          <ThemedText style={styles.titleText}>{title}</ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: KeziColors.brand.purple600,
  },
  titleText: {
    fontSize: 14,
    opacity: 0.6,
    marginLeft: Spacing.sm,
  },
});
