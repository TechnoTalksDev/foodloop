// app/(protected)/create-product-modal.tsx - COMPLETE WITH NOTIFICATIONS

import React, { useState, useRef, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	Image as RNImage,
	Platform,
	ActivityIndicator,
	Keyboard,
} from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
	FormTextarea,
} from "@/components/ui/form";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { H1 } from "@/components/ui/typography";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format, addDays } from "date-fns";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import { supabase } from "@/config/supabase";
import { useAuth } from "@/context/supabase-provider";
import { useNotifications } from "@/context/notification-provider";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { nanoid } from "nanoid";

// Define the form schema with zod
const formSchema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters"),
	price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
		message: "Price must be a positive number",
	}),
	originalPrice: z
		.string()
		.refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) > 0), {
			message: "Original price must be a positive number",
		}),
	amount: z
		.string()
		.refine(
			(val) =>
				!isNaN(Number(val)) && Number(val) > 0 && Number.isInteger(Number(val)),
			{
				message: "Available quantity must be a positive integer",
			},
		),
	expiry: z.date({
		required_error: "Please select an expiry date",
		invalid_type_error: "That's not a valid date",
	}),
	location: z.string().min(3, "Location must be at least 3 characters"),
	description: z.string().min(10, "Description must be at least 10 characters"),
	trash: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
		message: "Trash saved must be a non-negative number",
	}),
});

// Define tag options
const tagOptions = [
	{ label: "Vegetarian", icon: "vegetarian" },
	{ label: "Halal", icon: "halal" },
	{ label: "Gluten Free", icon: "glutenFree" },
	{ label: "Organic", icon: "organic" },
	{ label: "Local", icon: "local" },
	{ label: "Sustainable", icon: "sustainable" },
];

// Map tag icons to Ionicons
const tagIcons = {
	vegetarian: "leaf",
	halal: "checkmark-circle",
	glutenFree: "water",
	organic: "nutrition",
	local: "home",
	sustainable: "earth",
};

