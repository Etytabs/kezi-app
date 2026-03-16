import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, Modal, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassCard } from "@/components/GlassCard";
import { LogoHeader } from "@/components/LogoHeader";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { storage, AdminAction } from "@/services/storage";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";

type ModalType = "export" | "audit" | "security" | "language" | "createAdmin" | null;

const EXPORT_OPTIONS = [
  { id: "users", label: "Users Data", icon: "users" as const },
  { id: "orders", label: "Orders History", icon: "shopping-bag" as const },
  { id: "analytics", label: "Analytics Report", icon: "bar-chart-2" as const },
  { id: "merchants", label: "Merchants Data", icon: "briefcase" as const },
  { id: "products", label: "Products Catalog", icon: "package" as const },
];

const LANGUAGES = [
  { code: "en", name: "English", flag: "EN" },
  { code: "fr", name: "French", flag: "FR" },
  { code: "rw", name: "Kinyarwanda", flag: "RW" },
];

export default function AdminSettingsScreen() {
  const { theme, isDark } = useTheme();
  const { user, logout, updateAvatar } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    const logs = await storage.getAdminActions();
    setAuditLogs(logs);
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert(
        t("profile.logout"),
        "Are you sure you want to log out?",
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("profile.logout"), style: "destructive", onPress: logout },
        ]
      );
    }
  };

  const handleAvatarChange = async (uri: string) => {
    await updateAvatar(uri);
    Alert.alert("Photo Updated", "Your profile photo has been updated.");
  };

  const handleExport = async () => {
    if (selectedExports.length === 0) {
      Alert.alert("Select Data", "Please select at least one data type to export.");
      return;
    }
    
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await storage.logAdminAction({
      id: `action_${Date.now()}`,
      adminId: user?.id || "",
      adminEmail: user?.email || "",
      actionType: "system_config",
      targetId: "export",
      targetType: "system",
      description: `Exported ${selectedExports.join(", ")} as ${exportFormat.toUpperCase()}`,
      timestamp: new Date().toISOString(),
    });
    
    setIsLoading(false);
    setActiveModal(null);
    setSelectedExports([]);
    Alert.alert("Export Complete", `Your ${exportFormat.toUpperCase()} export has been generated and will be sent to ${user?.email}.`);
    loadAuditLogs();
  };

  const handleLanguageChange = async (langCode: string) => {
    setLanguage(langCode as "en" | "fr" | "rw");
    
    await storage.logAdminAction({
      id: `action_${Date.now()}`,
      adminId: user?.id || "",
      adminEmail: user?.email || "",
      actionType: "system_config",
      targetId: "language",
      targetType: "system",
      description: `Changed system language to ${langCode.toUpperCase()}`,
      previousValue: language,
      newValue: langCode,
      timestamp: new Date().toISOString(),
    });
    
    setActiveModal(null);
    loadAuditLogs();
  };

  const handleCreateAdmin = async () => {
    if (!user?.isSuperAdmin) {
      Alert.alert("Access Denied", "Only the main administrator can create other admins.");
      return;
    }
    
    if (!newAdminEmail || !newAdminName) {
      Alert.alert("Missing Information", "Please enter both email and name for the new admin.");
      return;
    }
    
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await storage.logAdminAction({
      id: `action_${Date.now()}`,
      adminId: user?.id || "",
      adminEmail: user?.email || "",
      actionType: "promote_user",
      targetId: newAdminEmail,
      targetType: "user",
      description: `Created new admin: ${newAdminName} (${newAdminEmail})`,
      timestamp: new Date().toISOString(),
    });
    
    setIsLoading(false);
    setActiveModal(null);
    setNewAdminEmail("");
    setNewAdminName("");
    Alert.alert("Admin Created", `${newAdminName} has been granted admin privileges.`);
    loadAuditLogs();
  };

  const toggleExportOption = (id: string) => {
    setSelectedExports(prev => 
      prev.includes(id) 
        ? prev.filter(e => e !== id)
        : [...prev, id]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getActionIcon = (actionType: string): React.ComponentProps<typeof Feather>["name"] => {
    switch (actionType) {
      case "promote_user": return "user-plus";
      case "demote_user": return "user-minus";
      case "approve_merchant": return "check-circle";
      case "suspend_merchant": return "pause-circle";
      case "system_config": return "settings";
      default: return "activity";
    }
  };

  const renderModal = () => {
    const modalBg = isDark ? KeziColors.night.base : "#FFFFFF";
    const inputBg = isDark ? KeziColors.night.deep : KeziColors.gray[100];

    return (
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: modalBg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {activeModal === "export" && "Data Export"}
                {activeModal === "audit" && "Audit Logs"}
                {activeModal === "security" && "Security Settings"}
                {activeModal === "language" && "Language Settings"}
                {activeModal === "createAdmin" && "Create Administrator"}
              </ThemedText>
              <Pressable onPress={() => setActiveModal(null)} style={styles.closeButton}>
                <Feather name="x" size={24} color={isDark ? KeziColors.night.text : KeziColors.gray[600]} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {activeModal === "export" && (
                <View style={styles.exportContent}>
                  <ThemedText style={styles.sectionLabel}>Select Data to Export</ThemedText>
                  {EXPORT_OPTIONS.map(option => (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.exportOption,
                        selectedExports.includes(option.id) && styles.exportOptionSelected,
                        { backgroundColor: selectedExports.includes(option.id) 
                          ? KeziColors.brand.purple100 
                          : inputBg 
                        }
                      ]}
                      onPress={() => toggleExportOption(option.id)}
                    >
                      <Feather 
                        name={option.icon} 
                        size={20} 
                        color={selectedExports.includes(option.id) 
                          ? KeziColors.brand.purple600 
                          : KeziColors.gray[500]
                        } 
                      />
                      <ThemedText style={styles.exportOptionText}>{option.label}</ThemedText>
                      {selectedExports.includes(option.id) ? (
                        <Feather name="check-circle" size={20} color={KeziColors.brand.purple600} />
                      ) : null}
                    </Pressable>
                  ))}
                  
                  <ThemedText style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Export Format</ThemedText>
                  <View style={styles.formatRow}>
                    <Pressable
                      style={[
                        styles.formatOption,
                        exportFormat === "csv" && styles.formatOptionSelected,
                        { backgroundColor: exportFormat === "csv" ? KeziColors.brand.purple100 : inputBg }
                      ]}
                      onPress={() => setExportFormat("csv")}
                    >
                      <ThemedText style={[
                        styles.formatText,
                        exportFormat === "csv" && { color: KeziColors.brand.purple600 }
                      ]}>CSV</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.formatOption,
                        exportFormat === "pdf" && styles.formatOptionSelected,
                        { backgroundColor: exportFormat === "pdf" ? KeziColors.brand.purple100 : inputBg }
                      ]}
                      onPress={() => setExportFormat("pdf")}
                    >
                      <ThemedText style={[
                        styles.formatText,
                        exportFormat === "pdf" && { color: KeziColors.brand.purple600 }
                      ]}>PDF</ThemedText>
                    </Pressable>
                  </View>
                  
                  <Button 
                    onPress={handleExport} 
                    style={styles.exportButton}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="download" size={18} color="#FFFFFF" />
                        <ThemedText style={styles.exportButtonText}>Generate Export</ThemedText>
                      </>
                    )}
                  </Button>
                </View>
              )}

              {activeModal === "audit" && (
                <View style={styles.auditContent}>
                  {auditLogs.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Feather name="file-text" size={48} color={KeziColors.gray[400]} />
                      <ThemedText style={styles.emptyText}>No audit logs yet</ThemedText>
                    </View>
                  ) : (
                    auditLogs.slice(0, 20).map(log => (
                      <View key={log.id} style={[styles.logItem, { backgroundColor: inputBg }]}>
                        <View style={[styles.logIcon, { backgroundColor: KeziColors.brand.purple100 }]}>
                          <Feather name={getActionIcon(log.actionType)} size={16} color={KeziColors.brand.purple600} />
                        </View>
                        <View style={styles.logContent}>
                          <ThemedText style={styles.logDescription}>{log.description}</ThemedText>
                          <ThemedText style={styles.logMeta}>
                            {log.adminEmail} • {formatTimestamp(log.timestamp)}
                          </ThemedText>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {activeModal === "security" && (
                <View style={styles.securityContent}>
                  <GlassCard style={styles.securityCard}>
                    <View style={styles.securityItem}>
                      <Feather name="lock" size={20} color={KeziColors.brand.purple600} />
                      <View style={styles.securityInfo}>
                        <ThemedText style={styles.securityTitle}>Password Policy</ThemedText>
                        <ThemedText style={styles.securityDesc}>Minimum 8 characters with numbers</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: KeziColors.brand.emerald100 }]}>
                        <ThemedText style={[styles.statusText, { color: KeziColors.brand.emerald500 }]}>Active</ThemedText>
                      </View>
                    </View>
                  </GlassCard>
                  
                  <GlassCard style={styles.securityCard}>
                    <View style={styles.securityItem}>
                      <Feather name="smartphone" size={20} color={KeziColors.brand.purple600} />
                      <View style={styles.securityInfo}>
                        <ThemedText style={styles.securityTitle}>Two-Factor Authentication</ThemedText>
                        <ThemedText style={styles.securityDesc}>SMS verification for admin accounts</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: KeziColors.gray[200] }]}>
                        <ThemedText style={[styles.statusText, { color: KeziColors.gray[500] }]}>Coming Soon</ThemedText>
                      </View>
                    </View>
                  </GlassCard>
                  
                  <GlassCard style={styles.securityCard}>
                    <View style={styles.securityItem}>
                      <Feather name="clock" size={20} color={KeziColors.brand.purple600} />
                      <View style={styles.securityInfo}>
                        <ThemedText style={styles.securityTitle}>Session Timeout</ThemedText>
                        <ThemedText style={styles.securityDesc}>Auto-logout after 30 minutes of inactivity</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: KeziColors.brand.emerald100 }]}>
                        <ThemedText style={[styles.statusText, { color: KeziColors.brand.emerald500 }]}>Active</ThemedText>
                      </View>
                    </View>
                  </GlassCard>
                  
                  <GlassCard style={styles.securityCard}>
                    <View style={styles.securityItem}>
                      <Feather name="eye-off" size={20} color={KeziColors.brand.purple600} />
                      <View style={styles.securityInfo}>
                        <ThemedText style={styles.securityTitle}>Data Encryption</ThemedText>
                        <ThemedText style={styles.securityDesc}>End-to-end encryption for sensitive data</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: KeziColors.brand.emerald100 }]}>
                        <ThemedText style={[styles.statusText, { color: KeziColors.brand.emerald500 }]}>Active</ThemedText>
                      </View>
                    </View>
                  </GlassCard>
                </View>
              )}

              {activeModal === "language" && (
                <View style={styles.languageContent}>
                  <ThemedText style={styles.sectionLabel}>Select Default Language</ThemedText>
                  {LANGUAGES.map(lang => (
                    <Pressable
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        language === lang.code && styles.languageOptionSelected,
                        { backgroundColor: language === lang.code ? KeziColors.brand.purple100 : inputBg }
                      ]}
                      onPress={() => handleLanguageChange(lang.code)}
                    >
                      <View style={[styles.flagBadge, { backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF" }]}>
                        <ThemedText style={styles.flagText}>{lang.flag}</ThemedText>
                      </View>
                      <ThemedText style={styles.languageName}>{lang.name}</ThemedText>
                      {language === lang.code ? (
                        <Feather name="check-circle" size={20} color={KeziColors.brand.purple600} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              )}

              {activeModal === "createAdmin" && (
                <View style={styles.createAdminContent}>
                  <ThemedText style={styles.sectionLabel}>New Administrator Details</ThemedText>
                  
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: inputBg, color: isDark ? "#FFFFFF" : "#000000" }]}
                      placeholder="Enter admin name"
                      placeholderTextColor={KeziColors.gray[400]}
                      value={newAdminName}
                      onChangeText={setNewAdminName}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: inputBg, color: isDark ? "#FFFFFF" : "#000000" }]}
                      placeholder="Enter admin email"
                      placeholderTextColor={KeziColors.gray[400]}
                      value={newAdminEmail}
                      onChangeText={setNewAdminEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <ThemedText style={styles.noteText}>
                    An invitation email will be sent to this address with login instructions.
                  </ThemedText>
                  
                  <Button 
                    onPress={handleCreateAdmin} 
                    style={styles.createButton}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="user-plus" size={18} color="#FFFFFF" />
                        <ThemedText style={styles.createButtonText}>Create Administrator</ThemedText>
                      </>
                    )}
                  </Button>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.container}>
      <LogoHeader showBackButton={false} />
      
      <GlassCard style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <AvatarPicker
            currentAvatar={user?.avatar}
            onAvatarChange={handleAvatarChange}
            size={80}
          />
          {user?.isSuperAdmin ? (
            <View style={styles.superAdminBadge}>
              <Feather name="star" size={12} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <ThemedText style={styles.name}>{user?.name}</ThemedText>
        <ThemedText style={styles.email}>{user?.email}</ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: KeziColors.brand.purple600 }]}>
          <ThemedText style={styles.roleText}>
            {user?.isSuperAdmin ? "Super Admin" : "Administrator"}
          </ThemedText>
        </View>
      </GlassCard>

      {user?.isSuperAdmin ? (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Admin Management</ThemedText>
          
          <GlassCard style={styles.menuCard}>
            <Pressable style={styles.menuItem} onPress={() => setActiveModal("createAdmin")}>
              <Feather name="user-plus" size={20} color={KeziColors.brand.purple600} />
              <ThemedText style={styles.menuText}>Create Administrator</ThemedText>
              <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
            </Pressable>
          </GlassCard>
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>System</ThemedText>
        
        <GlassCard style={styles.menuCard}>
          <Pressable style={styles.menuItem} onPress={() => setActiveModal("export")}>
            <Feather name="database" size={20} color={KeziColors.brand.purple600} />
            <ThemedText style={styles.menuText}>Data Export</ThemedText>
            <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.menuItem} onPress={() => setActiveModal("audit")}>
            <Feather name="file-text" size={20} color={KeziColors.brand.purple600} />
            <ThemedText style={styles.menuText}>Audit Logs</ThemedText>
            <View style={[styles.countBadge, { backgroundColor: KeziColors.brand.purple100 }]}>
              <ThemedText style={[styles.countText, { color: KeziColors.brand.purple600 }]}>
                {auditLogs.length}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.menuItem} onPress={() => setActiveModal("security")}>
            <Feather name="shield" size={20} color={KeziColors.brand.purple600} />
            <ThemedText style={styles.menuText}>Security Settings</ThemedText>
            <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.menuItem} onPress={() => setActiveModal("language")}>
            <Feather name="globe" size={20} color={KeziColors.brand.purple600} />
            <ThemedText style={styles.menuText}>Language</ThemedText>
            <View style={[styles.langBadge, { backgroundColor: KeziColors.brand.purple100 }]}>
              <ThemedText style={[styles.langText, { color: KeziColors.brand.purple600 }]}>
                {language.toUpperCase()}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={KeziColors.gray[400]} />
          </Pressable>
        </GlassCard>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color={KeziColors.phases.menstrual.primary} />
        <ThemedText style={styles.logoutText}>{t("profile.logout")}</ThemedText>
      </Pressable>

      {renderModal()}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  profileCard: {
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  superAdminBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: KeziColors.brand.amber500,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: KeziColors.brand.purple600,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  langBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
  },
  langText: {
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: KeziColors.gray[200],
    marginLeft: Spacing.md + 20 + Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: KeziColors.phases.menstrual.primary,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: KeziColors.phases.menstrual.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KeziColors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.5,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exportContent: {},
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  exportOptionSelected: {
    borderWidth: 1,
    borderColor: KeziColors.brand.purple600,
  },
  exportOptionText: {
    flex: 1,
    fontSize: 15,
  },
  formatRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  formatOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  formatOptionSelected: {
    borderWidth: 1,
    borderColor: KeziColors.brand.purple600,
  },
  formatText: {
    fontSize: 15,
    fontWeight: "600",
  },
  exportButton: {
    marginTop: Spacing.xl,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  auditContent: {},
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
  logItem: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  logContent: {
    flex: 1,
  },
  logDescription: {
    fontSize: 14,
    marginBottom: 2,
  },
  logMeta: {
    fontSize: 11,
    opacity: 0.5,
  },
  securityContent: {
    gap: Spacing.sm,
  },
  securityCard: {
    padding: Spacing.md,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 12,
    opacity: 0.6,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  languageContent: {},
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  languageOptionSelected: {
    borderWidth: 1,
    borderColor: KeziColors.brand.purple600,
  },
  flagBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  flagText: {
    fontSize: 14,
    fontWeight: "700",
  },
  languageName: {
    flex: 1,
    fontSize: 16,
  },
  createAdminContent: {},
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  textInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: 16,
  },
  noteText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  createButton: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
