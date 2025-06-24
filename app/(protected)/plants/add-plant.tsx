// app/(protected)/plants/add-plant.tsx - FIXED VERSION

import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	TextInput,
	Alert,
	Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { format } from "date-fns";
import { decode } from "base64-arraybuffer";

interface PlantType {
	id: string;
	name: string;
	emoji: string;
	season: string;
	harvest_time_days: number;
}

const DEFAULT_PLANT_TYPES: PlantType[] = [
	{ id: 'tomatoes', name: 'Tomatoes', emoji: '🍅', season: 'spring', harvest_time_days: 80 },
	{ id: 'lettuce', name: 'Lettuce', emoji: '🥬', season: 'spring', harvest_time_days: 45 },
	{ id: 'carrots', name: 'Carrots', emoji: '🥕', season: 'spring', harvest_time_days: 70 },
	{ id: 'peppers', name: 'Peppers', emoji: '🌶️', season: 'spring', harvest_time_days: 90 },
	{ id: 'herbs', name: 'Herbs', emoji: '🌿', season: 'year-round', harvest_time_days: 30 },
	{ id: 'strawberries', name: 'Strawberries', emoji: '🍓', season: 'spring', harvest_time_days: 60 },
	{ id: 'spinach', name: 'Spinach', emoji: '🥬', season: 'spring', harvest_time_days: 40 },
	{ id: 'radishes', name: 'Radishes', emoji: '🔴', season: 'spring', harvest_time_days: 25 },
	{ id: 'beans', name: 'Beans', emoji: '🫘', season: 'spring', harvest_time_days: 55 },
	{ id: 'cucumbers', name: 'Cucumbers', emoji: '🥒', season: 'spring', harvest_time_days: 55 },
];

