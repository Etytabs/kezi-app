import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView, Image, Platform, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { formatRWF } from "@/utils/currency";

const MATERNAL_MEDICINES = [
  {
    id: "1",
    name: "Prenatal Vitamins",
    description: "Complete folic acid + iron supplement",
    price: 32500,
    stock: 45,
    category: "Supplements",
    image: null,
  },
  {
    id: "2",
    name: "Calcium + D3",
    description: "Bone health support for pregnancy",
    price: 24000,
    stock: 32,
    category: "Supplements",
    image: null,
  },
  {
    id: "3",
    name: "Anti-Nausea Drops",
    description: "Ginger-based morning sickness relief",
    price: 16900,
    stock: 8,
    category: "Relief",
    image: null,
  },
  {
    id: "4",
    name: "Iron Supplement",
    description: "For anemia prevention during pregnancy",
    price: 19500,
    stock: 25,
    category: "Supplements",
    image: null,
  },
  {
    id: "5",
    name: "Stretch Mark Cream",
    description: "Moisturizing formula with vitamin E",
    price: 39000,
    stock: 4,
    category: "Skincare",
    image: null,
  },
];

const QUICK_CATEGORIES = [
  { id: "supplements", label: "Supplements", icon: "package" as const },
  { id: "relief", label: "Relief", icon: "heart" as const },
  { id: "skincare", label: "Skincare", icon: "droplet" as const },
  { id: "equipment", label: "Equipment", icon: "thermometer" as const },
];

