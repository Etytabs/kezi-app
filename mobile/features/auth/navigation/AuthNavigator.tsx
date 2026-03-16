import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import LandingScreen from "@/features/auth/screens/LandingScreen";
import LoginScreen from "@/features/auth/screens/LoginScreen";
import OnboardingScreen from "@/features/auth/screens/OnboardingScreen";
import VerificationScreen from "@/features/auth/screens/VerificationScreen";
import { useTheme } from "@/features/settings/hooks/useTheme";
import { storage } from "@/services/storage";
import { KeziColors } from "@/design/colors";

export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Onboarding: undefined;
  Verification: {
    email: string;
    verificationCode?: string;
    expiresAt?: string;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  const { theme, isDark } = useTheme();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await storage.isOnboardingComplete();
      setHasCompletedOnboarding(completed);
    } catch (error) {
      setHasCompletedOnboarding(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  if (isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={KeziColors.brand.pink500} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={hasCompletedOnboarding ? "Landing" : "Onboarding"}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.backgroundRoot,
        },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          presentation: "modal",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{
          presentation: "modal",
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
