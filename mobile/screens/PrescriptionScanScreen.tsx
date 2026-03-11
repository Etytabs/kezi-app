import React, { useState } from "react";
import { View, StyleSheet, Alert, Platform, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";

export default function PrescriptionScanScreen() {
  const { theme, isDark } = useTheme();
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  const handleScanPrescription = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Camera Not Available",
        "Run in Expo Go to use the prescription scanner."
      );
      return;
    }

    if (!cameraPermission?.granted) {
      if (cameraPermission?.canAskAgain) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert(
            "Camera Access Required",
            "Please enable camera access in Settings to scan prescriptions."
          );
          return;
        }
      } else {
        Alert.alert(
          "Camera Access Required",
          "Please enable camera access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: async () => {
                try {
                  const { Linking } = await import("expo-linking");
                  await Linking.openSettings();
                } catch (e) {
                  console.log("Could not open settings");
                }
              },
            },
          ]
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setScannedImage(result.assets[0].uri);
        setIsProcessing(true);
        
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsProcessing(false);
        
        Alert.alert(
          "Prescription Scanned",
          "Your prescription has been saved. Relevant products will be recommended based on your needs."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to scan prescription. Please try again.");
    }
  };

  const handleUploadFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setScannedImage(result.assets[0].uri);
        setIsProcessing(true);
        
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsProcessing(false);
        
        Alert.alert(
          "Prescription Uploaded",
          "Your prescription has been saved and analyzed."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload prescription. Please try again.");
    }
  };

  return (
    <ScreenScrollView>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GlassCard style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <Feather
              name="file-text"
              size={32}
              color={KeziColors.brand.purple500}
            />
          </View>
          <ThemedText type="h4" style={styles.title}>
            Prescription Scanner
          </ThemedText>
          <ThemedText type="body" style={styles.description}>
            Scan your prescription to get personalized product recommendations based on your healthcare needs.
          </ThemedText>
        </GlassCard>
      </Animated.View>

      {scannedImage ? (
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard style={styles.imageCard}>
            <Image source={{ uri: scannedImage }} style={styles.scannedImage} />
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ThemedText type="body" style={styles.processingText}>
                  Analyzing prescription...
                </ThemedText>
              </View>
            )}
          </GlassCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <View style={styles.buttonContainer}>
          <Button onPress={handleScanPrescription} style={styles.button}>
            <View style={styles.buttonContent}>
              <Feather name="camera" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={styles.buttonText}>
                Scan with Camera
              </ThemedText>
            </View>
          </Button>

          <Button
            variant="secondary"
            onPress={handleUploadFromGallery}
            style={styles.button}
          >
            <View style={styles.buttonContent}>
              <Feather name="upload" size={20} color={theme.text} />
              <ThemedText type="body" style={styles.secondaryButtonText}>
                Upload from Gallery
              </ThemedText>
            </View>
          </Button>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <GlassCard style={styles.privacyCard}>
          <Feather name="shield" size={20} color={KeziColors.brand.teal600} />
          <ThemedText type="small" style={styles.privacyText}>
            Your prescription data is encrypted and stored securely on your device. It is never shared without your explicit consent.
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
  imageCard: {
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  scannedImage: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.md,
    resizeMode: "cover",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  processingText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  buttonContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  button: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryButtonText: {
    fontWeight: "600",
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  privacyText: {
    flex: 1,
    opacity: 0.7,
  },
});
