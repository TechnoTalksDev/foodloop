// app/(protected)/plants/add-plant.tsx - FIXED IMAGE HANDLING

import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	TextInput,
	Alert,
	Image,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { format } from "date-fns";

interface PlantType {
	id: string;
	name: string;
	emoji: string;
	season: string;
	harvest_time_days: number;
}

const DEFAULT_PLANT_TYPES: PlantType[] = [
	{
		id: "tomatoes",
		name: "Tomatoes",
		emoji: "🍅",
		season: "spring",
		harvest_time_days: 80,
	},
	{
		id: "lettuce",
		name: "Lettuce",
		emoji: "🥬",
		season: "spring",
		harvest_time_days: 45,
	},
	{
		id: "carrots",
		name: "Carrots",
		emoji: "🥕",
		season: "spring",
		harvest_time_days: 70,
	},
	{
		id: "peppers",
		name: "Peppers",
		emoji: "🌶️",
		season: "spring",
		harvest_time_days: 90,
	},
	{
		id: "herbs",
		name: "Herbs",
		emoji: "🌿",
		season: "year-round",
		harvest_time_days: 30,
	},
	{
		id: "strawberries",
		name: "Strawberries",
		emoji: "🍓",
		season: "spring",
		harvest_time_days: 60,
	},
	{
		id: "spinach",
		name: "Spinach",
		emoji: "🥬",
		season: "spring",
		harvest_time_days: 40,
	},
	{
		id: "radishes",
		name: "Radishes",
		emoji: "🔴",
		season: "spring",
		harvest_time_days: 25,
	},
	{
		id: "beans",
		name: "Beans",
		emoji: "🫘",
		season: "spring",
		harvest_time_days: 55,
	},
	{
		id: "cucumbers",
		name: "Cucumbers",
		emoji: "🥒",
		season: "spring",
		harvest_time_days: 55,
	},
];

