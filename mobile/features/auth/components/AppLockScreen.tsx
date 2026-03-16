import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform, TextInput, Dimensions, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { KeziBrandIcon } from "@/components/KeziBrandIcon";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/services/storage";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

const SPACING_XXL = Spacing["2xl"];

const { width } = Dimensions.get("window");

interface AppLockScreenProps {
  onUnlock: () => void;
  visible: boolean;
}

const PIN_LENGTH = 4;

export function AppLockScreen({ onUnlock, visible }: AppLockScreenProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [biometricType, setBiometricType] = useState<string>("Biometric");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      checkBiometricSupport();
    }
  }, [visible]);

  const checkBiometricSupport = async () => {
    if (Platform.OS === "web") {
      setShowPinEntry(true);
      setBiometricAvailable(false);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const biometricEnabled = await storage.isBiometricEnabled();

    if (hasHardware && isEnrolled && biometricEnabled) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Touch ID");
      }
      setBiometricAvailable(true);
      attemptBiometricAuth();
    } else {
      setShowPinEntry(true);
      setBiometricAvailable(false);
    }
  };

  const attemptBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Kezi",
        disableDeviceFallback: true,
        cancelLabel: "Use PIN",
      });

      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onUnlock();
      } else {
        setShowPinEntry(true);
      }
    } catch (error) {
      setShowPinEntry(true);
    }
  };

  const handlePinPress = useCallback(async (digit: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newPin = pin + digit;
    setPin(newPin);
    setError("");

    if (newPin.length === PIN_LENGTH) {
      const savedPin = await storage.getAppPin();
      if (savedPin && newPin === savedPin) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onUnlock();
      } else if (!savedPin) {
        await storage.setAppPin(newPin);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onUnlock();
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        shakeX.value = withSequence(
          withSpring(-10, { damping: 2, stiffness: 500 }),
          withSpring(10, { damping: 2, stiffness: 500 }),
          withSpring(-10, { damping: 2, stiffness: 500 }),
          withSpring(0, { damping: 2, stiffness: 500 })
        );
        setError("Incorrect PIN");
        setPin("");
      }
    }
  }, [pin, onUnlock, shakeX]);

  const handleDelete = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPin((prev) => prev.slice(0, -1));
    setError("");
  }, []);

  const animatedPinStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  if (!visible) return null;

  const backgroundColor = isDark ? KeziColors.night.base : "#FFFFFF";

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, { backgroundColor }]}
    >
      <View style={[styles.content, { paddingTop: insets.top + SPACING_XXL }]}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[KeziColors.brand.pink500, KeziColors.brand.purple600]}
            style={styles.logoGradient}
          >
            <KeziBrandIcon size={48} />
          </LinearGradient>
          <ThemedText type="h2" style={styles.title}>
            Kezi
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {showPinEntry ? "Enter your PIN to unlock" : `Use ${biometricType} to unlock`}
          </ThemedText>
        </View>

        {showPinEntry ? (
          <View style={styles.pinSection}>
            <Animated.View style={[styles.pinDots, animatedPinStyle]}>
              {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    {
                      backgroundColor:
                        index < pin.length
                          ? KeziColors.brand.pink500
                          : isDark
                            ? KeziColors.night.surface
                            : KeziColors.gray[200],
                    },
                  ]}
                />
              ))}
            </Animated.View>

            {error ? (
              <ThemedText style={styles.error}>{error}</ThemedText>
            ) : null}

            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <Pressable
                  key={digit}
                  onPress={() => handlePinPress(digit.toString())}
                  style={({ pressed }) => [
                    styles.keypadButton,
                    {
                      backgroundColor: pressed
                        ? isDark
                          ? KeziColors.night.deep
                          : KeziColors.gray[100]
                        : isDark
                          ? KeziColors.night.surface
                          : KeziColors.gray[50],
                    },
                  ]}
                >
                  <ThemedText style={styles.keypadText}>{digit}</ThemedText>
                </Pressable>
              ))}
              {biometricAvailable ? (
                <Pressable
                  onPress={attemptBiometricAuth}
                  style={({ pressed }) => [
                    styles.keypadButton,
                    {
                      backgroundColor: pressed
                        ? isDark
                          ? KeziColors.night.deep
                          : KeziColors.gray[100]
                        : "transparent",
                    },
                  ]}
                >
                  <Feather
                    name={biometricType === "Face ID" ? "smile" : "smartphone"}
                    size={24}
                    color={KeziColors.brand.pink500}
                  />
                </Pressable>
              ) : (
                <View style={styles.keypadButton} />
              )}
              <Pressable
                onPress={() => handlePinPress("0")}
                style={({ pressed }) => [
                  styles.keypadButton,
                  {
                    backgroundColor: pressed
                      ? isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[100]
                      : isDark
                        ? KeziColors.night.surface
                        : KeziColors.gray[50],
                  },
                ]}
              >
                <ThemedText style={styles.keypadText}>0</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.keypadButton,
                  {
                    backgroundColor: pressed
                      ? isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[100]
                      : "transparent",
                  },
                ]}
              >
                <Feather
                  name="delete"
                  size={24}
                  color={isDark ? KeziColors.gray[400] : KeziColors.gray[600]}
                />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.biometricSection}>
            <Pressable
              onPress={attemptBiometricAuth}
              style={({ pressed }) => [
                styles.biometricButton,
                {
                  backgroundColor: pressed
                    ? isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[100]
                    : isDark
                      ? KeziColors.night.surface
                      : KeziColors.gray[50],
                },
              ]}
            >
              <Feather
                name={biometricType === "Face ID" ? "smile" : "smartphone"}
                size={48}
                color={KeziColors.brand.pink500}
              />
              <ThemedText style={styles.biometricText}>
                Tap to use {biometricType}
              </ThemedText>
            </Pressable>

            <Pressable onPress={() => setShowPinEntry(true)}>
              <ThemedText style={styles.usePinLink}>Use PIN instead</ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING_XXL,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.6,
    textAlign: "center",
  },
  pinSection: {
    alignItems: "center",
  },
  pinDots: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  error: {
    color: KeziColors.brand.pink500,
    marginBottom: Spacing.md,
    fontSize: 14,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: Math.min(width - 80, 280),
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadText: {
    fontSize: 28,
    fontWeight: "500",
  },
  biometricSection: {
    alignItems: "center",
    marginTop: SPACING_XXL,
  },
  biometricButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  biometricText: {
    marginTop: Spacing.md,
    fontSize: 14,
    opacity: 0.7,
  },
  usePinLink: {
    color: KeziColors.brand.pink500,
    fontSize: 14,
    marginTop: Spacing.lg,
  },
});
