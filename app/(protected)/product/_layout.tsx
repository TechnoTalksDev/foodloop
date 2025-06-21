import React from "react";
import { Stack } from "expo-router";

import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function ProductLayout() {
  const { colorScheme } = useColorScheme();
  
  const bgColor = colorScheme === "dark" ? colors.dark.background : colors.light.background;
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: bgColor }
      }}
    >
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
