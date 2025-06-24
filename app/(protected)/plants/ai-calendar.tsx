// app/(protected)/plants/ai-calendar.tsx - AI POWERED VERSION

import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
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
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { weatherService } from "@/lib/weather-service";

interface CalendarEvent {
	id: string;
	plant_id: string;
	event_type: string;
	title: string;
	description: string;
	scheduled_date: string;
	completed: boolean;
	ai_generated: boolean;
	plant_name?: string;
	plant_type?: string;
}

interface UserPlant {
	id: string;
	plant_name: string;
	plant_type: string;
	planted_date: string;
	expected_harvest: string;
	status: string;
}

interface WeatherForecast {
	date: string;
	icon: string;
	temperatureMax: number;
	temperatureMin: number;
	condition: string;
}

const EVENT_ICONS = {
	water: "💧",
	fertilize: "🌱",
	prune: "✂️",
	harvest: "🍅",
	transplant: "🪴",
	pest_check: "🔍",
	custom: "📝",
};

const GEMINI_API_KEY = 'AIzaSyCB5BR0-zGxedYP3yH6V7P88_mA6oe8f0s';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export default function AICalendarScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [weatherForecast, setWeatherForecast] = useState<WeatherForecast[]>([]);
	const [selectedView, setSelectedView] = useState<'today' | 'week' | 'upcoming'>('today');
	const [generatingTasks, setGeneratingTasks] = useState(false);

	useEffect(() => {
		fetchCalendarData();
		fetchWeatherForecast();
	}, [session?.user?.id]);

	const fetchCalendarData = async () => {
		if (!session?.user?.id) return;

		try {
			// Fetch calendar events
			const { data: eventsData, error: eventsError } = await supabase
				.from("plant_calendar_events")
				.select(`
					*,
					user_plants:plant_id(plant_name, plant_type)
				`)
				.eq("user_id", session.user.id)
				.gte("scheduled_date", format(new Date(), 'yyyy-MM-dd'))
				.order("scheduled_date", { ascending: true })
				.limit(50);

			if (eventsError) {
				console.error("Error fetching calendar events:", eventsError);
			} else {
				const processedEvents = (eventsData || []).map((event: any) => ({
					...event,
					plant_name: event.user_plants?.plant_name,
					plant_type: event.user_plants?.plant_type,
				}));
				setEvents(processedEvents);
			}

			// Fetch user plants
			const { data: plantsData, error: plantsError } = await supabase
				.from("user_plants")
				.select("*")
				.eq("user_id", session.user.id);

			if (plantsError) {
				console.error("Error fetching plants:", plantsError);
			} else {
				setUserPlants(plantsData || []);
			}

		} catch (error) {
			console.error("Error in fetchCalendarData:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchWeatherForecast = async () => {
		try {
			const weather = await weatherService.getWeatherData({
				temperatureUnit: 'fahrenheit',
				forecastDays: 7,
				includeDetails: false
			});

			setWeatherForecast(weather.forecast);
		} catch (error) {
			console.error("Error fetching weather:", error);
		}
	};

	const markEventComplete = async (eventId: string) => {
		try {
			const { error } = await supabase
				.from("plant_calendar_events")
				.update({
					completed: true,
					completed_at: new Date().toISOString()
				})
				.eq("id", eventId);

			if (error) {
				console.error("Error marking event complete:", error);
				Alert.alert("Error", "Failed to mark event as complete");
				return;
			}

			// Update local state
			setEvents(events.map(event => 
				event.id === eventId 
					? { ...event, completed: true }
					: event
			));

			Alert.alert("Great job!", "Task completed successfully! 🎉");
		} catch (error) {
			console.error("Error in markEventComplete:", error);
		}
	};

	const generateAICalendarTasks = async () => {
		if (!session?.user?.id || userPlants.length === 0) {
			Alert.alert("No Plants", "Add some plants first to generate AI calendar tasks!");
			return;
		}

		setGeneratingTasks(true);
		try {
			// Get weather data
			const weatherData = await weatherService.getWeatherData({
				temperatureUnit: 'fahrenheit',
				forecastDays: 7,
				includeDetails: true
			});

			// Prepare plant and weather context for AI
			const plantsContext = userPlants.map(plant => ({
				name: plant.plant_name,
				type: plant.plant_type,
				planted_date: plant.planted_date,
				expected_harvest: plant.expected_harvest,
				status: plant.status,
				days_since_planted: Math.floor((new Date().getTime() - new Date(plant.planted_date).getTime()) / (1000 * 60 * 60 * 24))
			}));

			const weatherContext = {
				current: {
					temperature: weatherData.temperature,
					condition: weatherData.condition,
					location: weatherData.location.name
				},
				forecast: weatherData.forecast.slice(0, 5).map(day => ({
					date: day.date,
					max_temp: day.temperatureMax,
					min_temp: day.temperatureMin,
					condition: day.condition
				}))
			};

			const aiPrompt = `You are HarvestHelper AI, a plant care specialist. Based on the following user's plants and weather forecast, generate a comprehensive care schedule for the next 7 days.

USER'S PLANTS:
${JSON.stringify(plantsContext, null, 2)}

WEATHER FORECAST:
${JSON.stringify(weatherContext, null, 2)}

Generate care tasks considering:
1. Plant growth stage and typical care needs
2. Weather conditions (watering needs, protection, etc.)
3. Seasonal care requirements
4. Optimal timing for different activities

For each task, provide:
- event_type: (water, fertilize, prune, harvest, pest_check, or custom)
- title: Brief task title
- description: Detailed explanation why this task is needed
- scheduled_date: YYYY-MM-DD format (next 7 days only)
- priority: high, medium, or low

Respond ONLY with a JSON array of tasks. Each task should be specific to the user's plants and current conditions.`;

			const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					contents: [{
						role: 'user',
						parts: [{ text: aiPrompt }]
					}],
					generationConfig: {
						temperature: 0.7,
						maxOutputTokens: 2048,
					}
				}),
			});

			if (!response.ok) {
				throw new Error(`AI API Error: ${response.status}`);
			}

			const data = await response.json();
			const aiResponse = data.candidates[0].content.parts[0].text;

			// Parse AI response
			let aiTasks;
			try {
				// Extract JSON from AI response (in case it includes extra text)
				const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
				const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
				aiTasks = JSON.parse(jsonString);
			} catch (parseError) {
				console.error("Error parsing AI response:", parseError);
				throw new Error("AI response format error");
			}

			// Process and insert AI-generated tasks
			const tasksToInsert = aiTasks.map((task: any) => ({
				user_id: session.user.id,
				plant_id: plantsContext[0]?.name ? userPlants.find(p => 
					task.description.toLowerCase().includes(p.plant_name.toLowerCase()) ||
					task.description.toLowerCase().includes(p.plant_type.toLowerCase())
				)?.id || userPlants[0].id : userPlants[0].id,
				event_type: task.event_type || 'custom',
				title: task.title,
				description: task.description,
				scheduled_date: task.scheduled_date,
				ai_generated: true,
				completed: false
			}));

			// Insert tasks into database
			const { error: insertError } = await supabase
				.from("plant_calendar_events")
				.insert(tasksToInsert);

			if (insertError) {
				console.error("Error inserting AI tasks:", insertError);
				throw insertError;
			}

			// Refresh calendar
			await fetchCalendarData();

			Alert.alert(
				"AI Calendar Generated! 🤖", 
				`Generated ${tasksToInsert.length} personalized care tasks based on your plants and weather conditions.`
			);

		} catch (error) {
			console.error("Error generating AI tasks:", error);
			Alert.alert("AI Error", "Failed to generate AI calendar. Please try again.");
		} finally {
			setGeneratingTasks(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await Promise.all([fetchCalendarData(), fetchWeatherForecast()]);
		setRefreshing(false);
	};

	const getFilteredEvents = () => {
		const today = new Date();

		switch (selectedView) {
			case 'today':
				return events.filter(event => 
					isToday(new Date(event.scheduled_date))
				);
			case 'week':
				const weekEnd = new Date(today);
				weekEnd.setDate(today.getDate() + 7);
				return events.filter(event => {
					const eventDate = new Date(event.scheduled_date);
					return eventDate >= today && eventDate <= weekEnd;
				});
			case 'upcoming':
			default:
				return events.filter(event => !event.completed);
		}
	};

	const getEventStatus = (event: CalendarEvent) => {
		const eventDate = new Date(event.scheduled_date);
		
		if (event.completed) return 'completed';
		if (isPast(eventDate) && !isToday(eventDate)) return 'overdue';
		if (isToday(eventDate)) return 'today';
		if (isTomorrow(eventDate)) return 'tomorrow';
		return 'upcoming';
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'text-green-600';
			case 'overdue': return 'text-red-600';
			case 'today': return 'text-orange-600';
			case 'tomorrow': return 'text-blue-600';
			default: return 'text-gray-600';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed': return '✅';
			case 'overdue': return '⚠️';
			case 'today': return '📅';
			case 'tomorrow': return '🔜';
			default: return '📋';
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
				<TouchableOpacity onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={24} color="#666" />
				</TouchableOpacity>
				<H1 className="flex-1 text-center">AI Calendar</H1>
				<TouchableOpacity onPress={generateAICalendarTasks} disabled={generatingTasks}>
					{generatingTasks ? (
						<ActivityIndicator size="small" color="#10b981" />
					) : (
						<Ionicons name="sparkles" size={24} color="#10b981" />
					)}
				</TouchableOpacity>
			</View>

			<ScrollView
				className="flex-1"
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={["#10b981"]}
						tintColor="#10b981"
					/>
				}
			>
				{/* AI Generation Button */}
				<View className="mx-4 mt-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-900/20 dark:to-green-900/20 rounded-xl border border-border">
					<View className="flex-row items-center justify-between mb-3">
						<View>
							<Text className="font-semibold text-lg">🤖 AI Plant Calendar</Text>
							<Text className="text-sm text-muted-foreground">
								Personalized care schedule based on your plants & weather
							</Text>
						</View>
						<Text className="text-3xl">🌱</Text>
					</View>

					<Button
						onPress={generateAICalendarTasks}
						disabled={generatingTasks || userPlants.length === 0}
						className="w-full"
						variant="default"
					>
						<Text className="text-primary-foreground font-medium">
							{generatingTasks ? (
								<View className="flex-row items-center">
									<ActivityIndicator size="small" color="white" />
									<Text className="text-primary-foreground ml-2">Generating AI Tasks...</Text>
								</View>
							) : (
								"🤖 Generate AI Care Schedule"
							)}
						</Text>
					</Button>
					
					{userPlants.length === 0 && (
						<Text className="text-center text-xs text-muted-foreground mt-2">
							Add plants first to generate AI tasks
						</Text>
					)}
				</View>

				{/* Weather Forecast */}
				{weatherForecast.length > 0 && (
					<View className="mx-4 mb-6 p-4 bg-secondary/30 rounded-xl border border-border">
						<Text className="font-semibold mb-3">7-Day Weather Forecast</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							{weatherForecast.map((day, index) => (
								<View key={index} className="items-center mr-4">
									<Text className="text-xs text-muted-foreground mb-1">
										{index === 0 ? 'Today' : format(addDays(new Date(), index), 'EEE')}
									</Text>
									<Text className="text-2xl mb-1">{day.icon}</Text>
									<Text className="text-xs font-medium">
										{day.temperatureMax}°/{day.temperatureMin}°
									</Text>
								</View>
							))}
						</ScrollView>
					</View>
				)}

				{/* View Selector */}
				<View className="px-4 mb-4">
					<View className="flex-row bg-secondary/30 rounded-lg p-1">
						{(['today', 'week', 'upcoming'] as const).map((view) => (
							<TouchableOpacity
								key={view}
								onPress={() => setSelectedView(view)}
								className={`flex-1 py-2 px-4 rounded-md ${
									selectedView === view ? 'bg-primary' : ''
								}`}
							>
								<Text className={`text-center capitalize font-medium ${
									selectedView === view ? 'text-primary-foreground' : 'text-foreground'
								}`}>
									{view}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Events List */}
				<View className="px-4">
					{loading ? (
						<View className="items-center py-8">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="text-muted-foreground mt-2">Loading your calendar...</Text>
						</View>
					) : getFilteredEvents().length === 0 ? (
						<View className="items-center py-8 bg-secondary/30 rounded-xl">
							<Text className="text-4xl mb-4">📅</Text>
							<Text className="text-xl font-semibold mb-2">No tasks {selectedView === 'today' ? 'today' : 'upcoming'}</Text>
							<Text className="text-center text-muted-foreground mb-4">
								{selectedView === 'today' 
									? "You're all caught up for today! Generate AI tasks or add plants."
									: "Generate AI-powered care tasks based on your plants and weather."
								}
							</Text>
							<View className="flex-row gap-2">
								<Button
									onPress={() => router.push("/(protected)/plants/add-plant" as any)}
									variant="outline"
									size="sm"
								>
									<Text>Add Plant</Text>
								</Button>
								<Button
									onPress={generateAICalendarTasks}
									disabled={userPlants.length === 0}
									size="sm"
								>
									<Text>AI Tasks</Text>
								</Button>
							</View>
						</View>
					) : (
						<View className="space-y-3">
							{getFilteredEvents().map((event) => {
								const status = getEventStatus(event);
								const eventType = event.event_type as keyof typeof EVENT_ICONS;
								
								return (
									<View
										key={event.id}
										className={`p-4 rounded-xl border ${
											event.completed ? 'bg-green-50 border-green-200' : 'bg-card border-border'
										}`}
									>
										<View className="flex-row items-start justify-between mb-2">
											<View className="flex-row items-center flex-1">
												<Text className="text-2xl mr-3">
													{EVENT_ICONS[eventType] || EVENT_ICONS.custom}
												</Text>
												<View className="flex-1">
													<Text className={`font-semibold text-base ${
														event.completed ? 'line-through text-muted-foreground' : ''
													}`}>
														{event.title}
													</Text>
													{event.plant_name && (
														<Text className="text-sm text-muted-foreground">
															{event.plant_name}
														</Text>
													)}
												</View>
											</View>
											
											<View className="items-end">
												<View className="flex-row items-center">
													<Text className="text-sm mr-1">
														{getStatusIcon(status)}
													</Text>
													<Text className={`text-sm font-medium ${getStatusColor(status)}`}>
														{format(new Date(event.scheduled_date), 'MMM d')}
													</Text>
												</View>
												{event.ai_generated && (
													<Text className="text-xs text-purple-600 mt-1">🤖 AI</Text>
												)}
											</View>
										</View>

										{event.description && (
											<Text className="text-sm text-muted-foreground mb-3">
												{event.description}
											</Text>
										)}

										{!event.completed && status !== 'upcoming' && (
											<Button
												onPress={() => markEventComplete(event.id)}
												size="sm"
												className="self-start"
											>
												<Text className="text-primary-foreground">Mark Complete</Text>
											</Button>
										)}
									</View>
								);
							})}
						</View>
					)}
				</View>

				{/* AI Features Info */}
				<View className="px-4 mt-6 mb-6">
					<View className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-border">
						<View className="flex-row items-center justify-between mb-3">
							<View>
								<Text className="font-semibold text-lg">🧠 How AI Helps</Text>
								<Text className="text-sm text-muted-foreground">
									Smart recommendations personalized for you
								</Text>
							</View>
							<Text className="text-3xl">✨</Text>
						</View>

						<View className="space-y-2">
							<View className="flex-row items-center">
								<Text className="text-lg mr-2">🌤️</Text>
								<Text className="text-sm text-muted-foreground flex-1">
									Weather-based watering and protection advice
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="text-lg mr-2">📊</Text>
								<Text className="text-sm text-muted-foreground flex-1">
									Growth stage-specific care recommendations
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="text-lg mr-2">🕐</Text>
								<Text className="text-sm text-muted-foreground flex-1">
									Optimal timing for fertilizing, pruning & harvesting
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="text-lg mr-2">🐛</Text>
								<Text className="text-sm text-muted-foreground flex-1">
									Seasonal pest monitoring and prevention
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>
		</SafeAreaView>
	);
}