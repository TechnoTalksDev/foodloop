// app/(protected)/(tabs)/plants.tsx - NO SUPABASE FUNCTIONS

import React, { useState, useEffect } from "react";
import {
	ScrollView,
	View,
	TouchableOpacity,
	RefreshControl,
	Image,
	Alert,
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

interface UserPlant {
	id: string;
	plant_name: string;
	plant_type: string;
	planted_date: string;
	expected_harvest: string;
	status: 'seedling' | 'growing' | 'flowering' | 'ready_to_harvest' | 'harvested';
	last_checkin: string | null;
	image_url: string | null;
	notes: string | null;
}

interface WeatherRecommendation {
	action: string;
	description: string;
	icon: string;
	priority: 'low' | 'medium' | 'high';
}

const PLANT_TYPES = [
	{ id: 'tomatoes', name: 'Tomatoes', icon: '🍅', season: 'spring', harvest_time: 80 },
	{ id: 'lettuce', name: 'Lettuce', icon: '🥬', season: 'spring', harvest_time: 45 },
	{ id: 'carrots', name: 'Carrots', icon: '🥕', season: 'spring', harvest_time: 70 },
	{ id: 'peppers', name: 'Peppers', icon: '🌶️', season: 'spring', harvest_time: 90 },
	{ id: 'herbs', name: 'Herbs', icon: '🌿', season: 'year-round', harvest_time: 30 },
	{ id: 'strawberries', name: 'Strawberries', icon: '🍓', season: 'spring', harvest_time: 60 },
];

export default function PlantsScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [weatherRecommendations, setWeatherRecommendations] = useState<WeatherRecommendation[]>([]);
	const [currentWeather, setCurrentWeather] = useState<any>(null);

	useEffect(() => {
		fetchUserPlants();
		fetchWeatherRecommendations();
	}, [session?.user?.id]);

	const fetchUserPlants = async () => {
		if (!session?.user?.id) return;

		try {
			// Direct table query - no functions
			const { data, error } = await supabase
				.from('user_plants')
				.select('*')
				.eq('user_id', session.user.id)
				.order('planted_date', { ascending: false });

			if (error) {
				console.error('Error fetching plants:', error);
				return;
			}

			setUserPlants(data || []);
		} catch (error) {
			console.error('Error in fetchUserPlants:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchWeatherRecommendations = async () => {
		try {
			const weather = await weatherService.getWeatherData({
				temperatureUnit: 'fahrenheit',
				forecastDays: 5,
				includeDetails: true
			});

			setCurrentWeather(weather);

			// Generate recommendations based on weather
			const recommendations: WeatherRecommendation[] = [];
			
			// Temperature-based recommendations
			if (weather.temperature < 35) {
				recommendations.push({
					action: 'Protect Plants',
					description: 'Frost warning! Cover sensitive plants and bring potted plants indoors.',
					icon: '❄️',
					priority: 'high'
				});
			} else if (weather.temperature > 85) {
				recommendations.push({
					action: 'Water & Shade',
					description: 'Hot weather ahead. Water early morning and provide shade.',
					icon: '🌡️',
					priority: 'high'
				});
			}

			// Weather condition recommendations
			if (weather.weatherCode >= 61 && weather.weatherCode <= 65) {
				recommendations.push({
					action: 'Indoor Tasks',
					description: 'Rainy weather perfect for planning and seed starting indoors.',
					icon: '🌧️',
					priority: 'medium'
				});
			} else if (weather.weatherCode <= 2) {
				recommendations.push({
					action: 'Perfect Garden Day',
					description: 'Great weather for planting, harvesting, and garden maintenance.',
					icon: '☀️',
					priority: 'low'
				});
			}

			// Seasonal recommendations
			const month = new Date().getMonth();
			if (month >= 2 && month <= 4) { // Spring
				recommendations.push({
					action: 'Spring Planting',
					description: 'Perfect time to start tomatoes, peppers, and herbs.',
					icon: '🌱',
					priority: 'medium'
				});
			} else if (month >= 5 && month <= 7) { // Summer
				recommendations.push({
					action: 'Summer Care',
					description: 'Focus on watering, harvesting, and pest management.',
					icon: '🌞',
					priority: 'medium'
				});
			}

			setWeatherRecommendations(recommendations);
		} catch (error) {
			console.error('Error fetching weather:', error);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await Promise.all([fetchUserPlants(), fetchWeatherRecommendations()]);
		setRefreshing(false);
	};

	const getPlantStatusColor = (status: string) => {
		switch (status) {
			case 'seedling': return 'text-yellow-600';
			case 'growing': return 'text-green-600';
			case 'flowering': return 'text-purple-600';
			case 'ready_to_harvest': return 'text-orange-600';
			case 'harvested': return 'text-gray-600';
			default: return 'text-gray-600';
		}
	};

	const getPlantStatusIcon = (status: string) => {
		switch (status) {
			case 'seedling': return '🌱';
			case 'growing': return '🌿';
			case 'flowering': return '🌸';
			case 'ready_to_harvest': return '🍅';
			case 'harvested': return '📦';
			default: return '🌱';
		}
	};

	const canHarvest = (plant: UserPlant) => {
		return plant.status === 'ready_to_harvest';
	};

	const needsCheckin = (plant: UserPlant) => {
		if (!plant.last_checkin) return true;
		const lastCheckin = new Date(plant.last_checkin);
		const now = new Date();
		const daysSince = Math.floor((now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24));
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

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
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
				<View className="flex-row justify-between items-center px-4 py-3 mb-4">
					<TouchableOpacity
						onPress={() => router.push("/(protected)/notification-modal")}
					>
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">🔔</Text>
						</View>
					</TouchableOpacity>

					<H1>My Plants</H1>

					<TouchableOpacity
						onPress={() => router.push("/(protected)/(tabs)/profile")}
					>
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">👤</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Weather Section */}
				{currentWeather && (
					<View className="mx-4 mb-6 p-4 bg-secondary/30 rounded-2xl border border-border">
						<View className="flex-row items-center justify-between mb-3">
							<View className="flex-row items-center">
								<Text className="text-2xl mr-2">{currentWeather.icon}</Text>
								<View>
									<Text className="text-lg font-semibold">
										{currentWeather.temperature}°F
									</Text>
									<Text className="text-sm text-muted-foreground">
										{currentWeather.location.name}
									</Text>
								</View>
							</View>
							<TouchableOpacity
								onPress={navigateToWeatherDetails}
							>
								<Text className="text-primary text-sm">5-Day Forecast</Text>
							</TouchableOpacity>
						</View>

						{weatherRecommendations.length > 0 && (
							<View className="space-y-2">
								{weatherRecommendations.slice(0, 2).map((rec, index) => (
									<View
										key={index}
										className={`flex-row items-center p-2 rounded-lg ${
											rec.priority === 'high'
												? 'bg-red-50 dark:bg-red-900/20'
												: rec.priority === 'medium'
												? 'bg-yellow-50 dark:bg-yellow-900/20'
												: 'bg-green-50 dark:bg-green-900/20'
										}`}
									>
										<Text className="text-lg mr-2">{rec.icon}</Text>
										<View className="flex-1">
											<Text className="font-medium text-sm">{rec.action}</Text>
											<Text className="text-xs text-muted-foreground">
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
				<View className="px-4 mb-6">
					<View className="flex-row gap-3">
						<TouchableOpacity
							className="flex-1 bg-primary p-4 rounded-xl items-center"
							onPress={navigateToAddPlant}
						>
							<Text className="text-2xl mb-2">🌱</Text>
							<Text className="text-primary-foreground font-medium">Add Plant</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className="flex-1 bg-green-600 p-4 rounded-xl items-center"
							onPress={navigateToAICalendar}
						>
							<Text className="text-2xl mb-2">📅</Text>
							<Text className="text-white font-medium">AI Calendar</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className="flex-1 bg-blue-600 p-4 rounded-xl items-center"
							onPress={() => router.push("/(protected)/(tabs)/community")}
						>
							<Text className="text-2xl mb-2">💬</Text>
							<Text className="text-white font-medium">Community</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* My Plants Section */}
				<View className="px-4 mb-6">
					<View className="flex-row items-center justify-between mb-4">
						<H3>My Plants ({userPlants.length})</H3>
						{userPlants.length > 0 && (
							<TouchableOpacity
								onPress={navigateToPlantList}
							>
								<Text className="text-primary font-medium">View All</Text>
							</TouchableOpacity>
						)}
					</View>

					{loading ? (
						<View className="items-center py-8">
							<Text className="text-muted-foreground">Loading your plants...</Text>
						</View>
					) : userPlants.length === 0 ? (
						<View className="items-center py-8 bg-secondary/30 rounded-xl">
							<Text className="text-6xl mb-4">🌱</Text>
							<Text className="text-xl font-semibold mb-2">Start Your Garden</Text>
							<Text className="text-center text-muted-foreground mb-4">
								Add your first plant to begin tracking your garden journey
							</Text>
							<Button
								onPress={navigateToAddPlant}
							>
								<Text>Add Your First Plant</Text>
							</Button>
						</View>
					) : (
						<View className="space-y-3">
							{userPlants.slice(0, 3).map((plant) => (
								<TouchableOpacity
									key={plant.id}
									className="bg-card p-4 rounded-xl border border-border"
									onPress={() => navigateToPlantDetail(plant.id)}
								>
									<View className="flex-row items-center">
										<View className="w-16 h-16 rounded-lg bg-muted items-center justify-center mr-4">
											{plant.image_url ? (
												<Image
													source={{ uri: plant.image_url }}
													className="w-16 h-16 rounded-lg"
													resizeMode="cover"
												/>
											) : (
												<Text className="text-2xl">
													{PLANT_TYPES.find(p => p.id === plant.plant_type)?.icon || '🌱'}
												</Text>
											)}
										</View>

										<View className="flex-1">
											<View className="flex-row items-center justify-between mb-1">
												<Text className="font-semibold text-base">
													{plant.plant_name}
												</Text>
												<View className="flex-row items-center">
													<Text className="text-sm mr-1">
														{getPlantStatusIcon(plant.status)}
													</Text>
													<Text className={`text-sm font-medium ${getPlantStatusColor(plant.status)}`}>
														{plant.status.replace('_', ' ')}
													</Text>
												</View>
											</View>

											<Text className="text-sm text-muted-foreground mb-2">
												Planted {format(new Date(plant.planted_date), 'MMM d, yyyy')}
											</Text>

											<View className="flex-row items-center justify-between">
												{needsCheckin(plant) && (
													<View className="bg-yellow-100 px-2 py-1 rounded">
														<Text className="text-yellow-700 text-xs font-medium">
															📸 Check-in Due
														</Text>
													</View>
												)}

												{canHarvest(plant) && (
													<TouchableOpacity
														className="bg-green-100 px-2 py-1 rounded"
														onPress={() =>
															router.push("/(protected)/(tabs)/marketplace")
														}
													>
														<Text className="text-green-700 text-xs font-medium">
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
				<View className="px-4 mb-6">
					<View className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-border">
						<View className="flex-row items-center justify-between mb-3">
							<View>
								<Text className="font-semibold text-lg">Marketplace</Text>
								<Text className="text-sm text-muted-foreground">
									Buy seeds or sell your harvest
								</Text>
							</View>
							<Text className="text-3xl">🛒</Text>
						</View>

						<View className="flex-row gap-2">
							<TouchableOpacity
								className="flex-1 bg-green-600 p-3 rounded-lg"
								onPress={() => {
									router.push("/(protected)/(tabs)/marketplace");
									// Could add search params for seeds/plants
								}}
							>
								<Text className="text-white text-center font-medium">
									🌱 Buy Seeds
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="flex-1 bg-orange-600 p-3 rounded-lg"
								onPress={() =>
									router.push("/(protected)/create-product-modal")
								}
							>
								<Text className="text-white text-center font-medium">
									🍅 Sell Harvest
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>
		</SafeAreaView>
	);
}