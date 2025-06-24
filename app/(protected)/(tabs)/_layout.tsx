import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function TabsLayout() {
	const { colorScheme } = useColorScheme();

	const bgColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;
	const borderColor =
		colorScheme === "dark" ? colors.dark.border : colors.light.border;
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;
	const mutedTextColor =
		colorScheme === "dark"
			? colors.dark.mutedForeground
			: colors.light.mutedForeground;

	const createTabBarIcon = (iconName: any, focused: boolean, color: string) => {
		return (
			<View className="items-center justify-center pt-0.5">
				<Ionicons
					name={focused ? iconName : `${iconName}-outline`}
					size={20}
					color={color}
				/>
			</View>
		);
	};

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: bgColor,
					borderTopColor: borderColor,
					borderTopWidth: 0.5,
					height: 85,
					paddingBottom: 20,
					paddingTop: 6,
					marginTop: -34,
				},
				tabBarActiveTintColor: textColor,
				tabBarInactiveTintColor: mutedTextColor,
				tabBarShowLabel: true,
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: "500",
					marginTop: 0,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, focused }) =>
						createTabBarIcon("home", focused, color),
				}}
			/>
			<Tabs.Screen
				name="marketplace"
				options={{
					title: "Market",
					tabBarIcon: ({ color, focused }) =>
						createTabBarIcon("basket", focused, color),
				}}
			/>
			<Tabs.Screen
				name="messages"
				options={{
					title: "Messages",
					tabBarIcon: ({ color, focused }) =>
						createTabBarIcon("chatbubbles", focused, color),
				}}
			/>
			<Tabs.Screen
				name="community"
				options={{
					title: "Forum",
					tabBarIcon: ({ color, focused }) =>
						createTabBarIcon("globe", focused, color),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Account",
					tabBarIcon: ({ color, focused }) =>
						createTabBarIcon("person", focused, color),
				}}
			/>
		</Tabs>
	);
}