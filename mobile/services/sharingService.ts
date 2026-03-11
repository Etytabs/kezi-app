import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";
import { CycleInfo, getPhaseName, getPhaseDescription } from "./cycleService";
import { JournalEntry } from "./storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SHARING_SETTINGS_KEY = "@kezi/sharing_settings";

export interface SharingPrivacySettings {
  sharePhase: boolean;
  shareCycleDay: boolean;
  shareFertilityStatus: boolean;
  shareMood: boolean;
  shareSymptoms: boolean;
  shareNotes: boolean;
  anonymousMode: boolean;
}

export const DEFAULT_SHARING_SETTINGS: SharingPrivacySettings = {
  sharePhase: true,
  shareCycleDay: false,
  shareFertilityStatus: false,
  shareMood: true,
  shareSymptoms: false,
  shareNotes: false,
  anonymousMode: false,
};

export interface ShareableInsight {
  type: "cycle" | "journal" | "wellness_tip";
  title: string;
  message: string;
  phase?: string;
  cycleDay?: number;
  mood?: string;
  symptoms?: string[];
  date?: string;
}

export const sharingService = {
  async getPrivacySettings(): Promise<SharingPrivacySettings> {
    try {
      const data = await AsyncStorage.getItem(SHARING_SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SHARING_SETTINGS, ...JSON.parse(data) };
      }
      return DEFAULT_SHARING_SETTINGS;
    } catch {
      return DEFAULT_SHARING_SETTINGS;
    }
  },

  async savePrivacySettings(settings: SharingPrivacySettings): Promise<void> {
    await AsyncStorage.setItem(SHARING_SETTINGS_KEY, JSON.stringify(settings));
  },

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === "web") {
      return typeof navigator !== "undefined" && typeof navigator.share === "function";
    }
    return await Sharing.isAvailableAsync();
  },

  createCycleInsightMessage(
    cycleInfo: CycleInfo,
    settings: SharingPrivacySettings
  ): ShareableInsight {
    const parts: string[] = [];
    const title = settings.anonymousMode 
      ? "Wellness Update" 
      : "My Cycle Insight";

    if (settings.sharePhase && cycleInfo.hasData) {
      const phaseName = getPhaseName(cycleInfo.phase);
      const phaseDesc = getPhaseDescription(cycleInfo.phase);
      parts.push(`Currently in ${phaseName}`);
      parts.push(phaseDesc);
    }

    if (settings.shareCycleDay && cycleInfo.hasData) {
      parts.push(`Day ${cycleInfo.currentDay} of my cycle`);
    }

    if (settings.shareFertilityStatus && cycleInfo.hasData) {
      if (cycleInfo.fertileWindow) {
        parts.push("In fertile window");
      } else if (cycleInfo.daysUntilOvulation <= 5) {
        parts.push(`${cycleInfo.daysUntilOvulation} days until ovulation`);
      }
    }

    if (parts.length === 0) {
      parts.push("Tracking my wellness journey with Kezi");
    }

    parts.push("\nShared via Kezi - Cycle Tracking & Wellness");

    return {
      type: "cycle",
      title,
      message: parts.join("\n"),
      phase: cycleInfo.hasData ? getPhaseName(cycleInfo.phase) : undefined,
      cycleDay: settings.shareCycleDay ? cycleInfo.currentDay : undefined,
    };
  },

  createJournalInsightMessage(
    entry: JournalEntry,
    settings: SharingPrivacySettings
  ): ShareableInsight {
    const parts: string[] = [];
    const title = settings.anonymousMode 
      ? "Wellness Journal" 
      : "My Wellness Check-in";

    const moodEmojis: Record<string, string> = {
      happy: "Feeling great",
      neutral: "Feeling balanced",
      sad: "Taking it easy",
      anxious: "Working through things",
      energetic: "Full of energy",
    };

    if (settings.shareMood) {
      parts.push(moodEmojis[entry.mood] || "Checking in");
    }

    if (settings.shareSymptoms && entry.symptoms.length > 0) {
      parts.push(`Tracking: ${entry.symptoms.slice(0, 3).join(", ")}`);
    }

    if (settings.shareNotes && entry.notes) {
      const truncatedNote = entry.notes.length > 100 
        ? entry.notes.substring(0, 97) + "..." 
        : entry.notes;
      parts.push(`"${truncatedNote}"`);
    }

    if (parts.length === 0) {
      parts.push("Journaling my wellness journey");
    }

    parts.push("\nShared via Kezi - Cycle Tracking & Wellness");

    return {
      type: "journal",
      title,
      message: parts.join("\n"),
      mood: settings.shareMood ? entry.mood : undefined,
      symptoms: settings.shareSymptoms ? entry.symptoms : undefined,
      date: entry.date,
    };
  },

  createWellnessTipMessage(
    phase: string,
    tip: string
  ): ShareableInsight {
    return {
      type: "wellness_tip",
      title: "Wellness Tip",
      message: `${tip}\n\nShared via Kezi - Cycle Tracking & Wellness`,
      phase,
    };
  },

  async shareInsight(insight: ShareableInsight): Promise<boolean> {
    const content = {
      title: insight.title,
      message: insight.message,
    };

    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: content.title,
            text: content.message,
          });
          return true;
        } else {
          await navigator.clipboard.writeText(content.message);
          return true;
        }
      } else {
        const result = await Share.share({
          message: content.message,
          title: content.title,
        });
        return result.action === Share.sharedAction;
      }
    } catch (error) {
      console.error("Sharing error:", error);
      return false;
    }
  },

  async shareText(text: string, title?: string): Promise<boolean> {
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: title || "Kezi",
            text,
          });
          return true;
        } else {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } else {
        const result = await Share.share({
          message: text,
          title: title || "Kezi",
        });
        return result.action === Share.sharedAction;
      }
    } catch (error) {
      console.error("Sharing error:", error);
      return false;
    }
  },
};
