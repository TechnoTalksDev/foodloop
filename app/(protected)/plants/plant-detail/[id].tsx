// app/(protected)/plants/plant-detail/[id].tsx - FIXED IMAGE HANDLING

import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	Image,
	Alert,
	TextInput,
	Modal,
	ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { format, differenceInDays } from "date-fns";
import { useNotifications } from "@/context/notification-provider";
import { addDays } from "date-fns";

interface PlantDetail {
	id: string;
	plant_name: string;
	plant_type: string;
	planted_date: string;
	expected_harvest: string;
	status: string;
	last_checkin: string | null;
	image_url: string | null;
	notes: string | null;
}

interface CheckIn {
	id: string;
	image_url: string | null;
	notes: string | null;
	height_cm: number | null;
	health_status: string;
	created_at: string;
}

const HEALTH_STATUS_OPTIONS = [
	{ value: 'healthy', label: 'Healthy', icon: '🌱', color: 'text-green-600' },
	{ value: 'needs_attention', label: 'Needs Attention', icon: '⚠️', color: 'text-yellow-600' },
	{ value: 'sick', label: 'Sick', icon: '🤒', color: 'text-red-600' },
	{ value: 'dying', label: 'Dying', icon: '💀', color: 'text-red-800' },
];

const STATUS_COLORS = {
	seedling: 'text-yellow-600',
	growing: 'text-green-600',
	flowering: 'text-purple-600',
	ready_to_harvest: 'text-orange-600',
	harvested: 'text-gray-600',
};

const STATUS_ICONS = {
	seedling: '🌱',
	growing: '🌿',
	flowering: '🌸',
	ready_to_harvest: '🍅',
	harvested: '📦',
};

const PLANT_TYPES = [
	{ id: 'tomatoes', name: 'Tomatoes', icon: '🍅' },
	{ id: 'lettuce', name: 'Lettuce', icon: '🥬' },
	{ id: 'carrots', name: 'Carrots', icon: '🥕' },
	{ id: 'peppers', name: 'Peppers', icon: '🌶️' },
	{ id: 'herbs', name: 'Herbs', icon: '🌿' },
	{ id: 'strawberries', name: 'Strawberries', icon: '🍓' },
];

