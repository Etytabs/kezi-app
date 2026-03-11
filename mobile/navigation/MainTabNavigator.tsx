import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import CycleStackNavigator from "@/navigation/CycleStackNavigator";
import MomStackNavigator from "@/navigation/MomStackNavigator";
import ShopStackNavigator from "@/navigation/ShopStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { KeziColors, BorderRadius } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  CycleTab: undefined;
  MomTab: undefined;
  ShopTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

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
            : KeziColors.brand.purple50
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

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: KeziColors.brand.purple600,
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
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CycleTab"
        component={CycleStackNavigator}
        options={{
          title: "Cycle",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MomTab"
        component={MomStackNavigator}
        options={{
          title: "Mom",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="heart" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopStackNavigator}
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="shopping-bag" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Me",
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
