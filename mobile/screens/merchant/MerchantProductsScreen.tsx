import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, FlatList, Alert, Platform, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";
import { productsApi } from "@/services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenInsets } from "@/hooks/useScreenInsets";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
}

const DEMO_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Prenatal Vitamins",
    description: "Essential vitamins for expectant mothers",
    price: 15000,
    stock: 50,
    category: "Supplements",
    isActive: true,
  },
  {
    id: "2",
    name: "Menstrual Cup - Size M",
    description: "Reusable menstrual cup, medical-grade silicone",
    price: 8000,
    stock: 25,
    category: "Hygiene",
    isActive: true,
  },
  {
    id: "3",
    name: "Organic Cotton Pads",
    description: "Pack of 10 organic cotton sanitary pads",
    price: 3500,
    stock: 100,
    category: "Hygiene",
    isActive: true,
  },
  {
    id: "4",
    name: "Folic Acid Supplement",
    description: "400mcg daily folic acid tablets - 90 count",
    price: 12000,
    stock: 0,
    category: "Supplements",
    isActive: false,
  },
];

const CATEGORIES = ["All", "Hygiene", "Supplements", "Maternal Care", "Wellness"];

export default function MerchantProductsScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { tabBarHeight } = useScreenInsets();
  const insets = useSafeAreaInsets();
  
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "Hygiene",
    imageUri: "",
  });

  const handlePickImage = async () => {
    if (Platform.OS === "web") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewProduct({ ...newProduct, imageUri: result.assets[0].uri });
      }
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        t("common.error"),
        "Please enable photo library access in Settings to add product images.",
        [{ text: t("common.ok") }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewProduct({ ...newProduct, imageUri: result.assets[0].uri });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} RWF`;

  const getStockColor = (stock: number) => {
    if (stock === 0) return KeziColors.gray[400];
    if (stock < 10) return KeziColors.phases.menstrual.primary;
    if (stock < 25) return KeziColors.phases.luteal.primary;
    return KeziColors.maternal.emerald500;
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      const message = "Please fill in product name and price";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Missing Information", message);
      }
      return;
    }

    const product: Product = {
      id: `new_${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price) || 0,
      stock: parseInt(newProduct.stock) || 0,
      category: newProduct.category,
      isActive: true,
    };

    setProducts([product, ...products]);
    setShowAddModal(false);
    setNewProduct({ name: "", description: "", price: "", stock: "", category: "Hygiene", imageUri: "" });
  };

  const handleToggleActive = (productId: string) => {
    setProducts(products.map((p) => 
      p.id === productId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handleDeleteProduct = (productId: string) => {
    const confirmDelete = () => {
      setProducts(products.filter((p) => p.id !== productId));
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this product?")) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Delete Product",
        "Are you sure you want to delete this product?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <GlassCard style={[styles.productCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.productHeader}>
        <View style={styles.productImagePlaceholder}>
          <Feather name="package" size={24} color={KeziColors.maternal.teal600} />
        </View>
        <View style={styles.productInfo}>
          <ThemedText style={styles.productName}>{item.name}</ThemedText>
          <ThemedText style={styles.productCategory}>{item.category}</ThemedText>
        </View>
        <Pressable 
          style={styles.menuButton}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Feather name="trash-2" size={18} color={KeziColors.gray[400]} />
        </Pressable>
      </View>

      <ThemedText style={styles.productDescription} numberOfLines={2}>
        {item.description}
      </ThemedText>

      <View style={styles.productFooter}>
        <ThemedText style={styles.productPrice}>{formatCurrency(item.price)}</ThemedText>
        <View style={styles.stockContainer}>
          <View style={[styles.stockDot, { backgroundColor: getStockColor(item.stock) }]} />
          <ThemedText style={styles.stockText}>
            {item.stock === 0 ? "Out of stock" : `${item.stock} in stock`}
          </ThemedText>
        </View>
      </View>

      <View style={styles.productActions}>
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
            {item.isActive ? "Hide" : "Show"}
          </ThemedText>
        </Pressable>
      </View>
    </GlassCard>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[100] }]}>
          <Feather name="search" size={20} color={KeziColors.gray[400]} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
            placeholder="Search products..."
            placeholderTextColor={KeziColors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
                { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[100] }
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <ThemedText
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive
                ]}
              >
                {item}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={[styles.productsList, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Feather name="package" size={48} color={KeziColors.gray[400]} />
            <ThemedText style={styles.emptyTitle}>No products found</ThemedText>
            <ThemedText style={styles.emptyText}>
              {searchQuery ? "Try a different search term" : "Add your first product to get started"}
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
              <ThemedText style={styles.modalTitle}>{t("merchant.addProduct")}</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={KeziColors.gray[400]} />
              </Pressable>
            </View>

            {Platform.OS === "web" ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Pressable style={styles.imagePicker} onPress={handlePickImage}>
                  {newProduct.imageUri ? (
                    <Image
                      source={{ uri: newProduct.imageUri }}
                      style={styles.productImagePreview}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.imagePickerPlaceholder, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100] }]}>
                      <Feather name="camera" size={32} color={KeziColors.maternal.teal600} />
                      <ThemedText style={styles.imagePickerText}>{t("merchant.addPhoto")}</ThemedText>
                      <ThemedText style={styles.imagePickerHint}>{t("common.optional")}</ThemedText>
                    </View>
                  )}
                </Pressable>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Product Name</ThemedText>
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                        color: isDark ? "#FFFFFF" : "#000000"
                      }
                    ]}
                    placeholder="Enter product name"
                    placeholderTextColor={KeziColors.gray[400]}
                    value={newProduct.name}
                    onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Description</ThemedText>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.textArea,
                      { 
                        backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                        color: isDark ? "#FFFFFF" : "#000000"
                      }
                    ]}
                    placeholder="Enter product description"
                    placeholderTextColor={KeziColors.gray[400]}
                    value={newProduct.description}
                    onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <ThemedText style={styles.label}>Price (RWF)</ThemedText>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                          color: isDark ? "#FFFFFF" : "#000000"
                        }
                      ]}
                      placeholder="0"
                      placeholderTextColor={KeziColors.gray[400]}
                      value={newProduct.price}
                      onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ width: Spacing.md }} />
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <ThemedText style={styles.label}>Stock</ThemedText>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                          color: isDark ? "#FFFFFF" : "#000000"
                        }
                      ]}
                      placeholder="0"
                      placeholderTextColor={KeziColors.gray[400]}
                      value={newProduct.stock}
                      onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Category</ThemedText>
                  <View style={styles.categorySelect}>
                    {CATEGORIES.filter((c) => c !== "All").map((category) => (
                      <Pressable
                        key={category}
                        style={[
                          styles.categoryOption,
                          newProduct.category === category && styles.categoryOptionActive,
                        ]}
                        onPress={() => setNewProduct({ ...newProduct, category })}
                      >
                        <ThemedText
                          style={[
                            styles.categoryOptionText,
                            newProduct.category === category && styles.categoryOptionTextActive,
                          ]}
                        >
                          {category}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Button onPress={handleAddProduct} style={styles.submitButton}>
                  {t("merchant.addProduct")}
                </Button>
              </ScrollView>
            ) : (
              <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                <Pressable style={styles.imagePicker} onPress={handlePickImage}>
                  {newProduct.imageUri ? (
                    <Image
                      source={{ uri: newProduct.imageUri }}
                      style={styles.productImagePreview}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.imagePickerPlaceholder, { backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100] }]}>
                      <Feather name="camera" size={32} color={KeziColors.maternal.teal600} />
                      <ThemedText style={styles.imagePickerText}>{t("merchant.addPhoto")}</ThemedText>
                      <ThemedText style={styles.imagePickerHint}>{t("common.optional")}</ThemedText>
                    </View>
                  )}
                </Pressable>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Product Name</ThemedText>
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                        color: isDark ? "#FFFFFF" : "#000000"
                      }
                    ]}
                    placeholder="Enter product name"
                    placeholderTextColor={KeziColors.gray[400]}
                    value={newProduct.name}
                    onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Description</ThemedText>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.textArea,
                      { 
                        backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                        color: isDark ? "#FFFFFF" : "#000000"
                      }
                    ]}
                    placeholder="Enter product description"
                    placeholderTextColor={KeziColors.gray[400]}
                    value={newProduct.description}
                    onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <ThemedText style={styles.label}>Price (RWF)</ThemedText>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                          color: isDark ? "#FFFFFF" : "#000000"
                        }
                      ]}
                      placeholder="0"
                      placeholderTextColor={KeziColors.gray[400]}
                      value={newProduct.price}
                      onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ width: Spacing.md }} />
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <ThemedText style={styles.label}>Stock</ThemedText>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                          color: isDark ? "#FFFFFF" : "#000000"
                        }
                      ]}
                      placeholder="0"
                      placeholderTextColor={KeziColors.gray[400]}
                      value={newProduct.stock}
                      onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Category</ThemedText>
                  <View style={styles.categorySelect}>
                    {CATEGORIES.filter((c) => c !== "All").map((category) => (
                      <Pressable
                        key={category}
                        style={[
                          styles.categoryOption,
                          newProduct.category === category && styles.categoryOptionActive,
                        ]}
                        onPress={() => setNewProduct({ ...newProduct, category })}
                      >
                        <ThemedText
                          style={[
                            styles.categoryOptionText,
                            newProduct.category === category && styles.categoryOptionTextActive,
                          ]}
                        >
                          {category}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Button onPress={handleAddProduct} style={styles.submitButton}>
                  {t("merchant.addProduct")}
                </Button>
              </KeyboardAwareScrollView>
            )}
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
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchBox: {
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
  categoriesContainer: {
    marginBottom: Spacing.sm,
  },
  categoriesList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: KeziColors.maternal.teal600,
  },
  categoryChipText: {
    fontSize: 14,
    opacity: 0.7,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    opacity: 1,
  },
  productsList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  productCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: KeziColors.maternal.teal100,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
  },
  productCategory: {
    fontSize: 12,
    opacity: 0.6,
  },
  menuButton: {
    padding: Spacing.xs,
  },
  productDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: KeziColors.maternal.teal600,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 12,
    opacity: 0.7,
  },
  productActions: {
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
    fontSize: 18,
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
    elevation: 10,
    zIndex: 100,
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
    maxHeight: "85%",
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categorySelect: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: KeziColors.gray[200],
  },
  categoryOptionActive: {
    backgroundColor: KeziColors.maternal.teal600,
  },
  categoryOptionText: {
    fontSize: 14,
    color: KeziColors.gray[600],
  },
  categoryOptionTextActive: {
    color: "#FFFFFF",
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  imagePicker: {
    marginBottom: Spacing.md,
  },
  imagePickerPlaceholder: {
    height: 120,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: KeziColors.maternal.teal300,
    gap: Spacing.xs,
  },
  imagePickerText: {
    fontSize: 14,
    color: KeziColors.maternal.teal600,
    fontWeight: "500",
  },
  imagePickerHint: {
    fontSize: 12,
    opacity: 0.6,
  },
  productImagePreview: {
    height: 120,
    borderRadius: BorderRadius.lg,
    width: "100%",
  },
});
