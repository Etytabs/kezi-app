import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

export type SymptomType =
  | "cramps"
  | "headache"
  | "mood"
  | "energy";

interface Props {
  selectedDay: number;
  phase: string;
  onLogSymptom: (symptom: SymptomType) => void;
}

export function QuickLog({ selectedDay, phase, onLogSymptom }: Props) {
  const symptoms: { key: SymptomType; icon: string; label: string }[] = [
    { key: "cramps", icon: "activity", label: "Cramps" },
    { key: "headache", icon: "wind", label: "Headache" },
    { key: "mood", icon: "smile", label: "Mood" },
    { key: "energy", icon: "zap", label: "Energy" },
  ];

  return (
    <View style={styles.container}>
      <ThemedText type="sectionHeader">
        Quick Log (Day {selectedDay})
      </ThemedText>

      <View style={styles.row}>
        {symptoms.map((s) => (
          <Pressable
            key={s.key}
            style={styles.button}
            onPress={() => onLogSymptom(s.key)}
          >
            <Feather name={s.icon as any} size={18} />
            <ThemedText type="small">{s.label}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },

  row: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },

  button: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#eee",
  },
});