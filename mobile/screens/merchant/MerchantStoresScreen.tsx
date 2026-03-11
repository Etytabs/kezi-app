import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, FlatList, Alert, Platform, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/context/LanguageContext";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenInsets } from "@/hooks/useScreenInsets";

interface Store {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  hours: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
}

const RWANDA_DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro",
];

const DEMO_STORES: Store[] = [
  {
    id: "1",
    name: "Kezi Pharmacy - Kigali Center",
    address: "KN 5 Road, Kigali Heights",
    district: "Gasabo",
    city: "Kigali",
    phone: "+250 788 123 456",
    hours: "Mon-Sat: 8:00 AM - 9:00 PM",
    isActive: true,
    latitude: -1.9441,
    longitude: 30.0619,
  },
  {
    id: "2",
    name: "Kezi Wellness Hub",
    address: "KG 11 Ave, Kimihurura",
    district: "Gasabo",
    city: "Kigali",
    phone: "+250 788 789 012",
    hours: "Mon-Fri: 9:00 AM - 6:00 PM",
    isActive: true,
    latitude: -1.9536,
    longitude: 30.0847,
  },
];

export default function MerchantStoresScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const { tabBarHeight } = useScreenInsets();
  const insets = useSafeAreaInsets();
  
  const [stores, setStores] = useState<Store[]>(DEMO_STORES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStore, setNewStore] = useState({
    name: "",
    address: "",
    district: "Gasabo",
    city: "Kigali",
    phone: "",
    hours: "Mon-Sat: 8:00 AM - 6:00 PM",
  });

  const handleAddStore = () => {
    if (!newStore.name || !newStore.address) {
      const message = "Please fill in store name and address";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Missing Information", message);
      }
      return;
    }

    const store: Store = {
      id: `new_${Date.now()}`,
      name: newStore.name,
      address: newStore.address,
      district: newStore.district,
      city: newStore.city,
      phone: newStore.phone,
      hours: newStore.hours,
      isActive: true,
    };

    setStores([store, ...stores]);
    setShowAddModal(false);
    setNewStore({
      name: "",
      address: "",
      district: "Gasabo",
      city: "Kigali",
      phone: "",
      hours: "Mon-Sat: 8:00 AM - 6:00 PM",
    });
  };

  const handleToggleActive = (storeId: string) => {
    setStores(stores.map((s) => 
      s.id === storeId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const handleDeleteStore = (storeId: string) => {
    const confirmDelete = () => {
      setStores(stores.filter((s) => s.id !== storeId));
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this store location?")) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Delete Store",
        "Are you sure you want to delete this store location?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  const renderStore = ({ item }: { item: Store }) => (
    <GlassCard style={[styles.storeCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.storeHeader}>
        <View style={styles.storeIcon}>
          <Feather name="map-pin" size={20} color={KeziColors.maternal.teal600} />
        </View>
        <View style={styles.storeInfo}>
          <ThemedText style={styles.storeName}>{item.name}</ThemedText>
          <View style={styles.districtBadge}>
            <ThemedText style={styles.districtText}>{item.district}, {item.city}</ThemedText>
          </View>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: item.isActive ? KeziColors.maternal.emerald500 : KeziColors.gray[400] }]} />
      </View>

      <View style={styles.storeDetails}>
        <View style={styles.detailRow}>
          <Feather name="home" size={16} color={KeziColors.gray[400]} />
          <ThemedText style={styles.detailText}>{item.address}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Feather name="clock" size={16} color={KeziColors.gray[400]} />
          <ThemedText style={styles.detailText}>{item.hours}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Feather name="phone" size={16} color={KeziColors.gray[400]} />
          <ThemedText style={styles.detailText}>{item.phone}</ThemedText>
        </View>
      </View>

      <View style={styles.storeActions}>
        <Pressable 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {}}
        >
          <Feather name="edit-2" size={14} color={KeziColors.maternal.teal600} />
          <ThemedText style={[styles.actionButtonText, { color: KeziColors.maternal.teal600 }]}>
            Edit
          </ThemedText>
        </Pressable>
        <Pressable 
          style={[
            styles.actionButton, 
            item.isActive ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={() => handleToggleActive(item.id)}
        >
          <Feather 
            name={item.isActive ? "eye-off" : "eye"} 
            size={14} 
            color={item.isActive ? KeziColors.gray[500] : KeziColors.maternal.emerald500} 
          />
          <ThemedText 
            style={[
              styles.actionButtonText, 
              { color: item.isActive ? KeziColors.gray[500] : KeziColors.maternal.emerald500 }
            ]}
          >
            {item.isActive ? "Close" : "Open"}
          </ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteStore(item.id)}
        >
          <Feather name="trash-2" size={14} color={KeziColors.phases.menstrual.primary} />
        </Pressable>
      </View>
    </GlassCard>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerStats}>
        <GlassCard style={styles.statCard}>
          <ThemedText style={styles.statValue}>{stores.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Stores</ThemedText>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <ThemedText style={[styles.statValue, { color: KeziColors.maternal.emerald500 }]}>
            {stores.filter((s) => s.isActive).length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Active</ThemedText>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <ThemedText style={[styles.statValue, { color: KeziColors.gray[400] }]}>
            {stores.filter((s) => !s.isActive).length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Closed</ThemedText>
        </GlassCard>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={renderStore}
        contentContainerStyle={[styles.storesList, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Feather name="map-pin" size={48} color={KeziColors.maternal.teal600} />
            <ThemedText style={styles.emptyTitle}>Your Stores</ThemedText>
            <ThemedText style={styles.emptyText}>
              Add store locations to manage inventory and accept orders
            </ThemedText>
          </GlassCard>
        }
      />

      <Pressable 
        style={[styles.fab, { bottom: tabBarHeight + Spacing.lg }]}
        onPress={() => setShowAddModal(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: isDark ? KeziColors.night.deep : "#FFFFFF",
              paddingBottom: insets.bottom + Spacing.lg
            }
          ]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Store Location</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={KeziColors.gray[400]} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Store Name</ThemedText>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                    color: isDark ? "#FFFFFF" : "#000000"
                  }
                ]}
                placeholder="e.g., Kezi Pharmacy - Main Branch"
                placeholderTextColor={KeziColors.gray[400]}
                value={newStore.name}
                onChangeText={(text) => setNewStore({ ...newStore, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Address</ThemedText>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                    color: isDark ? "#FFFFFF" : "#000000"
                  }
                ]}
                placeholder="Street address"
                placeholderTextColor={KeziColors.gray[400]}
                value={newStore.address}
                onChangeText={(text) => setNewStore({ ...newStore, address: text })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>District</ThemedText>
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100] }
                ]}>
                  <ThemedText style={styles.pickerText}>{newStore.district}</ThemedText>
                  <Feather name="chevron-down" size={16} color={KeziColors.gray[400]} />
                </View>
              </View>
              <View style={{ width: Spacing.md }} />
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>City</ThemedText>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                      color: isDark ? "#FFFFFF" : "#000000"
                    }
                  ]}
                  placeholder="Kigali"
                  placeholderTextColor={KeziColors.gray[400]}
                  value={newStore.city}
                  onChangeText={(text) => setNewStore({ ...newStore, city: text })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Phone Number</ThemedText>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                    color: isDark ? "#FFFFFF" : "#000000"
                  }
                ]}
                placeholder="+250 7XX XXX XXX"
                placeholderTextColor={KeziColors.gray[400]}
                value={newStore.phone}
                onChangeText={(text) => setNewStore({ ...newStore, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Operating Hours</ThemedText>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                    color: isDark ? "#FFFFFF" : "#000000"
                  }
                ]}
                placeholder="Mon-Sat: 8:00 AM - 6:00 PM"
                placeholderTextColor={KeziColors.gray[400]}
                value={newStore.hours}
                onChangeText={(text) => setNewStore({ ...newStore, hours: text })}
              />
            </View>

            <Button onPress={handleAddStore} style={styles.submitButton}>
              Add Store
            </Button>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStats: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  storesList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  storeCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: KeziColors.maternal.teal100,
    alignItems: "center",
    justifyContent: "center",
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xxs,
  },
  districtBadge: {
    backgroundColor: KeziColors.brand.purple100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  districtText: {
    fontSize: 11,
    color: KeziColors.brand.purple600,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storeDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingLeft: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  storeActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  editButton: {
    backgroundColor: KeziColors.maternal.teal100,
  },
  deactivateButton: {
    backgroundColor: KeziColors.gray[200],
  },
  activateButton: {
    backgroundColor: KeziColors.maternal.emerald100,
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: Spacing.md,
    backgroundColor: KeziColors.phases.menstrual.secondary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: KeziColors.maternal.teal600,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formRow: {
    flexDirection: "row",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  pickerText: {
    fontSize: 16,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
