import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import * as Linking from 'expo-linking';

interface AvatarPickerProps {
  currentAvatar?: string | null;
  onAvatarChange: (uri: string) => void;
  size?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AvatarPicker({
  currentAvatar,
  onAvatarChange,
  size = 100,
}: AvatarPickerProps) {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const scale = useSharedValue(1);

  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const showImageOptions = () => {
    Alert.alert(
      "Change Photo",
      "Choose how you'd like to update your photo",
      [
        {
          text: "Take Photo",
          onPress: handleTakePhoto,
        },
        {
          text: "Choose from Library",
          onPress: handleChooseFromLibrary,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Camera Not Available",
        "Run in Expo Go to use the camera feature."
      );
      return;
    }

    if (!cameraPermission?.granted) {
      if (cameraPermission?.canAskAgain) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert(
            "Camera Access Required",
            "Please enable camera access in Settings to take photos."
          );
          return;
        }
      } else {
        Alert.alert(
          "Camera Access Required",
          "Please enable camera access in Settings to take photos.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onAvatarChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    if (!mediaPermission?.granted) {
      if (mediaPermission?.canAskAgain) {
        const result = await requestMediaPermission();
        if (!result.granted) {
          Alert.alert(
            "Photo Library Access Required",
            "Please enable photo library access in Settings."
          );
          return;
        }
      } else {
        Alert.alert(
          "Photo Library Access Required",
          "Please enable photo library access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onAvatarChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select photo. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPressable
      onPress={showImageOptions}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      disabled={isLoading}
    >
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isDark
              ? KeziColors.night.deep
              : KeziColors.brand.pink100,
          },
        ]}
      >
        {currentAvatar ? (
          <Image
            source={{ uri: currentAvatar }}
            style={[
              styles.avatar,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            placeholder={require("../assets/images/avatar-placeholder.png")}
            transition={300}
          />
        ) : (
          <Feather
            name="user"
            size={size * 0.4}
            color={KeziColors.brand.pink500}
          />
        )}

        <View
          style={[
            styles.editBadge,
            {
              backgroundColor: KeziColors.brand.pink500,
              bottom: 0,
              right:.0,
            },
          ]}
        >
          <Feather name="camera" size={14} color="#FFFFFF" />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: {
    resizeMode: "cover",
  },
  editBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});