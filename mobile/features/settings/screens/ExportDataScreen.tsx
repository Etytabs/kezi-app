import React, { useState, useMemo } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { storage, JournalEntry } from "@/services/storage";
import { journalApi } from "@/services/api";
import { calculateCycleInfo, getPhaseName } from "@/services/cycleService";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { getFriendlyError } from "@/utils/errorMessages";

export default function ExportDataScreen() {
  const { theme, isDark } = useTheme();
  const { user, cycleConfig, isAnonymous } = useAuth();
  
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  const cycleInfo = useMemo(() => calculateCycleInfo(cycleConfig), [cycleConfig]);

  const fetchEntries = async (): Promise<JournalEntry[]> => {
    if (!isAnonymous) {
      try {
        const { data } = await journalApi.getAll();
        if (data?.entries && data.entries.length > 0) {
          return data.entries.map((e: any) => ({
            id: e.id,
            date: e.date,
            mood: e.mood || "neutral",
            symptoms: e.symptoms || [],
            notes: e.notes || "",
            createdAt: e.created_at || e.date,
          }));
        }
      } catch {}
    }
    return await storage.getJournalEntries();
  };

  const generatePDFContent = async () => {
    const entries = await fetchEntries();
    
    const entriesHTML = entries.slice(0, 30).map(entry => `
      <tr>
        <td>${new Date(entry.date).toLocaleDateString()}</td>
        <td>${entry.mood}</td>
        <td>${entry.symptoms.join(", ") || "None"}</td>
        <td>${entry.notes || "-"}</td>
      </tr>
    `).join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kezi Health Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #EC4899;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              background: linear-gradient(90deg, #EC4899, #9333EA);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .subtitle {
              color: #666;
              margin-top: 5px;
            }
            .section {
              margin: 25px 0;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #9333EA;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .info-card {
              background: #F9FAFB;
              padding: 15px;
              border-radius: 8px;
            }
            .info-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
            }
            .info-value {
              font-size: 18px;
              font-weight: 600;
              color: #333;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #E5E7EB;
            }
            th {
              background: #F9FAFB;
              font-weight: 600;
              color: #374151;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #9CA3AF;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Kezi</div>
            <div class="subtitle">Wellness Report for ${user?.name || "User"}</div>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Cycle Overview</div>
            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">Current Day</div>
                <div class="info-value">${cycleInfo.currentDay}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Cycle Length</div>
                <div class="info-value">${cycleConfig?.cycleLength || 28} days</div>
              </div>
              <div class="info-card">
                <div class="info-label">Current Phase</div>
                <div class="info-value">${getPhaseName(cycleInfo.phase)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Journal Entries (Last 30)</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mood</th>
                  <th>Symptoms</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${entriesHTML || "<tr><td colspan='4'>No journal entries yet</td></tr>"}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This report was generated by Kezi - Your Wellness Companion</p>
            <p>All data is stored securely and privately on your device.</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "PDF Export Not Available",
        "Run in Expo Go to export PDF reports."
      );
      return;
    }

    setIsExportingPDF(true);
    try {
      const html = await generatePDFContent();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export Kezi Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", "PDF saved to: " + uri);
      }
    } catch (error) {
      console.error("PDF export error:", error);
      const friendly = getFriendlyError('server error');
      Alert.alert("Export Failed", "We couldn't create your PDF report. Please try again in a moment.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const entries = await fetchEntries();
      
      const headers = ["Date", "Mood", "Symptoms", "Notes"];
      const rows = entries.map(entry => [
        new Date(entry.date).toLocaleDateString(),
        entry.mood,
        entry.symptoms.join("; "),
        `"${(entry.notes || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `kezi-journal-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert("Success", "CSV file downloaded.");
      } else {
        Alert.alert("CSV Export", `${entries.length} journal entries ready for export. Use the PDF export for sharing on mobile.`);
      }
    } catch (error) {
      console.error("CSV export error:", error);
      Alert.alert("Export Failed", "We couldn't create your CSV file. Please try again in a moment.");
    } finally {
      setIsExportingCSV(false);
    }
  };

  return (
    <ScreenScrollView>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GlassCard style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <Feather
              name="download"
              size={32}
              color={KeziColors.brand.purple500}
            />
          </View>
          <ThemedText type="h4" style={styles.title}>
            Export Your Data
          </ThemedText>
          <ThemedText type="body" style={styles.description}>
            Download your cycle history and journal entries. Your data belongs to you.
          </ThemedText>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          EXPORT FORMATS
        </ThemedText>

        <GlassCard
          style={styles.exportCard}
          onPress={handleExportPDF}
          disabled={isExportingPDF}
        >
          <View style={styles.exportContent}>
            <View
              style={[
                styles.exportIcon,
                { backgroundColor: KeziColors.brand.pink50 },
              ]}
            >
              <Feather name="file-text" size={24} color={KeziColors.brand.pink500} />
            </View>
            <View style={styles.exportInfo}>
              <ThemedText type="body" style={styles.exportTitle}>
                PDF Report
              </ThemedText>
              <ThemedText type="small" style={styles.exportDescription}>
                Beautifully formatted report with cycle overview and journal entries
              </ThemedText>
            </View>
            <Feather
              name={isExportingPDF ? "loader" : "download"}
              size={20}
              color={theme.textMuted}
            />
          </View>
        </GlassCard>

        <GlassCard
          style={styles.exportCard}
          onPress={handleExportCSV}
          disabled={isExportingCSV}
        >
          <View style={styles.exportContent}>
            <View
              style={[
                styles.exportIcon,
                { backgroundColor: KeziColors.brand.teal50 },
              ]}
            >
              <Feather name="table" size={24} color={KeziColors.brand.teal600} />
            </View>
            <View style={styles.exportInfo}>
              <ThemedText type="body" style={styles.exportTitle}>
                CSV Spreadsheet
              </ThemedText>
              <ThemedText type="small" style={styles.exportDescription}>
                Raw data format compatible with Excel and Google Sheets
              </ThemedText>
            </View>
            <Feather
              name={isExportingCSV ? "loader" : "download"}
              size={20}
              color={theme.textMuted}
            />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <GlassCard style={styles.privacyCard}>
          <Feather name="shield" size={20} color={KeziColors.brand.teal600} />
          <ThemedText type="small" style={styles.privacyText}>
            Your health data is stored securely on our servers and synced to your device. Exports are processed entirely on your device.
          </ThemedText>
        </GlassCard>
      </Animated.View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
    opacity: 0.7,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  exportCard: {
    marginBottom: Spacing.md,
  },
  exportContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  exportDescription: {
    opacity: 0.6,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  privacyText: {
    flex: 1,
    opacity: 0.7,
  },
});
