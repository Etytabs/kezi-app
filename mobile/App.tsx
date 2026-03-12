import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { navigationRef } from "./services/navigation";
import { checkApiHealth } from "./services/api";

import MainTabNavigator from "./navigation/MainTabNavigator";
import MerchantTabNavigator from "./navigation/MerchantTabNavigator";
import AdminTabNavigator from "./navigation/AdminTabNavigator";
import AuthNavigator from "./navigation/AuthNavigator";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { BrandedSplashScreen } from "./components/BrandedSplashScreen";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { DiscreetModeProvider } from "./context/DiscreetModeContext";
import { ProfileProvider } from "./context/ProfileContext";
import { ThemeProvider } from "./context/ThemeContext";

function getNavigatorForRole(role?: string) {
  switch (role) {
    case "merchant":
      return <MerchantTabNavigator />;
    case "admin":
      return <AdminTabNavigator />;
    default:
      return <MainTabNavigator />;
  }
}

function AppContent() {

  const { isLoading, isAuthenticated, user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  /* TEST CONNECTION BACKEND */

  useEffect(() => {

    async function testBackend() {
      try {
        const ok = await checkApiHealth();
        console.log("✅ Backend connection:", ok);
      } catch (err) {
        console.log("❌ Backend unreachable");
      }
    }

    testBackend();

  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (isLoading || showSplash) {
    return <BrandedSplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? getNavigatorForRole(user?.role) : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <ThemeProvider>
              <LanguageProvider>
                <DiscreetModeProvider>
                  <AuthProvider>
                    <ProfileProvider>
                      <AppContent />
                    </ProfileProvider>
                  </AuthProvider>
                </DiscreetModeProvider>
              </LanguageProvider>
              <StatusBar style="auto" />
            </ThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});