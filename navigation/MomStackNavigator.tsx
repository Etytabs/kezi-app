import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MaternalScreen from "@/screens/MaternalScreen";
import PregnancyTrackerScreen from "@/screens/PregnancyTrackerScreen";
import PostpartumScreen from "@/screens/PostpartumScreen";
import { BackButton } from "@/components/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type MomStackParamList = {
  Maternal: undefined;
  PregnancyTracker: undefined;
  Postpartum: undefined;
};

const Stack = createNativeStackNavigator<MomStackParamList>();

export default function MomStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Maternal"
        component={MaternalScreen}
        options={{
          title: "Mom",
        }}
      />
      <Stack.Screen
        name="PregnancyTracker"
        component={PregnancyTrackerScreen}
        options={{
          title: "Pregnancy Tracker",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="Postpartum"
        component={PostpartumScreen}
        options={{
          title: "Postpartum Care",
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack.Navigator>
  );
}
