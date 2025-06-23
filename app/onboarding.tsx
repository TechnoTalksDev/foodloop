import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	TextInput,
	Modal,
	Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, Muted } from "@/components/ui/typography";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/context/supabase-provider";
import { useOnboarding } from "@/lib/useOnboarding";
import { colors } from "@/constants/colors";
import { supabase } from "@/config/supabase";

// Sample onboarding data
const onboardingSteps = [
	{
		id: 1,
		title: "What topics are you interested in?",
		subtitle: "Choose at least three to help us better tailor your experience",
		type: "multiple-choice",
		options: [
			{ id: "grow", label: "Growing my own food", icon: "🪴" },
			{ id: "waste", label: "Preventing food waste", icon: "🥦" },
			{ id: "help", label: "Getting help with gardening", icon: "🆘" },
			{ id: "diagnose", label: "Diagnosing my plants", icon: "🔍" },
			{ id: "meals", label: "Meals with fresh food", icon: "🍲" },
			{ id: "save-money", label: "Save money on groceries", icon: "💰" },
		],
	},
	{
		id: 2,
		title: "What would you like to grow?",
		subtitle: "Choose 3 plants you're most interested in growing",
		type: "multiple-choice",
		options: [
			{ id: "tomatoes", label: "Tomatoes", icon: "🍅" },
			{ id: "peppers", label: "Peppers", icon: "🌶️" },
			{ id: "leafy-greens", label: "Leafy Greens", icon: "🥬" },
			{ id: "root-vegetables", label: "Root Vegetables", icon: "🥕" },
			{ id: "onions-garlic", label: "Onions, Garlic, Leeks", icon: "🧄" },
			{ id: "basil", label: "Basil", icon: "🌿" },
			{ id: "mint", label: "Mint", icon: "🌱" },
			{ id: "chives", label: "Chives", icon: "🌾" },
			{ id: "strawberries", label: "Strawberries", icon: "🍓" },
			{ id: "fruit-trees", label: "Fruit Trees", icon: "🌳" },
			{ id: "berries", label: "Berries", icon: "🫐" },
			{ id: "marigolds", label: "Marigolds", icon: "🌼" },
			{ id: "roses", label: "Roses", icon: "🌹" },
			{ id: "other", label: "Other", icon: "✏️" },
		],
	},
	{
		id: 3,
		title: "How often do you shop for food?",
		subtitle: "We'll use this to send you relevant notifications",
		type: "single-choice",
		options: [
			{ id: "daily", label: "Daily", icon: "📅" },
			{ id: "few-times-week", label: "A few times a week", icon: "📊" },
			{ id: "weekly", label: "Weekly", icon: "🗓️" },
			{ id: "biweekly", label: "Every two weeks", icon: "📋" },
			{ id: "monthly", label: "Monthly", icon: "🗓️" },
		],
	},
	{
		id: 4,
		title: "Enable Location Access",
		subtitle:
			"We need your location to show you local food options and reduce food waste in your area",
		type: "location",
		options: [], // No predefined options for location type
	},
];