export default function AddPlantScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [plantTypes, setPlantTypes] =
		useState<PlantType[]>(DEFAULT_PLANT_TYPES);
	const [selectedType, setSelectedType] = useState<string>("");
	const [plantName, setPlantName] = useState("");
	const [plantedDate, setPlantedDate] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [loading, setLoading] = useState(false);
	const [uploadingImage, setUploadingImage] = useState(false);

	useEffect(() => {
		fetchPlantTypes();
	}, []);

	const fetchPlantTypes = async () => {
		try {
			const { data, error } = await supabase
				.from("plant_types")
				.select("*")
				.order("name");

			if (error) {
				console.error("Error fetching plant types:", error);
				return;
			}

			if (data && data.length > 0) {
				setPlantTypes(data);
			}
		} catch (error) {
			console.error("Error in fetchPlantTypes:", error);
		}
	};

	const requestPermissions = async () => {
		const { status: cameraStatus } =
			await ImagePicker.requestCameraPermissionsAsync();
		const { status: mediaStatus } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (cameraStatus !== "granted" || mediaStatus !== "granted") {
			Alert.alert(
				"Permissions Required",
				"Camera and photo library access are needed to add plant photos.",
				[{ text: "OK" }],
			);
			return false;
		}
		return true;
	};

	const showImageOptions = async () => {
		const hasPermissions = await requestPermissions();
		if (!hasPermissions) return;

		Alert.alert(
			"Add Plant Photo",
			"Choose how you'd like to add a photo of your plant",
			[
				{ text: "Take Photo", onPress: takePhoto },
				{ text: "Choose from Library", onPress: pickImage },
				{ text: "Cancel", style: "cancel" },
			],
		);
	};

	const takePhoto = async () => {
		try {
			setUploadingImage(true);

			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			if (!result.canceled) {
				setImageUri(result.assets[0].uri);
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
				aspect: [1, 1],
				quality: 0.8,
			});

			if (!result.canceled) {
				setImageUri(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error picking image:", error);
			Alert.alert("Error", "Failed to pick image. Please try again.");
		} finally {
			setUploadingImage(false);
		}
	};

	const uploadImageToSupabase = async (uri: string): Promise<string | null> => {
		if (!session?.user?.id) return null;

		try {
			// Create a unique filename
			const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
			const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
			const filePath = `plants/${fileName}`;

			// Create FormData for upload
			const formData = new FormData();
			formData.append("file", {
				uri: uri,
				type: `image/${fileExt}`,
				name: fileName,
			} as any);

			// Upload using fetch with FormData
			const { data, error } = await supabase.storage
				.from("plants")
				.upload(filePath, formData, {
					cacheControl: "3600",
					upsert: false,
				});

			if (error) {
				console.error("Supabase upload error:", error);
				return null;
			}

			// Get public URL
			const { data: urlData } = supabase.storage
				.from("plants")
				.getPublicUrl(filePath);

			return urlData.publicUrl;
		} catch (error) {
			console.error("Error uploading image:", error);
			return null;
		}
	};

	const calculateExpectedHarvest = (
		plantedDate: Date,
		plantType: string,
	): string => {
		const selectedPlantType = plantTypes.find((p) => p.id === plantType);
		if (!selectedPlantType) return format(new Date(), "yyyy-MM-dd");

		const harvestDate = new Date(plantedDate);
		harvestDate.setDate(
			harvestDate.getDate() + selectedPlantType.harvest_time_days,
		);
		return format(harvestDate, "yyyy-MM-dd");
	};

	const handleSavePlant = async () => {
		if (!selectedType || !plantName.trim()) {
			Alert.alert(
				"Missing Information",
				"Please select a plant type and enter a name.",
			);
			return;
		}

		if (!session?.user?.id) {
			Alert.alert("Error", "You must be logged in to add plants.");
			return;
		}

		setLoading(true);
		try {
			console.log("Starting plant save process...");

			let imageUrl = null;
			if (imageUri) {
				console.log("Uploading image...");
				setUploadingImage(true);
				imageUrl = await uploadImageToSupabase(imageUri);
				setUploadingImage(false);

				if (!imageUrl) {
					console.log("Image upload failed, proceeding without image");
				}
			}

			const expectedHarvest = calculateExpectedHarvest(
				plantedDate,
				selectedType,
			);

			console.log("Saving plant to database...");
			const { error } = await supabase.from("user_plants").insert({
				user_id: session.user.id,
				plant_name: plantName.trim(),
				plant_type: selectedType,
				planted_date: format(plantedDate, "yyyy-MM-dd"),
				expected_harvest: expectedHarvest,
				notes: notes.trim() || null,
				image_url: imageUrl,
				status: "seedling",
			});

			if (error) {
				console.error("Error adding plant:", error);
				Alert.alert("Database Error", "Failed to add plant. Please try again.");
				return;
			}

			console.log("Plant saved successfully!");
			Alert.alert(
				"Plant Added! 🌱",
				"Your plant has been added successfully. Check your AI calendar for care reminders!",
				[
					{
						text: "OK",
						onPress: () => router.back(),
					},
				],
			);
		} catch (error) {
			console.error("Error in handleSavePlant:", error);
			Alert.alert("Error", "Failed to add plant. Please try again.");
		} finally {
			setLoading(false);
			setUploadingImage(false);
		}
	};

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
				<H1 className="flex-1 text-center">Add Plant</H1>
				<View className="w-10" />
			</View>

			<ScrollView
				className="flex-1 px-6 py-6"
				showsVerticalScrollIndicator={false}
			>
				{/* Plant Type Selection */}
				<View className="mb-8">
					<Text className="text-lg font-semibold mb-4">
						What are you growing?
					</Text>
					<View className="flex-row flex-wrap gap-3">
						{plantTypes.map((type) => (
							<TouchableOpacity
								key={type.id}
								onPress={() => setSelectedType(type.id)}
								className={`p-4 rounded-2xl border-2 shadow-sm ${
									selectedType === type.id
										? "border-primary bg-primary/10"
										: "border-border bg-secondary/30"
								}`}
								activeOpacity={0.8}
							>
								<Text className="text-3xl text-center mb-2">{type.emoji}</Text>
								<Text
									className={`text-sm text-center font-semibold ${
										selectedType === type.id
											? "text-primary"
											: "text-foreground"
									}`}
								>
									{type.name}
								</Text>
								<Text className="text-xs text-center text-muted-foreground mt-1">
									{type.harvest_time_days} days
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Plant Name */}
				<View className="mb-8">
					<Text className="text-lg font-semibold mb-4">Give it a name</Text>
					<TextInput
						value={plantName}
						onChangeText={setPlantName}
						placeholder="e.g., My Cherry Tomatoes"
						className="border border-border rounded-xl px-5 py-4 text-base text-foreground bg-background"
						placeholderTextColor="#999"
					/>
				</View>

				{/* Planted Date */}
				<View className="mb-8">
					<Text className="text-lg font-semibold mb-4">
						When did you plant it?
					</Text>
					<TouchableOpacity
						onPress={() => setShowDatePicker(true)}
						className="flex-row items-center border border-border rounded-xl px-5 py-4 bg-card"
						activeOpacity={0.8}
					>
						<Ionicons
							name="calendar-outline"
							size={22}
							color="#666"
							style={{ marginRight: 15 }}
						/>
						<Text className="text-base text-foreground font-medium">
							{format(plantedDate, "MMMM d, yyyy")}
						</Text>
					</TouchableOpacity>

					<DateTimePickerModal
						isVisible={showDatePicker}
						mode="date"
						date={plantedDate}
						onConfirm={(date) => {
							setPlantedDate(date);
							setShowDatePicker(false);
						}}
						onCancel={() => setShowDatePicker(false)}
						maximumDate={new Date()}
					/>
				</View>

				{/* Photo Section */}
				<View className="mb-8">
					<Text className="text-lg font-semibold mb-4">
						Add a photo (optional)
					</Text>

					{imageUri ? (
						<View className="relative">
							<Image
								source={{ uri: imageUri }}
								className="w-full h-64 rounded-2xl"
								resizeMode="cover"
							/>
							<TouchableOpacity
								onPress={() => setImageUri(null)}
								className="absolute top-3 right-3 bg-red-500 rounded-full p-2 shadow-lg"
								activeOpacity={0.8}
							>
								<Ionicons name="close" size={18} color="white" />
							</TouchableOpacity>
							<TouchableOpacity
								onPress={showImageOptions}
								className="absolute bottom-3 right-3 bg-primary rounded-full p-3 shadow-lg"
								activeOpacity={0.8}
							>
								<Ionicons name="camera" size={18} color="white" />
							</TouchableOpacity>
						</View>
					) : (
						<TouchableOpacity
							onPress={showImageOptions}
							disabled={uploadingImage}
							className="border-2 border-dashed border-border rounded-2xl p-12 items-center bg-secondary/20"
							activeOpacity={0.8}
						>
							{uploadingImage ? (
								<>
									<ActivityIndicator size="large" color="#10b981" />
									<Text className="text-center text-muted-foreground mt-3 font-medium">
										Processing image...
									</Text>
								</>
							) : (
								<>
									<Ionicons name="camera" size={48} color="#999" />
									<Text className="text-center text-muted-foreground mt-3 font-medium">
										Tap to add a photo of your plant
									</Text>
									<Text className="text-center text-xs text-muted-foreground mt-2 leading-4">
										Photos help track growth progress over time
									</Text>
								</>
							)}
						</TouchableOpacity>
					)}
				</View>

				{/* Notes */}
				<View className="mb-8">
					<Text className="text-lg font-semibold mb-4">Notes (optional)</Text>
					<TextInput
						value={notes}
						onChangeText={setNotes}
						placeholder="Any special notes about your plant..."
						multiline
						numberOfLines={4}
						className="border border-border rounded-xl px-5 py-4 text-base text-foreground bg-background"
						placeholderTextColor="#999"
						textAlignVertical="top"
					/>
				</View>

				{/* Expected Harvest Info */}
				{selectedType && (
					<View className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
						<Text className="text-green-700 dark:text-green-300 font-medium mb-2">
							🌱 Expected Harvest
						</Text>
						<Text className="text-green-600 dark:text-green-400 text-sm">
							Based on typical growing time, you can expect to harvest around{" "}
							{format(
								new Date(calculateExpectedHarvest(plantedDate, selectedType)),
								"MMMM d, yyyy",
							)}
						</Text>
					</View>
				)}

				{/* Save Button */}
				<Button
					onPress={handleSavePlant}
					disabled={
						loading || uploadingImage || !selectedType || !plantName.trim()
					}
					className="w-full mb-6"
				>
					{loading || uploadingImage ? (
						<View className="flex-row items-center">
							<ActivityIndicator size="small" color="white" />
							<Text className="text-primary-foreground font-semibold ml-2">
								{uploadingImage ? "Uploading image..." : "Adding Plant..."}
							</Text>
						</View>
					) : (
						<Text className="text-primary-foreground font-semibold">
							Add Plant
						</Text>
					)}
				</Button>

				{/* Help Text */}
				<View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
					<Text className="text-blue-700 dark:text-blue-300 text-sm">
						💡 After adding your plant, check the AI Calendar for automated care
						reminders based on your plant type and local weather conditions.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
