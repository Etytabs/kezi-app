import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { storage, JournalEntry } from "@/services/storage";
import { journalApi } from "@/services/api";
import { calculateCycleInfo, getPhaseName } from "@/services/cycleService";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { getFriendlyError } from "@/utils/errorMessages";

const MOODS = [
  { id: "happy", icon: "smile", label: "Happy", color: KeziColors.functional.success },
  { id: "neutral", icon: "meh", label: "Neutral", color: KeziColors.gray[400] },
  { id: "sad", icon: "frown", label: "Sad", color: KeziColors.brand.purple500 },
  { id: "anxious", icon: "alert-circle", label: "Anxious", color: KeziColors.functional.warning },
  { id: "energetic", icon: "zap", label: "Energetic", color: KeziColors.brand.teal600 },
] as const;

const SYMPTOMS = [
  "Cramps",
  "Headache",
  "Fatigue",
  "Bloating",
  "Mood swings",
  "Cravings",
  "Breast tenderness",
  "Back pain",
];

export default function JournalScreen() {
  const { theme, isDark } = useTheme();
  const { cycleConfig, isAnonymous } = useAuth();
  const layout = useResponsiveLayout();
  const isWideScreen = layout.isTablet || layout.isDesktop;

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const cycleInfo = useMemo(() => calculateCycleInfo(cycleConfig), [cycleConfig]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (!isAnonymous) {
      try {
        const { data } = await journalApi.getAll();
        if (data?.entries && data.entries.length > 0) {
          const mappedEntries: JournalEntry[] = data.entries.map((e: any) => ({
            id: e.id,
            date: e.date,
            mood: e.mood || "neutral",
            symptoms: e.symptoms || [],
            notes: e.notes || "",
            createdAt: e.created_at || e.date,
          }));
          setEntries(mappedEntries);
          return;
        }
      } catch (err) {
        console.log("Failed to load from server, falling back to local:", err);
      }
    }
    const savedEntries = await storage.getJournalEntries();
    setEntries(savedEntries);
  };

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert("Missing Mood", "Please select how you're feeling today.");
      return;
    }

    setIsLoading(true);
    try {
      const todayDate = new Date().toISOString().split("T")[0];

      let serverId: string | undefined;
      if (!isAnonymous) {
        const { data, error } = await journalApi.create({
          date: todayDate,
          mood: selectedMood,
          symptoms: selectedSymptoms,
          notes,
        });
        if (error) {
          throw new Error(error);
        }
        serverId = data?.entry?.id;
      }

      const newEntry: JournalEntry = {
        id: serverId || Date.now().toString(),
        date: todayDate,
        mood: selectedMood as JournalEntry["mood"],
        symptoms: selectedSymptoms,
        notes,
        createdAt: new Date().toISOString(),
      };

      await storage.addJournalEntry(newEntry);

      await loadEntries();
      setSelectedMood("");
      setSelectedSymptoms([]);
      setNotes("");
      Alert.alert("Saved", "Your journal entry has been saved.");
    } catch (error) {
      const friendly = getFriendlyError('server error');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={isWideScreen ? styles.wideScreenContainer : undefined}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GlassCard style={styles.newEntryCard}>
          <View style={styles.header}>
            <ThemedText type="h4">How are you feeling?</ThemedText>
            <ThemedText type="small" style={styles.phaseLabel}>
              {getPhaseName(cycleInfo.phase)} - Day {cycleInfo.currentDay}
            </ThemedText>
          </View>

          <View style={styles.moodRow}>
            {MOODS.map((mood) => (
              <Pressable
                key={mood.id}
                onPress={() => setSelectedMood(mood.id)}
                style={[
                  styles.moodButton,
                  {
                    backgroundColor:
                      selectedMood === mood.id
                        ? mood.color
                        : isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[100],
                  },
                ]}
              >
                <Feather
                  name={mood.icon as any}
                  size={24}
                  color={selectedMood === mood.id ? "#FFFFFF" : mood.color}
                />
                <ThemedText
                  type="small"
                  style={[
                    styles.moodLabel,
                    selectedMood === mood.id && styles.selectedMoodLabel,
                  ]}
                >
                  {mood.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            SYMPTOMS
          </ThemedText>
          <View style={styles.symptomsGrid}>
            {SYMPTOMS.map((symptom) => (
              <Pressable
                key={symptom}
                onPress={() => toggleSymptom(symptom)}
                style={[
                  styles.symptomChip,
                  {
                    backgroundColor: selectedSymptoms.includes(symptom)
                      ? KeziColors.brand.pink500
                      : isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[100],
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[
                    styles.symptomText,
                    selectedSymptoms.includes(symptom) && styles.selectedSymptomText,
                  ]}
                >
                  {symptom}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            NOTES
          </ThemedText>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: isDark
                  ? KeziColors.night.deep
                  : KeziColors.gray[50],
                color: theme.text,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="How was your day? Any thoughts to share..."
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Button
            onPress={handleSave}
            disabled={isLoading}
            style={styles.saveButton}
          >
            {isLoading ? "Saving..." : "Save Entry"}
          </Button>
        </GlassCard>
      </Animated.View>

      {entries.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            RECENT ENTRIES
          </ThemedText>
          {entries.slice(0, 5).map((entry, index) => {
            const mood = MOODS.find((m) => m.id === entry.mood);
            return (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
                layout={Layout.springify()}
              >
                <GlassCard style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryMood}>
                      <Feather
                        name={mood?.icon as any}
                        size={20}
                        color={mood?.color}
                      />
                      <ThemedText type="body" style={styles.entryMoodLabel}>
                        {mood?.label}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={styles.entryDate}>
                      {formatDate(entry.date)}
                    </ThemedText>
                  </View>
                  {entry.symptoms.length > 0 && (
                    <View style={styles.entrySymptoms}>
                      {entry.symptoms.map((symptom) => (
                        <View key={symptom} style={styles.entrySymptomChip}>
                          <ThemedText type="small" style={styles.entrySymptomText}>
                            {symptom}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                  {entry.notes ? (
                    <ThemedText type="small" style={styles.entryNotes}>
                      {entry.notes}
                    </ThemedText>
                  ) : null}
                </GlassCard>
              </Animated.View>
            );
          })}
        </Animated.View>
      )}
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  wideScreenContainer: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  newEntryCard: {
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  phaseLabel: {
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  moodButton: {
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 60,
  },
  moodLabel: {
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
  selectedMoodLabel: {
    color: "#FFFFFF",
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  symptomChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  symptomText: {
    fontWeight: "500",
  },
  selectedSymptomText: {
    color: "#FFFFFF",
  },
  notesInput: {
    minHeight: 100,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
  entryCard: {
    marginBottom: Spacing.md,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  entryMood: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryMoodLabel: {
    marginLeft: Spacing.sm,
    fontWeight: "600",
  },
  entryDate: {
    opacity: 0.6,
  },
  entrySymptoms: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  entrySymptomChip: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  entrySymptomText: {
    color: KeziColors.brand.pink500,
    fontSize: 11,
    fontWeight: "600",
  },
  entryNotes: {
    opacity: 0.8,
    fontStyle: "italic",
  },
});
