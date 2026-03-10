import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CycleScreen from "@/screens/CycleScreen";
import JournalScreen from "@/screens/JournalScreen";
import { BackButton } from "@/components/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type CycleStackParamList = {
  Cycle: undefined;
  Journal: undefined;
};

const Stack = createNativeStackNavigator<CycleStackParamList>();

export default function CycleStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Cycle"
        component={CycleScreen}
        options={{
          title: "Cycle Tracking",
        }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          title: "Wellness Journal",
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack.Navigator>
  );
}
