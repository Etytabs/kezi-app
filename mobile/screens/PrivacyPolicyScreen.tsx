import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const layout = useResponsiveLayout();
  const isWideScreen = layout.isTablet || layout.isDesktop;

  return (
    <ScreenScrollView>
      <View style={isWideScreen ? styles.wideScreenContainer : undefined}>
        <Animated.View entering={FadeInDown.delay(50).duration(500)}>
          <GlassCard style={styles.card}>
            <View style={styles.headerContainer}>
              <View style={[styles.headerIcon, { backgroundColor: KeziColors.brand.purple100 }]}>
                <Feather name="shield" size={32} color={KeziColors.brand.purple500} />
              </View>
              <ThemedText type="h3" style={styles.headerTitle}>
                Privacy & Data Protection
              </ThemedText>
              <ThemedText type="small" style={styles.headerSubtitle}>
                Last updated: February 2026
              </ThemedText>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            OUR COMMITMENT
          </ThemedText>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="heart" size={20} color={KeziColors.brand.pink500} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Your Health Data Matters
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.bodyText}>
              Kezi treats your health data with medical-grade protection standards. We believe your most personal information deserves the highest level of care and security.
            </ThemedText>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Data minimization: we only collect what is necessary to provide our services
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  All data encrypted at rest and in transit
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  We never sell or share your data with third parties
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            ANONYMOUS MODE
          </ThemedText>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="eye-off" size={20} color={KeziColors.brand.purple500} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Track Without an Account
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.bodyText}>
              Kezi allows you to track your cycle without creating an account. In anonymous mode, your privacy is absolute.
            </ThemedText>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  All data stays entirely on your device
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  No identifiable information is collected
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  No server communication required
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            DATA ENCRYPTION
          </ThemedText>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="lock" size={20} color={KeziColors.brand.pink500} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                End-to-End Protection
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.bodyText}>
              Your health data is protected with industry-leading encryption at every stage.
            </ThemedText>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="smartphone" size={16} color={KeziColors.brand.purple500} />
                <ThemedText type="body" style={styles.bulletText}>
                  Local data encrypted with device-secured keys
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="server" size={16} color={KeziColors.brand.purple500} />
                <ThemedText type="body" style={styles.bulletText}>
                  Server data encrypted at rest using AES-256
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="shuffle" size={16} color={KeziColors.brand.purple500} />
                <ThemedText type="body" style={styles.bulletText}>
                  All data transmissions secured with TLS 1.3
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            DATA COLLECTION
          </ThemedText>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="database" size={20} color={KeziColors.brand.teal600} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                What We Collect
              </ThemedText>
            </View>
            <ThemedText type="body" style={[styles.bodyText, { fontWeight: "600" }]}>
              Information we collect:
            </ThemedText>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Cycle dates and period tracking data
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Journal entries and notes
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Symptoms and mood logs
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <ThemedText type="body" style={[styles.bodyText, { fontWeight: "600" }]}>
              What we do NOT collect:
            </ThemedText>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="x" size={16} color={KeziColors.functional.danger} />
                <ThemedText type="body" style={styles.bulletText}>
                  Precise location data
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="x" size={16} color={KeziColors.functional.danger} />
                <ThemedText type="body" style={styles.bulletText}>
                  Contacts or address book
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="x" size={16} color={KeziColors.functional.danger} />
                <ThemedText type="body" style={styles.bulletText}>
                  Browsing history or app usage outside Kezi
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            YOUR RIGHTS
          </ThemedText>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="user-check" size={20} color={KeziColors.brand.purple500} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                You Are in Control
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.bodyText}>
              You have full control over your data at all times. We respect your rights and make it easy to manage your information.
            </ThemedText>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="eye" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Right to access all your stored data
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="download" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Data portability via CSV and PDF export
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="trash-2" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Right to delete all your data at any time
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="user-x" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Account deletion permanently removes all server data
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            HIPAA COMPLIANCE
          </ThemedText>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="award" size={20} color={KeziColors.brand.pink500} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Healthcare-Grade Security
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.bodyText}>
              Kezi implements safeguards aligned with HIPAA (Health Insurance Portability and Accountability Act) standards to protect your health information.
            </ThemedText>

            <ThemedText type="body" style={[styles.bodyText, { fontWeight: "600", marginTop: Spacing.md }]}>
              Technical Safeguards:
            </ThemedText>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="hard-drive" size={16} color={KeziColors.brand.purple500} />
                <ThemedText type="body" style={styles.bulletText}>
                  Encrypted storage for all protected health information
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="key" size={16} color={KeziColors.brand.purple500} />
                <ThemedText type="body" style={styles.bulletText}>
                  Secure authentication with multi-factor support
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="file-text" size={16} color={KeziColors.brand.purple500} />
                <ThemedText type="body" style={styles.bulletText}>
                  Comprehensive audit logging of data access
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="clock" size={16} color={KeziColors.brand.purple500} />
                <ThemedText type="body" style={styles.bulletText}>
                  Automatic session timeouts for inactive users
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="users" size={16} color={KeziColors.brand.purple500} />
                <ThemedText type="body" style={styles.bulletText}>
                  Role-based access controls
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <ThemedText type="body" style={[styles.bodyText, { fontWeight: "600" }]}>
              Administrative Safeguards:
            </ThemedText>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="book-open" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Regular staff training on data privacy and security
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="alert-triangle" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Documented incident response procedures
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            DATA RETENTION
          </ThemedText>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="archive" size={20} color={KeziColors.brand.teal600} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                How Long We Keep Your Data
              </ThemedText>
            </View>
            <View style={styles.bulletContainer}>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Data is retained only while your account is active
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  All data deleted within 30 days of account deletion
                </ThemedText>
              </View>
              <View style={styles.bulletRow}>
                <Feather name="check" size={16} color={KeziColors.brand.teal600} />
                <ThemedText type="body" style={styles.bulletText}>
                  Anonymous mode data never leaves your device
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            CONTACT
          </ThemedText>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="mail" size={20} color={KeziColors.brand.purple500} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Questions or Concerns
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.bodyText}>
              If you have any questions about this privacy policy or how we handle your data, please reach out to our privacy team.
            </ThemedText>
            <View style={styles.contactRow}>
              <Feather name="at-sign" size={16} color={KeziColors.brand.pink500} />
              <ThemedText type="body" style={[styles.bulletText, { color: KeziColors.brand.pink500 }]}>
                privacy@kezi.app
              </ThemedText>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <ThemedText type="small" style={styles.version}>
            Kezi Privacy Policy v1.0
          </ThemedText>
        </Animated.View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  wideScreenContainer: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  headerContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    opacity: 0.6,
    textAlign: "center",
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    flex: 1,
  },
  bodyText: {
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: Spacing.md,
  },
  bulletContainer: {
    gap: Spacing.md,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: Spacing.lg,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  version: {
    textAlign: "center",
    opacity: 0.5,
    marginBottom: Spacing.xl,
  },
});
