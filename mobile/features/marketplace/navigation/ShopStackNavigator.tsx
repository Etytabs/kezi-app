import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ShopScreen from "@/features/marketplace/screens/ShopScreen";
import ProductDetailScreen from "@/features/marketplace/screens/ProductDetailScreen";
import MerchantDetailScreen from "@/features/merchants/screens/MerchantDetailScreen";
import MerchantDiscoveryScreen from "@/features/merchants/screens/MerchantDiscoveryScreen";
import MaternalScreen from "@/features/maternal/screens/MaternalScreen";
import { BackButton } from "@/components/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ShopStackParamList = {
  Shop: undefined;
  ProductDetail: { productId: string };
  MerchantDetail: { merchantId: string };
  MerchantDiscovery: undefined;
  Maternal: undefined;
};

const Stack = createNativeStackNavigator<ShopStackParamList>();

export default function ShopStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: "Marketplace",
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: "Product",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="MerchantDetail"
        component={MerchantDetailScreen}
        options={{
          title: "Store",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="MerchantDiscovery"
        component={MerchantDiscoveryScreen}
        options={{
          title: "Nearby Merchants",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="Maternal"
        component={MaternalScreen}
        options={{
          title: "Maternal Care",
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack.Navigator>
  );
}
