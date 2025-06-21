import { router } from "expo-router";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ui/product-card";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";

// Sample food categories with eco-friendly icons
const foodCategories = [
	{ id: 1, name: "Fruits", icon: "🍎" },
	{ id: 2, name: "Veggies", icon: "🥦" },
	{ id: 3, name: "Bakery", icon: "🍞" },
	{ id: 4, name: "Dairy", icon: "🥛" },
	{ id: 5, name: "Meals", icon: "🍲" },
];

// Sample recommended items with discount percentages
const recommendedItems = [
	{
		id: 1,
		name: "Organic Apples",
		business: "Local Farm",
		price: 2.99,
		originalPrice: 4.99,
		discount: "40% off",
		image: require("@/assets/foodloop.png"),
		eco: "Saves 2kg CO₂",
	},
	{
		id: 2,
		name: "Fresh Bread",
		business: "Campus Bakery",
		price: 1.99,
		originalPrice: 3.5,
		discount: "43% off",
		image: require("@/assets/foodloop.png"),
		eco: "Saves 1kg CO₂",
	},
	{
		id: 3,
		name: "Veggie Bowl",
		business: "Green Café",
		price: 4.99,
		originalPrice: 7.99,
		discount: "38% off",
		image: require("@/assets/foodloop.png"),
		eco: "Saves 3kg CO₂",
	},
	{
		id: 4,
		name: "Greek Yogurt",
		business: "Student Store",
		price: 0.99,
		originalPrice: 2.49,
		discount: "60% off",
		image: require("@/assets/foodloop.png"),
		eco: "Saves 1kg CO₂",
	},
];