export default function CreateProduct() {
	const router = useRouter();
	const { colorScheme } = useColorScheme();
	const { addNotification } = useNotifications();
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [images, setImages] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [isDatePickerVisible, setDatePickerVisible] = useState(false);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			price: "",
			originalPrice: "",
			amount: "",
			expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week in the future
			location: "",
			description: "",
			trash: "",
		},
	});

	// Colors based on the theme
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;
	const bgColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;
	const mutedTextColor =
		colorScheme === "dark"
			? colors.dark.mutedForeground
			: colors.light.mutedForeground;
	// Accent color for high contrast (use green accent)
	const accentColor =
		colorScheme === "dark" ? colors.dark.accent : colors.light.accent;
	// Handle image picker
	const pickImage = async () => {
		try {
			// Check if we've already reached the maximum number of images
			if (images.length >= 5) {
				alert("Maximum of 5 images allowed per product.");
				return;
			}

			setIsUploading(true);
			// Request permission
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (status !== "granted") {
				alert("Sorry, we need camera roll permissions to upload images.");
				setIsUploading(false);
				return;
			}

			// Launch image library
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.7,
			});

			if (!result.canceled) {
				// Add the selected asset to our images array
				setImages([...images, result.assets[0].uri]);
			}
		} catch (error) {
			console.error("Error picking image:", error);
			alert("There was an error selecting your image.");
		} finally {
			setIsUploading(false);
		}
	};

	// Remove an image
	const removeImage = (index: number) => {
		setImages(images.filter((_, i) => i !== index));
	};

	// Toggle tag selection
	const toggleTag = (tagLabel: string) => {
		if (selectedTags.includes(tagLabel)) {
			setSelectedTags(selectedTags.filter((tag) => tag !== tagLabel));
		} else {
			setSelectedTags([...selectedTags, tagLabel]);
		}
	};
	// Form submission
	const { session } = useAuth();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		try {
			setIsSubmitting(true);
			console.log("Submitting form...");

			// Check if user is authenticated
			if (!session?.user) {
				alert("You must be logged in to create a product");
				setIsSubmitting(false);
				return;
			}

			// Upload images to Supabase Storage
			const imageUrls = [];
			console.log(`Uploading ${images.length} images...`);

			for (const imageUri of images) {
				try {
					// Get the file extension
					const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
					const fileName = `${nanoid()}.${fileExt}`;

					// Read the file as base64
					const fileBase64 = await FileSystem.readAsStringAsync(imageUri, {
						encoding: FileSystem.EncodingType.Base64,
					});

					// Convert to ArrayBuffer for upload
					const fileBuffer = decode(fileBase64);

					// Upload to Supabase storage
					const { data, error } = await supabase.storage
						.from("products")
						.upload(fileName, fileBuffer, {
							contentType: `image/${fileExt}`,
							upsert: false,
						});

					if (error) {
						console.error("Error uploading image:", error);
						throw new Error(`Upload failed: ${error.message}`);
					}

					// Get public URL for the uploaded file
					const { data: urlData } = supabase.storage
						.from("products")
						.getPublicUrl(fileName);

					if (urlData?.publicUrl) {
						imageUrls.push(urlData.publicUrl);
						console.log(`Image uploaded successfully: ${urlData.publicUrl}`);
					}
				} catch (uploadError) {
					console.error("Error in image upload loop:", uploadError);
					// Continue with other images if one fails
				}
			}

			// Format tags as expected by the database
			const formattedTags = selectedTags.map((label) => {
				const tag = tagOptions.find((t) => t.label === label);
				return {
					label,
					icon: tag ? tagIcons[tag.icon as keyof typeof tagIcons] : "leaf",
				};
			});

			// Create the product in the database
			console.log("Creating product in database...");
			const { data: product, error } = await supabase
				.from("product") // Using the correct table name
				.insert({
					name: data.name,
					price: Number(data.price),
					original_price: Number(data.originalPrice),
					amount: Number(data.amount),
					description: data.description,
					location: data.location,
					expiry: data.expiry.toISOString(),
					trash: Number(data.trash),
					tags: formattedTags.length ? formattedTags : null,
					image_url: imageUrls.length ? imageUrls : null,
					user_id: session.user.id,
				})
				.select("id")
				.single();

			if (error) {
				console.error("Database error:", error);
				throw new Error(`Database error: ${error.message}`);
			}

			console.log("Product created successfully:", product);

			// Send marketplace notification
			await addNotification({
				type: "marketplace_update",
				title: "Product listed successfully! 🛒",
				message: `Your "${data.name}" is now live on the marketplace. Buyers can discover it now!`,
				data: {
					action: "product_created",
					product_name: data.name,
					product_id: product.id,
				},
				urgent: false,
				icon: "✅",
				action_url: "/(protected)/(tabs)/marketplace",
				expires_at: addDays(new Date(), 7).toISOString(),
			});

			// Show success message and navigate back
			alert("Product created successfully!");
			router.back();
		} catch (error) {
			console.error("Error creating product:", error);
			alert(`Failed to create product: ${(error as Error).message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Modal Header */}
			<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
				<TouchableOpacity
					onPress={() => router.back()}
					className="p-2 -ml-2"
					activeOpacity={0.7}
				>
					<Ionicons name="close" size={24} color={textColor} />
				</TouchableOpacity>
				<H1 className="flex-1 text-center">Create Product</H1>
				<View className="w-8" />
			</View>

			<ScrollView
				className="flex-1 px-4 py-4"
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				<Form {...form}>
					<View className="space-y-6 mb-8">
						{/* Image upload section */}
						<View className="mb-6">
							{/* Increased margin-bottom for more space */}
							<Text className="text-base font-medium mb-2">Product Images</Text>
							<View className="flex-row flex-wrap">
								{images.map((image, index) => (
									<View key={index} className="mr-3 mb-3 relative">
										<RNImage
											source={{ uri: image }}
											className="w-24 h-24 rounded-md"
										/>
										<TouchableOpacity
											onPress={() => removeImage(index)}
											className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1"
										>
											<Ionicons name="close" size={16} color={textColor} />
										</TouchableOpacity>
									</View>
								))}
								{/* Add image button - only shown if less than 5 images */}
								{images.length < 5 && (
									<TouchableOpacity
										onPress={pickImage}
										className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground items-center justify-center mr-3 mb-3"
										disabled={isUploading}
									>
										{isUploading ? (
											<ActivityIndicator size="small" color={textColor} />
										) : (
											<>
												<Ionicons name="add" size={24} color={mutedTextColor} />
												<Text className="text-xs text-muted-foreground mt-1">
													Add Image
												</Text>
											</>
										)}
									</TouchableOpacity>
								)}
							</View>
							<Text className="text-sm text-muted-foreground mt-1">
								{images.length === 0
									? "Add at least one image of your product (maximum 5)"
									: `${images.length}/5 images added${images.length < 5 ? ", you can add " + (5 - images.length) + " more" : ""}`}
							</Text>
						</View>
						{/* Product name */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormInput
									label="Product Name"
									placeholder="Enter product name"
									{...field}
								/>
							)}
						/>
						<View className="h-5" />
						{/* Price fields - side by side */}
						<View className="flex-row space-x-4 gap-4">
							<View className="flex-1">
								<FormField
									control={form.control}
									name="price"
									render={({ field }) => (
										<FormInput
											label="Price ($)"
											placeholder="0.00"
											keyboardType="decimal-pad"
											{...field}
										/>
									)}
								/>
							</View>

							<View className="flex-1">
								<FormField
									control={form.control}
									name="originalPrice"
									render={({ field }) => (
										<FormInput
											label="Original Price ($)"
											placeholder="0.00"
											keyboardType="decimal-pad"
											{...field}
										/>
									)}
								/>
							</View>
						</View>
						<View className="h-5" /> {/* Add vertical space between fields */}
						{/* Quantity */}
						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => (
								<FormInput
									label="Available Quantity"
									placeholder="Enter quantity"
									keyboardType="number-pad"
									{...field}
								/>
							)}
						/>
						<View className="h-5" /> {/* Add vertical space between fields */}
						{/* Expiry date */}
						<FormField
							control={form.control}
							name="expiry"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Expiry Date</FormLabel>
									<TouchableOpacity
										onPress={() => setDatePickerVisible(true)}
										className="flex-row items-center h-12 px-3 rounded-md border border-input bg-background mb-1"
									>
										<Ionicons
											name="calendar-outline"
											size={20}
											color={
												colorScheme === "dark"
													? colors.dark.mutedForeground
													: colors.light.mutedForeground
											}
											style={{ marginRight: 8 }}
										/>
										<Text
											className={field.value ? "" : "text-muted-foreground"}
										>
											{format(field.value, "PPP")}
										</Text>
									</TouchableOpacity>
									<FormDescription>
										Tap to select when this product will expire
									</FormDescription>
									<FormMessage />
									<DateTimePickerModal
										isVisible={isDatePickerVisible}
										mode="date"
										date={field.value}
										onConfirm={(date) => {
											field.onChange(date);
											setDatePickerVisible(false);
										}}
										onCancel={() => setDatePickerVisible(false)}
									/>
								</FormItem>
							)}
						/>
						<View className="h-5" /> {/* Add vertical space between fields */}
						{/* Location */}
						<FormField
							control={form.control}
							name="location"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Location</FormLabel>
									<View
										className="mb-1"
										style={{
											zIndex: 1,
											// Fixed height prevents scrolling inside this container
											height: 48,
										}}
									>
										<GooglePlacesAutocomplete
											placeholder="Where can this item be picked up?"
											predefinedPlaces={[]}
											disableScroll={false} // Disable internal scrolling
											onPress={(data, details = null) => {
												// Set the location field value when a place is selected
												field.onChange(data.description);
												Keyboard.dismiss();
											}}
											renderLeftButton={() => (
												<View className="justify-center items-center pl-3">
													<Ionicons
														name="location-outline"
														size={20}
														color={
															colorScheme === "dark"
																? colors.dark.mutedForeground
																: colors.light.mutedForeground
														}
													/>
												</View>
											)}
											fetchDetails={false}
											keyboardShouldPersistTaps="handled"
											listViewDisplayed="auto"
											enablePoweredByContainer={false}
											minLength={2}
											query={{
												key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
												language: "en",
											}}
											textInputProps={{
												autoCapitalize: "none",
												autoCorrect: false,
												value: field.value,
												onChangeText: (text) => field.onChange(text),
												clearButtonMode: "while-editing",
											}}
											styles={{
												container: {
													flex: 0,
												},
												textInputContainer: {
													flexDirection: "row",
													borderWidth: 1,
													borderColor:
														colorScheme === "dark"
															? colors.dark.input
															: colors.light.input,
													borderRadius: 8,
													backgroundColor:
														colorScheme === "dark"
															? colors.dark.background
															: colors.light.background,
													height: 48,
												},
												textInput: {
													height: 46,
													color:
														colorScheme === "dark"
															? colors.dark.foreground
															: colors.light.foreground,
													fontSize: 16,
													backgroundColor: "transparent",
													flex: 1,
												},
												listView: {
													borderWidth: 1,
													borderColor:
														colorScheme === "dark"
															? colors.dark.border
															: colors.light.border,
													backgroundColor:
														colorScheme === "dark"
															? colors.dark.background
															: colors.light.background,
													borderRadius: 8,
													marginTop: 5,
													position: "absolute",
													top: 50,
													left: 0,
													right: 0,
													zIndex: 9999, // Higher z-index to ensure it's on top
													elevation: 5, // For Android
													maxHeight: 200,
													overflow: "visible", // Allow content to overflow
												},
												row: {
													backgroundColor:
														colorScheme === "dark"
															? colors.dark.background
															: colors.light.background,
													padding: 13,
												},
												separator: {
													backgroundColor:
														colorScheme === "dark"
															? colors.dark.border
															: colors.light.border,
													height: 1,
												},
												description: {
													color:
														colorScheme === "dark"
															? colors.dark.foreground
															: colors.light.foreground,
												},
												poweredContainer: {
													display: "none",
												},
											}}
											debounce={300}
										/>
									</View>
									{field.value && (
										<FormDescription>
											Pickup location: {field.value}
										</FormDescription>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>
						<View className="h-5" /> {/* Add vertical space between fields */}
						{/* Trash saved */}
						<FormField
							control={form.control}
							name="trash"
							render={({ field }) => (
								<FormInput
									label="Food Waste Saved (lbs)"
									placeholder="Enter amount in pounds"
									keyboardType="decimal-pad"
									{...field}
								/>
							)}
						/>
						<View className="h-5" /> {/* Add vertical space between fields */}
						{/* Description */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormTextarea
									label="Description"
									placeholder="Describe your product"
									numberOfLines={4}
									{...field}
								/>
							)}
						/>
						<View className="h-5" /> {/* Add vertical space between fields */}
						{/* Tags */}
						<View className="mb-4">
							<Text className="text-base font-medium mb-2">Tags</Text>
							<View className="flex-row flex-wrap">
								{tagOptions.map((tag) => (
									<TouchableOpacity
										key={tag.label}
										onPress={() => toggleTag(tag.label)}
										className={`mr-2 mb-2 flex-row items-center px-3 py-2 rounded-full ${
											selectedTags.includes(tag.label)
												? "border border-border"
												: "bg-muted/30 border border-border"
										}`}
										style={
											selectedTags.includes(tag.label)
												? {
														backgroundColor: accentColor,
														borderColor: accentColor,
													}
												: undefined
										}
									>
										<Ionicons
											name={tagIcons[tag.icon as keyof typeof tagIcons] as any}
											size={16}
											color={
												selectedTags.includes(tag.label) ? "#fff" : textColor
											}
											className="mr-1"
										/>
										<Text
											className={`text-sm ${selectedTags.includes(tag.label) ? "text-white" : ""}`}
										>
											{tag.label}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
						{/* Submit button */}
						<View className="pt-4 pb-8">
							<Button
								onPress={form.handleSubmit(onSubmit)}
								className="w-full"
								style={{
									backgroundColor: isSubmitting
										? colorScheme === "dark"
											? colors.dark.mutedForeground
											: colors.light.mutedForeground
										: accentColor,
								}}
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<View className="flex-row items-center">
										<ActivityIndicator size="small" color="#ffffff" />
										<Text className="text-white font-semibold ml-2">
											Creating...
										</Text>
									</View>
								) : (
									<Text className="text-white font-semibold">
										Create Product
									</Text>
								)}
							</Button>
							{/* Cancel button */}
							<Button
								variant="outline"
								onPress={() => router.back()}
								className="w-full mt-3"
							>
								<Text>Cancel</Text>
							</Button>
						</View>
					</View>
				</Form>
			</ScrollView>
		</SafeAreaView>
	);
}
