import React, { useState } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	FlatList,
	Alert,
	Image,
	Modal,
	Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { nanoid } from "nanoid";
import { format } from "date-fns";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import {
	usePost,
	usePostReplies,
	useCreateReply,
	usePostVoting,
	useReplyVoting,
} from "@/hooks/useCommunity";
import { PostReply } from "@/types/community";
import { supabase } from "@/config/supabase";

export default function PostDetailPage() {
	const router = useRouter();
	const { id } = useLocalSearchParams();
	const postId = parseInt(id as string);
	const { colorScheme } = useColorScheme();

	const { post, loading: postLoading, refetch: refetchPost } = usePost(postId);
	const {
		replies,
		loading: repliesLoading,
		refetch: refetchReplies,
	} = usePostReplies(postId);
	const { createReply, loading: replyLoading } = useCreateReply();
	const { votePost, loading: voteLoading } = usePostVoting();
	const { voteReply, loading: replyVoteLoading } = useReplyVoting();
	const [replyContent, setReplyContent] = useState("");
	const [replyingTo, setReplyingTo] = useState<number | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
		null,
	);
	const [imageModalVisible, setImageModalVisible] = useState(false);
	const [modalImageSet, setModalImageSet] = useState<string[]>([]);
	const [replyImages, setReplyImages] = useState<string[]>([]);
	const [uploadingReplyImages, setUploadingReplyImages] = useState(false);

	// Colors based on the theme
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;
	const mutedTextColor =
		colorScheme === "dark"
			? colors.dark.mutedForeground
			: colors.light.mutedForeground;
	const handleReply = async () => {
		if (!replyContent.trim()) {
			Alert.alert("Error", "Reply content is required");
			return;
		}

		try {
			// Upload images first if any
			let imageUrls: string[] = [];
			if (replyImages.length > 0) {
				imageUrls = await uploadReplyImages();
			}

			const result = await createReply({
				post_id: postId,
				content: replyContent.trim(),
				parent_reply_id: replyingTo || undefined,
				images: imageUrls.length > 0 ? imageUrls : undefined,
			});

			if (result) {
				setReplyContent("");
				setReplyingTo(null);
				setReplyImages([]);
				refetchReplies();
				refetchPost(); // Update reply count
			}
		} catch (error) {
			Alert.alert("Error", "Failed to create reply. Please try again.");
		}
	};

	const handleVote = async (voteType: "up" | "down") => {
		const success = await votePost(postId, voteType);
		if (success) {
			refetchPost();
		}
	};

	const handleReplyVote = async (replyId: number, voteType: "up" | "down") => {
		const success = await voteReply(replyId, voteType);
		if (success) {
			refetchReplies();
		}
	};

	const openImageModal = (
		index: number,
		imageSet: string[] = post?.images || [],
	) => {
		setSelectedImageIndex(index);
		setModalImageSet(imageSet);
		setImageModalVisible(true);
	};

	const closeImageModal = () => {
		setImageModalVisible(false);
		setSelectedImageIndex(null);
		setModalImageSet([]);
	};

	const renderImageModal = () => {
		if (!modalImageSet.length || selectedImageIndex === null) return null;

		const { width, height } = Dimensions.get("window");

		return (
			<Modal
				visible={imageModalVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={closeImageModal}
			>
				{/* Backdrop - tap to close */}
				<TouchableOpacity
					className="flex-1 bg-black/90 justify-center items-center"
					activeOpacity={1}
					onPress={closeImageModal}
				>
					{/* Close button - top right */}
					<TouchableOpacity
						onPress={closeImageModal}
						className="absolute top-12 right-4 z-20 w-12 h-12 bg-black/70 rounded-full items-center justify-center border border-white/20"
						activeOpacity={0.8}
					>
						<Ionicons name="close" size={28} color="white" />
					</TouchableOpacity>

					{/* Image counter - top left */}
					{modalImageSet.length > 1 && (
						<View className="absolute top-12 left-4 z-20 bg-black/70 px-4 py-2 rounded-full border border-white/20">
							<Text className="text-white font-medium text-sm">
								{selectedImageIndex + 1} of {modalImageSet.length}
							</Text>
						</View>
					)}

					{/* Image container - prevent tap propagation */}
					<TouchableOpacity
						activeOpacity={1}
						onPress={(e) => e.stopPropagation()}
						style={{ width: width - 40, height: height - 200 }}
						className="justify-center items-center"
					>
						<Image
							source={{ uri: modalImageSet[selectedImageIndex] }}
							style={{
								width: width - 40,
								height: height - 200,
							}}
							resizeMode="contain"
						/>
					</TouchableOpacity>

					{/* Navigation buttons - bottom */}
					{modalImageSet.length > 1 && (
						<View className="absolute bottom-20 left-0 right-0">
							<View className="flex-row justify-center">
								{selectedImageIndex > 0 && (
									<TouchableOpacity
										onPress={(e) => {
											e.stopPropagation();
											setSelectedImageIndex(selectedImageIndex - 1);
										}}
										className="bg-black/70 rounded-full p-3 mx-3 border border-white/20"
										activeOpacity={0.8}
									>
										<Ionicons name="chevron-back" size={24} color="white" />
									</TouchableOpacity>
								)}
								{selectedImageIndex < modalImageSet.length - 1 && (
									<TouchableOpacity
										onPress={(e) => {
											e.stopPropagation();
											setSelectedImageIndex(selectedImageIndex + 1);
										}}
										className="bg-black/70 rounded-full p-3 mx-3 border border-white/20"
										activeOpacity={0.8}
									>
										<Ionicons name="chevron-forward" size={24} color="white" />
									</TouchableOpacity>
								)}
							</View>
						</View>
					)}

					{/* Close instruction text */}
					<View className="absolute bottom-8 left-0 right-0">
						<Text className="text-white/60 text-center text-xs">
							Tap anywhere to close
						</Text>
					</View>
				</TouchableOpacity>
			</Modal>
		);
	};

	// Reply image functions
	const pickReplyImages = async () => {
		if (replyImages.length >= 3) {
			Alert.alert(
				"Limit Reached",
				"You can only add up to 3 images per reply.",
			);
			return;
		}

		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission Denied",
				"Sorry, we need camera roll permissions to upload images.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsMultipleSelection: true,
			quality: 0.8,
			selectionLimit: 3 - replyImages.length,
			aspect: [4, 3],
		});

		if (!result.canceled && result.assets) {
			const newImages = result.assets.map((asset) => asset.uri);
			setReplyImages((prev) => [...prev, ...newImages]);
		}
	};

	const takeReplyPhoto = async () => {
		if (replyImages.length >= 3) {
			Alert.alert(
				"Limit Reached",
				"You can only add up to 3 images per reply.",
			);
			return;
		}

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
			setReplyImages((prev) => [...prev, result.assets[0].uri]);
		}
	};

	const removeReplyImage = (index: number) => {
		setReplyImages((prev) => prev.filter((_, i) => i !== index));
	};

	const uploadReplyImages = async (): Promise<string[]> => {
		if (replyImages.length === 0) return [];

		setUploadingReplyImages(true);
		const uploadedUrls: string[] = [];

		try {
			for (let i = 0; i < replyImages.length; i++) {
				const imageUri = replyImages[i];
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
			setUploadingReplyImages(false);
		}

		return uploadedUrls;
	};

	const showReplyImageOptions = () => {
		Alert.alert("Add Image", "Choose how you'd like to add an image", [
			{ text: "Camera", onPress: takeReplyPhoto },
			{ text: "Photo Library", onPress: pickReplyImages },
			{ text: "Cancel", style: "cancel" },
		]);
	};

	const renderReply = ({ item }: { item: PostReply }) => (
		<View className="border-l-2 border-border/50 ml-4 pl-4 mb-4">
			<View className="flex-row items-start">
				{/* Author Avatar */}
				<View className="mr-3">
					{item.author?.avatar ? (
						<Image
							source={{ uri: item.author.avatar }}
							className="w-8 h-8 rounded-full"
							resizeMode="cover"
						/>
					) : (
						<View className="w-8 h-8 bg-primary/80 rounded-full items-center justify-center">
							<Text className="text-white text-xs font-bold">
								{item.author?.name
									? item.author.name.charAt(0).toUpperCase()
									: "U"}
							</Text>
						</View>
					)}
				</View>

				<View className="flex-1">
					{/* Author Info */}
					<View className="flex-row items-center mb-1">
						<Text className="font-medium text-foreground text-sm">
							{item.author?.name || item.author?.username || "Anonymous"}
						</Text>
						<Text className="text-xs text-muted-foreground ml-2">
							{format(new Date(item.created_at), "MMM d, h:mm a")}
						</Text>
					</View>

					{/* Reply Content */}
					<Text className="text-foreground mb-3 leading-relaxed">
						{item.content}
					</Text>

					{/* Reply Images */}
					{item.images && item.images.length > 0 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							className="mb-3"
							contentContainerStyle={{ paddingRight: 16 }}
						>
							<View className="flex-row">
								{item.images.map((imageUrl, index) => (
									<TouchableOpacity
										key={index}
										onPress={() => openImageModal(index, item.images!)}
										className="mr-2"
										activeOpacity={0.8}
									>
										<Image
											source={{ uri: imageUrl }}
											className="w-20 h-20 rounded-lg"
											resizeMode="cover"
										/>
									</TouchableOpacity>
								))}
							</View>
						</ScrollView>
					)}

					{/* Vote Buttons */}
					<View className="flex-row items-center">
						<TouchableOpacity
							onPress={() => handleReplyVote(item.id, "up")}
							className={`flex-row items-center mr-4 px-2 py-1 rounded-full ${
								item.user_vote === "up"
									? "bg-green-100 dark:bg-green-900/30"
									: "bg-secondary/50"
							}`}
							activeOpacity={0.7}
							disabled={replyVoteLoading}
						>
							<Ionicons
								name="arrow-up"
								size={16}
								color={item.user_vote === "up" ? "#16a34a" : mutedTextColor}
							/>
							<Text
								className={`ml-1 text-sm ${
									item.user_vote === "up"
										? "text-green-600 dark:text-green-400 font-semibold"
										: "text-muted-foreground"
								}`}
							>
								{item.upvotes}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => handleReplyVote(item.id, "down")}
							className={`flex-row items-center px-2 py-1 rounded-full ${
								item.user_vote === "down"
									? "bg-red-100 dark:bg-red-900/30"
									: "bg-secondary/50"
							}`}
							activeOpacity={0.7}
							disabled={replyVoteLoading}
						>
							<Ionicons
								name="arrow-down"
								size={16}
								color={item.user_vote === "down" ? "#dc2626" : mutedTextColor}
							/>
							<Text
								className={`ml-1 text-sm ${
									item.user_vote === "down"
										? "text-red-600 dark:text-red-400 font-semibold"
										: "text-muted-foreground"
								}`}
							>
								{item.downvotes}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</View>
	);

	if (postLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<Text className="text-muted-foreground">Loading post...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!post) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<Text className="text-muted-foreground">Post not found</Text>
				</View>
			</SafeAreaView>
		);
	}
	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View className="flex-row items-center justify-between px-4 py-3 mb-4">
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={textColor} />
					</TouchableOpacity>
					<H1>Post</H1>
					<View style={{ width: 24 }} />
				</View>

				<View className="px-4">
					{/* Post */}
					<View className="bg-card rounded-xl p-4 mb-6 border border-border">
						{/* Post Header */}
						<View className="flex-row items-start justify-between mb-3">
							<View className="flex-row items-center flex-1">
								<View className="w-10 h-10 rounded-full overflow-hidden mr-3">
									{post.author?.avatar ? (
										<Image
											source={{ uri: post.author.avatar }}
											className="w-10 h-10"
											resizeMode="cover"
										/>
									) : (
										<View className="w-10 h-10 bg-primary/80 rounded-full items-center justify-center">
											<Text className="text-white text-sm font-bold">
												{post.author?.name
													? post.author.name.charAt(0).toUpperCase()
													: "U"}
											</Text>
										</View>
									)}
								</View>
								<View className="flex-1">
									<Text className="font-medium text-foreground">
										{post.author?.name || post.author?.username || "Anonymous"}
									</Text>
									<View className="flex-row items-center">
										<Text className="text-xs text-muted-foreground">
											{format(
												new Date(post.created_at),
												"MMM d, yyyy 'at' h:mm a",
											)}
										</Text>
										{post.group && (
											<>
												<Text className="text-xs text-muted-foreground mx-1">
													•
												</Text>
												<Text className="text-xs text-primary font-medium">
													{post.group.name}
												</Text>
											</>
										)}
									</View>
								</View>
							</View>
							{post.is_pinned && (
								<View className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
									<Text className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">
										📌 Pinned
									</Text>
								</View>
							)}
						</View>
						{/* Post Type & Tags */}
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							className="mb-3"
							contentContainerStyle={{ paddingRight: 16 }}
						>
							<View className="flex-row items-center">
								<View className="bg-secondary/50 px-2 py-1 rounded-full mr-2">
									<Text className="text-xs text-secondary-foreground font-medium">
										{post.post_type}
									</Text>
								</View>
								{post.tags &&
									post.tags.map((tag, index) => (
										<View
											key={index}
											className="bg-primary/10 px-2 py-1 rounded-full mr-2"
										>
											<Text className="text-xs text-primary font-medium">
												#{tag}
											</Text>
										</View>
									))}
							</View>
						</ScrollView>
						{/* Post Title */}
						<Text className="text-xl font-semibold text-foreground mb-3">
							{post.title}
						</Text>
						{/* Post Content */}
						<Text className="text-foreground mb-4 leading-6">
							{post.content}
						</Text>
						{/* Post Images */}
						{post.images && post.images.length > 0 && (
							<View className="mb-4">
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={{ paddingRight: 16 }}
								>
									<View className="flex-row">
										{post.images.map((imageUrl, index) => (
											<TouchableOpacity
												key={index}
												onPress={() => openImageModal(index, post.images || [])}
												className="mr-3"
											>
												<Image
													source={{ uri: imageUrl }}
													className="w-24 h-24 rounded-lg"
													resizeMode="cover"
												/>
											</TouchableOpacity>
										))}
									</View>
								</ScrollView>
							</View>
						)}
						{/* Post Location */}
						{post.location && (
							<View className="flex-row items-center mb-4">
								<Ionicons
									name="location-outline"
									size={16}
									color={mutedTextColor}
								/>
								<Text className="text-muted-foreground text-sm ml-1">
									{post.location}
								</Text>
							</View>
						)}
						{/* Post Actions */}
						<View className="flex-row items-center justify-between pt-3 border-t border-border">
							<View className="flex-row items-center">
								<TouchableOpacity
									onPress={() => handleVote("up")}
									disabled={voteLoading}
									className="flex-row items-center mr-6"
								>
									<Ionicons
										name={
											post.user_vote === "up" ? "arrow-up" : "arrow-up-outline"
										}
										size={20}
										color={
											post.user_vote === "up"
												? colors.light.primary
												: mutedTextColor
										}
									/>
									<Text className="text-foreground ml-1 font-medium">
										{post.upvotes}
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => handleVote("down")}
									disabled={voteLoading}
									className="flex-row items-center mr-6"
								>
									<Ionicons
										name={
											post.user_vote === "down"
												? "arrow-down"
												: "arrow-down-outline"
										}
										size={20}
										color={
											post.user_vote === "down" ? "#ef4444" : mutedTextColor
										}
									/>
									<Text className="text-foreground ml-1 font-medium">
										{post.downvotes}
									</Text>
								</TouchableOpacity>
								<View className="flex-row items-center mr-6">
									<Ionicons
										name="chatbubble-outline"
										size={18}
										color={mutedTextColor}
									/>
									<Text className="text-muted-foreground text-sm ml-1">
										{post.reply_count} replies
									</Text>
								</View>
								<View className="flex-row items-center">
									<Ionicons
										name="eye-outline"
										size={18}
										color={mutedTextColor}
									/>
									<Text className="text-muted-foreground text-sm ml-1">
										{post.view_count} views
									</Text>
								</View>
							</View>
						</View>
					</View>
					{/* Reply Form */}
					{!replyingTo && (
						<View className="mb-6">
							<Text className="text-lg font-semibold text-foreground mb-3">
								Add a Reply
							</Text>
							<Textarea
								placeholder="Share your thoughts or answer..."
								value={replyContent}
								onChangeText={setReplyContent}
								numberOfLines={4}
								className="text-foreground mb-3"
							/>

							{/* Reply Images */}
							<View className="mb-3">
								{/* Add Image Button */}
								{replyImages.length < 3 && (
									<TouchableOpacity
										onPress={showReplyImageOptions}
										className="border border-dashed border-border rounded-lg p-3 mb-3 flex-row items-center justify-center"
										activeOpacity={0.7}
									>
										<Ionicons
											name="camera-outline"
											size={20}
											color={mutedTextColor}
										/>
										<Text className="text-muted-foreground ml-2">
											{replyImages.length === 0
												? "Add images"
												: `Add more images (${replyImages.length}/3)`}
										</Text>
									</TouchableOpacity>
								)}

								{/* Image Preview */}
								{replyImages.length > 0 && (
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={{ paddingRight: 16 }}
									>
										<View className="flex-row">
											{replyImages.map((imageUri, index) => (
												<View key={index} className="mr-2 relative">
													<Image
														source={{ uri: imageUri }}
														className="w-16 h-16 rounded-lg"
														resizeMode="cover"
													/>
													<TouchableOpacity
														onPress={() => removeReplyImage(index)}
														className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
														activeOpacity={0.7}
													>
														<Ionicons name="close" size={12} color="white" />
													</TouchableOpacity>
												</View>
											))}
										</View>
									</ScrollView>
								)}
							</View>

							<Button
								onPress={handleReply}
								disabled={
									replyLoading || uploadingReplyImages || !replyContent.trim()
								}
								className="w-full"
							>
								<Text className="text-primary-foreground font-semibold">
									{uploadingReplyImages
										? "Uploading images..."
										: replyLoading
											? "Posting..."
											: "Post Reply"}
								</Text>
							</Button>
						</View>
					)}
					{/* Replies */}
					<View className="mb-8">
						<Text className="text-lg font-semibold text-foreground mb-4">
							Replies ({replies.length})
						</Text>
						{repliesLoading ? (
							<View className="py-8">
								<Text className="text-center text-muted-foreground">
									Loading replies...
								</Text>
							</View>
						) : replies.length === 0 ? (
							<View className="py-8">
								<Text className="text-center text-muted-foreground">
									No replies yet. Be the first to reply!
								</Text>
							</View>
						) : (
							<FlatList
								data={replies}
								renderItem={renderReply}
								keyExtractor={(item) => item.id.toString()}
								scrollEnabled={false}
							/>
						)}
					</View>
				</View>
			</ScrollView>
			{renderImageModal()}
		</SafeAreaView>
	);
}