export default function PlantDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { session } = useAuth();
	const [plant, setPlant] = useState<PlantDetail | null>(null);
	const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCheckInModal, setShowCheckInModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleting, setDeleting] = useState(false);
	
	// Check-in form state
	const [checkInImage, setCheckInImage] = useState<string | null>(null);
	const [checkInNotes, setCheckInNotes] = useState("");
	const [checkInHeight, setCheckInHeight] = useState("");
	const [checkInHealth, setCheckInHealth] = useState("healthy");
	const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
	const [uploadingImage, setUploadingImage] = useState(false);
    const { addNotification } = useNotifications()

	useEffect(() => {
		if (id) {
			fetchPlantDetail();
			fetchCheckIns();
		}
	}, [id]);

	const fetchPlantDetail = async () => {
		if (!id || !session?.user?.id) return;

		try {
			const { data, error } = await supabase
				.from("user_plants")
				.select("*")
				.eq("id", id)
				.eq("user_id", session.user.id)
				.single();

			if (error) {
				console.error("Error fetching plant:", error);
				Alert.alert("Error", "Plant not found");
				router.back();
				return;
			}

			setPlant(data);
		} catch (error) {
			console.error("Error in fetchPlantDetail:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchCheckIns = async () => {
		if (!id || !session?.user?.id) return;

		try {
			const { data, error } = await supabase
				.from("plant_checkins")
				.select("*")
				.eq("plant_id", id)
				.eq("user_id", session.user.id)
				.order("created_at", { ascending: false })
				.limit(10);

			if (error) {
				console.error("Error fetching check-ins:", error);
				return;
			}

			setCheckIns(data || []);
		} catch (error) {
			console.error("Error in fetchCheckIns:", error);
		}
	};

	const handleDeletePlant = async () => {
		if (!id || !session?.user?.id) return;

		setDeleting(true);
		try {
			// Delete check-ins first
			const { error: checkinsError } = await supabase
				.from("plant_checkins")
				.delete()
				.eq("plant_id", id)
				.eq("user_id", session.user.id);

			if (checkinsError) {
				console.error("Error deleting check-ins:", checkinsError);
			}

			// Delete calendar events
			const { error: eventsError } = await supabase
				.from("plant_calendar_events")
				.delete()
				.eq("plant_id", id)
				.eq("user_id", session.user.id);

			if (eventsError) {
				console.error("Error deleting calendar events:", eventsError);
			}

			// Delete the plant
			const { error: plantError } = await supabase
				.from("user_plants")
				.delete()
				.eq("id", id)
				.eq("user_id", session.user.id);

			if (plantError) {
				console.error("Error deleting plant:", plantError);
				Alert.alert("Error", "Failed to delete plant. Please try again.");
				return;
			}

			Alert.alert(
				"Plant Deleted",
				`${plant?.plant_name || "Your plant"} has been successfully removed from your garden.`,
				[{ text: "OK", onPress: () => router.back() }]
			);

		} catch (error) {
			console.error("Error in handleDeletePlant:", error);
			Alert.alert("Error", "Failed to delete plant. Please try again.");
		} finally {
			setDeleting(false);
			setShowDeleteModal(false);
		}
	};

	const confirmDeletePlant = () => {
		Alert.alert(
			"Delete Plant",
			`Are you sure you want to delete "${plant?.plant_name}"? This will permanently remove the plant and all its check-ins. This action cannot be undone.`,
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Delete", style: "destructive", onPress: () => setShowDeleteModal(true) }
			]
		);
	};

	const requestPermissions = async () => {
		const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
		const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		
		if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
			Alert.alert("Permissions Required", "Camera and photo access are needed to take check-in photos.");
			return false;
		}
		return true;
	};

	const showImageOptions = async () => {
		const hasPermissions = await requestPermissions();
		if (!hasPermissions) return;

		Alert.alert(
			"Add Check-in Photo",
			"Choose how you'd like to add a photo",
			[
				{ text: "Take Photo", onPress: takePhoto },
				{ text: "Choose from Library", onPress: pickImage },
				{ text: "Cancel", style: "cancel" }
			]
		);
	};

	const takePhoto = async () => {
		try {
			setUploadingImage(true);
			
			const result = await ImagePicker.launchCameraAsync({
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			if (!result.canceled) {
				setCheckInImage(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error taking photo:", error);
			Alert.alert("Error", "Failed to take photo. Please try again.");
		} finally {
			setUploadingImage(false);
		}
	};

	const pickImage = async () => {
		try {
			setUploadingImage(true);
			
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			if (!result.canceled) {
				setCheckInImage(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error picking image:", error);
			Alert.alert("Error", "Failed to pick image. Please try again.");
		} finally {
			setUploadingImage(false);
		}
	};

	const uploadCheckInImage = async (imageUri: string): Promise<string | null> => {
		if (!session?.user?.id) return null;

		try {
			const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
			const fileName = `${session.user.id}_${id}_${Date.now()}.${fileExt}`;
			const filePath = `checkins/${fileName}`;

			const formData = new FormData();
			formData.append('file', {
				uri: imageUri,
				type: `image/${fileExt}`,
				name: fileName,
			} as any);

			const { data, error } = await supabase.storage
				.from('plants')
				.upload(filePath, formData, {
					cacheControl: '3600',
					upsert: false,
				});

			if (error) {
				console.error('Error uploading check-in image:', error);
				return null;
			}

			const { data: urlData } = supabase.storage
				.from('plants')
				.getPublicUrl(filePath);

			return urlData.publicUrl;

		} catch (error) {
			console.error('Error in uploadCheckInImage:', error);
			return null;
		}
	};

	const submitCheckIn = async () => {
		if (!session?.user?.id || !id) return;

		setSubmittingCheckIn(true);
		try {
			let imageUrl = null;
			if (checkInImage) {
				imageUrl = await uploadCheckInImage(checkInImage);
			}

			const heightValue = checkInHeight ? parseFloat(checkInHeight) : null;

			const { error } = await supabase
				.from("plant_checkins")
				.insert({
					user_id: session.user.id,
					plant_id: id,
					image_url: imageUrl,
					notes: checkInNotes.trim() || null,
					height_cm: heightValue,
					health_status: checkInHealth,
				});

			if (error) {
				console.error("Error submitting check-in:", error);
				Alert.alert("Error", "Failed to submit check-in. Please try again.");
				return;
			}

			// Update plant's last check-in time
			await supabase
				.from("user_plants")
				.update({ last_checkin: new Date().toISOString() })
				.eq("id", id);

			// ADD THIS: Send achievement notification
			addNotification({
				type: 'achievement',
				title: 'Plant check-in complete! 🌱',
				message: `Great job taking care of ${plant?.plant_name}. Your plant is thriving!`,
				data: { plant_id: id, achievement_type: 'check_in' },
				urgent: false,
				icon: '🎉',
				expires_at: addDays(new Date(), 3).toISOString(),
			});

			// Reset form
			setCheckInImage(null);
			setCheckInNotes("");
			setCheckInHeight("");
			setCheckInHealth("healthy");
			setShowCheckInModal(false);

			// Refresh data
			await Promise.all([fetchPlantDetail(), fetchCheckIns()]);

			Alert.alert("Check-in Complete!", "Your daily check-in has been recorded! 📸");
		} catch (error) {
			console.error("Error in submitCheckIn:", error);
			Alert.alert("Error", "Failed to submit check-in. Please try again.");
		} finally {
			setSubmittingCheckIn(false);
		}
	};

	// ADD THIS: Update plant status function to include notifications
	const updatePlantStatus = async (newStatus: string) => {
		if (!id) return;

		try {
			const { error } = await supabase
				.from("user_plants")
				.update({ status: newStatus })
				.eq("id", id);

			if (error) {
				console.error("Error updating plant status:", error);
				Alert.alert("Error", "Failed to update plant status.");
				return;
			}

			setPlant(prev => prev ? { ...prev, status: newStatus } : null);
			
			// ADD THIS: Send notification for harvest readiness
			if (newStatus === 'ready_to_harvest') {
				addNotification({
					type: 'achievement',
					title: 'Ready to Harvest! 🍅',
					message: `Your ${plant?.plant_name} is ready for harvest! Consider selling on the marketplace.`,
					data: { plant_id: id, achievement_type: 'harvest_ready' },
					urgent: false,
					icon: '🎉',
					action_url: '/(protected)/create-product-modal',
					expires_at: addDays(new Date(), 7).toISOString(),
				});

				Alert.alert(
					"Ready to Harvest! 🎉",
					"Your plant is ready for harvest! Consider selling your produce on the marketplace.",
					[
						{ text: "Later", style: "cancel" },
						{ 
							text: "Sell on Marketplace", 
							onPress: () => router.push("/(protected)/create-product-modal")
						}
					]
				);
			}
		} catch (error) {
			console.error("Error in updatePlantStatus:", error);
		}
	};

	const getDaysGrowing = () => {
		if (!plant) return 0;
		return differenceInDays(new Date(), new Date(plant.planted_date));
	};

	const getDaysUntilHarvest = () => {
		if (!plant?.expected_harvest) return null;
		return differenceInDays(new Date(plant.expected_harvest), new Date());
	};

	const canCheckIn = () => {
		if (!plant?.last_checkin) return true;
		const lastCheckIn = new Date(plant.last_checkin);
		const now = new Date();
		const hoursSince = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60));
		return hoursSince >= 20; // Allow check-in after 20 hours
	};

	const getPlantTypeIcon = (plantType: string) => {
		const type = PLANT_TYPES.find(t => t.id === plantType);
		return type?.icon || '🌱';
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#10b981" />
					<Text className="text-muted-foreground mt-2">Loading plant details...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!plant) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<Text className="text-muted-foreground">Plant not found</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
				<TouchableOpacity onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={24} color="#666" />
				</TouchableOpacity>
				<H1 className="flex-1 text-center">{plant.plant_name}</H1>
				<TouchableOpacity onPress={confirmDeletePlant}>
					<Ionicons name="trash-outline" size={24} color="#ef4444" />
				</TouchableOpacity>
			</View>

			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{/* Plant Image & Status */}
				<View className="relative">
					{plant.image_url ? (
						<Image
							source={{ uri: plant.image_url }}
							className="w-full h-64"
							resizeMode="cover"
						/>
					) : (
						<View className="w-full h-64 bg-muted items-center justify-center">
							<Text className="text-6xl">
								{getPlantTypeIcon(plant.plant_type)}
							</Text>
						</View>
					)}
					
					<View className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full">
						<Text className="text-white font-medium">
							{STATUS_ICONS[plant.status as keyof typeof STATUS_ICONS]} {plant.status.replace('_', ' ')}
						</Text>
					</View>
				</View>

				{/* Plant Info */}
				<View className="p-4">
					<View className="flex-row justify-between items-center mb-4">
						<View>
							<Text className="text-2xl font-bold">{plant.plant_name}</Text>
							<Text className="text-muted-foreground capitalize">{plant.plant_type}</Text>
						</View>
						
						{canCheckIn() && (
							<TouchableOpacity
								onPress={() => setShowCheckInModal(true)}
								className="bg-primary px-4 py-2 rounded-full"
							>
								<Text className="text-primary-foreground font-medium">📸 Check-in</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Stats */}
					<View className="flex-row justify-between mb-6">
						<View className="items-center flex-1">
							<Text className="text-2xl font-bold text-primary">{getDaysGrowing()}</Text>
							<Text className="text-sm text-muted-foreground">Days Growing</Text>
						</View>
						<View className="items-center flex-1">
							<Text className="text-2xl font-bold text-primary">
								{getDaysUntilHarvest() !== null ? getDaysUntilHarvest() : '--'}
							</Text>
							<Text className="text-sm text-muted-foreground">Days to Harvest</Text>
						</View>
						<View className="items-center flex-1">
							<Text className="text-2xl font-bold text-primary">{checkIns.length}</Text>
							<Text className="text-sm text-muted-foreground">Check-ins</Text>
						</View>
					</View>

					{/* Quick Actions */}
					<View className="flex-row gap-3 mb-6">
						<TouchableOpacity
							className="flex-1 bg-blue-600 p-3 rounded-lg"
							onPress={() => router.push("/(protected)/plants/ai-calendar" as any)}
						>
							<Text className="text-white text-center font-medium">📅 Calendar</Text>
						</TouchableOpacity>
						
						<TouchableOpacity
							className="flex-1 bg-green-600 p-3 rounded-lg"
							onPress={() => router.push("/(protected)/(tabs)/community" as any)}
						>
							<Text className="text-white text-center font-medium">💬 Community</Text>
						</TouchableOpacity>
						
						{plant.status === 'ready_to_harvest' && (
							<TouchableOpacity
								className="flex-1 bg-orange-600 p-3 rounded-lg"
								onPress={() => router.push("/(protected)/create-product-modal")}
							>
								<Text className="text-white text-center font-medium">🛒 Sell</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Status Update */}
					{plant.status !== 'harvested' && (
						<View className="bg-secondary/30 p-4 rounded-xl mb-6">
							<Text className="font-semibold mb-3">Update Plant Status</Text>
							<View className="flex-row flex-wrap gap-2">
								{Object.entries(STATUS_ICONS).map(([status, icon]) => (
									<TouchableOpacity
										key={status}
										onPress={() => updatePlantStatus(status)}
										disabled={plant.status === status}
										className={`px-3 py-2 rounded-lg border ${
											plant.status === status 
												? 'bg-primary border-primary' 
												: 'bg-background border-border'
										}`}
									>
										<Text className={`text-sm ${
											plant.status === status ? 'text-primary-foreground' : 'text-foreground'
										}`}>
											{icon} {status.replace('_', ' ')}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
					)}

					{/* Recent Check-ins */}
					<View>
						<H3 className="mb-4">Recent Check-ins</H3>
						{checkIns.length === 0 ? (
							<View className="items-center py-8 bg-secondary/30 rounded-xl">
								<Text className="text-4xl mb-2">📸</Text>
								<Text className="font-semibold mb-1">No check-ins yet</Text>
								<Text className="text-center text-muted-foreground">
									Take your first photo to track your plant's progress
								</Text>
							</View>
						) : (
							<View className="space-y-4">
								{checkIns.map((checkIn) => (
									<View key={checkIn.id} className="bg-card p-4 rounded-xl border border-border">
										<View className="flex-row items-center justify-between mb-3">
											<Text className="font-medium">
												{format(new Date(checkIn.created_at), 'MMM d, yyyy')}
											</Text>
											<View className="flex-row items-center">
												<Text className="mr-2">
													{HEALTH_STATUS_OPTIONS.find(h => h.value === checkIn.health_status)?.icon}
												</Text>
												<Text className={`text-sm font-medium ${
													HEALTH_STATUS_OPTIONS.find(h => h.value === checkIn.health_status)?.color
												}`}>
													{HEALTH_STATUS_OPTIONS.find(h => h.value === checkIn.health_status)?.label}
												</Text>
											</View>
										</View>

										{checkIn.image_url && (
											<Image
												source={{ uri: checkIn.image_url }}
												className="w-full h-48 rounded-lg mb-3"
												resizeMode="cover"
											/>
										)}

										{checkIn.height_cm && (
											<Text className="text-sm text-muted-foreground mb-2">
												📏 Height: {checkIn.height_cm} cm
											</Text>
										)}

										{checkIn.notes && (
											<Text className="text-sm">{checkIn.notes}</Text>
										)}
									</View>
								))}
							</View>
						)}
					</View>
				</View>

				{/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>

			{/* Check-in Modal */}
			<Modal
				visible={showCheckInModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowCheckInModal(false)}
			>
				<View className="flex-1 bg-black/50 items-center justify-center p-4">
					<View className="bg-background rounded-2xl p-6 w-full max-w-md max-h-[90%]">
						<View className="flex-row items-center justify-between mb-4">
							<Text className="text-xl font-bold">Daily Check-in</Text>
							<TouchableOpacity onPress={() => setShowCheckInModal(false)}>
								<Ionicons name="close" size={24} color="#666" />
							</TouchableOpacity>
						</View>

						<ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
							{/* Photo */}
							<View className="mb-4">
								<Text className="font-medium mb-2">Take a photo</Text>
								{checkInImage ? (
									<View className="relative">
										<Image
											source={{ uri: checkInImage }}
											className="w-full h-48 rounded-lg"
											resizeMode="cover"
										/>
										<TouchableOpacity
											onPress={() => setCheckInImage(null)}
											className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
										>
											<Ionicons name="close" size={16} color="white" />
										</TouchableOpacity>
									</View>
								) : (
									<TouchableOpacity
										onPress={showImageOptions}
										disabled={uploadingImage}
										className="border-2 border-dashed border-border rounded-lg p-6 items-center"
									>
										{uploadingImage ? (
											<>
												<ActivityIndicator size="large" color="#10b981" />
												<Text className="text-sm text-muted-foreground mt-2">
													Processing image...
												</Text>
											</>
										) : (
											<>
												<Ionicons name="camera" size={32} color="#999" />
												<Text className="text-sm text-muted-foreground mt-2 text-center">
													Tap to add a photo
												</Text>
											</>
										)}
									</TouchableOpacity>
								)}
							</View>

							{/* Health Status */}
							<View className="mb-4">
								<Text className="font-medium mb-2">How's your plant doing?</Text>
								<View className="flex-row flex-wrap gap-2">
									{HEALTH_STATUS_OPTIONS.map((option) => (
										<TouchableOpacity
											key={option.value}
											onPress={() => setCheckInHealth(option.value)}
											className={`px-3 py-2 rounded-lg border ${
												checkInHealth === option.value
													? 'bg-primary border-primary'
													: 'bg-background border-border'
											}`}
										>
											<Text className={`text-sm ${
												checkInHealth === option.value ? 'text-primary-foreground' : 'text-foreground'
											}`}>
												{option.icon} {option.label}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>

							{/* Height */}
							<View className="mb-4">
								<Text className="font-medium mb-2">Height (cm) - Optional</Text>
								<TextInput
									value={checkInHeight}
									onChangeText={setCheckInHeight}
									placeholder="e.g., 15.5"
									keyboardType="decimal-pad"
									className="border border-border rounded-lg px-3 py-2 text-foreground"
								/>
							</View>

							{/* Notes */}
							<View className="mb-6">
								<Text className="font-medium mb-2">Notes - Optional</Text>
								<TextInput
									value={checkInNotes}
									onChangeText={setCheckInNotes}
									placeholder="Any observations about your plant..."
									multiline
									numberOfLines={3}
									className="border border-border rounded-lg px-3 py-2 text-foreground"
									textAlignVertical="top"
								/>
							</View>
						</ScrollView>

						{/* Submit Button */}
						<Button
							onPress={submitCheckIn}
							disabled={submittingCheckIn || uploadingImage}
							className="w-full"
						>
							{submittingCheckIn || uploadingImage ? (
								<View className="flex-row items-center">
									<ActivityIndicator size="small" color="white" />
									<Text className="text-primary-foreground font-semibold ml-2">
										{uploadingImage ? "Processing..." : "Saving..."}
									</Text>
								</View>
							) : (
								<Text className="text-primary-foreground font-semibold">
									Save Check-in
								</Text>
							)}
						</Button>
					</View>
				</View>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				visible={showDeleteModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowDeleteModal(false)}
			>
				<View className="flex-1 bg-black/50 items-center justify-center p-4">
					<View className="bg-background rounded-2xl p-6 w-full max-w-sm">
						<View className="items-center mb-6">
							<View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
								<Ionicons name="warning" size={32} color="#ef4444" />
							</View>
							<Text className="text-xl font-bold text-center mb-2">Delete Plant?</Text>
							<Text className="text-center text-muted-foreground">
								This will permanently delete "{plant.plant_name}" and all its check-ins. 
								This action cannot be undone.
							</Text>
						</View>

						<View className="space-y-3">
							<Button
								onPress={handleDeletePlant}
								disabled={deleting}
								className="w-full bg-red-500"
							>
								{deleting ? (
									<View className="flex-row items-center">
										<ActivityIndicator size="small" color="white" />
										<Text className="text-white font-semibold ml-2">
											Deleting...
										</Text>
									</View>
								) : (
									<Text className="text-white font-semibold">
										Yes, Delete Plant
									</Text>
								)}
							</Button>
							
							<Button
								onPress={() => setShowDeleteModal(false)}
								disabled={deleting}
								variant="outline"
								className="w-full"
							>
								<Text>Cancel</Text>
							</Button>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}