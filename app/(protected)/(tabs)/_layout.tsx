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

	// Helper function to create a tab bar icon with proper spacing
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
	
	// Create a special tab bar icon for the create button
	const createCenterTabBarIcon = (iconName: any, focused: boolean, color: string) => {
		return (
			<View className="items-center justify-center rounded-full bg-[#64AD64] w-16 h-16">
				<Ionicons
					name={iconName}
					size={28}
					color="#FFFFFF"
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
					height: 85, // Further increased height for better spacing
					paddingBottom: 20, // Increased bottom padding to clear the navigation handle completely
					paddingTop: 6, // Keep top padding the same
					marginTop: -34,
				},
				tabBarActiveTintColor: textColor,
				tabBarInactiveTintColor: mutedTextColor,
				tabBarShowLabel: true,
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: "500",
					marginTop: 0, // Reduced marginTop to prevent cutoff and better position labels
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
				name="create-product"
				options={{
					title: "Create",
					tabBarIcon: ({ focused }) => createCenterTabBarIcon("add", focused, "#FFFFFF"),
					tabBarItemStyle: {
						marginTop: -10, // Lift the button slightly higher than other tabs
					},
					tabBarLabel: () => null, // This completely removes the label component
				}}
			/>
			<Tabs.Screen
				name="cart"
				options={{
					title: "Cart",
					tabBarIcon: ({ color, focused }) =>
						createTabBarIcon("cart", focused, color),
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
