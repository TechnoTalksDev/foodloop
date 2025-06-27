// app/(protected)/(tabs)/index.tsx - PREMIUM PROFESSIONAL HOME SCREEN

import { router } from "expo-router";
import { Image, ScrollView, TouchableOpacity, View, Dimensions } from "react-native";
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, withDelay, withRepeat, interpolate, Extrapolation } from "react-native-reanimated";
import { useEffect, useState } from "react";
import Animated from 'react-native-reanimated';

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
import { useAchievements } from "@/hooks/useAchievements";

// Sample food categories with eco-friendly icons
const foodCategories = [
	{ id: 1, name: "Fruits", icon: "🍎" },
	{ id: 2, name: "Veggies", icon: "🥦" },
	{ id: 3, name: "Bakery", icon: "🍞" },
	{ id: 4, name: "Dairy", icon: "🥛" },
	{ id: 5, name: "Meals", icon: "🍲" },
];

// Interface for marketplace products
interface MarketplaceProduct {
	id: number;
	name: string;
	price: number;
	original_price?: string;
	description?: string;
	image_url?: string[];
	created_at: string;
	expiry?: string;
	trash?: number;
	user_id: string;
	location: string;
	amount: number;
}

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

	// Subtle 3D Animation Values
	const card1Float = useSharedValue(0);
	const card2Float = useSharedValue(0);
	const card3Float = useSharedValue(0);
	const card4Float = useSharedValue(0);
	const card5Float = useSharedValue(0);
	const card6Float = useSharedValue(0);
	
	const headerScale = useSharedValue(0.95);
	const headerOpacity = useSharedValue(0);

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

	// Subtle floating animations for cards
	useEffect(() => {
		// Header entrance
		headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
		headerScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 120 }));

		// Gentle floating animations
		card1Float.value = withRepeat(
			withSequence(
				withTiming(-4, { duration: 4000 }),
				withTiming(4, { duration: 4000 })
			),
			-1,
			true
		);

		card2Float.value = withDelay(500, withRepeat(
			withSequence(
				withTiming(3, { duration: 3500 }),
				withTiming(-3, { duration: 3500 })
			),
			-1,
			true
		));

		card3Float.value = withDelay(1000, withRepeat(
			withSequence(
				withTiming(-3, { duration: 4500 }),
				withTiming(5, { duration: 4500 })
			),
			-1,
			true
		));

		card4Float.value = withDelay(1200, withRepeat(
			withSequence(
				withTiming(4, { duration: 3800 }),
				withTiming(-2, { duration: 3800 })
			),
			-1,
			true
		));

		card5Float.value = withDelay(1500, withRepeat(
			withSequence(
				withTiming(-5, { duration: 4200 }),
				withTiming(2, { duration: 4200 })
			),
			-1,
			true
		));

		card6Float.value = withDelay(1800, withRepeat(
			withSequence(
				withTiming(3, { duration: 3600 }),
				withTiming(-4, { duration: 3600 })
			),
			-1,
			true
		));
	}, []);

	// Animated styles for each card with subtle effects
	const headerAnimatedStyle = useAnimatedStyle(() => ({
		opacity: headerOpacity.value,
		transform: [{ scale: headerScale.value }],
	}));

	const card1AnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: card1Float.value }],
	}));

	const card2AnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: card2Float.value }],
	}));

	const card3AnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: card3Float.value }],
	}));

	const card4AnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: card4Float.value }],
	}));

	const card5AnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: card5Float.value }],
	}));

	const card6AnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: card6Float.value }],
	}));
	
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

	// Recommended items state
	const [recommendedItems, setRecommendedItems] = useState<Array<{
		id: number;
		name: string;
		business: string;
		price: number;
		originalPrice: number;
		discount: string;
		image: { uri: string } | any;
		eco: string;
	}>>([]);
	const [loadingRecommendations, setLoadingRecommendations] = useState(true);

	// Fetch recommended marketplace items
	const fetchRecommendedItems = async () => {
		try {
			setLoadingRecommendations(true);

			// Get recent products with good discounts and eco-friendly options
			const { data: products, error } = await supabase
				.from("product")
				.select("*")
				.gt("amount", 0)
				.not("original_price", "is", null)
				.order("created_at", { ascending: false })
				.limit(6);

			if (error) {
				console.error("Error fetching recommended items:", error);
				return;
			}

			if (products && products.length > 0) {
				// Get user info for business names
				const userIds = [...new Set(products.map(p => p.user_id).filter(Boolean))];
				const { data: users } = await supabase
					.from("users")
					.select("id, username, name")
					.in("id", userIds);

				const userMap = new Map();
				if (users) {
					users.forEach(user => {
						userMap.set(user.id, user);
					});
				}

				// Transform products to match UI expectations
				const formattedRecommendations = products.slice(0, 4).map((product: MarketplaceProduct) => {
					const originalPrice = product.original_price ? parseFloat(product.original_price) : product.price;
					const savings = originalPrice - product.price;
					const discountPercentage = originalPrice > product.price 
						? Math.round((savings / originalPrice) * 100)
						: 0;

					const user = userMap.get(product.user_id);
					const businessName = user?.name || user?.username || "Local Business";

					const ecoImpact = product.trash 
						? `Saves ${product.trash}kg CO₂` 
						: "Eco-friendly";

					return {
						id: product.id,
						name: product.name,
						business: businessName,
						price: product.price,
						originalPrice: originalPrice,
						discount: discountPercentage > 0 ? `${discountPercentage}% off` : "",
						image: product.image_url && product.image_url.length > 0 
							? { uri: product.image_url[0] }
							: require("@/assets/foodloop.png"),
						eco: ecoImpact,
					};
				});

				setRecommendedItems(formattedRecommendations);
			}
		} catch (error) {
			console.error("Error in fetchRecommendedItems:", error);
		} finally {
			setLoadingRecommendations(false);
		}
	};

	// Fetch weather and recommendations on component mount
	useEffect(() => {
		fetchWeather();
		fetchRecommendedItems();
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

	// Achievements data - using real hook
	const { getStats, getNextMilestone, loading: achievementsLoading } = useAchievements();
	
	const achievementStats = getStats();
	const nextMilestone = getNextMilestone();

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
			<ScrollView 
				className="flex-1" 
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 24 }}
			>
				{/* Professional Header */}
				<Animated.View 
					className="flex-row justify-between items-center py-4 mb-2 px-4"
					style={headerAnimatedStyle}
				>
					<TouchableOpacity 
						onPress={() => router.push("/(protected)/notification-modal")}
						className="relative p-2 -ml-2"
					> 
						<View className="w-8 h-8 items-center justify-center">
							<Text className="text-xl">🔔</Text>
							{unreadCount > 0 && (
								<View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center shadow-sm">
									<Text className="text-white text-xs font-semibold">
										{unreadCount > 99 ? "99+" : unreadCount}
									</Text>
								</View>
							)}
						</View>
					</TouchableOpacity>

					<View className="items-center">
						<H1 className="text-2xl font-bold tracking-tight">My Garden</H1>
						<Text className="text-muted-foreground text-sm">
							{loadingUser ? "Welcome" : `Hello, ${username}`}
						</Text>
					</View>

					<TouchableOpacity 
						onPress={() => router.push("/(protected)/(tabs)/profile")}
						className="p-1"
					> 
						<View className="w-9 h-9 items-center justify-center overflow-hidden rounded-xl bg-card border border-border shadow-sm">
							{avatarUrl ? (
								<Image 
									source={{ uri: avatarUrl }} 
									className="w-9 h-9 rounded-xl" 
									resizeMode="cover"
								/>
							) : (
								<View className="w-9 h-9 bg-primary rounded-xl items-center justify-center">
									<Text className="text-primary-foreground text-base font-semibold">
										{username ? username.charAt(0).toUpperCase() : "U"}
									</Text>
								</View>
							)}
						</View>
					</TouchableOpacity>
				</Animated.View>

				{/* Plant Check-In Widget */}
				<Animated.View 
					className="mb-6 px-4"
					style={card1AnimatedStyle}
				>
					<TouchableOpacity 
						className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg"
						onPress={navigateToPlants}
						activeOpacity={0.95}
					>
						<View className="p-6">
							<View className="flex-row items-center mb-4">
								<View className="w-12 h-12 bg-green-50 dark:bg-green-950 rounded-xl items-center justify-center mr-4">
									<Text className="text-2xl">🌱</Text>
								</View>
								<View className="flex-1">
									<Text className="text-lg font-semibold text-foreground">Plant Check-In</Text>
									<Text className="text-muted-foreground text-sm mt-0.5">
										{plantCheckIn.loading 
											? "Loading your plants..." 
											: plantCheckIn.totalPlants === 0
											? "Start your gardening journey"
											: `${plantCheckIn.totalPlants} plants in your garden`
										}
									</Text>
								</View>
							</View>
							
							<View className="bg-muted/30 backdrop-blur-sm rounded-xl p-4">
								{plantCheckIn.loading ? (
									<View className="items-center py-6">
										<View className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-pulse" />
										<Text className="text-muted-foreground text-sm mt-3">Loading plant data...</Text>
									</View>
								) : plantCheckIn.totalPlants === 0 ? (
									<View className="items-center py-2">
										<Text className="text-3xl mb-3">🌱</Text>
										<Text className="text-lg font-medium text-center mb-2">Start Your Garden</Text>
										<Text className="text-muted-foreground text-center text-sm mb-4 leading-relaxed">
											Add your first plant to begin daily check-ins and track growth progress
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
									<View className="items-center py-2">
										<Text className="text-3xl mb-3">✅</Text>
										<Text className="text-lg font-medium text-center mb-2">All Caught Up!</Text>
										<Text className="text-muted-foreground text-center text-sm mb-4">
											{plantCheckIn.plantsCheckedInToday > 0 
												? `${plantCheckIn.plantsCheckedInToday} plants checked in today`
												: "All your plants are up to date"
											}
										</Text>
										<Button
											variant="outline"
											className="w-full"
											onPress={navigateToPlants}
										>
											<Text className="font-medium">View All Plants</Text>
										</Button>
									</View>
								) : (
									<View>
										<Text className="text-lg font-medium text-center mb-1">
											{plantCheckIn.plantsNeedingCheckIn.length} plant{plantCheckIn.plantsNeedingCheckIn.length > 1 ? 's' : ''} need{plantCheckIn.plantsNeedingCheckIn.length === 1 ? 's' : ''} attention
										</Text>
										<Text className="text-muted-foreground text-center text-sm mb-4">
											Track your plants' growth progress
										</Text>
										
										{/* Show plants needing check-in */}
										<View className="space-y-3 mb-4">
											{plantCheckIn.plantsNeedingCheckIn.map((plant) => (
												<TouchableOpacity
													key={plant.id}
													className="flex-row items-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50"
													onPress={() => handlePlantCheckIn(plant.id)}
													activeOpacity={0.8}
												>
													<View className="w-10 h-10 rounded-lg bg-background border border-border items-center justify-center mr-3">
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
													<View className="bg-amber-100 dark:bg-amber-900/50 px-3 py-1.5 rounded-lg">
														<Text className="text-amber-700 dark:text-amber-300 text-xs font-medium">
															Check-in
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
						</View>
					</TouchableOpacity>
				</Animated.View>

				{/* Achievements Widget */}
				<Animated.View 
					className="mb-6 px-4"
					style={card2AnimatedStyle}
				>
					<TouchableOpacity 
						className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg"
						onPress={() => router.push("/(protected)/achievements-modal")}
						activeOpacity={0.95}
					>
						<View className="p-6">
							<View className="flex-row justify-between items-center mb-4">
								<View className="flex-row items-center">
									<View className="w-12 h-12 bg-yellow-50 dark:bg-yellow-950 rounded-xl items-center justify-center mr-4">
										<Text className="text-2xl">🏆</Text>
									</View>
									<View>
										<Text className="text-lg font-semibold">Achievements</Text>
										<Text className="text-muted-foreground text-sm">Track your progress</Text>
									</View>
								</View>
								<TouchableOpacity onPress={() => router.push("/(protected)/achievements-modal")}>
									<Text className="text-primary font-medium text-sm">View All</Text>
								</TouchableOpacity>
							</View>
							
							<View className="bg-muted/30 backdrop-blur-sm rounded-xl p-4">
								{achievementsLoading ? (
									<View className="items-center py-4">
										<View className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-pulse" />
										<Text className="text-muted-foreground text-sm mt-3">Loading achievements...</Text>
									</View>
								) : nextMilestone ? (
									<View>
										<View className="flex-row items-center mb-3">
											<Text className="text-2xl mr-3">{nextMilestone.achievement.icon}</Text>
											<View className="flex-1">
												<Text className="font-medium text-sm">{nextMilestone.achievement.name}</Text>
												<Text className="text-xs text-muted-foreground">+{nextMilestone.achievement.points} points</Text>
											</View>
										</View>
										<Text className="text-sm text-muted-foreground mb-3 leading-relaxed">
											{nextMilestone.achievement.description}
										</Text>
										<View className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
											<View 
												className="h-2 bg-green-500 rounded-full transition-all duration-300" 
												style={{ width: `${nextMilestone.progressPercentage}%` }} 
											/>
										</View>
										<View className="flex-row justify-between">
											<Text className="text-muted-foreground text-xs">
												{nextMilestone.current_progress} / {nextMilestone.achievement.target_value}
											</Text>
											<Text className="text-muted-foreground text-xs">{Math.round(nextMilestone.progressPercentage)}%</Text>
										</View>
									</View>
								) : (
									<View className="items-center py-2">
										<Text className="text-3xl mb-3">🎉</Text>
										<Text className="font-medium text-center mb-1">All Achievements Complete!</Text>
										<Text className="text-muted-foreground text-sm text-center">
											You're a FoodLoop champion
										</Text>
									</View>
								)}
								
								<View className="mt-4 pt-4 border-t border-border">
									<Text className="text-muted-foreground text-center text-sm">
										{achievementStats.completedCount} of {achievementStats.totalAchievements} completed
									</Text>
								</View>
							</View>
						</View>
					</TouchableOpacity>
				</Animated.View>

				{/* Weather Widget */}
				<Animated.View 
					className="mb-6 px-4"
					style={card3AnimatedStyle}
				>
					<View className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg">
						<View className="p-6">
							<View className="flex-row justify-between items-center mb-4">
								<View className="flex-row items-center">
									<View className="w-12 h-12 bg-blue-50 dark:bg-blue-950 rounded-xl items-center justify-center mr-4">
										<Text className="text-2xl">🌤️</Text>
									</View>
									<View>
										<Text className="text-lg font-semibold">Weather</Text>
										<Text className="text-muted-foreground text-sm">
											{weather.loading ? "Loading..." : weather.location}
										</Text>
									</View>
								</View>
								<TouchableOpacity onPress={fetchWeather}>
									<Text className="text-primary text-sm font-medium">Refresh</Text>
								</TouchableOpacity>
							</View>
							
							<View className="bg-muted/30 backdrop-blur-sm rounded-xl p-4">
								{weather.loading ? (
									<View className="items-center py-6">
										<View className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-pulse" />
										<Text className="text-muted-foreground text-sm mt-3">Loading weather...</Text>
									</View>
								) : weather.error ? (
									<View className="items-center py-4">
										<Text className="text-red-500 text-sm mb-2">{weather.error}</Text>
										<TouchableOpacity onPress={fetchWeather}>
											<Text className="text-primary text-sm font-medium">Try Again</Text>
										</TouchableOpacity>
									</View>
								) : (
									<View>
										<View className="flex-row items-center justify-between mb-4">
											<View className="flex-row items-center">
												<Text className="text-4xl mr-4">{weather.icon}</Text>
												<View>
													<Text className="text-2xl font-bold">{weather.temp}</Text>
													<Text className="text-muted-foreground text-sm">{weather.condition}</Text>
												</View>
											</View>
											{weather.advice && (
												<View className="flex-1 ml-4">
													<View className="bg-green-50 dark:bg-green-950/50 px-3 py-2 rounded-lg">
														<Text className="text-green-700 dark:text-green-300 text-xs font-medium text-right">
															{weather.advice}
														</Text>
													</View>
												</View>
											)}
										</View>
										
										{weather.forecast.length > 0 && (
											<View className="flex-row justify-between pt-4 border-t border-border">
												{weather.forecast.map((day, index) => (
													<View key={index} className="items-center flex-1">
														<Text className="text-muted-foreground text-xs mb-1">{day.day}</Text>
														<Text className="text-lg mb-1">{day.icon}</Text>
														<Text className="font-medium text-sm">{day.temp}</Text>
													</View>
												))}
											</View>
										)}
									</View>
								)}
							</View>
						</View>
					</View>
				</Animated.View>

				{/* Recommendations Widget */}
				<Animated.View 
					className="mb-6 px-4"
					style={card4AnimatedStyle}
				>
					<View className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg">
						<View className="p-6">
							<View className="flex-row justify-between items-center mb-4">
								<View className="flex-row items-center">
									<View className="w-12 h-12 bg-purple-50 dark:bg-purple-950 rounded-xl items-center justify-center mr-4">
										<Text className="text-2xl">🛒</Text>
									</View>
									<View>
										<Text className="text-lg font-semibold">Recommended</Text>
										<Text className="text-muted-foreground text-sm">Local deals for you</Text>
									</View>
								</View>
								<TouchableOpacity onPress={() => router.push("/(protected)/(tabs)/marketplace")}>
									<Text className="text-primary font-medium text-sm">See All</Text>
								</TouchableOpacity>
							</View>
							
							{loadingRecommendations ? (
								<View className="bg-muted/30 backdrop-blur-sm rounded-xl p-6 items-center">
									<View className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-pulse" />
									<Text className="text-muted-foreground text-sm mt-3">Loading recommendations...</Text>
								</View>
							) : recommendedItems.length === 0 ? (
								<View className="bg-muted/30 backdrop-blur-sm rounded-xl p-6 items-center">
									<Text className="text-3xl mb-3">🛒</Text>
									<Text className="font-medium mb-2">No Items Available</Text>
									<Text className="text-center text-muted-foreground text-sm leading-relaxed">
										Check back later for new products from local businesses
									</Text>
								</View>
							) : (
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
							)}
						</View>
					</View>
				</Animated.View>
				
				{/* FoodLoop AI Section */}
				<Animated.View 
					className="mb-6 px-4"
					style={card5AnimatedStyle}
				>
					<View className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden">
						<View className="backdrop-blur-md dark:bg-slate-800/90 p-6" style={{ backgroundColor: '#2ac76c' }}>
							<View className="flex-row items-center mb-4">
								<View className="w-12 h-12 bg-slate-700 rounded-xl items-center justify-center mr-4">
									<Image 
										source={require('../../../assets/2.png')} 
										className="w-7 h-7"
										resizeMode="contain"
									/>
								</View>
								<View className="flex-1">
									<Text className="text-white text-lg font-semibold">FoodLoop AI</Text>
									<Text className="text-slate-300 text-sm">Multiple AI models to assist you</Text>
								</View>
							</View>
							
							<Text className="text-slate-200 text-sm leading-relaxed mb-4">
								Leverage our variety of AI models to maximize your food usage, minimize waste, and optimize savings.
							</Text>
							
							<Button
								className="w-full bg-white"
								variant="secondary"
								onPress={() => router.push("/(protected)/smartplate-ai")}
							>
								<View className="flex-row items-center">
									<Text className="text-xl mr-2">🧠</Text>
									<Text className="text-slate-900 font-medium">Start AI Chat</Text>
								</View>
							</Button>
						</View>
						
						<View className="bg-muted/20 backdrop-blur-sm px-6 py-4">
							<Text className="text-center text-xs text-muted-foreground">
								Powered by Google Gemini • Helped save 245kg food waste this month
							</Text>
						</View>
					</View>
				</Animated.View>

				{/* Impact Tracker */}
				<Animated.View 
					className="mb-6 px-4"
					style={card6AnimatedStyle}
				>
					<TouchableOpacity 
						className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg"
						onPress={() => router.push("/(protected)/impact-dashboard")}
						activeOpacity={0.95}
					>
						<View className="p-6">
							<View className="flex-row items-center justify-between mb-4">
								<View className="flex-row items-center">
									<View className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 rounded-xl items-center justify-center mr-4">
										<Text className="text-2xl">🌍</Text>
									</View>
									<View>
										<Text className="text-lg font-semibold">Your Impact</Text>
										<Text className="text-muted-foreground text-sm">Environmental contribution</Text>
									</View>
								</View>
								<TouchableOpacity onPress={() => router.push("/(protected)/impact-dashboard")}>
									<Text className="text-primary font-medium text-sm">View Details</Text>
								</TouchableOpacity>
							</View>

							<View className="bg-muted/50 rounded-xl p-4">
								{realImpact.loading ? (
									<View className="items-center py-6">
										<View className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-pulse" />
										<Text className="text-muted-foreground text-sm mt-3">Loading impact data...</Text>
									</View>
								) : !realImpact.hasData ? (
									<View className="items-center py-4">
										<Text className="text-3xl mb-3">🌱</Text>
										<Text className="font-medium text-center mb-2">Start Your Journey</Text>
										<Text className="text-center text-sm text-muted-foreground leading-relaxed">
											Make your first purchase to begin tracking your environmental impact
										</Text>
									</View>
								) : (
									<View>
										<View className="flex-row justify-between mb-4">
											<View className="items-center flex-1">
												<Text className="text-xl font-bold text-green-600 dark:text-green-400">
													{realImpact.totalCO2Saved}
												</Text>
												<Text className="text-xs text-muted-foreground font-medium">kg CO₂ Saved</Text>
											</View>
											<View className="items-center flex-1">
												<Text className="text-xl font-bold text-blue-600 dark:text-blue-400">
													${realImpact.totalMoneySaved}
												</Text>
												<Text className="text-xs text-muted-foreground font-medium">Money Saved</Text>
											</View>
											<View className="items-center flex-1">
												<Text className="text-xl font-bold text-amber-600 dark:text-amber-400">
													{realImpact.totalItemsRescued}
												</Text>
												<Text className="text-xs text-muted-foreground font-medium">Items Rescued</Text>
											</View>
										</View>
										
										<View className="pt-4 border-t border-border">
											<Text className="text-center text-sm text-muted-foreground">
												Tap to explore your detailed environmental impact
											</Text>
										</View>
									</View>
								)}
							</View>
						</View>
					</TouchableOpacity>
				</Animated.View>
			</ScrollView>
		</SafeAreaView>
	);
}