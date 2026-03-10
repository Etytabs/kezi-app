import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, Alert, Platform, TextInput, RefreshControl, Modal, ScrollView, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { storage } from "@/services/storage";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";

interface Merchant {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  category: "Pharmacy" | "Wellness Center" | "Clinic" | "Other";
  address: string;
  status: "pending" | "verified" | "rejected" | "suspended";
  created_at: string;
  products_count: number;
  orders_count: number;
  registration_number?: string;
  description?: string;
}

const STATUS_FILTERS = ["All", "Pending", "Verified", "Rejected", "Suspended"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const MERCHANT_CATEGORIES = [
  { id: "Pharmacy", label: "Pharmacy", icon: "plus-circle" as const },
  { id: "Wellness Center", label: "Wellness Center", icon: "heart" as const },
  { id: "Clinic", label: "Clinic", icon: "activity" as const },
  { id: "Other", label: "Other", icon: "grid" as const },
] as const;

const DEMO_MERCHANTS: Merchant[] = [
  {
    id: "1",
    business_name: "Kigali Pharmacy Plus",
    email: "info@kigalipharmacy.rw",
    phone: "+250 788 123 456",
    category: "Pharmacy",
    address: "KN 5 Rd, Kigali",
    status: "pending",
    created_at: "2024-01-15",
    products_count: 0,
    orders_count: 0,
    registration_number: "RDB-2024-001234",
  },
  {
    id: "2",
    business_name: "Mama's Wellness Shop",
    email: "mama.wellness@gmail.com",
    phone: "+250 788 234 567",
    category: "Wellness Center",
    address: "Kimironko, Kigali",
    status: "pending",
    created_at: "2024-01-14",
    products_count: 0,
    orders_count: 0,
  },
  {
    id: "3",
    business_name: "FemCare Clinic",
    email: "contact@femcare.rw",
    phone: "+250 788 345 678",
    category: "Clinic",
    address: "Nyamirambo, Kigali",
    status: "pending",
    created_at: "2024-01-13",
    products_count: 0,
    orders_count: 0,
  },
  {
    id: "4",
    business_name: "HealthFirst Pharmacy",
    email: "healthfirst@rw.com",
    phone: "+250 788 456 789",
    category: "Pharmacy",
    address: "Remera, Kigali",
    status: "verified",
    created_at: "2024-01-01",
    products_count: 45,
    orders_count: 123,
    registration_number: "RDB-2023-005678",
  },
  {
    id: "5",
    business_name: "EcoFem Wellness",
    email: "eco@femrw.com",
    phone: "+250 788 567 890",
    category: "Wellness Center",
    address: "Kicukiro, Kigali",
    status: "verified",
    created_at: "2023-12-15",
    products_count: 28,
    orders_count: 89,
  },
  {
    id: "6",
    business_name: "Natural Care Shop",
    email: "natural@care.rw",
    phone: "+250 788 678 901",
    category: "Other",
    address: "Muhanga",
    status: "suspended",
    created_at: "2023-11-20",
    products_count: 12,
    orders_count: 34,
  },
];

export default function AdminMerchantsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>(DEMO_MERCHANTS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newMerchant, setNewMerchant] = useState({
    business_name: "",
    email: "",
    phone: "",
    category: "" as Merchant["category"] | "",
    address: "",
    registration_number: "",
    description: "",
  });

  const filteredMerchants = merchants.filter((m) => {
    const matchesStatus = statusFilter === "All" || m.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = m.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = merchants.filter((m) => m.status === "pending").length;
  const verifiedCount = merchants.filter((m) => m.status === "verified").length;
  const suspendedCount = merchants.filter((m) => m.status === "suspended").length;

  const handleVerify = async (id: string) => {
    const merchant = merchants.find(m => m.id === id);
    
    const confirmAction = async () => {
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "verified" as const } : m))
      );
      
      await storage.logAdminAction({
        id: `action_${Date.now()}`,
        adminId: user?.id || "",
        adminEmail: user?.email || "",
        actionType: "approve_merchant",
        targetId: id,
        targetType: "merchant",
        description: `Verified merchant: ${merchant?.business_name}`,
        timestamp: new Date().toISOString(),
      });
    };

    if (Platform.OS === "web") {
      if (window.confirm("Verify this merchant? They will be able to sell products.")) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Verify Merchant",
        "Verify this merchant? They will be able to sell products.",
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Verify", onPress: confirmAction },
        ]
      );
    }
  };

  const handleReject = async (id: string) => {
    const merchant = merchants.find(m => m.id === id);
    
    const confirmAction = async () => {
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "rejected" as const } : m))
      );
      
      await storage.logAdminAction({
        id: `action_${Date.now()}`,
        adminId: user?.id || "",
        adminEmail: user?.email || "",
        actionType: "suspend_merchant",
        targetId: id,
        targetType: "merchant",
        description: `Rejected merchant application: ${merchant?.business_name}`,
        timestamp: new Date().toISOString(),
      });
    };

    if (Platform.OS === "web") {
      if (window.confirm("Reject this merchant application?")) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Reject Application",
        "Reject this merchant application?",
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Reject", style: "destructive", onPress: confirmAction },
        ]
      );
    }
  };

  const handleSuspend = async (id: string) => {
    const merchant = merchants.find(m => m.id === id);
    
    const confirmAction = async () => {
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "suspended" as const } : m))
      );
      
      await storage.logAdminAction({
        id: `action_${Date.now()}`,
        adminId: user?.id || "",
        adminEmail: user?.email || "",
        actionType: "suspend_merchant",
        targetId: id,
        targetType: "merchant",
        description: `Suspended merchant: ${merchant?.business_name}`,
        timestamp: new Date().toISOString(),
      });
    };

    if (Platform.OS === "web") {
      if (window.confirm("Suspend this merchant? They will not be able to sell products.")) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Suspend Merchant",
        "Suspend this merchant? They will not be able to sell products.",
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Suspend", style: "destructive", onPress: confirmAction },
        ]
      );
    }
  };

  const handleReactivate = async (id: string) => {
    const merchant = merchants.find(m => m.id === id);
    
    const confirmAction = async () => {
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "verified" as const } : m))
      );
      
      await storage.logAdminAction({
        id: `action_${Date.now()}`,
        adminId: user?.id || "",
        adminEmail: user?.email || "",
        actionType: "approve_merchant",
        targetId: id,
        targetType: "merchant",
        description: `Reactivated merchant: ${merchant?.business_name}`,
        timestamp: new Date().toISOString(),
      });
    };

    if (Platform.OS === "web") {
      if (window.confirm("Reactivate this merchant?")) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Reactivate Merchant",
        "Reactivate this merchant?",
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Reactivate", onPress: confirmAction },
        ]
      );
    }
  };

  const handleCreateMerchant = async () => {
    if (!newMerchant.business_name || !newMerchant.email || !newMerchant.phone || !newMerchant.category) {
      Alert.alert("Missing Information", "Please fill in all required fields (Business Name, Email, Phone, Category).");
      return;
    }
    
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const merchant: Merchant = {
      id: `merchant_${Date.now()}`,
      business_name: newMerchant.business_name,
      email: newMerchant.email,
      phone: newMerchant.phone,
      category: newMerchant.category as Merchant["category"],
      address: newMerchant.address,
      registration_number: newMerchant.registration_number,
      description: newMerchant.description,
      status: "pending",
      created_at: new Date().toISOString().split("T")[0],
      products_count: 0,
      orders_count: 0,
    };
    
    setMerchants(prev => [merchant, ...prev]);
    
    await storage.logAdminAction({
      id: `action_${Date.now()}`,
      adminId: user?.id || "",
      adminEmail: user?.email || "",
      actionType: "approve_merchant",
      targetId: merchant.id,
      targetType: "merchant",
      description: `Created new merchant: ${merchant.business_name} (${merchant.category})`,
      timestamp: new Date().toISOString(),
    });
    
    setIsLoading(false);
    setShowCreateModal(false);
    setNewMerchant({
      business_name: "",
      email: "",
      phone: "",
      category: "",
      address: "",
      registration_number: "",
      description: "",
    });
    
    Alert.alert("Merchant Created", `${merchant.business_name} has been added and is pending verification.`);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: Merchant["status"]) => {
    switch (status) {
      case "pending": return KeziColors.phases.luteal.primary;
      case "verified": return KeziColors.maternal.emerald500;
      case "rejected": return KeziColors.phases.menstrual.primary;
      case "suspended": return KeziColors.gray[500];
    }
  };

  const getStatusBg = (status: Merchant["status"]) => {
    switch (status) {
      case "pending": return KeziColors.phases.luteal.secondary;
      case "verified": return KeziColors.maternal.emerald100;
      case "rejected": return KeziColors.phases.menstrual.secondary;
      case "suspended": return KeziColors.gray[200];
    }
  };

  const getCategoryIcon = (category: Merchant["category"]): React.ComponentProps<typeof Feather>["name"] => {
    switch (category) {
      case "Pharmacy": return "plus-circle";
      case "Wellness Center": return "heart";
      case "Clinic": return "activity";
      case "Other": return "grid";
    }
  };

  const renderMerchant = ({ item }: { item: Merchant }) => {
    const isExpanded = expandedId === item.id;
    
    return (
      <GlassCard style={styles.merchantCard}>
        <Pressable onPress={() => setExpandedId(isExpanded ? null : item.id)}>
          <View style={styles.merchantHeader}>
            <View style={styles.merchantInfo}>
              <View style={styles.merchantTitleRow}>
                <ThemedText style={styles.merchantName}>{item.business_name}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.categoryRow}>
                <Feather name={getCategoryIcon(item.category)} size={12} color={KeziColors.maternal.teal600} />
                <ThemedText style={styles.merchantCategory}>{item.category}</ThemedText>
              </View>
              <ThemedText style={styles.merchantEmail}>{item.email}</ThemedText>
            </View>
            <Feather
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={KeziColors.gray[400]}
            />
          </View>
        </Pressable>

        {isExpanded ? (
          <View style={styles.merchantDetails}>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Feather name="phone" size={14} color={KeziColors.gray[400]} />
                <ThemedText style={styles.detailText}>{item.phone}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <Feather name="map-pin" size={14} color={KeziColors.gray[400]} />
                <ThemedText style={styles.detailText}>{item.address || "No address"}</ThemedText>
              </View>
              {item.registration_number ? (
                <View style={styles.detailItem}>
                  <Feather name="file-text" size={14} color={KeziColors.gray[400]} />
                  <ThemedText style={styles.detailText}>Reg: {item.registration_number}</ThemedText>
                </View>
              ) : null}
              <View style={styles.detailItem}>
                <Feather name="calendar" size={14} color={KeziColors.gray[400]} />
                <ThemedText style={styles.detailText}>Joined {item.created_at}</ThemedText>
              </View>
            </View>

            {item.status === "verified" ? (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{item.products_count}</ThemedText>
                  <ThemedText style={styles.statLabel}>Products</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{item.orders_count}</ThemedText>
                  <ThemedText style={styles.statLabel}>Orders</ThemedText>
                </View>
              </View>
            ) : null}

            <View style={styles.actionButtons}>
              {item.status === "pending" ? (
                <>
                  <Button
                    style={[styles.actionButton, { backgroundColor: KeziColors.maternal.emerald500 }]}
                    onPress={() => handleVerify(item.id)}
                  >
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>Verify</ThemedText>
                  </Button>
                  <Pressable
                    style={[styles.actionButtonOutline, { borderColor: KeziColors.phases.menstrual.primary }]}
                    onPress={() => handleReject(item.id)}
                  >
                    <Feather name="x" size={16} color={KeziColors.phases.menstrual.primary} />
                    <ThemedText style={[styles.actionButtonOutlineText, { color: KeziColors.phases.menstrual.primary }]}>
                      Reject
                    </ThemedText>
                  </Pressable>
                </>
              ) : null}
              {item.status === "verified" ? (
                <Pressable
                  style={[styles.actionButtonOutline, { borderColor: KeziColors.gray[400] }]}
                  onPress={() => handleSuspend(item.id)}
                >
                  <Feather name="pause-circle" size={16} color={KeziColors.gray[500]} />
                  <ThemedText style={[styles.actionButtonOutlineText, { color: KeziColors.gray[500] }]}>
                    Suspend
                  </ThemedText>
                </Pressable>
              ) : null}
              {(item.status === "suspended" || item.status === "rejected") ? (
                <Button
                  style={[styles.actionButton, { backgroundColor: KeziColors.maternal.teal600 }]}
                  onPress={() => handleReactivate(item.id)}
                >
                  <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Reactivate</ThemedText>
                </Button>
              ) : null}
            </View>
          </View>
        ) : null}
      </GlassCard>
    );
  };

  const renderCreateModal = () => {
    const modalBg = isDark ? KeziColors.night.base : "#FFFFFF";
    const inputBg = isDark ? KeziColors.night.deep : KeziColors.gray[100];

    return (
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: modalBg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create New Merchant</ThemedText>
              <Pressable onPress={() => setShowCreateModal(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={isDark ? KeziColors.night.text : KeziColors.gray[600]} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.formSectionTitle}>Business Information</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Business Name *</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: inputBg, color: isDark ? "#FFFFFF" : "#000000" }]}
                  placeholder="Enter business name"
                  placeholderTextColor={KeziColors.gray[400]}
                  value={newMerchant.business_name}
                  onChangeText={(text) => setNewMerchant(prev => ({ ...prev, business_name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Category *</ThemedText>
                <View style={styles.categoryGrid}>
                  {MERCHANT_CATEGORIES.map(cat => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        newMerchant.category === cat.id && styles.categoryOptionSelected,
                        { backgroundColor: newMerchant.category === cat.id ? KeziColors.maternal.teal100 : inputBg }
                      ]}
                      onPress={() => setNewMerchant(prev => ({ ...prev, category: cat.id }))}
                    >
                      <Feather 
                        name={cat.icon} 
                        size={20} 
                        color={newMerchant.category === cat.id ? KeziColors.maternal.teal600 : KeziColors.gray[400]} 
                      />
                      <ThemedText style={[
                        styles.categoryOptionText,
                        newMerchant.category === cat.id && { color: KeziColors.maternal.teal600 }
                      ]}>
                        {cat.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Registration Number</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: inputBg, color: isDark ? "#FFFFFF" : "#000000" }]}
                  placeholder="e.g., RDB-2024-XXXXXX"
                  placeholderTextColor={KeziColors.gray[400]}
                  value={newMerchant.registration_number}
                  onChangeText={(text) => setNewMerchant(prev => ({ ...prev, registration_number: text }))}
                />
              </View>

              <ThemedText style={[styles.formSectionTitle, { marginTop: Spacing.lg }]}>Contact Information</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Email Address *</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: inputBg, color: isDark ? "#FFFFFF" : "#000000" }]}
                  placeholder="business@example.com"
                  placeholderTextColor={KeziColors.gray[400]}
                  value={newMerchant.email}
                  onChangeText={(text) => setNewMerchant(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Phone Number *</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: inputBg, color: isDark ? "#FFFFFF" : "#000000" }]}
                  placeholder="+250 7XX XXX XXX"
                  placeholderTextColor={KeziColors.gray[400]}
                  value={newMerchant.phone}
                  onChangeText={(text) => setNewMerchant(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Business Address</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: inputBg, color: isDark ? "#FFFFFF" : "#000000" }]}
                  placeholder="Street, City, District"
                  placeholderTextColor={KeziColors.gray[400]}
                  value={newMerchant.address}
                  onChangeText={(text) => setNewMerchant(prev => ({ ...prev, address: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Description</ThemedText>
                <TextInput
                  style={[styles.textInput, styles.textArea, { backgroundColor: inputBg, color: isDark ? "#FFFFFF" : "#000000" }]}
                  placeholder="Brief description of the business..."
                  placeholderTextColor={KeziColors.gray[400]}
                  value={newMerchant.description}
                  onChangeText={(text) => setNewMerchant(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <Button 
                onPress={handleCreateMerchant} 
                style={styles.createButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="plus-circle" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.createButtonText}>Create Merchant</ThemedText>
                  </>
                )}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100] }]}>
          <Feather name="search" size={18} color={KeziColors.gray[400]} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
            placeholder="Search merchants..."
            placeholderTextColor={KeziColors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.statsRowContainer}>
        <View style={[styles.statChip, { backgroundColor: KeziColors.phases.luteal.secondary }]}>
          <ThemedText style={[styles.statChipValue, { color: KeziColors.phases.luteal.primary }]}>{pendingCount}</ThemedText>
          <ThemedText style={styles.statChipLabel}>Pending</ThemedText>
        </View>
        <View style={[styles.statChip, { backgroundColor: KeziColors.maternal.emerald100 }]}>
          <ThemedText style={[styles.statChipValue, { color: KeziColors.maternal.emerald500 }]}>{verifiedCount}</ThemedText>
          <ThemedText style={styles.statChipLabel}>Verified</ThemedText>
        </View>
        <View style={[styles.statChip, { backgroundColor: KeziColors.gray[200] }]}>
          <ThemedText style={[styles.statChipValue, { color: KeziColors.gray[500] }]}>{suspendedCount}</ThemedText>
          <ThemedText style={styles.statChipLabel}>Suspended</ThemedText>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={STATUS_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                statusFilter === item && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(item)}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  statusFilter === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredMerchants}
        keyExtractor={(item) => item.id}
        renderItem={renderMerchant}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={KeziColors.gray[400]} />
            <ThemedText style={styles.emptyText}>No merchants found</ThemedText>
          </GlassCard>
        }
      />

      {renderCreateModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: KeziColors.maternal.teal600,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRowContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statChipValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statChipLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 2,
  },
  filtersContainer: {
    marginBottom: Spacing.sm,
  },
  filtersList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: KeziColors.gray[200],
  },
  filterChipActive: {
    backgroundColor: KeziColors.brand.purple600,
  },
  filterChipText: {
    fontSize: 12,
    color: KeziColors.gray[600],
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  merchantCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  merchantHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  merchantInfo: {
    flex: 1,
  },
  merchantTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
    marginBottom: Spacing.xxs,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "600",
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
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  merchantCategory: {
    fontSize: 12,
    color: KeziColors.maternal.teal600,
  },
  merchantEmail: {
    fontSize: 12,
    opacity: 0.6,
  },
  merchantDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KeziColors.gray[200],
  },
  detailsGrid: {
    gap: Spacing.xs,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 13,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  actionButtonOutlineText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
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
  formSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.5,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    minWidth: "45%",
  },
  categoryOptionSelected: {
    borderWidth: 1,
    borderColor: KeziColors.maternal.teal600,
  },
  categoryOptionText: {
    fontSize: 14,
  },
  createButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
