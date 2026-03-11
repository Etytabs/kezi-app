import { Platform, Alert } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { storage } from "./storage";

export type BiometricType = "Face ID" | "Touch ID" | "Biometric" | null;

interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  isEnabled: boolean;
}

export const biometricAuth = {
  async getCapabilities(): Promise<BiometricCapabilities> {
    if (Platform.OS === "web") {
      return {
        hasHardware: false,
        isEnrolled: false,
        biometricType: null,
        isEnabled: false,
      };
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const isEnabled = await storage.isBiometricEnabled();

    let biometricType: BiometricType = null;

    if (hasHardware && isEnrolled) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = "Face ID";
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = "Touch ID";
      } else {
        biometricType = "Biometric";
      }
    }

    return {
      hasHardware,
      isEnrolled,
      biometricType,
      isEnabled,
    };
  },

  async isAvailable(): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    return capabilities.hasHardware && capabilities.isEnrolled && capabilities.isEnabled;
  },

  async authenticate(
    promptMessage: string = "Authenticate to continue",
    options?: { fallbackToPin?: boolean }
  ): Promise<BiometricAuthResult> {
    if (Platform.OS === "web") {
      return { success: true };
    }

    const capabilities = await this.getCapabilities();

    if (!capabilities.hasHardware || !capabilities.isEnrolled) {
      return { success: true };
    }

    if (!capabilities.isEnabled) {
      return { success: true };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        disableDeviceFallback: !options?.fallbackToPin,
        cancelLabel: "Cancel",
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true };
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return {
          success: false,
          error: result.error || "Authentication cancelled",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Authentication failed",
      };
    }
  },

  async authenticateForProfileSwitch(profileName: string): Promise<boolean> {
    const result = await this.authenticate(
      `Authenticate to access ${profileName}'s data`
    );
    return result.success;
  },

  async authenticateForSensitiveData(dataType: string): Promise<boolean> {
    const result = await this.authenticate(
      `Authenticate to view ${dataType}`
    );
    return result.success;
  },

  async enableBiometric(): Promise<boolean> {
    const capabilities = await this.getCapabilities();

    if (!capabilities.hasHardware) {
      Alert.alert(
        "Not Available",
        "Biometric authentication is not available on this device."
      );
      return false;
    }

    if (!capabilities.isEnrolled) {
      Alert.alert(
        "Not Enrolled",
        `Please set up ${capabilities.biometricType || "biometric authentication"} in your device settings first.`
      );
      return false;
    }

    const result = await this.authenticate(
      `Enable ${capabilities.biometricType || "biometric"} authentication`
    );

    if (result.success) {
      await storage.setBiometricEnabled(true);
      return true;
    }

    return false;
  },

  async disableBiometric(): Promise<boolean> {
    const result = await this.authenticate(
      "Authenticate to disable biometric lock"
    );

    if (result.success) {
      await storage.setBiometricEnabled(false);
      return true;
    }

    return false;
  },
};
