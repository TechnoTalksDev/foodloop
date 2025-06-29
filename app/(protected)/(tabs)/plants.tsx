// app/(protected)/(tabs)/plants.tsx - IMPROVED VERSION

import React, { useState, useEffect } from "react";
import {
	ScrollView,
	View,
	TouchableOpacity,
	RefreshControl,
	Image,
	Alert,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { weatherService } from "@/lib/weather-service";
import { format } from "date-fns";
import { useNotifications } from "@/context/notification-provider";

interface UserPlant {
	id: string;
	plant_name: string;
	plant_type: string;
	planted_date: string;
	expected_harvest: string;
	status:
		| "seedling"
		| "growing"
		| "flowering"
		| "ready_to_harvest"
		| "harvested";
	last_checkin: string | null;
	image_url: string | null;
	notes: string | null;
}

interface WeatherRecommendation {
	action: string;
	description: string;
	icon: string;
	priority: "low" | "medium" | "high";
}

const PLANT_TYPES = [
	{
		id: "tomatoes",
		name: "Tomatoes",
		icon: "🍅",
		season: "spring",
		harvest_time: 80,
	},
	{
		id: "lettuce",
		name: "Lettuce",
		icon: "🥬",
		season: "spring",
		harvest_time: 45,
	},
	{
		id: "carrots",
		name: "Carrots",
		icon: "🥕",
		season: "spring",
		harvest_time: 70,
	},
	{
		id: "peppers",
		name: "Peppers",
		icon: "🌶️",
		season: "spring",
		harvest_time: 90,
	},
	{
		id: "herbs",
		name: "Herbs",
		icon: "🌿",
		season: "year-round",
		harvest_time: 30,
	},
	{
		id: "strawberries",
		name: "Strawberries",
		icon: "🍓",
		season: "spring",
		harvest_time: 60,
	},
];

export default function PlantsScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [weatherRecommendations, setWeatherRecommendations] = useState<
		WeatherRecommendation[]
	>([]);
	const [currentWeather, setCurrentWeather] = useState<any>(null);
	const [weatherLoading, setWeatherLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { unreadCount } = useNotifications();

	// Helper function to determine season
	const getSeason = (
		month: number,
	): "spring" | "summer" | "fall" | "winter" => {
		if (month >= 2 && month <= 4) return "spring"; // March-May
		if (month >= 5 && month <= 7) return "summer"; // June-August
		if (month >= 8 && month <= 10) return "fall"; // September-November
		return "winter"; // December-February
	};

	useEffect(() => {
		fetchUserPlants();
		fetchWeatherRecommendations();
	}, [session?.user?.id]);

	const fetchUserPlants = async () => {
		if (!session?.user?.id) {
			setLoading(false);
			return;
		}

		try {
			setError(null);

			const { data, error } = await supabase
				.from("user_plants")
				.select("*")
				.eq("user_id", session.user.id)
				.order("planted_date", { ascending: false });

			if (error) {
				console.error("Error fetching plants:", error);
				setError("Failed to load your plants. Please try again.");
				return;
			}

			setUserPlants(data || []);
		} catch (error) {
			console.error("Error in fetchUserPlants:", error);
			setError("An unexpected error occurred while loading your plants.");
		} finally {
			setLoading(false);
		}
	};

	const fetchWeatherRecommendations = async () => {
		try {
			setWeatherLoading(true);

			const weather = await weatherService.getWeatherData({
				temperatureUnit: "fahrenheit",
				forecastDays: 5,
				includeDetails: true,
			});

			setCurrentWeather(weather);

			// Generate recommendations based on weather
			const recommendations: WeatherRecommendation[] = [];

			// Get farming advice from weather service (it has proper temperature logic)
			const farmingAdvice = weatherService.getFarmingAdvice(weather);

			// Temperature-based recommendations with correct frost threshold
			if (weather.temperature <= 32) {
				recommendations.push({
					action: "Frost Warning",
					description:
						"Freezing temperatures! Protect sensitive plants and harvest what you can.",
					icon: "❄️",
					priority: "high",
				});
			} else if (weather.temperature < 40 && weather.temperature > 32) {
				recommendations.push({
					action: "Cold Weather",
					description:
						"Near-freezing temperatures. Consider protecting sensitive plants.",
					icon: "🥶",
					priority: "medium",
				});
			} else if (weather.temperature > 90) {
				recommendations.push({
					action: "Extreme Heat",
					description:
						"Very hot weather! Water plants early morning/evening and provide shade.",
					icon: "🔥",
					priority: "high",
				});
			} else if (weather.temperature > 85) {
				recommendations.push({
					action: "Hot Weather",
					description:
						"Hot conditions. Water regularly and consider afternoon shade.",
					icon: "🌡️",
					priority: "medium",
				});
			}

			// Weather condition recommendations
			if (weather.weatherCode >= 95) {
				// Thunderstorms
				recommendations.push({
					action: "Storm Warning",
					description:
						"Severe weather expected. Secure plants and avoid outdoor work.",
					icon: "⛈️",
					priority: "high",
				});
			} else if (weather.weatherCode >= 61 && weather.weatherCode <= 82) {
				// Rain
				recommendations.push({
					action: "Rainy Day",
					description:
						"Good day for indoor tasks. Rain provides natural watering!",
					icon: "🌧️",
					priority: "medium",
				});
			} else if (weather.weatherCode >= 71 && weather.weatherCode <= 86) {
				// Snow
				recommendations.push({
					action: "Snow Day",
					description: "Perfect time for planning and indoor seed starting.",
					icon: "�️",
					priority: "medium",
				});
			} else if (weather.weatherCode <= 1) {
				// Clear/sunny
				recommendations.push({
					action: "Perfect Garden Day",
					description:
						"Excellent weather for harvesting and outdoor garden work!",
					icon: "☀️",
					priority: "low",
				});
			} else if (weather.weatherCode <= 3) {
				// Partly cloudy/overcast
				recommendations.push({
					action: "Good Garden Day",
					description:
						"Great conditions for most outdoor gardening activities.",
					icon: "⛅",
					priority: "low",
				});
			}

			// Check upcoming forecast for frost warnings
			if (weather.forecast && weather.forecast.length > 0) {
				const tomorrowForecast = weather.forecast[1]; // Tomorrow
				if (tomorrowForecast && tomorrowForecast.temperatureMin <= 32) {
					recommendations.unshift({
						action: "Frost Alert Tomorrow",
						description: `Frost expected tomorrow (low: ${tomorrowForecast.temperatureMin}°F). Prepare now!`,
						icon: "⚠️",
						priority: "high",
					});
				}
			}

			// Seasonal recommendations based on current month
			const month = new Date().getMonth();
			const currentSeason = getSeason(month);

			if (
				currentSeason === "spring" &&
				weather.temperature > 50 &&
				weather.temperature < 80
			) {
				recommendations.push({
					action: "Spring Planting",
					description: "Perfect spring weather for starting new plants!",
					icon: "🌱",
					priority: "medium",
				});
			} else if (currentSeason === "summer" && weather.temperature < 85) {
				recommendations.push({
					action: "Summer Garden Care",
					description:
						"Good weather for maintenance, watering, and harvesting.",
					icon: "🌞",
					priority: "low",
				});
			} else if (currentSeason === "fall" && weather.temperature > 40) {
				recommendations.push({
					action: "Fall Harvest",
					description: "Great weather for harvesting and preparing for winter.",
					icon: "�",
					priority: "medium",
				});
			} else if (currentSeason === "winter" && weather.temperature > 45) {
				recommendations.push({
					action: "Winter Planning",
					description:
						"Mild winter day - good for planning next season and indoor tasks.",
					icon: "❄️",
					priority: "low",
				});
			}

			setWeatherRecommendations(recommendations);
		} catch (error) {
			console.error("Error fetching weather:", error);
			// Don't show error for weather, just set empty state
			setCurrentWeather(null);
			setWeatherRecommendations([]);
		} finally {
			setWeatherLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await Promise.all([fetchUserPlants(), fetchWeatherRecommendations()]);
		setRefreshing(false);
	};

	const getPlantStatusColor = (status: string) => {
		switch (status) {
			case "seedling":
				return "text-yellow-600";
			case "growing":
				return "text-green-600";
			case "flowering":
				return "text-purple-600";
			case "ready_to_harvest":
				return "text-orange-600";
			case "harvested":
				return "text-gray-600";
			default:
				return "text-gray-600";
		}
	};

	const getPlantStatusIcon = (status: string) => {
		switch (status) {
			case "seedling":
				return "🌱";
			case "growing":
				return "🌿";
			case "flowering":
				return "🌸";
			case "ready_to_harvest":
				return "🍅";
			case "harvested":
				return "📦";
			default:
				return "🌱";
		}
	};

	const getPlantTypeIcon = (plantType: string) => {
		const type = PLANT_TYPES.find((p) => p.id === plantType);
		return type?.icon || "🌱";
	};

	const canHarvest = (plant: UserPlant) => {
		return plant.status === "ready_to_harvest";
	};

	const needsCheckin = (plant: UserPlant) => {
		if (!plant.last_checkin) return true;
		const lastCheckin = new Date(plant.last_checkin);
		const now = new Date();
		const daysSince = Math.floor(
			(now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24),
		);
		return daysSince >= 1;
	};

	// Navigation functions with type casting
	const navigateToAddPlant = () => {
		router.push("/(protected)/plants/add-plant" as any);
	};

	const navigateToAICalendar = () => {
		router.push("/(protected)/plants/ai-calendar" as any);
	};

	const navigateToWeatherDetails = () => {
		router.push("/(protected)/plants/weather-details" as any);
	};

	const navigateToPlantList = () => {
		router.push("/(protected)/plants/plant-list" as any);
	};

	const navigateToPlantDetail = (plantId: string) => {
		router.push(`/(protected)/plants/plant-detail/${plantId}` as any);
	};

	const handleImageError = (plantName: string) => {
		console.log(`Failed to load image for plant: ${plantName}`);
		// Image errors are handled gracefully by showing fallback icon
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 80 }}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={["#10b981"]}
						tintColor="#10b981"
					/>
				}
			>
				{/* Header */}
				<View className="flex-row justify-between items-center px-6 py-4 mb-2">
					<TouchableOpacity
						onPress={() => router.push("/(protected)/notification-modal")}
					>
						<View className="w-11 h-11 items-center justify-center">
							<Text className="text-2xl">🔔</Text>
							{unreadCount > 0 && (
								<View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
									<Text className="text-white text-xs font-bold">
										{unreadCount > 99 ? "99+" : unreadCount}
									</Text>
								</View>
							)}
						</View>
					</TouchableOpacity>

					<H1>My Plants</H1>

					<TouchableOpacity
						onPress={() => router.push("/(protected)/(tabs)/profile")}
					>
						<View className="w-11 h-11 items-center justify-center">
							<Text className="text-2xl">👤</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Weather Section */}
				{!weatherLoading && currentWeather && (
					<View className="mx-6 mb-6 p-5 bg-secondary/40 rounded-2xl border border-border">
						<View className="flex-row items-center justify-between mb-4">
							<View className="flex-row items-center">
								<Text className="text-3xl mr-3">{currentWeather.icon}</Text>
								<View>
									<Text className="text-xl font-semibold">
										{currentWeather.temperature}°F
									</Text>
									<Text className="text-sm text-muted-foreground">
										{currentWeather.location.name}
									</Text>
								</View>
							</View>
							<TouchableOpacity
								onPress={navigateToWeatherDetails}
								className="px-3 py-2 bg-primary/10 rounded-lg"
							>
								<Text className="text-primary text-sm font-medium">
									7-Day Forecast
								</Text>
							</TouchableOpacity>
						</View>

						{weatherRecommendations.length > 0 && (
							<View className="space-y-3">
								{weatherRecommendations.slice(0, 2).map((rec, index) => (
									<View
										key={index}
										className={`flex-row items-center p-3 rounded-xl mt-2 ${
											rec.priority === "high"
												? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
												: rec.priority === "medium"
													? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
													: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
										}`}
									>
										<Text className="text-xl mr-3">{rec.icon}</Text>
										<View className="flex-1">
											<Text className="font-semibold text-sm">
												{rec.action}
											</Text>
											<Text className="text-xs text-muted-foreground leading-4 mt-1">
												{rec.description}
											</Text>
										</View>
									</View>
								))}
							</View>
						)}
					</View>
				)}

				{/* Quick Actions */}
				<View className="px-6 mb-8">
					<View className="flex-row gap-4">
						<TouchableOpacity
							className="flex-1 bg-primary py-6 px-4 rounded-2xl items-center shadow-sm"
							onPress={navigateToAddPlant}
							activeOpacity={0.8}
						>
							<Text className="text-3xl mb-3">🌱</Text>
							<Text className="text-primary-foreground font-semibold text-center text-sm">
								Add Plant
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className="flex-1 bg-green-600 py-6 px-4 rounded-2xl items-center shadow-sm"
							onPress={navigateToAICalendar}
							activeOpacity={0.8}
						>
							<Text className="text-3xl mb-3">📅</Text>
							<Text className="text-white font-semibold text-center text-sm">
								AI Calendar
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className="flex-1 bg-blue-600 py-6 px-4 rounded-2xl items-center shadow-sm"
							onPress={() => router.push("/(protected)/(tabs)/community")}
							activeOpacity={0.8}
						>
							<Text className="text-3xl mb-3">💬</Text>
							<Text className="text-white font-semibold text-center text-sm">
								Community
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Error State */}
				{error && (
					<View className="mx-6 mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
						<View className="flex-row items-center">
							<Ionicons name="warning" size={20} color="#ef4444" />
							<Text className="ml-3 text-red-600 dark:text-red-400 font-medium flex-1">
								{error}
							</Text>
						</View>
						<TouchableOpacity
							onPress={() => {
								setError(null);
								fetchUserPlants();
							}}
							className="mt-3 self-start"
						>
							<Text className="text-red-600 dark:text-red-400 text-sm font-medium underline">
								Tap to retry
							</Text>
						</TouchableOpacity>
					</View>
				)}

				{/* My Plants Section */}
				<View className="px-6 mb-6">
					<View className="flex-row items-center justify-between mb-5">
						<H3>My Plants ({userPlants.length})</H3>
						{userPlants.length > 0 && (
							<TouchableOpacity
								onPress={navigateToPlantList}
								className="px-4 py-2 bg-primary/10 rounded-lg"
							>
								<Text className="text-primary font-semibold text-sm">
									View All
								</Text>
							</TouchableOpacity>
						)}
					</View>

					{loading ? (
						<View className="items-center py-12">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="text-muted-foreground mt-3">
								Loading your plants...
							</Text>
						</View>
					) : userPlants.length === 0 ? (
						<View className="items-center py-12 px-6 bg-secondary/40 rounded-2xl">
							<Text className="text-6xl mb-4">🌱</Text>
							<Text className="text-xl font-semibold mb-3">
								Start Your Garden
							</Text>
							<Text className="text-center text-muted-foreground mb-6 leading-5">
								Add your first plant to begin tracking your garden journey and
								get personalized care recommendations
							</Text>
							<Button onPress={navigateToAddPlant} className="px-6 py-3">
								<Text className="font-semibold">Add Your First Plant</Text>
							</Button>
						</View>
					) : (
						<View>
							{userPlants.slice(0, 3).map((plant, index) => (
								<TouchableOpacity
									key={plant.id}
									className={`bg-card p-6 rounded-2xl border border-border shadow-sm ${
										index < userPlants.slice(0, 3).length - 1 ? "mb-6" : ""
									}`}
									onPress={() => navigateToPlantDetail(plant.id)}
									activeOpacity={0.8}
								>
									<View className="flex-row items-center">
										<View className="w-18 h-18 rounded-xl bg-muted items-center justify-center mr-5">
											{plant.image_url ? (
												<Image
													source={{ uri: plant.image_url }}
													className="w-18 h-18 rounded-xl"
													resizeMode="cover"
													onError={() => handleImageError(plant.plant_name)}
													defaultSource={require("@/assets/foodloop.png")}
												/>
											) : (
												<Text className="text-3xl">
													{getPlantTypeIcon(plant.plant_type)}
												</Text>
											)}
										</View>

										<View className="flex-1">
											<View className="flex-row items-center justify-between mb-2">
												<Text className="font-semibold text-lg flex-1 mr-2">
													{plant.plant_name}
												</Text>
												<View className="flex-row items-center">
													<Text className="text-base mr-2">
														{getPlantStatusIcon(plant.status)}
													</Text>
													<Text
														className={`text-sm font-semibold ${getPlantStatusColor(plant.status)}`}
													>
														{plant.status.replace("_", " ")}
													</Text>
												</View>
											</View>

											<Text className="text-sm text-muted-foreground mb-3">
												Planted{" "}
												{format(new Date(plant.planted_date), "MMM d, yyyy")}
											</Text>

											<View className="flex-row items-center justify-between">
												{needsCheckin(plant) && (
													<View className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-2 rounded-lg">
														<Text className="text-yellow-700 dark:text-yellow-300 text-xs font-semibold">
															📸 Check-in Due
														</Text>
													</View>
												)}

												{canHarvest(plant) && (
													<TouchableOpacity
														className="bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg"
														onPress={() =>
															router.push("/(protected)/(tabs)/marketplace")
														}
														activeOpacity={0.8}
													>
														<Text className="text-green-700 dark:text-green-300 text-xs font-semibold">
															🛒 Ready to Sell
														</Text>
													</TouchableOpacity>
												)}
											</View>
										</View>
									</View>
								</TouchableOpacity>
							))}
						</View>
					)}
				</View>

				{/* Marketplace Integration */}
				<View className="px-6 mb-8">
					<View className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-border">
						<View className="flex-row items-center justify-between mb-5">
							<View className="flex-1">
								<Text className="font-bold text-lg mb-1">Marketplace</Text>
								<Text className="text-sm text-muted-foreground">
									Buy seeds & supplies or sell your harvest
								</Text>
							</View>
							<Text className="text-4xl">🛒</Text>
						</View>

						<View className="flex-row gap-3">
							<TouchableOpacity
								className="flex-1 bg-green-600 py-4 px-3 rounded-xl shadow-sm"
								onPress={() => {
									router.push("/(protected)/(tabs)/marketplace");
								}}
								activeOpacity={0.8}
							>
								<Text className="text-white text-center font-semibold text-sm">
									🌱 Buy Seeds
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="flex-1 bg-orange-600 py-4 px-3 rounded-xl shadow-sm"
								onPress={() => router.push("/(protected)/create-product-modal")}
								activeOpacity={0.8}
							>
								<Text className="text-white text-center font-semibold text-sm">
									🍅 Sell Harvest
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* Garden Statistics */}
				{userPlants.length > 0 && (
					<View className="px-6 mb-8">
						<View className="bg-secondary/40 p-6 rounded-2xl border border-border">
							<H3 className="mb-5">Garden Statistics</H3>
							<View className="flex-row justify-between">
								<View className="items-center flex-1">
									<Text className="text-3xl font-bold text-green-600 mb-2">
										{
											userPlants.filter((p) => p.status === "ready_to_harvest")
												.length
										}
									</Text>
									<Text className="text-xs text-muted-foreground text-center leading-4">
										Ready to Harvest
									</Text>
								</View>
								<View className="items-center flex-1">
									<Text className="text-3xl font-bold text-blue-600 mb-2">
										{userPlants.filter((p) => p.status === "growing").length}
									</Text>
									<Text className="text-xs text-muted-foreground text-center leading-4">
										Growing
									</Text>
								</View>
								<View className="items-center flex-1">
									<Text className="text-3xl font-bold text-yellow-600 mb-2">
										{userPlants.filter((p) => needsCheckin(p)).length}
									</Text>
									<Text className="text-xs text-muted-foreground text-center leading-4">
										Need Check-in
									</Text>
								</View>
								<View className="items-center flex-1">
									<Text className="text-3xl font-bold text-purple-600 mb-2">
										{userPlants.filter((p) => p.status === "flowering").length}
									</Text>
									<Text className="text-xs text-muted-foreground text-center leading-4">
										Flowering
									</Text>
								</View>
							</View>
						</View>
					</View>
				)}

				{/* Tips Section */}
				<View className="px-6 mb-8">
					<View className="bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-900/20 dark:to-green-900/20 p-6 rounded-2xl border border-border">
						<View className="flex-row items-center justify-between mb-5">
							<View className="flex-1">
								<Text className="font-bold text-lg mb-1">💡 Garden Tips</Text>
								<Text className="text-sm text-muted-foreground">
									Smart advice for better growing
								</Text>
							</View>
							<Text className="text-4xl">🌿</Text>
						</View>

						<View className="space-y-3 mb-6">
							<Text className="text-sm leading-5">
								• Check your plants daily during growing season
							</Text>
							<Text className="text-sm leading-5">
								• Water deeply but less frequently for stronger roots
							</Text>
							<Text className="text-sm leading-5">
								• Use companion planting to naturally repel pests
							</Text>
							<Text className="text-sm leading-5">
								• Track your harvest dates to plan future plantings
							</Text>
						</View>

						<TouchableOpacity
							className="bg-primary px-5 py-3 rounded-xl self-start shadow-sm"
							onPress={() => router.push("/(protected)/smartplate-ai")}
							activeOpacity={0.8}
						>
							<Text className="text-primary-foreground font-semibold text-sm">
								🤖 Get AI Garden Advice
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
