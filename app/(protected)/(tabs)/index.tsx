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
import { format, subMonths, differenceInHours, isToday } from 'date-fns';
import { weatherService, WeatherData } from "@/lib/weather-service";
import { useNotifications } from "@/context/notification-provider";

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

// Plant check-in interface
interface PlantCheckInData {
	plantsNeedingCheckIn: Array<{
		id: string;
		plant_name: string;
		plant_type: string;
		last_checkin: string | null;
		hoursSinceLastCheckIn: number;
		image_url: string | null;
	}>;
	totalPlants: number;
	plantsCheckedInToday: number;
	loading: boolean;
}

const PLANT_TYPE_ICONS = {
	tomatoes: '🍅',
	lettuce: '🥬',
	carrots: '🥕',
	peppers: '🌶️',
	herbs: '🌿',
	strawberries: '🍓',
	spinach: '🥬',
	radishes: '🔴',
	beans: '🫘',
	cucumbers: '🥒',
};

export default function Home() {
	const { session } = useAuth();
	const { unreadCount } = useNotifications();
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

	// Plant check-in state
	const [plantCheckIn, setPlantCheckIn] = useState<PlantCheckInData>({
		plantsNeedingCheckIn: [],
		totalPlants: 0,
		plantsCheckedInToday: 0,
		loading: true
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

	// Fetch plant check-in data
	const fetchPlantCheckInData = async () => {
		if (!session?.user?.id) {
			setPlantCheckIn(prev => ({ ...prev, loading: false }));
			return;
		}

		try {
			setPlantCheckIn(prev => ({ ...prev, loading: true }));

			// Fetch all user plants
			const { data: plantsData, error: plantsError } = await supabase
				.from('user_plants')
				.select('id, plant_name, plant_type, last_checkin, image_url, status')
				.eq('user_id', session.user.id)
				.neq('status', 'harvested'); // Don't include harvested plants

			if (plantsError) {
				console.error('Error fetching plants:', plantsError);
				setPlantCheckIn(prev => ({ ...prev, loading: false }));
				return;
			}

			const plants = plantsData || [];

			// Calculate which plants need check-in
			const now = new Date();
			const plantsNeedingCheckIn = plants.filter(plant => {
				if (!plant.last_checkin) return true; // Never checked in
				
				const lastCheckin = new Date(plant.last_checkin);
				const hoursSince = differenceInHours(now, lastCheckin);
				return hoursSince >= 20; // Need check-in after 20 hours
			}).map(plant => ({
				...plant,
				hoursSinceLastCheckIn: plant.last_checkin 
					? differenceInHours(now, new Date(plant.last_checkin))
					: 999
			}));

			// Count plants checked in today
			const plantsCheckedInToday = plants.filter(plant => {
				if (!plant.last_checkin) return false;
				return isToday(new Date(plant.last_checkin));
			}).length;

			setPlantCheckIn({
				plantsNeedingCheckIn: plantsNeedingCheckIn.slice(0, 3), // Show max 3
				totalPlants: plants.length,
				plantsCheckedInToday,
				loading: false
			});

		} catch (error) {
			console.error('Error fetching plant check-in data:', error);
			setPlantCheckIn(prev => ({ ...prev, loading: false }));
		}
	};

	// Fetch weather on component mount
	useEffect(() => {
		fetchWeather();
	}, []);

	// Fetch plant data on component mount
	useEffect(() => {
		fetchPlantCheckInData();
	}, [session?.user?.id]);

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

	const getPlantTypeIcon = (plantType: string) => {
		return PLANT_TYPE_ICONS[plantType as keyof typeof PLANT_TYPE_ICONS] || '🌱';
	};

	const handlePlantCheckIn = (plantId: string) => {
		// Navigate directly to the plant detail page for check-in
		router.push(`/(protected)/plants/plant-detail/${plantId}`);
	};

	const navigateToPlants = () => {
		router.push("/(protected)/(tabs)/plants");
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{/* Header section */}
				<View className="flex-row justify-between items-center px-4 py-3 mb-4">
					<TouchableOpacity onPress={() => router.push("/(protected)/notification-modal")}> 
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">🔔</Text>
							{unreadCount > 0 && (
								<View className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
									<Text className="text-white text-xs font-bold">
										{unreadCount > 99 ? "99+" : unreadCount}
									</Text>
								</View>
							)}
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

				{/* Plant Check-In Widget - Updated with real data */}
				<TouchableOpacity 
					className="mx-4 mb-6 p-5 bg-secondary/30 rounded-2xl shadow border border-border"
					onPress={navigateToPlants}
					activeOpacity={0.7}
				>
					<View className="flex-row items-center mb-3">
						<View className="rounded-full items-center justify-center mr-3">
							<Text className="text-lg">🌱</Text>
						</View>
						<View className="flex-1">
							<Text className="text-lg font-semibold text-green-500">Plant Check-In</Text>
							<Text className="text-muted-foreground text-sm">
								{plantCheckIn.loading 
									? "Loading your plants..." 
									: `${plantCheckIn.totalPlants} plants in your garden`
								}
							</Text>
						</View>
					</View>
					
					<View className="bg-secondary/50 rounded-xl p-4 mt-2">
						{plantCheckIn.loading ? (
							<View className="items-center py-4">
								<Text className="text-muted-foreground">Loading plant data...</Text>
							</View>
						) : plantCheckIn.totalPlants === 0 ? (
							<View className="items-center">
								<Text className="text-4xl mb-2">🌱</Text>
								<Text className="text-xl font-medium text-center mb-2">Start Your Garden</Text>
								<Text className="text-muted-foreground text-center mb-3">
									Add your first plant to begin daily check-ins
								</Text>
								<Button
									variant="default"
									className="w-full"
									onPress={() => router.push("/(protected)/plants/add-plant")}
								>
									<Text className="text-primary-foreground font-medium">Add Your First Plant</Text>
								</Button>
							</View>
						) : plantCheckIn.plantsNeedingCheckIn.length === 0 ? (
							<View className="items-center">
								<Text className="text-4xl mb-2">✅</Text>
								<Text className="text-xl font-medium text-center mb-2">All Caught Up!</Text>
								<Text className="text-muted-foreground text-center mb-3">
									{plantCheckIn.plantsCheckedInToday > 0 
										? `${plantCheckIn.plantsCheckedInToday} plants checked in today`
										: "All your plants are up to date"
									}
								</Text>
								<Button
									variant="default"
									className="w-full"
									onPress={navigateToPlants}
								>
									<Text className="text-primary-foreground font-medium">View All Plants</Text>
								</Button>
							</View>
						) : (
							<View>
								<Text className="text-xl font-medium text-center mb-2">
									{plantCheckIn.plantsNeedingCheckIn.length} plant{plantCheckIn.plantsNeedingCheckIn.length > 1 ? 's' : ''} need{plantCheckIn.plantsNeedingCheckIn.length === 1 ? 's' : ''} check-in
								</Text>
								<Text className="text-muted-foreground text-center mb-3">
									Track your plants' growth progress
								</Text>
								
								{/* Show plants needing check-in */}
								<View className="space-y-2 mb-4">
									{plantCheckIn.plantsNeedingCheckIn.map((plant) => (
										<TouchableOpacity
											key={plant.id}
											className="flex-row items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
											onPress={() => handlePlantCheckIn(plant.id)}
											activeOpacity={0.7}
										>
											<View className="w-10 h-10 rounded-lg bg-muted items-center justify-center mr-3">
												{plant.image_url ? (
													<Image
														source={{ uri: plant.image_url }}
														className="w-10 h-10 rounded-lg"
														resizeMode="cover"
													/>
												) : (
													<Text className="text-lg">
														{getPlantTypeIcon(plant.plant_type)}
													</Text>
												)}
											</View>
											<View className="flex-1">
												<Text className="font-medium text-sm">{plant.plant_name}</Text>
												<Text className="text-xs text-muted-foreground">
													{plant.hoursSinceLastCheckIn >= 999 
														? "Never checked in" 
														: `${Math.floor(plant.hoursSinceLastCheckIn)}h ago`
													}
												</Text>
											</View>
											<View className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">
												<Text className="text-yellow-800 dark:text-yellow-200 text-xs font-medium">
													📸 Check-in
												</Text>
											</View>
										</TouchableOpacity>
									))}
								</View>

								<Button
									variant="default"
									className="w-full"
									onPress={navigateToPlants}
								>
									<Text className="text-primary-foreground font-medium">View All Plants</Text>
								</Button>
							</View>
						)}
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