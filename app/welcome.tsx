import React, { useState, useRef } from "react";
import { View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import PagerView from "react-native-pager-view";
import Svg, { Defs, RadialGradient, Stop, Ellipse } from "react-native-svg";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { useAuth } from "@/context/supabase-provider";

export default function WelcomeScreen() {
	const { signInWithGoogle } = useAuth();
	const [currentFeature, setCurrentFeature] = useState(0);
	const pagerRef = useRef<PagerView>(null);
	const { width } = Dimensions.get("window");

	const features = [
		{
			emoji: "🌱",
			text: "Urban gardening",
		},
		{
			emoji: "💰",
			text: "Saving money on quality food",
		},
		{
			emoji: "🌍",
			text: "Helping the environment",
		},
		{
			emoji: "🏬",
			text: "Supporting your local community",
		},
	];

	const handlePageSelected = (event: any) => {
		setCurrentFeature(event.nativeEvent.position);
	};

	return (
		<View className="flex-1 bg-black">
			{/* Bottom radial gradient using SVG for button invitation */}
			<View
				style={{
					position: "absolute",
					bottom: -100,
					left: -50,
					right: -50,
					height: 400,
				}}
			>
				<Svg width="100%" height="100%" style={{ position: "absolute" }}>
					<Defs>
						<RadialGradient id="bottomGradient" cx="50%" cy="75%" r="50%">
							<Stop
								offset="10%"
								stopColor="rgba(34, 197, 94, 0.3)"
								stopOpacity="1"
							/>
							<Stop
								offset="30%"
								stopColor="rgba(21, 128, 61, 0.2)"
								stopOpacity="1"
							/>
							<Stop
								offset="60%"
								stopColor="rgba(16, 185, 129, 0.1)"
								stopOpacity="1"
							/>
							<Stop offset="100%" stopColor="transparent" stopOpacity="0" />
						</RadialGradient>
					</Defs>
					<Ellipse
						cx="50%"
						cy="75%"
						rx="50%"
						ry="40%"
						fill="url(#bottomGradient)"
					/>
				</Svg>
			</View>

			{/* Secondary bottom radial gradient for additional glow */}
			<View
				style={{
					position: "absolute",
					bottom: -50,
					left: 0,
					right: 0,
					height: 250,
				}}
			>
				<Svg width="100%" height="100%" style={{ position: "absolute" }}>
					<Defs>
						<RadialGradient id="bottomGradient2" cx="50%" cy="80%" r="35%">
							<Stop
								offset="20%"
								stopColor="rgba(16, 185, 129, 0.2)"
								stopOpacity="1"
							/>
							<Stop
								offset="50%"
								stopColor="rgba(34, 197, 94, 0.1)"
								stopOpacity="1"
							/>
							<Stop offset="100%" stopColor="transparent" stopOpacity="0" />
						</RadialGradient>
					</Defs>
					<Ellipse
						cx="50%"
						cy="80%"
						rx="35%"
						ry="30%"
						fill="url(#bottomGradient2)"
					/>
				</Svg>
			</View>

			<SafeAreaView className="flex-1">
				<View className="flex-1 items-center justify-center px-6">
					{/* App Icon with Green Accent Glow */}
					<View className="mb-8 relative">
						<View className="absolute inset-0 bg-green-500/30 rounded-full blur-xl w-28 h-28 -top-2 -left-2" />
						<Image
							source={require("@/assets/icon.png")}
							className="w-24 h-24 relative z-10"
						/>
					</View>

					{/* Welcome Text with Green Accent */}
					<H1 className="text-white text-center text-4xl font-bold mb-4">
						Welcome to{" "}
						<Text className="text-green-400 text-4xl font-bold">FoodLoop</Text>
					</H1>

					{/* Description */}
					<Text className="text-gray-300 text-center text-base leading-6 mb-12 max-w-sm">
						A sustainable food marketplace connecting you with local businesses
						to purchase surplus food at discounted prices.
					</Text>

					{/* Join us in text with green accent */}
					<Text className="text-white text-center text-lg font-semibold mb-0">
						Join us in:
					</Text>

					{/* Features Carousel */}
					<View className="w-full mb-16">
						<PagerView
							ref={pagerRef}
							style={{ height: 120, width: "100%" }}
							initialPage={0}
							onPageSelected={handlePageSelected}
						>
							{features.map((feature, index) => (
								<View
									key={index}
									className="items-center justify-center px-19 w-full"
								>
									<View className="flex-row items-center justify-center bg-gray-800/50 backdrop-blur-lg rounded-2xl px-8 py-6 border border-green-500/20 w-full max-w-xs mx-auto">
										<Text className="text-4xl mr-4">{feature.emoji}</Text>
										<Text className="text-gray-300 text-lg font-medium text-center flex-1">
											{feature.text}
										</Text>
									</View>
								</View>
							))}
						</PagerView>

						{/* Pagination Dots */}
						<View className="flex-row justify-center mt-0 space-x-2">
							{features.map((_, index) => (
								<View
									key={index}
									className={`w-2 h-2 rounded-full mx-1 ${
										index === currentFeature ? "bg-green-400" : "bg-gray-600"
									}`}
								/>
							))}
						</View>
					</View>
				</View>

				{/* Bottom Section with Green Accent Button */}
				<View className="px-6 pb-8">
					<LinearGradient
						colors={["#22c55e", "#16a34a"]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{
							borderRadius: 12,
							marginBottom: 16,
						}}
					>
						<Button
							size="lg"
							className="bg-transparent border-0 py-4"
							onPress={signInWithGoogle}
						>
							<Text className="text-white text-lg font-semibold">
								Continue with Google
							</Text>
						</Button>
					</LinearGradient>

					<Text className="text-gray-400 text-center text-sm">
						TSA Nationals 2025
					</Text>
				</View>
			</SafeAreaView>
		</View>
	);
}
