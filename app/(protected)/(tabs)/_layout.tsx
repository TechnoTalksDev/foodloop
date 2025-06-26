// app/(protected)/(tabs)/_layout.tsx - UPDATED VERSION

import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function TabsLayout() {
	const { colorScheme } = useColorScheme();

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
			<View className="items-center justify-center">
				<Ionicons
					name={focused ? iconName : `${iconName}-outline`}
					size={24}
					color={color}
				/>
			</View>
		);
	};

	const CustomTabBar = ({ state, descriptors, navigation }: any) => {
		return (
			<View style={styles.tabBarContainer}>
				<BlurView
					intensity={80}
					tint={colorScheme === "dark" ? "dark" : "light"}
					style={styles.blurView}
					experimentalBlurMethod="dimezisBlurView"
				>
					<View style={[styles.tabBar, { borderTopColor: borderColor }]}>
						{state.routes.map((route: any, index: number) => {
							const { options } = descriptors[route.key];
							const isFocused = state.index === index;

							const onPress = () => {
								const event = navigation.emit({
									type: "tabPress",
									target: route.key,
									canPreventDefault: true,
								});

								if (!isFocused && !event.defaultPrevented) {
									navigation.navigate(route.name);
								}
							};

							return (
								<TouchableOpacity
									key={route.key}
									accessibilityRole="button"
									accessibilityState={isFocused ? { selected: true } : {}}
									accessibilityLabel={options.tabBarAccessibilityLabel}
									testID={options.tabBarTestID}
									onPress={onPress}
									style={styles.tabButton}
								>
									{options.tabBarIcon({
										focused: isFocused,
										color: isFocused ? textColor : mutedTextColor,
									})}
								</TouchableOpacity>
							);
						})}
					</View>
				</BlurView>
			</View>
		);
	};

	return (
		<Tabs
			tabBar={(props) => <CustomTabBar {...props} />}
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: textColor,
				tabBarInactiveTintColor: mutedTextColor,
				tabBarShowLabel: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Garden",
					tabBarIcon: ({ color, focused }) =>
						createTabBarIcon("home", focused, color),
				}}
			/>
			<Tabs.Screen
				name="plants"
				options={{
					title: "Plants",
					tabBarIcon: ({ color, focused }) =>
						createTabBarIcon("leaf", focused, color),
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

const styles = StyleSheet.create({
	tabBarContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
	},
	blurView: {
		overflow: "hidden",
	},
	tabBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		height: 84,
		paddingBottom: 24,
		paddingTop: 8,
		borderTopWidth: 0.5,
	},
	tabButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 8,
	},
});