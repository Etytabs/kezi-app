import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import AdminDashboard from "@/screens/AdminDashboard";
import ManageProfilesScreen from "@/screens/ManageProfilesScreen";
import ExportDataScreen from "@/screens/ExportDataScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import PrescriptionScanScreen from "@/screens/PrescriptionScanScreen";
import WishlistScreen from "@/screens/WishlistScreen";
import PrivacyPolicyScreen from "@/screens/PrivacyPolicyScreen";
import HealthIntegrationScreen from "@/screens/HealthIntegrationScreen";
import HealthDashboardScreen from "@/screens/HealthDashboardScreen";
import { BackButton } from "@/components/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Admin: undefined;
  ManageProfiles: undefined;
  ExportData: undefined;
  NotificationSettings: undefined;
  PrescriptionScan: undefined;
  Wishlist: undefined;
  PrivacyPolicy: undefined;
  HealthIntegration: undefined;
  HealthDashboard: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminDashboard}
        options={{
          title: "Admin Dashboard",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ManageProfiles"
        component={ManageProfilesScreen}
        options={{
          title: "Manage Profiles",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="ExportData"
        component={ExportDataScreen}
        options={{
          title: "Export Data",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: "Notifications",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="PrescriptionScan"
        component={PrescriptionScanScreen}
        options={{
          title: "Scan Prescription",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          title: "Wishlist",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          title: "Privacy & Security",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="HealthIntegration"
        component={HealthIntegrationScreen}
        options={{
          title: "Health Integration",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="HealthDashboard"
        component={HealthDashboardScreen}
        options={{
          title: "Health Dashboard",
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack.Navigator>
  );
}