export default function OnboardingScreen() {
	const { colorScheme } = useColorScheme();
	const { session } = useAuth();
	const { completeOnboarding } = useOnboarding();
	const router = useRouter();

	// Colors based on theme
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;
	const mutedTextColor =
		colorScheme === "dark"
			? colors.dark.mutedForeground
			: colors.light.mutedForeground;
	const primaryColor =
		colorScheme === "dark" ? colors.dark.primary : colors.light.primary;

	const [currentStep, setCurrentStep] = useState(0);
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(false);
	// Location-specific state
	const [currentLocation, setCurrentLocation] = useState<string | null>(null);
	const [isLoadingLocation, setIsLoadingLocation] = useState(false);
	const [locationPermissionGranted, setLocationPermissionGranted] =
		useState(false);

	// Custom plant input state
	const [showOtherPlantModal, setShowOtherPlantModal] = useState(false);
	const [customPlantText, setCustomPlantText] = useState("");
	const [customPlants, setCustomPlants] = useState<string[]>([]);

	// Check existing location permission on mount
	useEffect(() => {
		const checkLocationPermission = async () => {
			try {
				const { status } = await Location.getForegroundPermissionsAsync();
				if (status === "granted") {
					setLocationPermissionGranted(true);
					setCurrentLocation("Location access granted");
					setAnswers((prev) => ({
						...prev,
						4: "location_granted", // hardcoded to location step id
					}));
				}
			} catch (error) {
				console.error("Error checking location permission:", error);
			}
		};

		checkLocationPermission();
	}, []);

	const appIcon =
		colorScheme === "dark"
			? require("@/assets/foodloop.png")
			: require("@/assets/icon-dark.png");
	const currentStepData = onboardingSteps[currentStep];
	const isLastStep = currentStep === onboardingSteps.length - 1;
	const canContinue =
		currentStepData.type === "location"
			? locationPermissionGranted
			: currentStepData.type === "multiple-choice"
				? currentStepData.id === 2
					? (answers[currentStepData.id] || []).length === 3 // Exactly 3 for plant selection
					: (answers[currentStepData.id] || []).length >= 3 // At least 3 for other multiple choice
				: answers[currentStepData.id];

	// Location permission function
	const requestLocationPermission = async () => {
		setIsLoadingLocation(true);
		try {
			// Request permission to access location
			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status === "granted") {
				console.log("Location permission granted");
				setLocationPermissionGranted(true);
				setCurrentLocation("Location access granted");
				setAnswers((prev) => ({
					...prev,
					[currentStepData.id]: "location_granted",
				}));
			} else {
				console.log("Location permission denied");
				setLocationPermissionGranted(false);
				setCurrentLocation(null);
				// Show user that permission is required
				alert(
					"Location permission is required to continue. Please enable location access in your device settings to proceed.",
				);
			}
		} catch (error) {
			console.error("Error requesting location permission:", error);
			setLocationPermissionGranted(false);
			setCurrentLocation(null);
		} finally {
			setIsLoadingLocation(false);
		}
	};
	const handleOptionSelect = (optionId: string) => {
		// Handle "Other" option for plants
		if (optionId === "other" && currentStepData.id === 2) {
			const currentAnswers = answers[currentStepData.id] || [];
			if (currentAnswers.length >= 3) {
				Alert.alert(
					"Maximum selections reached",
					"You can only select up to 3 plants. Please deselect one first.",
				);
				return;
			}
			setShowOtherPlantModal(true);
			return;
		}

		if (currentStepData.type === "multiple-choice") {
			setAnswers((prev) => {
				const currentAnswers = prev[currentStepData.id] || [];

				// For plant selection (step 2), limit to 3 selections
				if (
					currentStepData.id === 2 &&
					!currentAnswers.includes(optionId) &&
					currentAnswers.length >= 3
				) {
					Alert.alert(
						"Maximum selections reached",
						"You can only select up to 3 plants. Please deselect one first.",
					);
					return prev;
				}

				const newAnswers = currentAnswers.includes(optionId)
					? currentAnswers.filter((id: string) => id !== optionId)
					: [...currentAnswers, optionId];

				// If deselecting a custom plant, remove it from the custom plants list
				if (
					optionId.startsWith("custom_") &&
					currentAnswers.includes(optionId)
				) {
					const plantName = prev[`custom_plant_${optionId}`];
					if (plantName) {
						setCustomPlants((current) =>
							current.filter((plant) => plant !== plantName),
						);
						// Clean up the stored custom plant text
						const updatedAnswers = { ...prev };
						delete updatedAnswers[`custom_plant_${optionId}`];
						return { ...updatedAnswers, [currentStepData.id]: newAnswers };
					}
				}

				return { ...prev, [currentStepData.id]: newAnswers };
			});
		} else {
			setAnswers((prev) => ({ ...prev, [currentStepData.id]: optionId }));
		}
	};
	const handleAddCustomPlant = () => {
		const trimmedText = customPlantText.trim();
		if (trimmedText.length === 0) {
			Alert.alert("Please enter a plant name");
			return;
		}

		// Check current selection count
		const currentAnswers = answers[2] || [];
		if (currentAnswers.length >= 3) {
			Alert.alert(
				"Maximum selections reached",
				"You can only select up to 3 plants. Please deselect one first.",
			);
			setShowOtherPlantModal(false);
			return;
		}

		// Check for duplicates
		if (
			customPlants.some(
				(plant) => plant.toLowerCase() === trimmedText.toLowerCase(),
			)
		) {
			Alert.alert(
				"Plant already added",
				"You've already added this plant to your list.",
			);
			return;
		}

		// Add to custom plants list
		const newCustomPlants = [...customPlants, trimmedText];
		setCustomPlants(newCustomPlants);

		// Update answers to include the custom plant
		setAnswers((prev) => {
			const currentAnswers = prev[2] || []; // Step 2 is the plant selection
			const customPlantId = `custom_${trimmedText.toLowerCase().replace(/\s+/g, "_")}`;
			return {
				...prev,
				2: [...currentAnswers, customPlantId],
				[`custom_plant_${customPlantId}`]: trimmedText, // Store the actual text
			};
		});

		// Reset modal state
		setCustomPlantText("");
		setShowOtherPlantModal(false);
	};	const saveOnboardingData = async () => {
		if (!session?.user?.id) {
			throw new Error("User not authenticated");
		}
		
		// Process the answers to match the database schema - saving IDs instead of labels
		const topics = answers[1] || []; // Keep the topic IDs as they are
		const plants = answers[2] || []; // Keep the plant IDs as they are (includes custom_* IDs)
		const often = answers[3]; // Keep the shopping frequency ID as it is
		
		// Note: For custom plants, the IDs are stored as "custom_plant_name" format
		// The actual custom plant names are stored separately in answers[`custom_plant_${plantId}`]
		
		// Validate required data
		if (topics.length === 0) {
			throw new Error("Please select your interests before continuing");
		}
		if (plants.length !== 3) {
			throw new Error("Please select exactly 3 plants before continuing");
		}
		if (!often) {
			throw new Error(
				"Please select your shopping frequency before continuing",
			);
		}

		console.log("Saving onboarding data:", { topics, plants, often });

		// Insert data into the onboarding table
		// Note: The id field is now the foreign key to users table, so we use the user's id directly
		const { data, error } = await supabase
			.from("onboarding")
			.upsert({
				id: session.user.id, // Use user ID as the primary key
				topics: topics,
				plants: plants,
				often: often,
			})
			.select()
			.single();

		if (error) {
			console.error("Error saving onboarding data:", error);
			throw error;
		}

		console.log("Onboarding data saved successfully:", data);
		return data;
	};
	const handleContinue = async () => {
		if (isLastStep) {
			// Complete onboarding
			setLoading(true);
			try {
				// First save the onboarding data to our custom table
				await saveOnboardingData();

				// Then mark onboarding as complete in the users table
				const success = await completeOnboarding();
				if (success) {
					console.log("Onboarding completed successfully");
					console.log("Onboarding answers:", answers);
					router.replace("/onboarding-complete");
				} else {
					console.error("Failed to complete onboarding");
					Alert.alert(
						"Error",
						"Failed to complete onboarding. Please try again.",
					);
				}
			} catch (error) {
				console.error("Error completing onboarding:", error);
				Alert.alert(
					"Error",
					"Failed to save your responses. Please try again.",
				);
			} finally {
				setLoading(false);
			}
		} else {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	// Handle custom plant text submission
	const handleCustomPlantSubmit = () => {
		if (customPlantText.trim() !== "") {
			setCustomPlants((prev) => [...prev, customPlantText.trim()]);
			setCustomPlantText("");
			setShowOtherPlantModal(false);
		}
	};
	return (
		<>
			<SafeAreaView className="flex-1 bg-background">
				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
				>
					{/* Header */}
					<View className="flex-row items-center justify-between px-4 py-4">
						{currentStep > 0 ? (
							<TouchableOpacity onPress={handleBack} className="p-2">
								<Text className="text-2xl">←</Text>
							</TouchableOpacity>
						) : (
							<View className="p-2 w-8" />
						)}

						<View className="flex-1 items-center">
							<Image source={appIcon} className="w-8 h-8 rounded-lg" />
						</View>

						<View className="p-2 w-8" />
					</View>

					{/* Progress indicator */}
					<View className="px-4 mb-8">
						<View className="flex-row gap-1">
							{onboardingSteps.map((_, index) => (
								<View
									key={index}
									className={`flex-1 h-1 rounded ${
										index <= currentStep ? "bg-primary" : "bg-secondary/30"
									}`}
								/>
							))}
						</View>
						<Text className="text-center text-muted-foreground mt-2 text-sm">
							Step {currentStep + 1} of {onboardingSteps.length}
						</Text>
					</View>

					{/* Content */}
					<View className="flex-1 px-4">
						<H1 className="text-center mb-4">{currentStepData.title}</H1>
						<Muted className="text-center mb-8">
							{currentStepData.subtitle}
						</Muted>
						{/* Special note for plant selection step */}
						{currentStepData.id === 2 && (
							<View className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
								<Text className="text-center text-primary text-sm font-medium">
									💡 Select exactly 3 plants to get personalized growing tips
									and recommendations
								</Text>
							</View>
						)}
						{/* Options */}
						{currentStepData.type === "location" ? (
							<View className="gap-6">
								{/* Location Permission Explanation */}
								<View className="p-6 rounded-2xl bg-secondary/50 border border-border">
									<View className="flex-row items-center mb-4">
										<View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center mr-4">
											<Ionicons
												name="location"
												size={24}
												color={primaryColor}
											/>
										</View>
										<View className="flex-1">
											<Text className="text-lg font-semibold text-foreground">
												Location Permission Required
											</Text>
											<Text className="text-sm text-muted-foreground">
												Help us connect you with local businesses
											</Text>
										</View>
									</View>

									<Text className="text-foreground mb-4 leading-6">
										We need access to your location to:
									</Text>

									<View className="gap-3 mb-6">
										<View className="flex-row items-center">
											<View className="w-2 h-2 rounded-full bg-primary mr-3" />
											<Text className="text-muted-foreground flex-1">
												Show you local food deals and surplus items nearby
											</Text>
										</View>
										<View className="flex-row items-center">
											<View className="w-2 h-2 rounded-full bg-primary mr-3" />
											<Text className="text-muted-foreground flex-1">
												Connect you with urban farming communities in your area
											</Text>
										</View>
										<View className="flex-row items-center">
											<View className="w-2 h-2 rounded-full bg-primary mr-3" />
											<Text className="text-muted-foreground flex-1">
												Help reduce food waste in your community
											</Text>
										</View>
										<View className="flex-row items-center">
											<View className="w-2 h-2 rounded-full bg-primary mr-3" />
											<Text className="text-muted-foreground flex-1">
												Reccomend personalized farming advice based on your
												weather
											</Text>
										</View>
									</View>
								</View>

								{/* Permission Request Button */}
								<TouchableOpacity
									onPress={requestLocationPermission}
									disabled={isLoadingLocation}
									className={`p-6 rounded-2xl border-2 flex-row items-center ${
										locationPermissionGranted
											? "border-primary bg-primary/10"
											: "border-border bg-background"
									}`}
									activeOpacity={0.7}
								>
									<View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center mr-4">
										{isLoadingLocation ? (
											<Text className="text-primary text-xl">⏳</Text>
										) : locationPermissionGranted ? (
											<Ionicons
												name="checkmark-circle"
												size={24}
												color={primaryColor}
											/>
										) : (
											<Ionicons
												name="location"
												size={24}
												color={primaryColor}
											/>
										)}
									</View>
									<View className="flex-1">
										<Text
											className={`text-lg font-medium ${locationPermissionGranted ? "text-primary" : "text-foreground"}`}
										>
											{isLoadingLocation
												? "Requesting permission..."
												: locationPermissionGranted
													? "Location Permission Granted"
													: "Grant Location Permission"}
										</Text>
										<Text className="text-sm text-muted-foreground">
											{locationPermissionGranted
												? "You can now continue to the next step"
												: "Tap to allow location access"}
										</Text>
									</View>
									{locationPermissionGranted && (
										<View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
											<Text className="text-primary-foreground text-sm">✓</Text>
										</View>
									)}
								</TouchableOpacity>

								{/* Privacy Note */}
								<View className="p-4 rounded-2xl bg-muted/30">
									<Text className="text-center text-muted-foreground text-sm">
										🔒 Your location data is used only to show relevant local
										content and is never shared with third parties.
									</Text>
								</View>
							</View>
						) : (
							<View className="gap-3">

								{currentStepData.options.map((option) => {
									const isSelected =
										currentStepData.type === "multiple-choice"
											? (answers[currentStepData.id] || []).includes(option.id)
											: answers[currentStepData.id] === option.id;

									// Check if this option should be disabled for plant selection (step 2)
									const currentAnswers = answers[currentStepData.id] || [];
									const isAtLimit =
										currentStepData.id === 2 &&
										currentAnswers.length >= 3 &&
										!isSelected;

									return (
										<TouchableOpacity
											key={option.id}
											onPress={() => {
												if (isAtLimit) {
													Alert.alert(
														"Maximum selections reached",
														"You can only select up to 3 plants. Please deselect one first.",
													);
													return;
												}
												if (option.id === "other") {
													// Open modal for custom input
													setShowOtherPlantModal(true);
												} else {
													handleOptionSelect(option.id);
												}
											}}
											className={`p-4 rounded-2xl border-2 flex-row items-center ${
												isSelected
													? "border-primary bg-primary/10"
													: isAtLimit
														? "border-border/50 bg-secondary/10 opacity-50"
														: "border-border bg-secondary/30"
											}`}
											activeOpacity={isAtLimit ? 0.3 : 0.7}
										>
											<View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center mr-4">
												<Text
													className={`text-2xl ${isAtLimit ? "opacity-50" : ""}`}
												>
													{option.icon}
												</Text>
											</View>
											<View className="flex-1">
												<Text
													className={`text-lg font-medium ${
														isSelected
															? "text-primary"
															: isAtLimit
																? "text-muted-foreground"
																: "text-foreground"
													}`}
												>
													{option.label}
												</Text>
											</View>
											{isSelected && (
												<View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
													<Text className="text-primary-foreground text-sm">
														✓
													</Text>
												</View>
											)}
										</TouchableOpacity>
									);
								})}
								{/* Display custom plants for the plant selection step */}
								{currentStepData.id === 2 && customPlants.length > 0 && (
									<>
										{customPlants.map((plantName, index) => {
											const customId = `custom_${plantName.toLowerCase().replace(/\s+/g, "_")}`;
											const isSelected = (
												answers[currentStepData.id] || []
											).includes(customId);

											return (
												<TouchableOpacity
													key={`custom_${index}`}
													onPress={() => handleOptionSelect(customId)}
													className={`p-4 rounded-2xl border-2 flex-row items-center ${
														isSelected
															? "border-primary bg-primary/10"
															: "border-border bg-secondary/30"
													}`}
													activeOpacity={0.7}
												>
													<View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center mr-4">
														<Text className="text-2xl">🌱</Text>
													</View>
													<View className="flex-1">
														<Text
															className={`text-lg font-medium ${isSelected ? "text-primary" : "text-foreground"}`}
														>
															{plantName}
														</Text>
														<Text className="text-sm text-muted-foreground">
															Custom plant
														</Text>
													</View>
													{isSelected && (
														<View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
															<Text className="text-primary-foreground text-sm">
																✓
															</Text>
														</View>
													)}
												</TouchableOpacity>
											);
										})}
									</>
								)}
							</View>
						)}
						{/* Selection hint for multiple choice */}
						{currentStepData.type === "multiple-choice" && (
							<Text className="text-center text-muted-foreground mt-4 text-sm">
								Selected: {(answers[currentStepData.id] || []).length} /{" "}
								{currentStepData.id === 2 ? "3" : "3 minimum"}
							</Text>
						)}
					</View>
				</ScrollView>
				{/* Continue button */}
				<View className="p-4">
					<Button
						size="default"
						variant="default"
						onPress={handleContinue}
						disabled={!canContinue || loading}
						className="w-full"
					>

						<Text className="text-primary-foreground font-semibold">
							{loading
								? isLastStep
									? "Saving your preferences..."
									: "Loading..."
								: isLastStep
									? "Get Started"
									: "Continue"}
						</Text>
					</Button>
				</View>
				{/* Custom Plant Modal */}
				{showOtherPlantModal && (
					<View className="absolute inset-0 flex-1 items-center justify-center bg-black/60">
						<View className="w-11/12 max-w-md bg-background rounded-2xl p-6">
							<Text className="text-lg font-semibold mb-4">
								What would you like to grow? (Custom Entry)
							</Text>

							{/* Custom Plant Input */}
							<View className="flex-row items-center border-b border-border pb-2 mb-4">
								<TextInput
									value={customPlantText}
									onChangeText={setCustomPlantText}
									placeholder="Enter plant name"
									className="flex-1 text-lg py-2"
									placeholderTextColor={mutedTextColor}
								/>
							</View>

							{/* Submit Button */}
							<Button
								onPress={handleCustomPlantSubmit}
								disabled={loading}
								className="w-full mb-4"
							>
								<Text className="text-primary-foreground font-semibold">
									{loading ? "Adding..." : "Add Plant"}
								</Text>
							</Button>

							{/* Cancel Button */}
							<TouchableOpacity
								onPress={() => setShowOtherPlantModal(false)}
								className="w-full p-4 rounded-2xl bg-secondary/50"
								activeOpacity={0.7}
							>
								<Text className="text-center text-foreground font-semibold">
									Cancel
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}
			</SafeAreaView>

			{/* Custom Plant Input Modal */}
			<Modal
				visible={showOtherPlantModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowOtherPlantModal(false)}
			>
				<View className="flex-1 justify-center items-center bg-black/50">
					<View className="bg-background rounded-2xl p-6 mx-4 w-full max-w-sm">
						<Text className="text-xl font-semibold text-foreground mb-4 text-center">
							Add Custom Plant
						</Text>

						<Text className="text-muted-foreground mb-4 text-center">
							What plant would you like to grow?
						</Text>

						<TextInput
							value={customPlantText}
							onChangeText={setCustomPlantText}
							placeholder="Enter plant name..."
							className="border border-border rounded-xl p-4 text-foreground bg-background mb-6"
							placeholderTextColor={mutedTextColor}
							autoFocus={true}
							onSubmitEditing={handleAddCustomPlant}
						/>

						<View className="flex-row gap-3">
							<TouchableOpacity
								onPress={() => setShowOtherPlantModal(false)}
								className="flex-1 p-4 rounded-xl bg-secondary"
							>
								<Text className="text-center text-foreground font-medium">
									Cancel
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={handleAddCustomPlant}
								className="flex-1 p-4 rounded-xl bg-primary"
							>
								<Text className="text-center text-primary-foreground font-medium">
									Add Plant
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
}
