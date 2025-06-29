import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H2, H3 } from "@/components/ui/typography";
import { WeatherService, WeatherData, ForecastDay } from "@/lib/weather-service";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

interface WeatherRecommendation {
	icon: string;
	action: string;
	description: string;
	priority: "high" | "medium" | "low";
}

export default function WeatherDetailsScreen() {
	const router = useRouter();
	const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recommendations, setRecommendations] = useState<
		WeatherRecommendation[]
	>([]);

	useEffect(() => {
		fetchWeatherData();
	}, []);

	const fetchWeatherData = async () => {
		try {
			setError(null);
			const weatherService = WeatherService.getInstance();
			const weather = await weatherService.getWeatherData({
				forecastDays: 7,
				includeDetails: true,
			});
			setWeatherData(weather);
			generateRecommendations(weather);
		} catch (err) {
			console.error("Error fetching weather:", err);
			setError("Failed to load weather data. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchWeatherData();
		setRefreshing(false);
	};

	const generateRecommendations = (weather: WeatherData) => {
		const recs: WeatherRecommendation[] = [];
		const today = weather.forecast[0];
		const tomorrow = weather.forecast[1];

		// Temperature-based recommendations
		if (weather.temperature < 40) {
			recs.push({
				icon: "🥶",
				action: "Protect from Frost",
				description:
					"Cover sensitive plants or bring potted plants indoors tonight",
				priority: "high",
			});
		}

		if (weather.temperature > 85) {
			recs.push({
				icon: "☀️",
				action: "Extra Watering Needed",
				description: "Water plants early morning or evening to prevent stress",
				priority: "high",
			});
		}

		// Rain-based recommendations
		if (today.precipitationProbability && today.precipitationProbability > 70) {
			recs.push({
				icon: "🌧️",
				action: "Skip Watering Today",
				description: "Heavy rain expected - let nature do the watering",
				priority: "medium",
			});
		} else if (
			today.precipitationProbability &&
			today.precipitationProbability < 20 &&
			weather.temperature > 75
		) {
			recs.push({
				icon: "💧",
				action: "Water Your Plants",
				description: "No rain expected and warm weather - check soil moisture",
				priority: "medium",
			});
		}

		// Wind recommendations
		if (weather.windSpeed && weather.windSpeed > 20) {
			recs.push({
				icon: "💨",
				action: "Secure Tall Plants",
				description: "Strong winds expected - stake or support tall plants",
				priority: "medium",
			});
		}

		// UV recommendations
		if (weather.uvIndex && weather.uvIndex > 7) {
			recs.push({
				icon: "🕶️",
				action: "Provide Shade",
				description:
					"Very high UV - consider shade cloth for sensitive plants",
				priority: "low",
			});
		}

		// General seasonal advice
		const month = new Date().getMonth();
		if (month >= 2 && month <= 4) {
			// Spring
			recs.push({
				icon: "🌱",
				action: "Perfect Planting Weather",
				description: "Great time to start seeds and transplant seedlings",
				priority: "low",
			});
		}

		setRecommendations(recs);
	};

	const getDayName = (date: string, index: number) => {
		if (index === 0) return "Today";
		if (index === 1) return "Tomorrow";
		return format(new Date(date), "EEEE");
	};

	const getDetailedCondition = (forecast: ForecastDay) => {
		let condition = forecast.condition;
		if (forecast.precipitationProbability) {
			condition += ` • ${forecast.precipitationProbability}% chance of rain`;
		}
		return condition;
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color="#000" />
					</TouchableOpacity>
					<H1>Weather Forecast</H1>
					<View className="w-6" />
				</View>
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#10b981" />
					<Text className="text-muted-foreground mt-3">
						Loading weather forecast...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !weatherData) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color="#000" />
					</TouchableOpacity>
					<H1>Weather Forecast</H1>
					<View className="w-6" />
				</View>
				<View className="flex-1 justify-center items-center px-6">
					<Text className="text-6xl mb-4">⚠️</Text>
					<Text className="text-xl font-semibold mb-3 text-center">
						Weather Unavailable
					</Text>
					<Text className="text-center text-muted-foreground mb-6 leading-5">
						{error || "Unable to load weather data"}
					</Text>
					<TouchableOpacity
						onPress={fetchWeatherData}
						className="bg-primary px-6 py-3 rounded-xl"
					>
						<Text className="text-primary-foreground font-semibold">
							Try Again
						</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
				<TouchableOpacity onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color="#000" />
				</TouchableOpacity>
				<H1>Weather Forecast</H1>
				<TouchableOpacity onPress={onRefresh}>
					<Ionicons name="refresh" size={24} color="#000" />
				</TouchableOpacity>
			</View>

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
				{/* Current Weather */}
				<View className="mx-6 mt-6 mb-6 p-6 bg-secondary/40 rounded-2xl border border-border">
					<View className="items-center mb-6">
						<Text className="text-6xl mb-3">{weatherData.icon}</Text>
						<Text className="text-4xl font-bold mb-2">
							{weatherData.temperature}°F
						</Text>
						<Text className="text-lg text-muted-foreground mb-1">
							{weatherData.condition}
						</Text>
						<Text className="text-sm text-muted-foreground">
							{weatherData.location.name}
						</Text>
					</View>

					{/* Current Weather Details */}
					{weatherData.humidity && (
						<View className="flex-row justify-between pt-6 border-t border-border">
							<View className="items-center flex-1">
								<Text className="text-sm text-muted-foreground mb-1">
									Feels Like
								</Text>
								<Text className="font-semibold">
									{weatherData.feelsLike}°F
								</Text>
							</View>
							<View className="items-center flex-1">
								<Text className="text-sm text-muted-foreground mb-1">
									Humidity
								</Text>
								<Text className="font-semibold">{weatherData.humidity}%</Text>
							</View>
							<View className="items-center flex-1">
								<Text className="text-sm text-muted-foreground mb-1">
									Wind Speed
								</Text>
								<Text className="font-semibold">
									{weatherData.windSpeed} mph
								</Text>
							</View>
							<View className="items-center flex-1">
								<Text className="text-sm text-muted-foreground mb-1">
									UV Index
								</Text>
								<Text className="font-semibold">{weatherData.uvIndex}</Text>
							</View>
						</View>
					)}
				</View>

				{/* Garden Recommendations */}
				{recommendations.length > 0 && (
					<View className="mx-6 mb-6">
						<H2 className="mb-4">🌱 Garden Recommendations</H2>
						<View className="space-y-3">
							{recommendations.map((rec, index) => (
								<View
									key={index}
									className={`flex-row items-center p-4 rounded-xl ${
										rec.priority === "high"
											? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
											: rec.priority === "medium"
												? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
												: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
									}`}
								>
									<Text className="text-2xl mr-4">{rec.icon}</Text>
									<View className="flex-1">
										<Text className="font-semibold mb-1">{rec.action}</Text>
										<Text className="text-sm text-muted-foreground leading-5">
											{rec.description}
										</Text>
									</View>
								</View>
							))}
						</View>
					</View>
				)}

				{/* 7-Day Forecast */}
				<View className="mx-6 mb-6">
					<H2 className="mb-4">📅 7-Day Forecast</H2>
					<View className="bg-card rounded-2xl border border-border overflow-hidden">
						{weatherData.forecast.slice(0, 7).map((day, index) => (
							<View
								key={day.date}
								className={`flex-row items-center p-5 ${
									index < 6 ? "border-b border-border" : ""
								} ${index === 0 ? "bg-primary/5" : ""}`}
							>
								<View className="flex-1">
									<Text className="font-semibold text-base mb-1">
										{getDayName(day.date, index)}
									</Text>
									<Text className="text-sm text-muted-foreground">
										{format(new Date(day.date), "MMM d")}
									</Text>
								</View>

								<View className="items-center mx-4">
									<Text className="text-3xl mb-1">{day.icon}</Text>
									<Text className="text-xs text-muted-foreground text-center">
										{day.condition}
									</Text>
								</View>

								<View className="items-end">
									<View className="flex-row items-center">
										<Text className="font-bold text-lg mr-2">
											{day.temperatureMax}°
										</Text>
										<Text className="text-muted-foreground">
											{day.temperatureMin}°
										</Text>
									</View>
									{day.precipitationProbability && (
										<Text className="text-xs text-blue-600 mt-1">
											{day.precipitationProbability}% rain
										</Text>
									)}
								</View>
							</View>
						))}
					</View>
				</View>

				{/* Gardening Tips */}
				<View className="mx-6 mb-6">
					<View className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-border">
						<View className="flex-row items-center mb-4">
							<Text className="text-3xl mr-3">💡</Text>
							<View>
								<Text className="font-bold text-lg">Weather-Based Tips</Text>
								<Text className="text-sm text-muted-foreground">
									Optimize your garden care
								</Text>
							</View>
						</View>

						<View className="space-y-3">
							<Text className="text-sm leading-5">
								• Check soil moisture before watering - weather affects
								evaporation rates
							</Text>
							<Text className="text-sm leading-5">
								• Use weather forecasts to plan harvesting before storms
							</Text>
							<Text className="text-sm leading-5">
								• Cover plants when frost is predicted (below 35°F)
							</Text>
							<Text className="text-sm leading-5">
								• Take advantage of cooler, overcast days for transplanting
							</Text>
						</View>
					</View>
				</View>

				{/* Data Source */}
				<View className="mx-6 mb-6">
					<View className="bg-muted/30 p-4 rounded-xl">
						<Text className="text-xs text-muted-foreground text-center">
							Weather data provided by Open-Meteo • Updated{" "}
							{format(new Date(), "h:mm a")}
						</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
