import React from "react";
import { View } from "react-native";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/context/supabase-provider";

export default function WelcomeScreen() {
	const { colorScheme } = useColorScheme();
	const { signInWithGoogle } = useAuth();
	const appIcon =
		colorScheme === "dark"
			? require("@/assets/foodloop.png")
			: require("@/assets/icon-dark.png");

	return (
		<SafeAreaView className="flex flex-1 bg-background p-4">
			<View className="flex flex-1 items-center justify-center gap-y-4 web:m-4">
				<Image source={appIcon} className="w-32 h-32 rounded-xl" />
				<H1 className="text-center">Welcome to Foodloop</H1>
				<Muted className="text-center">
					A sustainable food marketplace connecting you with local businesses to
					purchase surplus food at discounted prices.
				</Muted>

				<View className="mt-4">
					<Text className="text-center font-medium mb-2 text-xl">
						Join us in:
					</Text>
					<View className="flex flex-col gap-y-2">
						<Text className="text-center">🌱 Reducing food waste</Text>
						<Text className="text-center">💰 Saving money on quality food</Text>
						<Text className="text-center">🌍 Helping the environment</Text>
						<Text className="text-center">🏬 Supporting local businesses</Text>
					</View>
				</View>
			</View>
			<View className="flex flex-col gap-y-4 web:m-4">
				<Button size="default" variant="default" onPress={signInWithGoogle}>
					<Text>Continue with Google</Text>
				</Button>
				<Muted className="text-center text-xs mt-2">TSA Nationals 2025</Muted>
			</View>
		</SafeAreaView>
	);
}
