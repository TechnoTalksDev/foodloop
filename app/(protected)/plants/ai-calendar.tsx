// app/(protected)/plants/ai-calendar.tsx - NEW FILE

import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
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
import { format, isToday, isTomorrow, isPast, startOfWeek, endOfWeek, addDays } from "date-fns";
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

const EVENT_COLORS = {
	water: "bg-blue-100 text-blue-700 border-blue-200",
	fertilize: "bg-green-100 text-green-700 border-green-200",
	prune: "bg-yellow-100 text-yellow-700 border-yellow-200",
	harvest: "bg-orange-100 text-orange-700 border-orange-200",
	transplant: "bg-purple-100 text-purple-700 border-purple-200",
	pest_check: "bg-red-100 text-red-700 border-red-200",
	custom: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function AICalendarScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [weatherForecast, setWeatherForecast] = useState<WeatherForecast[]>([]);
	const [selectedView, setSelectedView] = useState<'today' | 'week' | 'upcoming'>('today');

	useEffect(() => {
		fetchCalendarEvents();
		fetchWeatherForecast();
	}, [session?.user?.id]);

	const fetchCalendarEvents = async () => {
		if (!session?.user?.id) return;

		try {
			const { data, error } = await supabase
				.from("plant_calendar_events")
				.select(`
					*,
					user_plants:plant_id(plant_name, plant_type)
				`)
				.eq("user_id", session.user.id)
				.gte("scheduled_date", format(new Date(), 'yyyy-MM-dd'))
				.order("scheduled_date", { ascending: true })
				.limit(50);

			if (error) {
				console.error("Error fetching calendar events:", error);
				return;
			}

			const processedEvents = (data || []).map((event: any) => ({
				...event,
				plant_name: event.user_plants?.plant_name,
				plant_type: event.user_plants?.plant_type,
			}));

			setEvents(processedEvents);
		} catch (error) {
			console.error("Error in fetchCalendarEvents:", error);
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

			// Show success message
			Alert.alert("Great job!", "Task completed successfully! 🎉");
		} catch (error) {
			console.error("Error in markEventComplete:", error);
		}
	};

	const generateWeatherBasedTasks = async () => {
		if (!session?.user?.id) return;

		try {
			const weather = await weatherService.getWeatherData({
				temperatureUnit: 'fahrenheit',
				forecastDays: 3,
				includeDetails: true
			});

			const newEvents = [];
			const today = new Date();

			// Generate weather-based recommendations
			if (weather.temperature < 35) {
				newEvents.push({
					user_id: session.user.id,
					event_type: 'custom',
					title: 'Frost Protection',
					description: 'Protect plants from frost - cover sensitive plants and move potted plants indoors',
					scheduled_date: format(today, 'yyyy-MM-dd'),
					ai_generated: true
				});
			}

			if (weather.forecast.some(day => day.temperatureMax > 85)) {
				newEvents.push({
					user_id: session.user.id,
					event_type: 'water',
					title: 'Extra Watering',
					description: 'Hot weather forecast - provide extra water and shade for plants',
					scheduled_date: format(addDays(today, 1), 'yyyy-MM-dd'),
					ai_generated: true
				});
			}

			// Check for rain in forecast
			const rainyDays = weather.forecast.filter(day => 
				day.weatherCode >= 61 && day.weatherCode <= 82
			);

			if (rainyDays.length > 0) {
				newEvents.push({
					user_id: session.user.id,
					event_type: 'custom',
					title: 'Indoor Garden Tasks',
					description: 'Rainy weather - perfect time for seed starting and indoor plant care',
					scheduled_date: format(addDays(today, 1), 'yyyy-MM-dd'),
					ai_generated: true
				});
			}

			if (newEvents.length > 0) {
				const { error } = await supabase
					.from("plant_calendar_events")
					.insert(newEvents);

				if (error) {
					console.error("Error generating weather tasks:", error);
					return;
				}

				await fetchCalendarEvents();
				Alert.alert("AI Recommendations", `Generated ${newEvents.length} weather-based tasks for your garden!`);
			} else {
				Alert.alert("No New Tasks", "Current weather conditions don't require any special garden tasks.");
			}
		} catch (error) {
			console.error("Error generating weather tasks:", error);
			Alert.alert("Error", "Failed to generate weather-based tasks");
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await Promise.all([fetchCalendarEvents(), fetchWeatherForecast()]);
		setRefreshing(false);
	};

	const getFilteredEvents = () => {
		const today = new Date();
		const weekStart = startOfWeek(today);
		const weekEnd = endOfWeek(today);

		switch (selectedView) {
			case 'today':
				return events.filter(event => 
					isToday(new Date(event.scheduled_date))
				);
			case 'week':
				return events.filter(event => {
					const eventDate = new Date(event.scheduled_date);
					return eventDate >= weekStart && eventDate <= weekEnd;
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
				<TouchableOpacity onPress={generateWeatherBasedTasks}>
					<Ionicons name="refresh" size={24} color="#10b981" />
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
				{/* Weather Forecast */}
				{weatherForecast.length > 0 && (
					<View className="mx-4 mt-4 mb-6 p-4 bg-secondary/30 rounded-xl border border-border">
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
							<Text className="text-muted-foreground">Loading your calendar...</Text>
						</View>
					) : getFilteredEvents().length === 0 ? (
						<View className="items-center py-8 bg-secondary/30 rounded-xl">
							<Text className="text-4xl mb-4">📅</Text>
							<Text className="text-xl font-semibold mb-2">No tasks {selectedView === 'today' ? 'today' : 'upcoming'}</Text>
							<Text className="text-center text-muted-foreground mb-4">
								{selectedView === 'today' 
									? "You're all caught up for today! Check tomorrow's tasks or add a new plant."
									: "Add plants to get AI-generated care reminders based on weather and growth stages."
								}
							</Text>
							<Button
								onPress={() => router.push("/(protected)/plants/add-plant" as any)}
								variant="outline"
							>
								<Text>Add Plant</Text>
							</Button>
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

				{/* AI Features */}
				<View className="px-4 mt-6 mb-6">
					<View className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-border">
						<View className="flex-row items-center justify-between mb-3">
							<View>
								<Text className="font-semibold text-lg">AI Garden Assistant</Text>
								<Text className="text-sm text-muted-foreground">
									Smart recommendations based on weather & plant needs
								</Text>
							</View>
							<Text className="text-3xl">🤖</Text>
						</View>

						<Button
							onPress={generateWeatherBasedTasks}
							className="w-full"
							variant="outline"
						>
							<Text>Generate Weather-Based Tasks</Text>
						</Button>
					</View>
				</View>

				{/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>
		</SafeAreaView>
	);
}