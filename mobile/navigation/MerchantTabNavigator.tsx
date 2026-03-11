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

import MerchantDashboardScreen from "@/screens/merchant/MerchantDashboardScreen";
import MerchantProductsScreen from "@/screens/merchant/MerchantProductsScreen";
import MerchantOrdersScreen from "@/screens/merchant/MerchantOrdersScreen";
import MerchantStoresScreen from "@/screens/merchant/MerchantStoresScreen";
import MerchantProfileScreen from "@/screens/merchant/MerchantProfileScreen";

export type MerchantTabParamList = {
  DashboardTab: undefined;
  ProductsTab: undefined;
  OrdersTab: undefined;
  StoresTab: undefined;
  ProfileTab: undefined;
};

export type MerchantDashboardStackParamList = {
  Dashboard: undefined;
};

export type MerchantProductsStackParamList = {
  Products: undefined;
  ProductDetail: { productId: string };
  AddProduct: undefined;
  EditProduct: { productId: string };
};

export type MerchantOrdersStackParamList = {
  Orders: undefined;
  OrderDetail: { orderId: string };
};

export type MerchantStoresStackParamList = {
  Stores: undefined;
  StoreDetail: { storeId: string };
  AddStore: undefined;
  EditStore: { storeId: string };
  StoreInventory: { storeId: string };
};

const Tab = createBottomTabNavigator<MerchantTabParamList>();
const DashboardStack = createNativeStackNavigator<MerchantDashboardStackParamList>();
const ProductsStack = createNativeStackNavigator<MerchantProductsStackParamList>();
const OrdersStack = createNativeStackNavigator<MerchantOrdersStackParamList>();
const StoresStack = createNativeStackNavigator<MerchantStoresStackParamList>();

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
            ? KeziColors.maternal.teal600
            : KeziColors.maternal.teal100
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
        component={MerchantDashboardScreen}
        options={{ title: "Dashboard" }}
      />
    </DashboardStack.Navigator>
  );
}

function ProductsStackNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });
  return (
    <ProductsStack.Navigator screenOptions={commonOptions}>
      <ProductsStack.Screen
        name="Products"
        component={MerchantProductsScreen}
        options={{ title: "My Products" }}
      />
    </ProductsStack.Navigator>
  );
}

function OrdersStackNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });
  return (
    <OrdersStack.Navigator screenOptions={commonOptions}>
      <OrdersStack.Screen
        name="Orders"
        component={MerchantOrdersScreen}
        options={{ title: "Orders" }}
      />
    </OrdersStack.Navigator>
  );
}

function StoresStackNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });
  return (
    <StoresStack.Navigator screenOptions={commonOptions}>
      <StoresStack.Screen
        name="Stores"
        component={MerchantStoresScreen}
        options={{ title: "My Stores" }}
      />
    </StoresStack.Navigator>
  );
}

export default function MerchantTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        tabBarActiveTintColor: KeziColors.maternal.teal600,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: isDark ? KeziColors.night.base : "#FFFFFF",
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
        name="ProductsTab"
        component={ProductsStackNavigator}
        options={{
          title: "Products",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="package" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="file-text" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="StoresTab"
        component={StoresStackNavigator}
        options={{
          title: "Stores",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="map-pin" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={MerchantProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} />
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
