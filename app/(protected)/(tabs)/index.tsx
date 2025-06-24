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
import { format, subMonths } from 'date-fns';
import { weatherService, WeatherData } from "@/lib/weather-service";

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

interface RealImpactData {
	totalCO2Saved: number;
	totalMoneySaved: number;
	totalItemsRescued: number;
	hasData: boolean;
	loading: boolean;
}

// Simplified weather display interface
interface WeatherDisplay {
	temp: string;
	condition: string;
	icon: string;
	forecast: Array<{
		day: string;
		icon: string;
		temp: string;
	}>;
	loading: boolean;
	error: string | null;
	location: string;
	advice: string;
}

export default function Home() {
	const { session } = useAuth();
	const [username, setUsername] = useState<string | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [loadingUser, setLoadingUser] = useState(true);
	const [realImpact, setRealImpact] = useState<RealImpactData>({
		totalCO2Saved: 0,
		totalMoneySaved: 0,
		totalItemsRescued: 0,
		hasData: false,
		loading: true
	});

	// Weather state using the service
	const [weather, setWeather] = useState<WeatherDisplay>({
		temp: "--°",
		condition: "Loading...",
		icon: "🌤️",
		forecast: [],
		loading: true,
		error: null,
		location: "Getting location...",
		advice: ""
	});
	
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

	// Fetch weather data using the service
	const fetchWeather = async () => {
		try {
			setWeather(prev => ({ ...prev, loading: true, error: null }));

			const weatherData: WeatherData = await weatherService.getWeatherData({
				temperatureUnit: 'fahrenheit',
				forecastDays: 4,
				includeDetails: false
			});

			// Convert service data to display format
			const forecast = weatherData.forecast.map(day => ({
				day: day.day,
				icon: day.icon,
				temp: `${day.temperatureMax}°`
			}));

			const advice = weatherService.getFarmingAdvice(weatherData);

			setWeather({
				temp: `${weatherData.temperature}°F`,
				condition: weatherData.condition,
				icon: weatherData.icon,
				forecast,
				loading: false,
				error: null,
				location: weatherData.location.name,
				advice
			});

		} catch (error) {
			console.error('Weather fetch error:', error);
			setWeather(prev => ({
				...prev,
				loading: false,
				error: 'Failed to load weather',
				temp: "--°",
				condition: "Unavailable",
				icon: "🌤️",
				location: "Location unavailable",
				advice: ""
			}));
		}
	};

	// Fetch weather on component mount
	useEffect(() => {
		fetchWeather();
	}, []);

	// Fetch real impact data
	useEffect(() => {
		const fetchRealImpactData = async () => {
			if (!session?.user?.id) {
				setRealImpact(prev => ({ ...prev, loading: false }));
				return;
			}

			try {
				setRealImpact(prev => ({ ...prev, loading: true }));

				// Get data from the last 12 months
				const twelveMonthsAgo = subMonths(new Date(), 12);

				// Fetch user transactions from cart_items (assuming completed purchases)
				const { data: cartItems, error: cartError } = await supabase
					.from('cart_items')
					.select(`
						quantity,
						created_at,
						product:product(price, original_price, trash, name)
					`)
					.eq('user_id', session.user.id)
					.gte('created_at', twelveMonthsAgo.toISOString());

				if (cartError) {
					console.error('Error fetching cart items:', cartError);
					setRealImpact(prev => ({ ...prev, loading: false }));
					return;
				}

				const transactions = (cartItems as any[]) || [];

				// Calculate real impact metrics
				let totalCO2Saved = 0;
				let totalMoneySaved = 0;
				let totalItemsRescued = 0;

				transactions.forEach((transaction: any) => {
					const product = transaction.product;
					if (!product) return;

					const quantity = transaction.quantity;
					
					// CO2 savings (assuming each pound of food saves ~2.5kg CO2)
					const trashAmount = product.trash ?? 1;
					const co2Saved = trashAmount * quantity * 2.5;
					totalCO2Saved += co2Saved;
					
					// Money savings
					const originalPrice = product.original_price ? parseFloat(product.original_price) : 0;
					const moneySaved = Math.max(0, (originalPrice - product.price) * quantity);
					totalMoneySaved += moneySaved;
					
					// Items rescued
					totalItemsRescued += quantity;
				});

				setRealImpact({
					totalCO2Saved: Math.round(totalCO2Saved * 100) / 100,
					totalMoneySaved: Math.round(totalMoneySaved * 100) / 100,
					totalItemsRescued,
					hasData: transactions.length > 0,
					loading: false
				});

			} catch (error) {
				console.error('Error fetching real impact data:', error);
				setRealImpact(prev => ({ ...prev, loading: false }));
			}
		};

		fetchRealImpactData();
	}, [session?.user?.id]);

	// Daily check-in state (placeholder logic)
	const [checkedIn, setCheckedIn] = useState(false);
	
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

				{/* Local Weather Widget - Using Weather Service */}
				<View className="mx-4 mb-6 p-5 bg-secondary/30 rounded-2xl border border-border">
					<View className="flex-row justify-between items-center mb-3">
						<View className="flex-row items-center">
							<Text className="text-xl mr-2">☁️</Text>
							<Text className="text-lg font-semibold">Local Weather</Text>
						</View>
						<TouchableOpacity onPress={fetchWeather}>
							<Text className="text-primary text-sm">Refresh</Text>
						</TouchableOpacity>
					</View>
					
					{weather.loading ? (
						<View className="items-center py-4">
							<Text className="text-muted-foreground">Loading weather...</Text>
						</View>
					) : weather.error ? (
						<View className="items-center py-4">
							<Text className="text-red-500 text-sm">{weather.error}</Text>
							<TouchableOpacity onPress={fetchWeather} className="mt-2">
								<Text className="text-primary text-sm">Try Again</Text>
							</TouchableOpacity>
						</View>
					) : (
						<>
							<Text className="text-muted-foreground text-sm mb-3">{weather.location}</Text>
							
							<View className="flex-row items-center justify-between mb-3">
								<View className="flex-row items-center">
									<Text className="text-4xl mr-3">{weather.icon}</Text>
									<View>
										<Text className="text-2xl font-bold">{weather.temp}</Text>
										<Text className="text-muted-foreground">{weather.condition}</Text>
									</View>
								</View>
								<View className="flex-1 ml-4">
									<Text className="text-green-500 text-sm font-medium text-right">
										{weather.advice}
									</Text>
								</View>
							</View>
							
							<View className="flex-row justify-between mt-2">
								{weather.forecast.map((day, index) => (
									<View key={index} className="items-center flex-1">
										<Text className="text-muted-foreground text-xs">{day.day}</Text>
										<Text className="text-xl my-1">{day.icon}</Text>
										<Text className="font-medium text-sm">{day.temp}</Text>
									</View>
								))}
							</View>
						</>
					)}
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
				
				{/* SmartPlate AI section - Updated with navigation */}
				<View className="mx-4 mb-6 rounded-2xl border border-border overflow-hidden">
					<View className="bg-green-900 p-5 pb-6">
						<View className="flex-row items-center mb-3">
							<View className="w-12 h-12 bg-green-600 rounded-full items-center justify-center mr-3">
								<Text className="text-2xl">🧠</Text>
							</View>
							<View>
								<H3 className="text-white">SmartPlate AI</H3>
								<Text className="text-green-100 opacity-80">Reduce food waste with AI</Text>
							</View>
						</View>
						
						<Text className="text-green-50 mb-4">
							Get personalized recipes and sustainability tips from our AI assistant
						</Text>
					</View>
					
					<View className="bg-secondary/30 p-4">
						<Button
							className="w-full"
							variant="default"
							size="default"
							onPress={() => router.push("/(protected)/smartplate-ai")}
						>
							<View className="flex-row items-center">
								<Text className="text-xl mr-2">🧠</Text>
								<Text className="text-primary-foreground font-medium">Chat with AI</Text>
							</View>
						</Button>
						
						<Text className="text-center mt-2 text-xs text-muted-foreground">
							Powered by AI · Saved 245kg food waste this month
						</Text>
					</View>
				</View>

				{/* Real Impact tracker - Updated with real data */}
				<TouchableOpacity 
					className="mx-4 mb-12 p-5 bg-secondary/30 rounded-xl border border-border"
					onPress={() => router.push("/(protected)/impact-dashboard")}
					activeOpacity={0.7}
				>
					<View className="flex-row items-center justify-between mb-4">
						<View className="flex-row items-center">
							<Text className="text-2xl mr-2">🌍</Text>
							<H3>Your Impact</H3>
						</View>
						<TouchableOpacity onPress={() => router.push("/(protected)/impact-dashboard")}>
							<Text className="text-primary font-medium">View Details</Text>
						</TouchableOpacity>
					</View>

					{realImpact.loading ? (
						<View className="flex-row justify-center py-4">
							<Text className="text-muted-foreground">Loading your impact...</Text>
						</View>
					) : !realImpact.hasData ? (
						<View className="items-center py-4">
							<Text className="text-4xl mb-2">🌱</Text>
							<Text className="text-center text-muted-foreground mb-2">
								No impact data yet
							</Text>
							<Text className="text-center text-sm text-muted-foreground">
								Make your first purchase to start tracking your environmental impact!
							</Text>
						</View>
					) : (
						<>
							<View className="flex-row justify-between">
								<View className="items-center">
									<Text className="text-2xl font-bold text-green-500">
										{realImpact.totalCO2Saved} kg
									</Text>
									<Text className="text-xs text-muted-foreground">CO₂ Saved</Text>
								</View>
								<View className="items-center">
									<Text className="text-2xl font-bold text-primary">
										${realImpact.totalMoneySaved}
									</Text>
									<Text className="text-xs text-muted-foreground">Money Saved</Text>
								</View>
								<View className="items-center">
									<Text className="text-2xl font-bold text-amber-500">
										{realImpact.totalItemsRescued}
									</Text>
									<Text className="text-xs text-muted-foreground">Items Rescued</Text>
								</View>
							</View>
							
							<View className="mt-3 pt-3 border-t border-border">
								<Text className="text-center text-sm text-muted-foreground">
									Tap to see your detailed environmental impact
								</Text>
							</View>
						</>
					)}
				</TouchableOpacity>
				
			</ScrollView>

			{/* Tab navigation is handled by the parent layout */}
		</SafeAreaView>
	);
}