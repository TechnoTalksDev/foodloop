import { router } from "expo-router";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { LinearGradient } from 'expo-linear-gradient';

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ui/product-card";

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
	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{/* Header with notification and cart */}
				<View className="flex-row justify-between items-center px-4 py-3">
					<TouchableOpacity onPress={() => router.push("/(protected)/notification-modal")}>
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">🔔</Text>
						</View>
					</TouchableOpacity>

					<H1>Home</H1>

					<TouchableOpacity onPress={() => router.push("/(protected)/(tabs)/cart")}>
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">🛒</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Search bar */}
				<View className="px-4 mb-5">
					<TouchableOpacity 
						activeOpacity={0.7}
						onPress={() => {
							// Navigate to discover page with unique timestamp to force animation
							router.navigate({
								pathname: "/(protected)/(tabs)/discover",
								params: { 
									focusSearch: "true", 
									timestamp: Date.now().toString() 
								}
							});
						}}
					>
						<View className="flex-row items-center bg-secondary rounded-full px-4 py-4 border border-secondary/50 shadow-sm">
							<Text className="text-foreground/60 mr-2">🔍</Text>
							<Text className="flex-1 text-foreground/60 text-base">Search Product</Text>
							<Text className="text-primary text-sm font-medium">Search</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Food categories */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					className="pl-4 mb-6"
				>
					{foodCategories.map((category) => (
						<TouchableOpacity
							key={category.id}
							className="items-center mr-6"
						>
							<View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-2">
								<Text className="text-3xl">{category.icon}</Text>
							</View>
							<Text className="text-sm text-center font-medium">{category.name}</Text>
						</TouchableOpacity>
					))}
				</ScrollView>

				{/* Recommendations section */}
				<View className="px-4 mb-6">
					<View className="flex-row justify-between items-center mb-4">
						<H3>Recommend for You</H3>
						<TouchableOpacity>
							<Text className="text-primary font-medium">See More</Text>
						</TouchableOpacity>
					</View>

					<View className="flex-row flex-wrap justify-between">
						{recommendedItems.map((item) => (
							<ProductCard
								key={item.id}
								image={item.image}
								name={item.name}
								business={item.business}
								price={item.price}
								originalPrice={item.originalPrice}
								discount={item.discount}
								eco={item.eco}
								onPress={() => router.push({
									pathname: "/(protected)/product/[id]",
									params: { id: item.id }
								})}
							/>
						))}
					</View>
				</View>

				{/* SmartPlate AI section */}
				<View className="mx-4 mb-8 p-5 rounded-xl border border-border overflow-hidden">
					<LinearGradient
						colors={["#22c55e", "#16a34a", "#166534"]} // vibrant green gradient
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
					/>
					<View style={{ position: 'relative', zIndex: 1 }}>
						<View className="flex-row items-center mb-2">
							<Text className="text-2xl mr-2">🍽️</Text>
							<H3>SmartPlate AI</H3>
						</View>
						<Muted className="mb-4 text-white">
							Get personalized recipes based on what you have at home and reduce food waste
						</Muted>
						<Button
							className="w-full"
							variant="default"
							size="default"
						>
							<Text className="text-primary-foreground font-medium">Generate Recipes</Text>
						</Button>
					</View>
				</View>

				{/* Impact tracker */}
				<View className="mx-4 mb-12 p-5 bg-secondary/50 rounded-xl border border-border">
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
							<Text className="text-lg font-bold text-green-600">12 kg</Text>
							<Text className="text-xs text-foreground">CO₂ Saved</Text>
						</View>
						<View className="items-center">
							<Text className="text-lg font-bold text-primary">$24.50</Text>
							<Text className="text-xs text-foreground">Money Saved</Text>
						</View>
						<View className="items-center">
							<Text className="text-lg font-bold text-amber-600">8</Text>
							<Text className="text-xs text-foreground">Items Rescued</Text>
						</View>
					</View>
				</View>
				
			</ScrollView>

			{/* Tab navigation is handled by the parent layout */}
		</SafeAreaView>
	);
}
