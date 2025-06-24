import React, { useState } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	FlatList,
	Alert,
	Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
} from "@/hooks/useCommunity";
import { PostReply } from "@/types/community";
import { format } from "date-fns";

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

	const [replyContent, setReplyContent] = useState("");
	const [replyingTo, setReplyingTo] = useState<number | null>(null);

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

		const result = await createReply({
			post_id: postId,
			content: replyContent.trim(),
			parent_reply_id: replyingTo || undefined,
		});

		if (result) {
			setReplyContent("");
			setReplyingTo(null);
			refetchReplies();
			refetchPost(); // Update reply count
		}
	};

	const handleVote = async (voteType: "up" | "down") => {
		const success = await votePost(postId, voteType);
		if (success) {
			refetchPost();
		}
	};

	const renderReply = ({ item }: { item: PostReply }) => (
		<View className="bg-card rounded-xl p-4 mb-3 border border-border">
			{/* Reply Header */}
			<View className="flex-row items-center justify-between mb-3">
				<View className="flex-row items-center">
					<View className="w-8 h-8 rounded-full overflow-hidden mr-2">
						{item.author?.avatar ? (
							<Image
								source={{ uri: item.author.avatar }}
								className="w-8 h-8"
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
					<View>
						<Text className="font-medium text-foreground">
							{item.author?.name || item.author?.username || "Anonymous"}
						</Text>
						<Text className="text-xs text-muted-foreground">
							{format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
						</Text>
					</View>
				</View>
				{item.is_accepted && (
					<View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
						<Text className="text-green-600 dark:text-green-400 text-xs font-medium">
							✓ Accepted
						</Text>
					</View>
				)}
			</View>
			{/* Reply Content */}
			<Text className="text-foreground mb-3 leading-5">{item.content}</Text>
			{/* Reply Actions */}
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center">
					<TouchableOpacity
						onPress={() => {
							/* TODO: Implement reply voting */
						}}
						className="flex-row items-center mr-4"
					>
						<Ionicons
							name="arrow-up-outline"
							size={16}
							color={mutedTextColor}
						/>
						<Text className="text-muted-foreground text-sm ml-1">
							{item.upvotes}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => {
							/* TODO: Implement reply voting */
						}}
						className="flex-row items-center mr-4"
					>
						<Ionicons
							name="arrow-down-outline"
							size={16}
							color={mutedTextColor}
						/>
						<Text className="text-muted-foreground text-sm ml-1">
							{item.downvotes}
						</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					onPress={() => setReplyingTo(item.id)}
					className="flex-row items-center"
				>
					<Ionicons
						name="chatbubble-outline"
						size={16}
						color={mutedTextColor}
					/>
					<Text className="text-muted-foreground text-sm ml-1">Reply</Text>
				</TouchableOpacity>
			</View>
			{/* Reply to this reply */}
			{replyingTo === item.id && (
				<View className="mt-4 pt-4 border-t border-border">
					<Text className="text-muted-foreground text-sm mb-2">
						Replying to {item.author?.name || "this comment"}
					</Text>
					<Textarea
						placeholder="Write your reply..."
						value={replyContent}
						onChangeText={setReplyContent}
						numberOfLines={3}
						className="text-foreground mb-3"
					/>
					<View className="flex-row space-x-2">
						<Button
							onPress={handleReply}
							disabled={replyLoading || !replyContent.trim()}
							className="flex-1"
						>
							<Text className="text-primary-foreground">
								{replyLoading ? "Posting..." : "Post Reply"}
							</Text>
						</Button>
						<Button
							onPress={() => {
								setReplyingTo(null);
								setReplyContent("");
							}}
							variant="outline"
							className="flex-1"
						>
							<Text className="text-foreground">Cancel</Text>
						</Button>
					</View>
				</View>
			)}
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
							<Button
								onPress={handleReply}
								disabled={replyLoading || !replyContent.trim()}
								className="w-full"
							>
								<Text className="text-primary-foreground font-semibold">
									{replyLoading ? "Posting..." : "Post Reply"}
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
		</SafeAreaView>
	);
}
