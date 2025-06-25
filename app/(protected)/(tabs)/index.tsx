// app/(protected)/(tabs)/index.tsx - EPIC 3D FLOATING CARDS HOME SCREEN

import { router } from "expo-router";
import { Image, ScrollView, TouchableOpacity, View, Dimensions } from "react-native";
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, withDelay, withRepeat, interpolate, Extrapolation } from "react-native-reanimated";
import { LinearGradient } from 'expo-linear-gradient';
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
import { AchievementsModal } from "@/components/achievements-modal";

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

	// Epic 3D Animation Values
	const card1Float = useSharedValue(0);
	const card2Float = useSharedValue(0);
	const card3Float = useSharedValue(0);
	const card4Float = useSharedValue(0);
	const card5Float = useSharedValue(0);
	const card6Float = useSharedValue(0);
	
	const card1Rotation = useSharedValue(0);
	const card2Rotation = useSharedValue(0);
	const card3Rotation = useSharedValue(0);
	const card4Rotation = useSharedValue(0);
	const card5Rotation = useSharedValue(0);
	const card6Rotation = useSharedValue(0);

	const headerScale = useSharedValue(0.8);
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

	// Epic 3D floating animations
	useEffect(() => {
		// Header entrance
		headerOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
		headerScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));

		// Staggered floating animations for each card
		card1Float.value = withRepeat(
			withSequence(
				withTiming(-12, { duration: 3000 }),
				withTiming(8, { duration: 3000 })
			),
			-1,
			true
		);

		card2Float.value = withDelay(300, withRepeat(
			withSequence(
				withTiming(10, { duration: 2500 }),
				withTiming(-6, { duration: 2500 })
			),
			-1,
			true
		));

		card3Float.value = withDelay(600, withRepeat(
			withSequence(
				withTiming(-8, { duration: 3500 }),
				withTiming(12, { duration: 3500 })
			),
			-1,
			true
		));

		card4Float.value = withDelay(900, withRepeat(
			withSequence(
				withTiming(6, { duration: 2800 }),
				withTiming(-10, { duration: 2800 })
			),
			-1,
			true
		));

		card5Float.value = withDelay(1200, withRepeat(
			withSequence(
				withTiming(-14, { duration: 3200 }),
				withTiming(4, { duration: 3200 })
			),
			-1,
			true
		));

		card6Float.value = withDelay(1500, withRepeat(
			withSequence(
				withTiming(8, { duration: 2700 }),
				withTiming(-12, { duration: 2700 })
			),
			-1,
			true
		));

		// Subtle rotation animations
		card1Rotation.value = withRepeat(
			withSequence(
				withTiming(-2, { duration: 4000 }),
				withTiming(2, { duration: 4000 })
			),
			-1,
			true
		);

		card2Rotation.value = withDelay(500, withRepeat(
			withSequence(
				withTiming(1.5, { duration: 3500 }),
				withTiming(-1.5, { duration: 3500 })
			),
			-1,
			true
		));

		card3Rotation.value = withDelay(1000, withRepeat(
			withSequence(
				withTiming(-1, { duration: 4500 }),
				withTiming(1, { duration: 4500 })
			),
			-1,
			true
		));

		card4Rotation.value = withDelay(1500, withRepeat(
			withSequence(
				withTiming(2.5, { duration: 3000 }),
				withTiming(-2.5, { duration: 3000 })
			),
			-1,
			true
		));

		card5Rotation.value = withDelay(2000, withRepeat(
			withSequence(
				withTiming(-1.8, { duration: 3800 }),
				withTiming(1.8, { duration: 3800 })
			),
			-1,
			true
		));

		card6Rotation.value = withDelay(2500, withRepeat(
			withSequence(
				withTiming(1.2, { duration: 4200 }),
				withTiming(-1.2, { duration: 4200 })
			),
			-1,
			true
		));
	}, []);

	// Animated styles for each card with 3D effects
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
	const [achievementsModalVisible, setAchievementsModalVisible] = useState(false);
	
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
		<>
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{/* Header section */}
				<Animated.View 
					className="flex-row justify-between items-center px-4 py-3 mb-4"
					style={headerAnimatedStyle}
				>
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
				</Animated.View>

				{/* Plant Check-In Widget - 3D Floating Card */}
				<Animated.View 
					className="mx-4 mb-6"
					style={card1AnimatedStyle}
				>
					<TouchableOpacity 
						className="p-5 bg-secondary/30 rounded-2xl border border-border"
						onPress={navigateToPlants}
						activeOpacity={0.8}
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
				</Animated.View>

				{/* Achievements/Milestones Widget */}
				<TouchableOpacity 
					className="mx-4 mb-6 p-5 bg-secondary/30 rounded-2xl border border-border"
					onPress={() => setAchievementsModalVisible(true)}
					activeOpacity={0.7}
				>
					<View className="flex-row justify-between items-center mb-3">
						<View className="flex-row items-center">
							<Text className="text-xl mr-2">🏆</Text>
							<Text className="text-lg font-semibold">Milestones</Text>
						</View>
						<TouchableOpacity onPress={() => setAchievementsModalVisible(true)}>
							<Text className="text-primary font-medium text-sm">See All</Text>
						</TouchableOpacity>
					</View>
					
					{achievementsLoading ? (
						<View className="bg-secondary/50 p-4 rounded-lg items-center">
							<Text className="text-muted-foreground">Loading achievements...</Text>
						</View>
					) : nextMilestone ? (
						<View className="bg-secondary/50 p-3 rounded-lg mb-2">
							<View className="flex-row items-center mb-2">
								<Text className="text-lg mr-2">{nextMilestone.achievement.icon}</Text>
								<Text className="font-medium flex-1">{nextMilestone.achievement.name}</Text>
								<Text className="text-primary text-xs font-medium">+{nextMilestone.achievement.points}</Text>
							</View>
							<Text className="text-sm text-muted-foreground mb-2">
								{nextMilestone.achievement.description}
							</Text>
							<View className="w-full h-2 bg-secondary rounded-full overflow-hidden">
								<View className="h-2 bg-green-500 rounded-full" style={{ width: `${nextMilestone.progressPercentage}%` }} />
							</View>
							<View className="flex-row justify-between mt-1">
								<Text className="text-muted-foreground text-xs">
									{nextMilestone.current_progress} / {nextMilestone.achievement.target_value}
								</Text>
								<Text className="text-muted-foreground text-xs">{Math.round(nextMilestone.progressPercentage)}%</Text>
							</View>
						</View>
					) : (
						<View className="bg-secondary/50 p-4 rounded-lg items-center">
							<Text className="text-4xl mb-2">🎉</Text>
							<Text className="font-medium text-center mb-1">All achievements completed!</Text>
							<Text className="text-muted-foreground text-sm text-center">
								You're a FoodLoop champion!
							</Text>
						</View>
					)}
					
					<Text className="text-muted-foreground text-center mt-2">
						{achievementStats.completedCount} of {achievementStats.totalAchievements} achievements completed
					</Text>
				</TouchableOpacity>

				{/* Local Weather Widget - 3D Floating Card */}
				<Animated.View 
					className="mx-4 mb-6"
					style={card3AnimatedStyle}
				>
					<View className="p-5 bg-secondary/30 rounded-2xl border border-border">
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
				</Animated.View>

				{/* Recommendations Widget - 3D Floating Card */}
				<Animated.View 
					className="mx-4 mb-6"
					style={card4AnimatedStyle}
				>
					<View className="flex-row justify-between items-center mb-4">
						<Text className="text-lg font-semibold">Recommended For You</Text>
						<TouchableOpacity onPress={() => router.push("/(protected)/(tabs)/marketplace")}>
							<Text className="text-primary font-medium">See All</Text>
						</TouchableOpacity>
					</View>
					
					{loadingRecommendations ? (
						<View className="items-center py-8">
							<Text className="text-muted-foreground">Loading recommendations...</Text>
						</View>
					) : recommendedItems.length === 0 ? (
						<View className="items-center py-8 bg-secondary/30 rounded-xl">
							<Text className="text-4xl mb-2">🛒</Text>
							<Text className="font-semibold mb-1">No items available</Text>
							<Text className="text-center text-muted-foreground">
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
				</Animated.View>
				
				{/* SmartPlate AI section - 3D Floating Card */}
				<Animated.View 
					className="mx-4 mb-6"
					style={card5AnimatedStyle}
				>
					<View className="rounded-2xl border border-border overflow-hidden">
						<View className="bg-green-900 p-5 pb-6">
							<View className="flex-row items-center mb-3">
								<View className="w-12 h-12 bg-green-600 rounded-full items-center justify-center mr-3">
									<Image 
										source={require('../../../assets/2.png')} 
										className="w-8 h-8"
										resizeMode="contain"
									/>
								</View>
								<View>
									<H3 className="text-white">FoodLoop AI</H3>
									<Text className="text-green-100 opacity-80">Multiple AI Models to Use</Text>
								</View>
							</View>
							
							<Text className="text-green-50 mb-4">
								Use our variety of AI models to help you make the most of your food, reduce waste, and save money.
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
				</Animated.View>

				{/* Real Impact tracker - 3D Floating Card */}
				<Animated.View 
					className="mx-4 mb-12"
					style={card6AnimatedStyle}
				>
					<TouchableOpacity 
						className="p-5 bg-secondary/30 rounded-xl border border-border"
						onPress={() => router.push("/(protected)/impact-dashboard")}
						activeOpacity={0.8}
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
				</Animated.View>
				
			</ScrollView>

			{/* Tab navigation is handled by the parent layout */}
		</SafeAreaView>
		
		{/* Achievements Modal */}
		<AchievementsModal 
			visible={achievementsModalVisible}
			onClose={() => setAchievementsModalVisible(false)}
		/>
		</>
	);
}