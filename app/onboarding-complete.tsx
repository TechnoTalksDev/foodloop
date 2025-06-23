import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { useColorScheme } from "@/lib/useColorScheme";

export default function OnboardingCompleteScreen() {
	const { colorScheme } = useColorScheme();
	const router = useRouter();

	const appIcon =
		colorScheme === "dark"
			? require("@/assets/foodloop.png")
			: require("@/assets/icon-dark.png");

	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="flex-1 items-center justify-center px-4">
				<View className="items-center mb-8">
					<View className="w-32 h-32 rounded-full items-center justify-center mb-6">
						<Text className="text-8xl">🎉</Text>
					</View>
					<H1 className="text-center mb-4">You're all set!</H1>
					<Muted className="text-center text-lg">
						Let's start reducing food waste together.
					</Muted>
					<Muted className="text-center text-lg">Welcome to FoodLoop!</Muted>
				</View>

				<View className="items-center gap-y-4 mb-8">
					<View className="flex-row items-center">
						<Text className="text-2xl mr-2">🌱</Text>
						<Text className="text-lg">Help reduce food waste</Text>
					</View>
					<View className="flex-row items-center">
						<Text className="text-2xl mr-2">💰</Text>
						<Text className="text-lg">Save money on quality food</Text>
					</View>
					<View className="flex-row items-center">
						<Text className="text-2xl mr-2">🏬</Text>
						<Text className="text-lg">Support local businesses</Text>
					</View>
				</View>
			</View>

			<View className="p-4">
				<Button
					size="default"
					variant="default"
					onPress={() => router.replace("/")}
					className="w-full"
				>
					<Text className="text-primary-foreground font-semibold">
						Start Exploring
					</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
}
