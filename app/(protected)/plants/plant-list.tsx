// app/(protected)/plants/plant-list.tsx - NEW FILE - View All Plants

import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
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
import { format, differenceInDays } from "date-fns";

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

const PLANT_TYPES = [
	{ id: 'tomatoes', name: 'Tomatoes', icon: '🍅' },
	{ id: 'lettuce', name: 'Lettuce', icon: '🥬' },
	{ id: 'carrots', name: 'Carrots', icon: '🥕' },
	{ id: 'peppers', name: 'Peppers', icon: '🌶️' },
	{ id: 'herbs', name: 'Herbs', icon: '🌿' },
	{ id: 'strawberries', name: 'Strawberries', icon: '🍓' },
	{ id: 'spinach', name: 'Spinach', icon: '🥬' },
	{ id: 'radishes', name: 'Radishes', icon: '🔴' },
	{ id: 'beans', name: 'Beans', icon: '🫘' },
	{ id: 'cucumbers', name: 'Cucumbers', icon: '🥒' },
];

export default function PlantListScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedFilter, setSelectedFilter] = useState<string>('all');

	useEffect(() => {
		fetchUserPlants();
	}, [session?.user?.id]);

	const fetchUserPlants = async () => {
		if (!session?.user?.id) return;

		try {
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

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchUserPlants();
		setRefreshing(false);
	};

	const deletePlant = async (plantId: string, plantName: string) => {
		Alert.alert(
			"Delete Plant",
			`Are you sure you want to delete "${plantName}"? This action cannot be undone.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							const { error } = await supabase
								.from('user_plants')
								.delete()
								.eq('id', plantId);

							if (error) {
								console.error('Error deleting plant:', error);
								Alert.alert("Error", "Failed to delete plant. Please try again.");
								return;
							}

							// Remove from local state
							setUserPlants(plants => plants.filter(p => p.id !== plantId));
							Alert.alert("Deleted", `${plantName} has been removed from your garden.`);
						} catch (error) {
							console.error('Error in deletePlant:', error);
							Alert.alert("Error", "Failed to delete plant. Please try again.");
						}
					},
				},
			],
		);
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

	const getPlantTypeIcon = (plantType: string) => {
		const type = PLANT_TYPES.find(t => t.id === plantType);
		return type?.icon || '🌱';
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

	const getDaysGrowing = (plantedDate: string) => {
		return differenceInDays(new Date(), new Date(plantedDate));
	};

	const getFilteredPlants = () => {
		if (selectedFilter === 'all') return userPlants;
		return userPlants.filter(plant => plant.status === selectedFilter);
	};

	const statusFilters = [
		{ key: 'all', label: 'All Plants', icon: '🌿' },
		{ key: 'seedling', label: 'Seedlings', icon: '🌱' },
		{ key: 'growing', label: 'Growing', icon: '🌿' },
		{ key: 'flowering', label: 'Flowering', icon: '🌸' },
		{ key: 'ready_to_harvest', label: 'Ready', icon: '🍅' },
		{ key: 'harvested', label: 'Harvested', icon: '📦' },
	];

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
				<TouchableOpacity 
					onPress={() => router.back()}
					className="w-10 h-10 rounded-full bg-secondary/50 items-center justify-center"
					activeOpacity={0.8}
				>
					<Ionicons name="chevron-back" size={20} color="#666" />
				</TouchableOpacity>
				<H1 className="flex-1 text-center">All Plants ({userPlants.length})</H1>
				<TouchableOpacity 
					onPress={() => router.push("/(protected)/plants/add-plant" as any)}
					className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
					activeOpacity={0.8}
				>
					<Ionicons name="add" size={20} color="#10b981" />
				</TouchableOpacity>
			</View>

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
				{/* Filter Tabs */}
				<View className="px-6 pt-5 mb-5">
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<View className="flex-row gap-3 pr-6">
							{statusFilters.map((filter) => (
								<TouchableOpacity
									key={filter.key}
									onPress={() => setSelectedFilter(filter.key)}
									className={`px-4 py-3 rounded-full border shadow-sm ${
										selectedFilter === filter.key
											? 'bg-primary border-primary'
											: 'bg-card border-border'
									}`}
									activeOpacity={0.8}
								>
									<View className="flex-row items-center">
										<Text className="text-lg mr-2">{filter.icon}</Text>
										<Text className={`font-semibold ${
											selectedFilter === filter.key ? 'text-primary-foreground' : 'text-foreground'
										}`}>
											{filter.label}
										</Text>
									</View>
								</TouchableOpacity>
							))}
						</View>
					</ScrollView>
				</View>

				{/* Plants List */}
				<View className="px-6">
					{loading ? (
						<View className="items-center py-12">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="text-muted-foreground mt-3">Loading your plants...</Text>
						</View>
					) : getFilteredPlants().length === 0 ? (
						<View className="items-center py-12 px-6 bg-secondary/40 rounded-2xl">
							<Text className="text-6xl mb-4">🌱</Text>
							<H3 className="text-center mb-3">
								{selectedFilter === 'all' ? 'No Plants Yet' : `No ${statusFilters.find(f => f.key === selectedFilter)?.label}`}
							</H3>
							<Text className="text-center text-muted-foreground mb-6 leading-5">
								{selectedFilter === 'all' 
									? "Add your first plant to start tracking your garden journey"
									: "No plants in this category yet"
								}
							</Text>
							{selectedFilter === 'all' && (
								<Button 
									onPress={() => router.push("/(protected)/plants/add-plant" as any)}
									className="px-6 py-3"
								>
									<Text className="font-semibold">Add Your First Plant</Text>
								</Button>
							)}
						</View>
					) : (
						<View className="space-y-4">
							{getFilteredPlants().map((plant) => (
								<TouchableOpacity
									key={plant.id}
									className="bg-card p-5 rounded-2xl border border-border shadow-sm"
									onPress={() => router.push(`/(protected)/plants/plant-detail/${plant.id}` as any)}
									activeOpacity={0.8}
								>
									<View className="flex-row items-center">
										{/* Plant Image/Icon */}
										<View className="w-18 h-18 rounded-xl bg-muted items-center justify-center mr-5">
											{plant.image_url ? (
												<Image
													source={{ uri: plant.image_url }}
													className="w-18 h-18 rounded-xl"
													resizeMode="cover"
												/>
											) : (
												<Text className="text-3xl">
													{getPlantTypeIcon(plant.plant_type)}
												</Text>
											)}
										</View>

										{/* Plant Info */}
										<View className="flex-1">
											<View className="flex-row items-center justify-between mb-2">
												<Text className="font-semibold text-lg flex-1 mr-3">
													{plant.plant_name}
												</Text>
												<View className="flex-row items-center">
													<Text className="text-base mr-2">
														{getPlantStatusIcon(plant.status)}
													</Text>
													<Text className={`text-sm font-semibold ${getPlantStatusColor(plant.status)}`}>
														{plant.status.replace('_', ' ')}
													</Text>
												</View>
											</View>

											<Text className="text-sm text-muted-foreground mb-3 leading-4">
												{PLANT_TYPES.find(t => t.id === plant.plant_type)?.name || plant.plant_type} • 
												{' '}Planted {format(new Date(plant.planted_date), 'MMM d, yyyy')} • 
												{' '}{getDaysGrowing(plant.planted_date)} days growing
											</Text>

											{/* Status Indicators */}
											<View className="flex-row items-center justify-between">
												<View className="flex-row gap-2">
													{needsCheckin(plant) && (
														<View className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-2 rounded-lg">
															<Text className="text-yellow-700 dark:text-yellow-300 text-xs font-semibold">
																📸 Check-in Due
															</Text>
														</View>
													)}

													{canHarvest(plant) && (
														<View className="bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
															<Text className="text-green-700 dark:text-green-300 text-xs font-semibold">
																🍅 Ready to Harvest
															</Text>
														</View>
													)}
												</View>

												{/* Delete Button */}
												<TouchableOpacity
													onPress={(e) => {
														e.stopPropagation();
														deletePlant(plant.id, plant.plant_name);
													}}
													className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20"
													activeOpacity={0.8}
												>
													<Ionicons name="trash-outline" size={18} color="#ef4444" />
												</TouchableOpacity>
											</View>
										</View>
									</View>
								</TouchableOpacity>
							))}
						</View>
					)}
				</View>

				{/* Quick Actions */}
				{userPlants.length > 0 && (
					<View className="px-6 mt-8 mb-6">
						<H3 className="mb-5">Quick Actions</H3>
						<View className="flex-row gap-4">
							<TouchableOpacity
								className="flex-1 bg-primary p-5 rounded-2xl items-center shadow-sm"
								onPress={() => router.push("/(protected)/plants/add-plant" as any)}
								activeOpacity={0.8}
							>
								<Text className="text-3xl mb-2">🌱</Text>
								<Text className="text-primary-foreground font-semibold">Add Plant</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="flex-1 bg-green-600 p-5 rounded-2xl items-center shadow-sm"
								onPress={() => router.push("/(protected)/plants/ai-calendar" as any)}
								activeOpacity={0.8}
							>
								<Text className="text-3xl mb-2">🤖</Text>
								<Text className="text-white font-semibold">AI Calendar</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="flex-1 bg-orange-600 p-5 rounded-2xl items-center shadow-sm"
								onPress={() => router.push("/(protected)/create-product-modal")}
								activeOpacity={0.8}
							>
								<Text className="text-3xl mb-2">🛒</Text>
								<Text className="text-white font-semibold">Sell Harvest</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				{/* Stats Summary */}
				{userPlants.length > 0 && (
					<View className="px-6 mb-6">
						<View className="bg-secondary/40 p-6 rounded-2xl border border-border">
							<H3 className="mb-4">Garden Summary</H3>
							<View className="flex-row justify-between">
								<View className="items-center flex-1">
									<Text className="text-3xl font-bold text-green-500 mb-1">
										{userPlants.filter(p => p.status === 'ready_to_harvest').length}
									</Text>
									<Text className="text-xs text-muted-foreground text-center leading-4">Ready to Harvest</Text>
								</View>
								<View className="items-center flex-1">
									<Text className="text-3xl font-bold text-blue-500 mb-1">
										{userPlants.filter(p => p.status === 'growing').length}
									</Text>
									<Text className="text-xs text-muted-foreground text-center leading-4">Growing</Text>
								</View>
								<View className="items-center flex-1">
									<Text className="text-3xl font-bold text-yellow-500 mb-1">
										{userPlants.filter(p => needsCheckin(p)).length}
									</Text>
									<Text className="text-xs text-muted-foreground text-center leading-4">Need Check-in</Text>
								</View>
								<View className="items-center flex-1">
									<Text className="text-3xl font-bold text-gray-500 mb-1">
										{userPlants.filter(p => p.status === 'harvested').length}
									</Text>
									<Text className="text-xs text-muted-foreground text-center leading-4">Harvested</Text>
								</View>
							</View>
						</View>
					</View>
				)}

				{/* Bottom spacing */}
				<View className="h-24" />
			</ScrollView>
		</SafeAreaView>
	);
}