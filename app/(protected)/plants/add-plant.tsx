// app/(protected)/plants/add-plant.tsx - NEW FILE

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

export default function AddPlantScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [plantTypes, setPlantTypes] = useState<PlantType[]>([]);
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
				return;
			}

			setPlantTypes(data || []);
		} catch (error) {
			console.error("Error in fetchPlantTypes:", error);
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
			const response = await fetch(imageUri);
			const blob = await response.blob();
			const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
			const fileName = `plants/${session?.user?.id}/${Date.now()}.${fileExt}`;

			const { data, error } = await supabase.storage
				.from('plant-images')
				.upload(fileName, blob);

			if (error) {
				console.error('Error uploading image:', error);
				return null;
			}

			const { data: urlData } = supabase.storage
				.from('plant-images')
				.getPublicUrl(fileName);

			return urlData.publicUrl;
		} catch (error) {
			console.error('Error in uploadImage:', error);
			return null;
		}
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
			let imageUrl = null;
			if (image) {
				imageUrl = await uploadImage(image);
			}

			const { error } = await supabase
				.from("user_plants")
				.insert({
					user_id: session.user.id,
					plant_name: plantName.trim(),
					plant_type: selectedType,
					planted_date: format(plantedDate, 'yyyy-MM-dd'),
					notes: notes.trim() || null,
					image_url: imageUrl,
					status: 'seedling'
				});

			if (error) {
				console.error("Error adding plant:", error);
				Alert.alert("Error", "Failed to add plant. Please try again.");
				return;
			}

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