import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import {
  storage,
  Order,
  OrderItem,
  DeliveryAddress,
  PaymentMethod,
  OrderType,
} from "@/services/storage";
import { Product, Merchant } from "@/services/mockData";
import { Spacing, BorderRadius, KeziColors, Shadows } from "@/constants/theme";
import { formatRWF } from "@/utils/currency";

type CheckoutStep = "address" | "payment" | "confirmation";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  items: CartItem[];
  merchant: Merchant;
  orderType: OrderType;
  onOrderComplete: (order: Order) => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ComponentProps<typeof Feather>["name"]; description: string }[] = [
  { id: "mobile_money", label: "Mobile Money", icon: "smartphone", description: "Pay with MTN, Vodafone, or AirtelTigo" },
  { id: "card", label: "Debit/Credit Card", icon: "credit-card", description: "Visa, Mastercard accepted" },
  { id: "cash_on_delivery", label: "Cash on Delivery", icon: "dollar-sign", description: "Pay when you receive your order" },
];

const DELIVERY_FEE = 5.00;
const USD_TO_RWF = 1200;

const formatPrice = (usdAmount: number): string => {
  return formatRWF(usdAmount * USD_TO_RWF);
};

export function CheckoutModal({
  visible,
  onClose,
  items,
  merchant,
  orderType,
  onOrderComplete,
}: CheckoutModalProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [address, setAddress] = useState<DeliveryAddress>({
    street: "",
    city: "",
    region: "",
    landmark: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = orderType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const isAddressValid = address.street.trim() && address.city.trim() && address.phone.trim();

  const handleNext = () => {
    if (step === "address") {
      if (orderType === "delivery" && !isAddressValid) {
        Alert.alert("Missing Information", "Please fill in your delivery address and phone number.");
        return;
      }
      setStep("payment");
    } else if (step === "payment") {
      setStep("confirmation");
    }
  };

  const handleBack = () => {
    if (step === "payment") {
      setStep("address");
    } else if (step === "confirmation") {
      setStep("payment");
    }
  };

  const handlePlaceOrder = useCallback(async () => {
    if (!user) return;

    setIsProcessing(true);

    const orderItems: OrderItem[] = items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
    }));

    const now = new Date().toISOString();
    const order: Order = {
      id: Date.now().toString(),
      userId: user.id,
      merchantId: merchant.id,
      items: orderItems,
      orderType,
      paymentMethod,
      deliveryAddress: orderType === "delivery" ? address : undefined,
      subtotal,
      deliveryFee,
      total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const success = await storage.addOrder(order);

    setTimeout(() => {
      setIsProcessing(false);
      if (success) {
        onOrderComplete(order);
      } else {
        Alert.alert("Order Failed", "There was a problem saving your order. Please try again.");
      }
    }, 1500);
  }, [user, items, merchant, orderType, paymentMethod, address, subtotal, deliveryFee, total, onOrderComplete]);

  const renderAddressStep = () => (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIcon, { backgroundColor: KeziColors.brand.teal600 + "20" }]}>
          <Feather name="map-pin" size={20} color={KeziColors.brand.teal600} />
        </View>
        <ThemedText type="h4">
          {orderType === "delivery" ? "Delivery Address" : "Pickup Details"}
        </ThemedText>
      </View>

      {orderType === "delivery" ? (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.inputLabel}>Street Address *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50], color: theme.text }]}
              value={address.street}
              onChangeText={(text) => setAddress((prev) => ({ ...prev, street: text }))}
              placeholder="123 Main Street, Apt 4"
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText type="small" style={styles.inputLabel}>City *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50], color: theme.text }]}
                value={address.city}
                onChangeText={(text) => setAddress((prev) => ({ ...prev, city: text }))}
                placeholder="Kigali"
                placeholderTextColor={theme.placeholder}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText type="small" style={styles.inputLabel}>Region</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50], color: theme.text }]}
                value={address.region}
                onChangeText={(text) => setAddress((prev) => ({ ...prev, region: text }))}
                placeholder="Kigali City"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.inputLabel}>Landmark (Optional)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50], color: theme.text }]}
              value={address.landmark}
              onChangeText={(text) => setAddress((prev) => ({ ...prev, landmark: text }))}
              placeholder="Near the post office"
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.inputLabel}>Phone Number *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50], color: theme.text }]}
              value={address.phone}
              onChangeText={(text) => setAddress((prev) => ({ ...prev, phone: text }))}
              placeholder="+250 7XX XXX XXX"
              placeholderTextColor={theme.placeholder}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      ) : (
        <GlassCard style={styles.pickupCard}>
          <View style={styles.pickupRow}>
            <Feather name="home" size={20} color={KeziColors.brand.teal600} />
            <View style={styles.pickupInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>{merchant.name}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>{merchant.address}</ThemedText>
            </View>
          </View>
          <View style={[styles.pickupNote, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.brand.teal50 }]}>
            <Feather name="info" size={14} color={KeziColors.brand.teal600} />
            <ThemedText type="small" style={{ color: KeziColors.brand.teal600, flex: 1 }}>
              Your order will be ready for pickup in 30-45 minutes
            </ThemedText>
          </View>
        </GlassCard>
      )}
    </Animated.View>
  );

  const renderPaymentStep = () => (
    <Animated.View entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(200)} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIcon, { backgroundColor: KeziColors.brand.pink500 + "20" }]}>
          <Feather name="credit-card" size={20} color={KeziColors.brand.pink500} />
        </View>
        <ThemedText type="h4">Payment Method</ThemedText>
      </View>

      <View style={styles.paymentOptions}>
        {PAYMENT_METHODS.map((method) => (
          <Pressable
            key={method.id}
            onPress={() => setPaymentMethod(method.id)}
            style={({ pressed }) => [
              styles.paymentOption,
              {
                backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF",
                borderColor: paymentMethod === method.id ? KeziColors.brand.pink500 : isDark ? KeziColors.night.deep : KeziColors.gray[200],
                borderWidth: paymentMethod === method.id ? 2 : 1,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.paymentIcon, { backgroundColor: paymentMethod === method.id ? KeziColors.brand.pink500 + "20" : isDark ? KeziColors.night.deep : KeziColors.gray[100] }]}>
              <Feather name={method.icon} size={20} color={paymentMethod === method.id ? KeziColors.brand.pink500 : theme.textMuted} />
            </View>
            <View style={styles.paymentInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>{method.label}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>{method.description}</ThemedText>
            </View>
            <View style={[styles.radio, { borderColor: paymentMethod === method.id ? KeziColors.brand.pink500 : theme.textMuted }]}>
              {paymentMethod === method.id && <View style={[styles.radioInner, { backgroundColor: KeziColors.brand.pink500 }]} />}
            </View>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  const renderConfirmationStep = () => (
    <Animated.View entering={SlideInRight.duration(300)} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIcon, { backgroundColor: KeziColors.brand.purple500 + "20" }]}>
          <Feather name="check-circle" size={20} color={KeziColors.brand.purple500} />
        </View>
        <ThemedText type="h4">Review Order</ThemedText>
      </View>

      <GlassCard style={styles.summaryCard}>
        <ThemedText type="sectionHeader" style={styles.summaryTitle}>ORDER SUMMARY</ThemedText>
        {items.map((item) => (
          <View key={item.product.id} style={styles.summaryItem}>
            <View style={styles.itemInfo}>
              <ThemedText type="body">{item.product.name}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>Qty: {item.quantity}</ThemedText>
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>{formatPrice(item.product.price * item.quantity)}</ThemedText>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <ThemedText type="small" style={{ color: theme.textMuted }}>Subtotal</ThemedText>
          <ThemedText type="body">{formatPrice(subtotal)}</ThemedText>
        </View>

        {orderType === "delivery" && (
          <View style={styles.summaryRow}>
            <ThemedText type="small" style={{ color: theme.textMuted }}>Delivery Fee</ThemedText>
            <ThemedText type="body">{formatPrice(deliveryFee)}</ThemedText>
          </View>
        )}

        <View style={[styles.summaryRow, styles.totalRow]}>
          <ThemedText type="h4">Total</ThemedText>
          <ThemedText type="h3" style={{ color: KeziColors.brand.pink500 }}>{formatPrice(total)}</ThemedText>
        </View>
      </GlassCard>

      <View style={styles.confirmDetails}>
        <View style={styles.confirmRow}>
          <Feather name={orderType === "delivery" ? "truck" : "shopping-bag"} size={16} color={theme.textMuted} />
          <ThemedText type="small" style={{ color: theme.textMuted, textTransform: "capitalize" }}>{orderType}</ThemedText>
        </View>
        <View style={styles.confirmRow}>
          <Feather name="credit-card" size={16} color={theme.textMuted} />
          <ThemedText type="small" style={{ color: theme.textMuted }}>
            {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}
          </ThemedText>
        </View>
        {orderType === "delivery" && address.street && (
          <View style={styles.confirmRow}>
            <Feather name="map-pin" size={16} color={theme.textMuted} />
            <ThemedText type="small" style={{ color: theme.textMuted, flex: 1 }} numberOfLines={1}>
              {address.street}, {address.city}
            </ThemedText>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {(["address", "payment", "confirmation"] as CheckoutStep[]).map((s, index) => (
        <React.Fragment key={s}>
          <View
            style={[
              styles.stepDot,
              {
                backgroundColor:
                  step === s
                    ? KeziColors.brand.pink500
                    : ["address", "payment", "confirmation"].indexOf(step) > index
                    ? KeziColors.brand.teal600
                    : isDark
                    ? KeziColors.night.deep
                    : KeziColors.gray[200],
              },
            ]}
          >
            {["address", "payment", "confirmation"].indexOf(step) > index && (
              <Feather name="check" size={12} color="#FFFFFF" />
            )}
          </View>
          {index < 2 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor:
                    ["address", "payment", "confirmation"].indexOf(step) > index
                      ? KeziColors.brand.teal600
                      : isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[200],
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <View style={styles.overlay}>
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[
              styles.modal,
              {
                backgroundColor: isDark ? KeziColors.night.base : "#FFFFFF",
                paddingBottom: insets.bottom + Spacing.lg,
              },
            ]}
          >
            <View style={styles.header}>
              <Pressable onPress={step === "address" ? onClose : handleBack} style={styles.headerButton}>
                <Feather name={step === "address" ? "x" : "arrow-left"} size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4">Checkout</ThemedText>
              <View style={styles.headerButton} />
            </View>

            {renderStepIndicator()}

            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {step === "address" && renderAddressStep()}
              {step === "payment" && renderPaymentStep()}
              {step === "confirmation" && renderConfirmationStep()}
            </ScrollView>

            <View style={styles.footer}>
              {step === "confirmation" ? (
                <Button
                  onPress={handlePlaceOrder}
                  loading={isProcessing}
                  style={{ backgroundColor: KeziColors.brand.pink500 }}
                >
                  {isProcessing ? "Processing..." : `Place Order - ${formatPrice(total)}`}
                </Button>
              ) : (
                <Button onPress={handleNext}>
                  Continue
                </Button>
              )}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.sm,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: Spacing.xl,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    opacity: 0.7,
    marginLeft: Spacing.xs,
  },
  input: {
    height: 52,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  pickupCard: {
    marginTop: Spacing.md,
  },
  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  pickupInfo: {
    flex: 1,
  },
  pickupNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  paymentOptions: {
    gap: Spacing.md,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: {
    flex: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    marginBottom: Spacing.md,
    opacity: 0.6,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  totalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  confirmDetails: {
    gap: Spacing.sm,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
});
