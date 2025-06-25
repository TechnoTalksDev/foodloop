import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	Alert,
	TouchableOpacity,
	Pressable,
	FlatList,
	Image,
	ActivityIndicator,
	Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { nanoid } from "nanoid";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useCreatePost, useGroups } from "@/hooks/useCommunity";
import { CreatePostData } from "@/types/community";
import { supabase } from "@/config/supabase";

const POST_TYPES = [
	{
		id: "discussion",
		label: "💬 Discussion",
		description: "Start a conversation",
	},
	{
		id: "question",
		label: "❓ Question",
		description: "Ask for help or advice",
	},
	{ id: "tip", label: "💡 Tip", description: "Share knowledge or tips" },
	{
		id: "showcase",
		label: "📸 Showcase",
		description: "Show off your garden/results",
	},
	{
		id: "news",
		label: "📰 News",
		description: "Share relevant news or articles",
	},
];

const COMMON_TAGS = [
	"beginner",
	"advanced",
	"indoor",
	"outdoor",
	"organic",
	"pest-control",
	"watering",
	"fertilizer",
	"seeds",
	"harvest",
	"composting",
	"urban-gardening",
	"sustainability",
	"food-waste",
	"tips",
	"help-needed",
];

export default function CreatePostModal() {
	const router = useRouter();
	const { groupId } = useLocalSearchParams();
	const { colorScheme } = useColorScheme();
	const { createPost, loading, error } = useCreatePost();
	const { groups } = useGroups();
	// Form state
	const [formData, setFormData] = useState({
		title: "",
		content: "",
		group_id: groupId ? String(groupId) : "",
		post_type: "discussion",
		tags: [] as string[],
		location: "",
	});

	// Image state
	const [selectedImages, setSelectedImages] = useState<string[]>([]);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [isPickingImage, setIsPickingImage] = useState(false);

	// Colors based on the theme
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;
	const bgColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;
	const mutedTextColor =
		colorScheme === "dark"
			? colors.dark.mutedForeground
			: colors.light.mutedForeground;

	// Image upload functions
	const pickImages = async () => {
		if (selectedImages.length >= 5) {
			Alert.alert("Limit Reached", "You can only add up to 5 images per post.");
			return;
		}

		if (isPickingImage || uploadingImages) {
			return; // Prevent multiple concurrent operations
		}

		try {
			setIsPickingImage(true);

			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission Denied",
					"Sorry, we need camera roll permissions to upload images.",
				);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			if (!result.canceled && result.assets?.[0]) {
				setSelectedImages((prev) => [...prev, result.assets[0].uri]);
			}
		} catch (error) {
			console.error("Error picking image:", error);
			Alert.alert("Error", "There was an error selecting your image.");
		} finally {
			setIsPickingImage(false);
		}
	};

	const takePhoto = async () => {
		if (selectedImages.length >= 5) {
			Alert.alert("Limit Reached", "You can only add up to 5 images per post.");
			return;
		}

		if (isPickingImage || uploadingImages) {
			return; // Prevent multiple concurrent operations
		}

		try {
			setIsPickingImage(true);

			const { status } = await ImagePicker.requestCameraPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission Denied",
					"Sorry, we need camera permissions to take photos.",
				);
				return;
			}

			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				quality: 0.8,
				aspect: [4, 3],
			});

			if (!result.canceled && result.assets?.[0]) {
				setSelectedImages((prev) => [...prev, result.assets[0].uri]);
			}
		} catch (error) {
			console.error("Error taking photo:", error);
			Alert.alert("Error", "There was an error taking the photo.");
		} finally {
			setIsPickingImage(false);
		}
	};

	const removeImage = (index: number) => {
		setSelectedImages((prev) => prev.filter((_, i) => i !== index));
	};

	const uploadImages = async (): Promise<string[]> => {
		if (selectedImages.length === 0) return [];

		setUploadingImages(true);
		const uploadedUrls: string[] = [];

		try {
			for (let i = 0; i < selectedImages.length; i++) {
				const imageUri = selectedImages[i];
				const fileName = `${nanoid()}.jpg`;

				// Read file as base64
				const base64 = await FileSystem.readAsStringAsync(imageUri, {
					encoding: FileSystem.EncodingType.Base64,
				});

				// Upload to Supabase Storage (directly to bucket root, no folder)
				const { data, error } = await supabase.storage
					.from("posts")
					.upload(fileName, decode(base64), {
						contentType: "image/jpeg",
						upsert: false,
					});

				if (error) {
					console.error("Upload error:", error);
					throw error;
				}

				// Get public URL
				const { data: urlData } = supabase.storage
					.from("posts")
					.getPublicUrl(fileName);

				uploadedUrls.push(urlData.publicUrl);
			}
		} catch (error) {
			console.error("Error uploading images:", error);
			Alert.alert(
				"Upload Error",
				"Failed to upload some images. Please try again.",
			);
			throw error;
		} finally {
			setUploadingImages(false);
		}

		return uploadedUrls;
	};

	const showImageOptions = () => {
		Alert.alert(
			"Add Images",
			"Choose how you'd like to add images to your post",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Take Photo",
					onPress: takePhoto,
				},
				{
					text: "Choose from Library",
					onPress: pickImages,
				},
			],
		);
	};

	const handleSubmit = async () => {
		if (!formData.title.trim()) {
			Alert.alert("Error", "Post title is required");
			return;
		}

		if (!formData.content.trim()) {
			Alert.alert("Error", "Post content is required");
			return;
		}

		// Check if posting to a group and warn if user might not be a member
		if (formData.group_id) {
			const selectedGroup = groups.find(
				(g) => g.id.toString() === formData.group_id,
			);
			if (selectedGroup && !selectedGroup.is_member) {
				Alert.alert(
					"Group Membership",
					"You may need to join this group to post in it. Do you want to continue?",
					[
						{ text: "Cancel", style: "cancel" },
						{ text: "Continue", onPress: () => proceedWithPost() },
					],
				);
				return;
			}
		}

		await proceedWithPost();
	};
	const proceedWithPost = async () => {
		try {
			// Upload images first if any
			let imageUrls: string[] = [];
			if (selectedImages.length > 0) {
				imageUrls = await uploadImages();
			}

			const postData: CreatePostData = {
				title: formData.title.trim(),
				content: formData.content.trim(),
				group_id: formData.group_id ? parseInt(formData.group_id) : undefined,
				post_type: formData.post_type,
				tags: formData.tags.length > 0 ? formData.tags : undefined,
				location: formData.location.trim() || undefined,
				images: imageUrls.length > 0 ? imageUrls : undefined,
			};

			const result = await createPost(postData);

			if (result) {
				Alert.alert("Success", "Your post has been created successfully!", [
					{
						text: "OK",
						onPress: () => router.back(),
					},
				]);
			} else if (error) {
				Alert.alert("Error", error);
			}
		} catch (error) {
			Alert.alert("Error", "Failed to create post. Please try again.");
		}
	};

	const toggleTag = (tag: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.includes(tag)
				? prev.tags.filter((t) => t !== tag)
				: [...prev.tags, tag],
		}));
	};
	const renderGroup = ({ item }: { item: any }) => (
		<Pressable
			onPress={() =>
				setFormData((prev) => ({
					...prev,
					group_id:
						prev.group_id === item.id.toString() ? "" : item.id.toString(),
				}))
			}
			className={`p-3 rounded-xl border mb-2 ${
				formData.group_id === item.id.toString()
					? "border-primary bg-primary/10"
					: "border-border bg-card"
			}`}
		>
			<View className="flex-row items-center">
				<Text className="text-xl mr-3">{item.icon || "📁"}</Text>
				<View className="flex-1">
					<View className="flex-row items-center">
						<Text className="font-medium text-foreground mr-2">
							{item.name}
						</Text>
						{item.is_member && (
							<Text className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
								Member
							</Text>
						)}
					</View>
					<Text className="text-sm text-muted-foreground">
						{item.member_count} members
					</Text>
				</View>
				{formData.group_id === item.id.toString() && (
					<Ionicons
						name="checkmark-circle"
						size={20}
						color={colors.light.primary}
					/>
				)}
			</View>
		</Pressable>
	);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				{/* Header */}
				<View className="flex-row items-center justify-between px-4 py-3 mb-4">
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="close" size={24} color={textColor} />
					</TouchableOpacity>
					<H1>Create Post</H1>
					<View style={{ width: 24 }} />
				</View>

				<View className="px-4">
					{/* Post Type */}
					<View className="mb-6">
						<Label className="mb-3">Post Type</Label>
						<View>
							{POST_TYPES.map((type) => (
								<TouchableOpacity
									key={type.id}
									onPress={() =>
										setFormData((prev) => ({ ...prev, post_type: type.id }))
									}
									className="flex-row items-center py-3 px-2 mb-2 rounded-lg"
									activeOpacity={0.7}
								>
									<View className="mr-4">
										<View
											className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
												formData.post_type === type.id
													? "border-primary bg-primary"
													: "border-border bg-background"
											}`}
										>
											{formData.post_type === type.id && (
												<View className="w-3 h-3 rounded-full bg-white" />
											)}
										</View>
									</View>
									<View className="flex-1">
										<Text className="text-foreground font-medium">
											{type.label}
										</Text>
										<Text className="text-muted-foreground text-sm">
											{type.description}
										</Text>
									</View>
								</TouchableOpacity>
							))}
						</View>
					</View>
					{/* Group Selection */}
					<View className="mb-6">
						<Label className="mb-3">Post to Group (Optional)</Label>
						<Text className="text-muted-foreground text-sm mb-3">
							Select a group to post in, or leave blank to post to general
							community
						</Text>
						{formData.group_id && (
							<TouchableOpacity
								onPress={() =>
									setFormData((prev) => ({ ...prev, group_id: "" }))
								}
								className="mb-3 p-2 bg-muted rounded-lg"
							>
								<Text className="text-muted-foreground text-sm text-center">
									Clear selection (post to general community)
								</Text>
							</TouchableOpacity>
						)}
						<FlatList
							data={groups.slice(0, 5)} // Show top 5 groups
							renderItem={renderGroup}
							keyExtractor={(item) => item.id.toString()}
							scrollEnabled={false}
							className="max-h-60"
						/>
					</View>
					{/* Title */}
					<View className="mb-6">
						<Label className="mb-2">Title *</Label>
						<Input
							placeholder="What's your post about?"
							value={formData.title}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, title: text }))
							}
							className="text-foreground"
						/>
					</View>
					{/* Content */}
					<View className="mb-6">
						<Label className="mb-2">Content *</Label>
						<Textarea
							placeholder="Share your thoughts, ask a question, or provide details..."
							value={formData.content}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, content: text }))
							}
							numberOfLines={6}
							className="text-foreground"
						/>
					</View>
					{/* Location */}
					<View className="mb-6">
						<Label className="mb-2">Location (Optional)</Label>
						<View
							className="mb-1"
							style={{
								zIndex: 1,
								height: 48,
							}}
						>
							<GooglePlacesAutocomplete
								placeholder="e.g., San Francisco, CA"
								predefinedPlaces={[]}
								onPress={(data, details = null) => {
									setFormData((prev) => ({
										...prev,
										location: data.description,
									}));
									Keyboard.dismiss();
								}}
								renderLeftButton={() => (
									<View className="justify-center items-center pl-3">
										<Ionicons
											name="location-outline"
											size={20}
											color={mutedTextColor}
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
										zIndex: 9999,
										elevation: 5,
										maxHeight: 200,
										overflow: "visible",
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
						<Text className="text-muted-foreground text-xs mt-1">
							Share your location if relevant to your post
						</Text>
					</View>
					{/* Images */}
					<View className="mb-6">
						<Label className="mb-3">Images (Optional)</Label>
						<Text className="text-muted-foreground text-sm mb-3">
							Add up to 5 images to your post
						</Text>

						{/* Add Image Button */}
						{selectedImages.length < 5 && (
							<TouchableOpacity
								onPress={showImageOptions}
								className="border-2 border-dashed border-border rounded-lg p-4 mb-3 items-center justify-center"
								activeOpacity={0.7}
							>
								<Ionicons
									name="camera-outline"
									size={32}
									color={mutedTextColor}
								/>
								<Text className="text-muted-foreground mt-2 text-center">
									{selectedImages.length === 0
										? "Add images"
										: `Add more images (${selectedImages.length}/5)`}
								</Text>
							</TouchableOpacity>
						)}

						{/* Image Preview */}
						{selectedImages.length > 0 && (
							<View className="mb-3">
								<FlatList
									data={selectedImages}
									horizontal
									showsHorizontalScrollIndicator={false}
									keyExtractor={(item, index) => index.toString()}
									renderItem={({ item, index }) => (
										<View className="mr-3 relative">
											<Image
												source={{ uri: item }}
												className="w-20 h-20 rounded-lg"
												resizeMode="cover"
											/>
											<TouchableOpacity
												onPress={() => removeImage(index)}
												className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
												activeOpacity={0.7}
											>
												<Ionicons name="close" size={16} color="white" />
											</TouchableOpacity>
										</View>
									)}
									contentContainerStyle={{ paddingRight: 16 }}
								/>
							</View>
						)}
					</View>
					{/* Tags */}
					<View className="mb-6">
						<Label className="mb-3">Tags (Optional)</Label>
						<Text className="text-muted-foreground text-sm mb-3">
							Select relevant tags to help people find your post
						</Text>
						<View className="flex-row flex-wrap">
							{COMMON_TAGS.map((tag) => (
								<Pressable
									key={tag}
									onPress={() => toggleTag(tag)}
									className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
										formData.tags.includes(tag)
											? "border-primary bg-primary/10"
											: "border-border bg-card"
									}`}
								>
									<Text
										className={`text-sm ${
											formData.tags.includes(tag)
												? "text-primary font-medium"
												: "text-foreground"
										}`}
									>
										#{tag}
									</Text>
								</Pressable>
							))}
						</View>
						{formData.tags.length > 0 && (
							<View className="mt-3">
								<Text className="text-muted-foreground text-sm">
									Selected: {formData.tags.map((tag) => `#${tag}`).join(", ")}
								</Text>
							</View>
						)}
					</View>
					{/* Submit Button */}
					<Button
						onPress={handleSubmit}
						disabled={
							loading ||
							uploadingImages ||
							!formData.title.trim() ||
							!formData.content.trim()
						}
						className="w-full mb-8"
					>
						<Text className="text-primary-foreground font-semibold">
							{uploadingImages
								? "Uploading images..."
								: loading
									? "Creating..."
									: "Create Post"}
						</Text>
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
