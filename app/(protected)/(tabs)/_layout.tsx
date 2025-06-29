// app/(protected)/(tabs)/_layout.tsx - PREMIUM VERSION

import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { BlurView } from "expo-blur";

import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function TabsLayout() {
	const { colorScheme } = useColorScheme();

	const isDark = colorScheme === "dark";
	const borderColor = isDark ? colors.dark.border : colors.light.border;
	const textColor = isDark ? colors.dark.foreground : colors.light.foreground;
	const mutedTextColor = isDark
		? colors.dark.mutedForeground
		: colors.light.mutedForeground;
	const backgroundColor = isDark
		? "rgba(18, 18, 18, 0.95)"
		: "rgba(255, 255, 255, 0.95)";
	const activeColor = isDark ? "#10B981" : "#059669";

	const createTabBarIcon = (iconName: any, focused: boolean, color: string) => {
		const scaleAnim = React.useRef(
			new Animated.Value(focused ? 1 : 0.9),
		).current;
		const opacityAnim = React.useRef(
			new Animated.Value(focused ? 1 : 0.6),
		).current;

		React.useEffect(() => {
			Animated.parallel([
				Animated.spring(scaleAnim, {
					toValue: focused ? 1 : 0.9,
					useNativeDriver: true,
					tension: 300,
					friction: 20,
				}),
				Animated.timing(opacityAnim, {
					toValue: focused ? 1 : 0.6,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start();
		}, [focused]);

		return (
			<View style={styles.iconContainer}>
				<Animated.View
					style={[
						styles.iconWrapper,
						{
							transform: [{ scale: scaleAnim }],
							opacity: opacityAnim,
						},
					]}
				>
					<Ionicons
						name={focused ? iconName : `${iconName}-outline`}
						size={focused ? 26 : 24}
						color={focused ? activeColor : color}
					/>
				</Animated.View>
			</View>
		);
	};

	const CustomTabBar = ({ state, descriptors, navigation }: any) => {
		return (
			<View style={styles.tabBarContainer}>
				<BlurView
					intensity={80}
					tint={isDark ? "dark" : "light"}
					style={styles.blurView}
					experimentalBlurMethod="dimezisBlurView"
				>
					<View
						style={[
							styles.tabBar,
							{
								borderTopColor: borderColor,
							},
						]}
					>
						{/* Subtle top highlight */}
						<View
							style={[
								styles.topHighlight,
								{
									backgroundColor: isDark
										? "rgba(255,255,255,0.1)"
										: "rgba(255,255,255,0.8)",
								},
							]}
						/>

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
									style={[
										styles.tabButton,
										isFocused && styles.tabButtonActive,
									]}
									activeOpacity={0.7}
								>
									{options.tabBarIcon({
										focused: isFocused,
										color: isFocused ? activeColor : mutedTextColor,
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
				tabBarActiveTintColor: activeColor,
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
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -4,
		},
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 12,
	},
	tabBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		height: 88,
		paddingBottom: 28,
		paddingTop: 12,
		borderTopWidth: 0.5,
		position: "relative",
	},
	topHighlight: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 1,
	},
	tabButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 8,
		paddingHorizontal: 4,
		borderRadius: 20,
		minHeight: 56,
	},
	tabButtonActive: {
		// backgroundColor: "rgba(16, 185, 129, 0.12)",
	},
	iconContainer: {
		alignItems: "center",
		justifyContent: "center",
		minHeight: 40,
	},
	iconWrapper: {
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
});
