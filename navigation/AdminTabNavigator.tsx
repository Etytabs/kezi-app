import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { KeziColors, BorderRadius } from "@/constants/theme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import AdminUsersScreen from "@/screens/admin/AdminUsersScreen";
import AdminMerchantsScreen from "@/screens/admin/AdminMerchantsScreen";
import AdminAnalyticsScreen from "@/screens/admin/AdminAnalyticsScreen";
import AdminSettingsScreen from "@/screens/admin/AdminSettingsScreen";

export type AdminTabParamList = {
  DashboardTab: undefined;
  UsersTab: undefined;
  MerchantsTab: undefined;
  AnalyticsTab: undefined;
  SettingsTab: undefined;
};

export type AdminDashboardStackParamList = {
  Dashboard: undefined;
};

export type AdminUsersStackParamList = {
  Users: undefined;
  UserDetail: { userId: string };
};

export type AdminMerchantsStackParamList = {
  Merchants: undefined;
  MerchantDetail: { merchantId: string };
  VerificationQueue: undefined;
};

export type AdminAnalyticsStackParamList = {
  Analytics: undefined;
  ExportData: undefined;
  AuditLogs: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const DashboardStack = createNativeStackNavigator<AdminDashboardStackParamList>();
const UsersStack = createNativeStackNavigator<AdminUsersStackParamList>();
const MerchantsStack = createNativeStackNavigator<AdminMerchantsStackParamList>();
const AnalyticsStack = createNativeStackNavigator<AdminAnalyticsStackParamList>();

interface TabIconProps {
  name: React.ComponentProps<typeof Feather>["name"];
  color: string;
  focused: boolean;
}

function TabIcon({ name, color, focused }: TabIconProps) {
  const { isDark } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(focused ? -2 : 0, {
            damping: 15,
            stiffness: 150,
          }),
        },
        {
          scale: withSpring(focused ? 1.1 : 1, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withSpring(
        focused
          ? isDark
            ? KeziColors.night.deep
            : KeziColors.brand.purple100
          : "transparent",
        { damping: 15, stiffness: 150 }
      ),
    };
  });

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        containerStyle,
        animatedStyle,
      ]}
    >
      <Feather
        name={name}
        size={22}
        color={color}
        strokeWidth={focused ? 2.5 : 2}
      />
    </Animated.View>
  );
}

function DashboardStackNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });
  return (
    <DashboardStack.Navigator screenOptions={commonOptions}>
      <DashboardStack.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ title: "Admin Dashboard" }}
      />
    </DashboardStack.Navigator>
  );
}

function UsersStackNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });
  return (
    <UsersStack.Navigator screenOptions={commonOptions}>
      <UsersStack.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{ title: "Users" }}
      />
    </UsersStack.Navigator>
  );
}

function MerchantsStackNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });
  return (
    <MerchantsStack.Navigator screenOptions={commonOptions}>
      <MerchantsStack.Screen
        name="Merchants"
        component={AdminMerchantsScreen}
        options={{ title: "Merchants" }}
      />
    </MerchantsStack.Navigator>
  );
}

function AnalyticsStackNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });
  return (
    <AnalyticsStack.Navigator screenOptions={commonOptions}>
      <AnalyticsStack.Screen
        name="Analytics"
        component={AdminAnalyticsScreen}
        options={{ title: "Analytics" }}
      />
    </AnalyticsStack.Navigator>
  );
}

export default function AdminTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        tabBarActiveTintColor: KeziColors.brand.purple600,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: isDark ? KeziColors.night.deep : "#FFFFFF",
          }),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : KeziColors.gray[100],
          elevation: 0,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="UsersTab"
        component={UsersStackNavigator}
        options={{
          title: "Users",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="users" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MerchantsTab"
        component={MerchantsStackNavigator}
        options={{
          title: "Merchants",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="briefcase" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStackNavigator}
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bar-chart-2" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={AdminSettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
});