export default function AddPlantScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [plantTypes, setPlantTypes] = useState<PlantType[]>(DEFAULT_PLANT_TYPES);
	const [selectedType, setSelectedType] = useState<string>("");
	const [plantName, setPlantName] = useState("");
	const [plantedDate, setPlantedDate] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [image, setImage] = useState<string | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [loading, setLoading] = useState(false);

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
				// Use default plant types if database fetch fails
				return;
			}

			if (data && data.length > 0) {
				setPlantTypes(data);
			}
		} catch (error) {
			console.error("Error in fetchPlantTypes:", error);
			// Keep using default plant types
		}
	};

	const pickImage = async () => {
		try {
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			
			if (status !== "granted") {
				Alert.alert("Permission needed", "Please grant camera roll permissions to upload images.");
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.7,
			});

			if (!result.canceled) {
				setImage(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error picking image:", error);
			Alert.alert("Error", "Failed to pick image. Please try again.");
		}
	};

	const uploadImage = async (imageUri: string): Promise<string | null> => {
		try {
			console.log("Starting image upload...");
			
			// Read the file as base64
			const base64 = await FileSystem.readAsStringAsync(imageUri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			// Generate unique filename
			const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
			const fileName = `plants/${session?.user?.id}/${Date.now()}.${fileExt}`;

			console.log("Uploading to:", fileName);

			// Convert base64 to ArrayBuffer and upload
			const { data, error } = await supabase.storage
				.from('plant-images')
				.upload(fileName, decode(base64), {
					contentType: `image/${fileExt}`,
					upsert: false,
				});

			if (error) {
				console.error('Error uploading image:', error);
				throw error;
			}

			console.log("Upload successful:", data);

			// Get public URL
			const { data: urlData } = supabase.storage
				.from('plant-images')
				.getPublicUrl(fileName);

			console.log("Public URL:", urlData.publicUrl);
			return urlData.publicUrl;

		} catch (error) {
			console.error('Error in uploadImage:', error);
			Alert.alert("Upload Error", "Failed to upload image. Please try again.");
			return null;
		}
	};

	const calculateExpectedHarvest = (plantedDate: Date, plantType: string): string => {
		const selectedPlantType = plantTypes.find(p => p.id === plantType);
		if (!selectedPlantType) return format(new Date(), 'yyyy-MM-dd');
		
		const harvestDate = new Date(plantedDate);
		harvestDate.setDate(harvestDate.getDate() + selectedPlantType.harvest_time_days);
		return format(harvestDate, 'yyyy-MM-dd');
	};

	const handleSavePlant = async () => {
		if (!selectedType || !plantName.trim()) {
			Alert.alert("Missing Information", "Please select a plant type and enter a name.");
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
			if (image) {
				console.log("Uploading image...");
				imageUrl = await uploadImage(image);
				if (!imageUrl) {
					// Image upload failed, but we can still save the plant without image
					console.log("Image upload failed, proceeding without image");
				}
			}

			const expectedHarvest = calculateExpectedHarvest(plantedDate, selectedType);

			console.log("Saving plant to database...");
			const { error } = await supabase
				.from("user_plants")
				.insert({
					user_id: session.user.id,
					plant_name: plantName.trim(),
					plant_type: selectedType,
					planted_date: format(plantedDate, 'yyyy-MM-dd'),
					expected_harvest: expectedHarvest,
					notes: notes.trim() || null,
					image_url: imageUrl,
					status: 'seedling'
				});

			if (error) {
				console.error("Error adding plant:", error);
				Alert.alert("Database Error", "Failed to add plant. Please try again.");
				return;
			}

			console.log("Plant saved successfully!");
			Alert.alert(
				"Plant Added!",
				"Your plant has been added successfully. Check your AI calendar for care reminders!",
				[
					{
						text: "OK",
						onPress: () => router.back()
					}
				]
			);
		} catch (error) {
			console.error("Error in handleSavePlant:", error);
			Alert.alert("Error", "Failed to add plant. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
				<TouchableOpacity onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={24} color="#666" />
				</TouchableOpacity>
				<H1 className="flex-1 text-center">Add Plant</H1>
				<View className="w-6" />
			</View>

			<ScrollView className="flex-1 px-4 py-6">
				{/* Plant Type Selection */}
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">What are you growing?</Text>
					<View className="flex-row flex-wrap gap-3">
						{plantTypes.map((type) => (
							<TouchableOpacity
								key={type.id}
								onPress={() => setSelectedType(type.id)}
								className={`p-3 rounded-xl border-2 ${
									selectedType === type.id
										? "border-primary bg-primary/10"
										: "border-border bg-secondary/30"
								}`}
							>
								<Text className="text-2xl text-center mb-1">{type.emoji}</Text>
								<Text className={`text-sm text-center font-medium ${
									selectedType === type.id ? "text-primary" : "text-foreground"
								}`}>
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
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">Give it a name</Text>
					<TextInput
						value={plantName}
						onChangeText={setPlantName}
						placeholder="e.g., My Cherry Tomatoes"
						className="border border-border rounded-lg px-4 py-3 text-base text-foreground bg-background"
						placeholderTextColor="#999"
					/>
				</View>

				{/* Planted Date */}
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">When did you plant it?</Text>
					<TouchableOpacity
						onPress={() => setShowDatePicker(true)}
						className="flex-row items-center border border-border rounded-lg px-4 py-3"
					>
						<Ionicons name="calendar-outline" size={20} color="#666" className="mr-3" />
						<Text className="text-base text-foreground">
							{format(plantedDate, 'MMMM d, yyyy')}
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

				{/* Photo */}
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">Add a photo (optional)</Text>
					<TouchableOpacity
						onPress={pickImage}
						className="border-2 border-dashed border-border rounded-lg p-6 items-center"
					>
						{image ? (
							<Image
								source={{ uri: image }}
								className="w-32 h-32 rounded-lg mb-3"
								resizeMode="cover"
							/>
						) : (
							<>
								<Ionicons name="camera" size={48} color="#999" className="mb-3" />
								<Text className="text-center text-muted-foreground">
									Tap to add a photo of your plant
								</Text>
							</>
						)}
					</TouchableOpacity>
				</View>

				{/* Notes */}
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">Notes (optional)</Text>
					<TextInput
						value={notes}
						onChangeText={setNotes}
						placeholder="Any special notes about your plant..."
						multiline
						numberOfLines={4}
						className="border border-border rounded-lg px-4 py-3 text-base text-foreground bg-background"
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
							Based on typical growing time, you can expect to harvest around{' '}
							{format(new Date(calculateExpectedHarvest(plantedDate, selectedType)), 'MMMM d, yyyy')}
						</Text>
					</View>
				)}

				{/* Save Button */}
				<Button
					onPress={handleSavePlant}
					disabled={loading || !selectedType || !plantName.trim()}
					className="w-full mb-6"
				>
					<Text className="text-primary-foreground font-semibold">
						{loading ? "Adding Plant..." : "Add Plant"}
					</Text>
				</Button>

				{/* Help Text */}
				<View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
					<Text className="text-blue-700 dark:text-blue-300 text-sm">
						💡 After adding your plant, check the AI Calendar for automated care reminders 
						based on your plant type and local weather conditions.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}