import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

import { ThemedText } from "@/components/ThemedText";
import { KeziLogo } from "@/components/KeziLogo";
import { Spacing, KeziColors } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <KeziLogo size={28} />
      </View>
      <MaskedView
        maskElement={
          <ThemedText type="logotype" style={styles.title}>
            {title}
          </ThemedText>
        }
      >
        <LinearGradient
          colors={[KeziColors.brand.pink500, KeziColors.brand.purple600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <ThemedText type="logotype" style={[styles.title, styles.hidden]}>
            {title}
          </ThemedText>
        </LinearGradient>
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  hidden: {
    opacity: 0,
  },
});