export default function MaternalScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "pharmacies">("list");
  const [showComingSoon, setShowComingSoon] = useState(false);

  const filteredMedicines = useMemo(() => {
    if (!selectedCategory) return MATERNAL_MEDICINES;
    return MATERNAL_MEDICINES.filter(
      (m) => m.category.toLowerCase() === selectedCategory
    );
  }, [selectedCategory]);

  const handleUploadPrescription = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      if (Platform.OS !== "web") {
        try {
          await Linking.openSettings();
        } catch (error) {
          console.log("Could not open settings");
        }
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPrescriptionImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      if (Platform.OS !== "web") {
        try {
          await Linking.openSettings();
        } catch (error) {
          console.log("Could not open settings");
        }
      }
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPrescriptionImage(result.assets[0].uri);
    }
  };

  const getStockColor = (stock: number) => {
    if (stock <= 5) return KeziColors.functional.danger;
    if (stock <= 10) return KeziColors.functional.warning;
    return KeziColors.brand.emerald500;
  };

  const maternalFeatures = [
    {
      icon: "calendar" as const,
      title: "ANC Appointments",
      description: "Schedule and track antenatal care visits with reminders",
    },
    {
      icon: "activity" as const,
      title: "Health Monitoring",
      description: "Track blood pressure, weight, and baby movements",
    },
    {
      icon: "users" as const,
      title: "Postnatal Care",
      description: "Postpartum recovery support and newborn care tips",
    },
    {
      icon: "shopping-bag" as const,
      title: "Maternal Products",
      description: "Prenatal vitamins, nursing supplies, and baby essentials",
    },
  ];

  return (
    <>
      <ScreenScrollView>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <LinearGradient
          colors={[KeziColors.maternal.primary, KeziColors.brand.emerald500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Feather name="heart" size={24} color="#FFFFFF" />
            </View>
            <ThemedText type="h4" style={styles.heroTitle}>
              Maternal Care
            </ThemedText>
            <ThemedText type="body" style={styles.heroSubtitle}>
              Pregnancy tracking, postpartum care, and maternal products
            </ThemedText>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          TRACKING
        </ThemedText>
        <View style={styles.trackingCards}>
          <Pressable
            onPress={() => navigation.navigate("PregnancyTracker" as never)}
            style={[styles.trackingCard, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.maternal.surface }]}
          >
            <View style={[styles.trackingCardIcon, { backgroundColor: KeziColors.maternal.teal100 }]}>
              <Feather name="heart" size={22} color={KeziColors.maternal.primary} />
            </View>
            <ThemedText type="body" style={styles.trackingCardTitle}>
              Pregnancy Tracker
            </ThemedText>
            <ThemedText type="small" style={styles.trackingCardDesc}>
              Week-by-week fetal development and due date tracking
            </ThemedText>
            <Feather name="chevron-right" size={18} color={KeziColors.gray[400]} style={styles.trackingCardArrow} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("Postpartum" as never)}
            style={[styles.trackingCard, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.maternal.surface }]}
          >
            <View style={[styles.trackingCardIcon, { backgroundColor: KeziColors.maternal.emerald100 }]}>
              <Feather name="sun" size={22} color={KeziColors.maternal.secondary} />
            </View>
            <ThemedText type="body" style={styles.trackingCardTitle}>
              Postpartum Care
            </ThemedText>
            <ThemedText type="small" style={styles.trackingCardDesc}>
              Recovery tracking and breastfeeding session logger
            </ThemedText>
            <Feather name="chevron-right" size={18} color={KeziColors.gray[400]} style={styles.trackingCardArrow} />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          UPLOAD PRESCRIPTION
        </ThemedText>
        <Pressable onPress={handleUploadPrescription}>
          <View
            style={[
              styles.uploadCard,
              {
                backgroundColor: isDark
                  ? KeziColors.night.surface
                  : KeziColors.brand.teal50,
                borderColor: KeziColors.brand.teal600,
              },
            ]}
          >
            {prescriptionImage ? (
              <View style={styles.uploadedContent}>
                <Image
                  source={{ uri: prescriptionImage }}
                  style={styles.prescriptionThumb}
                />
                <View style={styles.uploadedInfo}>
                  <Feather
                    name="check-circle"
                    size={20}
                    color={KeziColors.brand.emerald500}
                  />
                  <ThemedText type="body" style={styles.uploadedText}>
                    Prescription uploaded
                  </ThemedText>
                </View>
                <ThemedText
                  type="small"
                  style={[styles.tapToChange, { color: KeziColors.brand.teal600 }]}
                >
                  Tap to change
                </ThemedText>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View
                  style={[
                    styles.uploadIconContainer,
                    { backgroundColor: KeziColors.brand.teal600 },
                  ]}
                >
                  <Feather name="upload" size={24} color="#FFFFFF" />
                </View>
                <ThemedText type="body" style={styles.uploadTitle}>
                  Upload your prescription
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.uploadHint, { color: KeziColors.brand.teal600 }]}
                >
                  Tap to select from gallery
                </ThemedText>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.viewToggle}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            {viewMode === "list" ? "MEDICINES" : "FIND PHARMACIES"}
          </ThemedText>
          <View style={styles.toggleButtons}>
            <Pressable
              onPress={() => setViewMode("list")}
              style={[
                styles.toggleButton,
                viewMode === "list" && {
                  backgroundColor: KeziColors.brand.teal600,
                },
              ]}
            >
              <Feather
                name="list"
                size={16}
                color={viewMode === "list" ? "#FFFFFF" : theme.textMuted}
              />
            </Pressable>
            <Pressable
              onPress={() => setViewMode("pharmacies")}
              style={[
                styles.toggleButton,
                viewMode === "pharmacies" && {
                  backgroundColor: KeziColors.brand.teal600,
                },
              ]}
            >
              <Feather
                name="map-pin"
                size={16}
                color={viewMode === "pharmacies" ? "#FFFFFF" : theme.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {viewMode === "list" ? (
        <>
          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              <Pressable
                onPress={() => setSelectedCategory(null)}
                style={[
                  styles.categoryChip,
                  !selectedCategory && {
                    backgroundColor: KeziColors.brand.teal600,
                  },
                  selectedCategory && {
                    backgroundColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[100],
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[
                    styles.categoryLabel,
                    { color: !selectedCategory ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  All
                </ThemedText>
              </Pressable>
              {QUICK_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === cat.id ? null : cat.id
                    )
                  }
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && {
                      backgroundColor: KeziColors.brand.teal600,
                    },
                    selectedCategory !== cat.id && {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[100],
                    },
                  ]}
                >
                  <Feather
                    name={cat.icon}
                    size={14}
                    color={
                      selectedCategory === cat.id ? "#FFFFFF" : theme.textSecondary
                    }
                  />
                  <ThemedText
                    type="small"
                    style={[
                      styles.categoryLabel,
                      {
                        color:
                          selectedCategory === cat.id
                            ? "#FFFFFF"
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          <View style={styles.productList}>
            {filteredMedicines.map((medicine, index) => (
              <Animated.View
                key={medicine.id}
                entering={FadeInDown.delay(300 + index * 50).duration(500)}
              >
                <GlassCard style={styles.productCard}>
                  <View style={styles.productContent}>
                    <View
                      style={[
                        styles.productIcon,
                        { backgroundColor: KeziColors.brand.teal50 },
                      ]}
                    >
                      <Feather
                        name="package"
                        size={20}
                        color={KeziColors.brand.teal600}
                      />
                    </View>
                    <View style={styles.productInfo}>
                      <ThemedText type="body" style={styles.productName}>
                        {medicine.name}
                      </ThemedText>
                      <ThemedText type="small" style={styles.productDesc}>
                        {medicine.description}
                      </ThemedText>
                      <View style={styles.productMeta}>
                        <ThemedText
                          type="body"
                          style={[
                            styles.productPrice,
                            { color: KeziColors.brand.teal600 },
                          ]}
                        >
                          {formatRWF(medicine.price)}
                        </ThemedText>
                        <View style={styles.stockBadge}>
                          <View
                            style={[
                              styles.stockDot,
                              { backgroundColor: getStockColor(medicine.stock) },
                            ]}
                          />
                          <ThemedText type="small" style={styles.stockText}>
                            {medicine.stock} in stock
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      style={[
                        styles.addButton,
                        { backgroundColor: KeziColors.brand.teal600 },
                      ]}
                    >
                      <Feather name="plus" size={18} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </View>
        </>
      ) : (
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <GlassCard style={styles.mapPlaceholder}>
            <View style={styles.mapContent}>
              <View
                style={[
                  styles.mapIcon,
                  { backgroundColor: KeziColors.brand.teal50 },
                ]}
              >
                <Feather
                  name="map"
                  size={32}
                  color={KeziColors.brand.teal600}
                />
              </View>
              <ThemedText type="h4" style={styles.mapTitle}>
                Pharmacy Finder
              </ThemedText>
              <ThemedText type="body" style={styles.mapSubtitle}>
                Enable location to find nearby pharmacies
              </ThemedText>
              <Button
                onPress={() => {}}
                style={[styles.enableLocationBtn, { backgroundColor: KeziColors.brand.teal600 }]}
              >
                Enable Location
              </Button>
            </View>
          </GlassCard>

          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            NEARBY PHARMACIES
          </ThemedText>
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} style={styles.pharmacyCard}>
              <View style={styles.pharmacyContent}>
                <View
                  style={[
                    styles.pharmacyIcon,
                    { backgroundColor: KeziColors.brand.teal50 },
                  ]}
                >
                  <Feather
                    name="map-pin"
                    size={20}
                    color={KeziColors.brand.teal600}
                  />
                </View>
                <View style={styles.pharmacyInfo}>
                  <ThemedText type="body" style={styles.pharmacyName}>
                    HealthCare Pharmacy {i}
                  </ThemedText>
                  <ThemedText type="small" style={styles.pharmacyAddress}>
                    123 Main Street, Suite {i}00
                  </ThemedText>
                  <View style={styles.pharmacyMeta}>
                    <View style={styles.distanceBadge}>
                      <Feather
                        name="navigation"
                        size={12}
                        color={KeziColors.brand.teal600}
                      />
                      <ThemedText
                        type="small"
                        style={[
                          styles.distanceText,
                          { color: KeziColors.brand.teal600 },
                        ]}
                      >
                        {0.5 * i} km
                      </ThemedText>
                    </View>
                    <View style={styles.openBadge}>
                      <View
                        style={[
                          styles.openDot,
                          { backgroundColor: KeziColors.brand.emerald500 },
                        ]}
                      />
                      <ThemedText type="small">Open</ThemedText>
                    </View>
                  </View>
                </View>
                <Pressable style={styles.directionsBtn}>
                  <Feather
                    name="navigation"
                    size={18}
                    color={KeziColors.brand.teal600}
                  />
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </Animated.View>
      )}
      </ScreenScrollView>

      <ComingSoonOverlay
        title="Maternal Care"
        subtitle="Complete pregnancy and postpartum care support is on the way"
        features={maternalFeatures}
        visible={showComingSoon}
        onPreview={() => setShowComingSoon(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  heroTitle: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  uploadCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  uploadPlaceholder: {
    alignItems: "center",
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  uploadTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  uploadHint: {
    opacity: 0.8,
  },
  uploadedContent: {
    alignItems: "center",
  },
  prescriptionThumb: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  uploadedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  uploadedText: {
    fontWeight: "600",
  },
  tapToChange: {
    marginTop: Spacing.xs,
  },
  viewToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  toggleButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  categoryScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
  },
  categoryLabel: {
    fontWeight: "600",
  },
  productList: {
    gap: Spacing.md,
  },
  productCard: {
    marginBottom: 0,
  },
  productContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  productDesc: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  productPrice: {
    fontWeight: "700",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    opacity: 0.7,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  mapPlaceholder: {
    marginBottom: Spacing.xl,
  },
  mapContent: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  mapIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  mapTitle: {
    marginBottom: Spacing.xs,
  },
  mapSubtitle: {
    opacity: 0.7,
    marginBottom: Spacing.lg,
  },
  enableLocationBtn: {
    paddingHorizontal: Spacing.xl,
  },
  pharmacyCard: {
    marginBottom: Spacing.md,
  },
  pharmacyContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  pharmacyIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  pharmacyAddress: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  pharmacyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontWeight: "600",
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  directionsBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  trackingCards: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  trackingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  trackingCardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  trackingCardTitle: {
    fontWeight: "600",
    flex: 0,
    marginRight: Spacing.xs,
  },
  trackingCardDesc: {
    flex: 1,
    opacity: 0.6,
    marginTop: 2,
  },
  trackingCardArrow: {
    marginLeft: Spacing.sm,
  },
});