export default function Home() {
	const { session } = useAuth();
	const [username, setUsername] = useState<string | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [loadingUser, setLoadingUser] = useState(true);
	
	useEffect(() => {
		const fetchUser = async () => {
			if (session?.user?.id) {
				const { data, error } = await supabase
					.from("users")
					.select("username, name, avatar")
					.eq("id", session.user.id)
					.single();
				if (data) {
					setUsername(data.name || data.username || "there");
					setAvatarUrl(data.avatar);
				} else {
					setUsername("there");
				}
			} else {
				setUsername("there");
			}
			setLoadingUser(false);
		};
		fetchUser();
	}, [session?.user?.id]);

	// Daily check-in state (placeholder logic)
	const [checkedIn, setCheckedIn] = useState(false);
	
	// Weather data state (placeholder)
	const [weather, setWeather] = useState({
		temp: "22°C",
		condition: "Sunny",
		icon: "☀️",
		forecast: [
			{ day: "Today", icon: "☀️", temp: "22°" },
			{ day: "Tue", icon: "☀️", temp: "24°" },
			{ day: "Wed", icon: "🌤️", temp: "21°" },
			{ day: "Thu", icon: "🌧️", temp: "18°" },
		]
	});

	// Achievements data (placeholder)
	const [achievements, setAchievements] = useState({
		completed: 3,
		total: 10,
		next: "Waste Warrior - Rescue 10 items",
		progress: 80
	});

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{/* Header with notification and cart */}
				<View className="flex-row justify-between items-center px-4 py-3 mb-4">
					<TouchableOpacity onPress={() => router.push("/(protected)/notification-modal")}> 
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">🔔</Text>
							<View className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
								<Text className="text-white text-xs font-bold">2</Text>
							</View>
						</View>
					</TouchableOpacity>

					<H1>My Garden</H1>

					<TouchableOpacity onPress={() => router.push("/(protected)/(tabs)/profile")}> 
						<View className="w-10 h-10 items-center justify-center overflow-hidden rounded-full">
							{avatarUrl ? (
								<Image 
									source={{ uri: avatarUrl }} 
									className="w-10 h-10" 
									resizeMode="cover"
								/>
							) : (
								<View className="w-10 h-10 bg-primary/80 rounded-full items-center justify-center">
									<Text className="text-white text-lg font-bold">
										{username ? username.charAt(0).toUpperCase() : "U"}
									</Text>
								</View>
							)}
						</View>
					</TouchableOpacity>
				</View>

				{/* Large Hey {username} text, not in a card */}
				{/* <View className="px-4 mt-2 mb-4">
					<Text className="text-4xl font-semibold mb-2">
						Hey {loadingUser ? "..." : username}!
					</Text>
				</View> */}

				{/* Daily Check-In Widget - Redesigned */}
				<TouchableOpacity 
					className="mx-4 mb-6 p-5 bg-secondary/30 rounded-2xl shadow border border-border"
					onPress={() => router.push("/(protected)/modal")}
					activeOpacity={0.7}
				>
					<View className="flex-row items-center mb-3">
						<View className="rounded-full items-center justify-center mr-3">
							<Text className="text-lg">📝</Text>
						</View>
						<View>
							<Text className="text-lg font-semibold text-green-500">Daily Check-In</Text>
							<Text className="text-muted-foreground text-sm">Keep track of your sustainability journey</Text>
						</View>
					</View>
					
					<View className="bg-secondary/50 rounded-xl p-4 mt-2">
						<Text className="text-xl font-medium text-center mb-2">What did you do today?</Text>
						<Text className="text-muted-foreground text-center mb-3">Share your environmental actions</Text>
						
						<Button
							variant="default"
							className="w-full"
							onPress={() => router.push("/(protected)/modal")}
						>
							<Text className="text-primary-foreground font-medium">Add Check-In</Text>
						</Button>
					</View>
				</TouchableOpacity>

				{/* Achievements/Milestones Widget */}
				<View className="mx-4 mb-6 p-5 bg-secondary/30 rounded-2xl border border-border">
					<View className="flex-row justify-between items-center mb-3">
						<View className="flex-row items-center">
							<Text className="text-xl mr-2">🏆</Text>
							<Text className="text-lg font-semibold">Milestones</Text>
						</View>
						<TouchableOpacity>
							<Text className="text-primary font-medium text-sm">See All</Text>
						</TouchableOpacity>
					</View>
					
					<View className="bg-secondary/50 p-3 rounded-lg mb-2">
						<Text className="font-medium mb-1">{achievements.next}</Text>
						<View className="w-full h-2 bg-secondary rounded-full overflow-hidden">
							<View className="h-2 bg-green-500 rounded-full" style={{ width: `${achievements.progress}%` }} />
						</View>
						<Text className="text-muted-foreground mt-1 text-right text-xs">{achievements.progress}%</Text>
					</View>
					
					<Text className="text-muted-foreground text-center mt-2">
						{achievements.completed} of {achievements.total} achievements completed
					</Text>
				</View>

				{/* Local Weather Widget */}
				<View className="mx-4 mb-6 p-5 bg-secondary/30 rounded-2xl border border-border">
					<View className="flex-row justify-between items-center mb-3">
						<View className="flex-row items-center">
							<Text className="text-xl mr-2">☁️</Text>
							<Text className="text-lg font-semibold">Local Weather</Text>
						</View>
						<Text className="text-muted-foreground">Your Area</Text>
					</View>
					
					<View className="flex-row items-center justify-between mb-3">
						<View className="flex-row items-center">
							<Text className="text-4xl mr-3">{weather.icon}</Text>
							<View>
								<Text className="text-2xl font-bold">{weather.temp}</Text>
								<Text className="text-muted-foreground">{weather.condition}</Text>
							</View>
						</View>
						<Text className="text-green-500">Good for harvesting</Text>
					</View>
					
					<View className="flex-row justify-between mt-2">
						{weather.forecast.map((day, index) => (
							<View key={index} className="items-center">
								<Text className="text-muted-foreground text-xs">{day.day}</Text>
								<Text className="text-xl my-1">{day.icon}</Text>
								<Text className="font-medium">{day.temp}</Text>
							</View>
						))}
					</View>
				</View>

				{/* Recommendations Widget with ProductCard component */}
				<View className="mx-4 mb-6">
					<View className="flex-row justify-between items-center mb-4">
						<Text className="text-lg font-semibold">Recommended For You</Text>
						<TouchableOpacity onPress={() => router.push("/(protected)/(tabs)/marketplace")}>
							<Text className="text-primary font-medium">See All</Text>
						</TouchableOpacity>
					</View>
					
					<View className="flex-row flex-wrap justify-between">
						{recommendedItems.slice(0, 2).map((item) => (
							<ProductCard
								key={item.id}
								name={item.name}
								business={item.business}
								price={item.price}
								originalPrice={item.originalPrice}
								discount={item.discount}
								image={item.image}
								eco={item.eco}
								onPress={() => router.push(`/(protected)/product/${item.id}`)}
							/>
						))}
					</View>
				</View>
				
				{/* SmartPlate AI section - Redesigned */}
				<View className="mx-4 mb-6 rounded-2xl border border-border overflow-hidden">
					<View className="bg-green-900 p-5 pb-6">
						<View className="flex-row items-center mb-3">
							<View className="w-12 h-12 bg-green-600 rounded-full items-center justify-center mr-3">
								<Text className="text-2xl">🍽️</Text>
							</View>
							<View>
								<H3 className="text-white">SmartPlate AI</H3>
								<Text className="text-green-100 opacity-80">Reduce food waste with AI</Text>
							</View>
						</View>
						
						<Text className="text-green-50 mb-4">
							Get personalized recipes based on ingredients you already have at home
						</Text>
					</View>
					
					<View className="bg-secondary/30 p-4">
						<Button
							className="w-full"
							variant="default"
							size="default"
						>
							<View className="flex-row items-center">
								<Text className="text-xl mr-2">🧠</Text>
								<Text className="text-primary-foreground font-medium">Generate Recipes</Text>
							</View>
						</Button>
						
						<Text className="text-center mt-2 text-xs text-muted-foreground">
							Powered by AI · Saved 245kg food waste this month
						</Text>
					</View>
				</View>

				{/* Impact tracker */}
				<View className="mx-4 mb-12 p-5 bg-secondary/30 rounded-xl border border-border">
					<View className="flex-row items-center justify-between mb-4">
						<View className="flex-row items-center">
							<Text className="text-2xl mr-2">🌍</Text>
							<H3>Your Impact</H3>
						</View>
						<TouchableOpacity>
							<Text className="text-primary font-medium">Details</Text>
						</TouchableOpacity>
					</View>

					<View className="flex-row justify-between">
						<View className="items-center">
							<Text className="text-2xl font-bold text-green-500">12 kg</Text>
							<Text className="text-xs text-muted-foreground">CO₂ Saved</Text>
						</View>
						<View className="items-center">
							<Text className="text-2xl font-bold text-primary">$24.50</Text>
							<Text className="text-xs text-muted-foreground">Money Saved</Text>
						</View>
						<View className="items-center">
							<Text className="text-2xl font-bold text-amber-500">8</Text>
							<Text className="text-xs text-muted-foreground">Items Rescued</Text>
						</View>
					</View>
				</View>
				
			</ScrollView>


			{/* Tab navigation is handled by the parent layout */}
		</SafeAreaView>
	);
}
