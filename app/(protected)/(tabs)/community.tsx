import React, { useState, useRef, useEffect } from "react";
import {
	ScrollView,
	View,
	Pressable,
	RefreshControl,
	FlatList,
	TouchableOpacity,
	Image,
	ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useAuth } from "@/context/supabase-provider";
import { useNotifications } from "@/context/notification-provider";
import { supabase } from "@/config/supabase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

// Import community hooks and types
import {
	useGroups,
	usePosts,
	usePostVoting,
	usePopularPosts,
	usePopularGroups,
} from "@/hooks/useCommunity";
import { Group, Post } from "@/types/community";

// Tab categories for the community
const communityTabs = [
	{ id: "popular", name: "Popular" },
	{ id: "groups", name: "Groups" },
	{ id: "posts", name: "Posts" },
];

export default function Community() {
	const [activeTab, setActiveTab] = useState("popular");
	const [refreshing, setRefreshing] = useState(false);

	// User authentication state
	const { session } = useAuth();
	const { colorScheme } = useColorScheme();
	const { unreadCount, notifications } = useNotifications();
	const [username, setUsername] = useState<string | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [loadingUser, setLoadingUser] = useState(true);

	// Community data hooks
	const {
		groups,
		loading: groupsLoading,
		error: groupsError,
		refetch: refetchGroups,
	} = useGroups();
	const {
		posts,
		loading: postsLoading,
		error: postsError,
		refetch: refetchPosts,
	} = usePosts();
	const { votePost, loading: voteLoading } = usePostVoting();

	// Popular content hooks
	const {
		posts: popularPosts,
		loading: popularPostsLoading,
		error: popularPostsError,
		refetch: refetchPopularPosts,
	} = usePopularPosts();
	const {
		groups: popularGroups,
		loading: popularGroupsLoading,
		error: popularGroupsError,
		refetch: refetchPopularGroups,
	} = usePopularGroups();

	// Calculate community-specific notification counts
	const communityNotificationCount = notifications.filter(n => 
		['community_post', 'community_reply', 'community_vote', 'group_join', 'group_update'].includes(n.type) && !n.read
	).length;

	const newPostsCount = notifications.filter(n => 
		n.type === 'community_post' && !n.read
	).length;

	const newGroupUpdatesCount = notifications.filter(n => 
		['group_join', 'group_update'].includes(n.type) && !n.read
	).length;

	useEffect(() => {
		const fetchUser = async () => {
			if (session?.user?.id) {
				const { data, error } = await supabase
					.from("users")
					.select("username, name, avatar")
					.eq("id", session.user.id)
					.single();
				if (data) {
					setUsername(data.name || data.username || "there");
					setAvatarUrl(data.avatar);
				} else {
					setUsername("there");
				}
			} else {
				setUsername("there");
			}
			setLoadingUser(false);
		};
		fetchUser();
	}, [session?.user?.id]);

	// Handler for pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		await Promise.all([
			refetchGroups(),
			refetchPosts(),
			refetchPopularPosts(),
			refetchPopularGroups(),
		]);
		setRefreshing(false);
	};

	const handleVote = async (postId: number, voteType: "up" | "down") => {
		const success = await votePost(postId, voteType);
		if (success) {
			refetchPosts(); // Refresh posts to show updated vote counts
			refetchPopularPosts(); // Also refresh popular posts
		}
	};

	const renderPost = ({ item }: { item: Post }) => (
		<Pressable
			className="bg-card rounded-xl p-4 mb-4 border border-border"
			onPress={() => router.push(`/(protected)/post/${item.id}` as any)}
		>
			{/* Post Header - Match post detail page exactly */}
			<View className="flex-row items-start justify-between mb-3">
				<View className="flex-row items-center flex-1">
					<View className="w-10 h-10 rounded-full overflow-hidden mr-3">
						{item.author?.avatar ? (
							<Image
								source={{ uri: item.author.avatar }}
								className="w-10 h-10"
								resizeMode="cover"
							/>
						) : (
							<View className="w-10 h-10 bg-primary/80 rounded-full items-center justify-center">
								<Text className="text-white text-sm font-bold">
									{item.author?.name
										? item.author.name.charAt(0).toUpperCase()
										: "U"}
								</Text>
							</View>
						)}
					</View>
					<View className="flex-1">
						<Text className="font-medium text-foreground">
							{item.author?.name || item.author?.username || "Anonymous"}
						</Text>
						<View className="flex-row items-center">
							<Text className="text-xs text-muted-foreground">
								{format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
							</Text>
							{item.group && (
								<>
									<Text className="text-xs text-muted-foreground mx-1">•</Text>
									<Text className="text-xs text-primary font-medium">
										{item.group.name}
									</Text>
								</>
							)}
						</View>
					</View>
				</View>
				{item.is_pinned && (
					<View className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
						<Text className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">
							📌 Pinned
						</Text>
					</View>
				)}
			</View>

			{/* Post Type & Tags - Horizontal ScrollView */}
			{(item.post_type || (item.tags && item.tags.length > 0)) && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					className="mb-3"
					contentContainerStyle={{ paddingRight: 16 }}
				>
					<View className="flex-row items-center">
						{item.post_type && (
							<View className="bg-secondary/50 px-2 py-1 rounded-full mr-2">
								<Text className="text-xs text-secondary-foreground font-medium">
									{item.post_type}
								</Text>
							</View>
						)}
						{item.tags &&
							item.tags.map((tag, index) => (
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
			)}

			{/* Post Title */}
			<Text className="text-xl font-semibold text-foreground mb-3">
				{item.title}
			</Text>

			{/* Post Content */}
			<Text className="text-foreground mb-4 leading-6" numberOfLines={3}>
				{item.content}
			</Text>

			{/* Post Images */}
			{item.images && item.images.length > 0 && (
				<View className="mb-4">
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingRight: 16 }}
					>
						<View className="flex-row">
							{item.images.slice(0, 3).map((imageUrl, index) => (
								<TouchableOpacity
									key={index}
									onPress={(e) => {
										e.stopPropagation();
										router.push(`/(protected)/post/${item.id}` as any);
									}}
									className="mr-2 relative"
								>
									<Image
										source={{ uri: imageUrl }}
										className="w-20 h-20 rounded-lg"
										resizeMode="cover"
									/>
									{index === 2 && item.images!.length > 3 && (
										<View className="absolute inset-0 bg-black/60 rounded-lg items-center justify-center">
											<Text className="text-white font-semibold">
												+{item.images!.length - 3}
											</Text>
										</View>
									)}
								</TouchableOpacity>
							))}
						</View>
					</ScrollView>
				</View>
			)}

			{/* Post Location */}
			{item.location && (
				<View className="flex-row items-center mb-4">
					<Ionicons name="location-outline" size={16} color="#6b7280" />
					<Text className="text-muted-foreground text-sm ml-1">
						{item.location}
					</Text>
				</View>
			)}

			{/* Post Actions - Match post detail page exactly */}
			<View className="flex-row items-center justify-between pt-3 border-t border-border">
				<View className="flex-row items-center">
					<TouchableOpacity
						onPress={(e) => {
							e.stopPropagation();
							handleVote(item.id, "up");
						}}
						disabled={voteLoading}
						className="flex-row items-center mr-6"
					>
						<Ionicons
							name={item.user_vote === "up" ? "arrow-up" : "arrow-up-outline"}
							size={20}
							color={item.user_vote === "up" ? colors.light.primary : "#6b7280"}
						/>
						<Text className="text-foreground ml-1 font-medium">
							{item.upvotes}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={(e) => {
							e.stopPropagation();
							handleVote(item.id, "down");
						}}
						disabled={voteLoading}
						className="flex-row items-center mr-6"
					>
						<Ionicons
							name={
								item.user_vote === "down" ? "arrow-down" : "arrow-down-outline"
							}
							size={20}
							color={item.user_vote === "down" ? "#ef4444" : "#6b7280"}
						/>
						<Text className="text-foreground ml-1 font-medium">
							{item.downvotes}
						</Text>
					</TouchableOpacity>
					<View className="flex-row items-center mr-6">
						<Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
						<Text className="text-muted-foreground text-sm ml-1">
							{item.reply_count} replies
						</Text>
					</View>
					<View className="flex-row items-center">
						<Ionicons name="eye-outline" size={18} color="#6b7280" />
						<Text className="text-muted-foreground text-sm ml-1">
							{item.view_count} views
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);

	const renderGroup = ({ item }: { item: Group }) => (
		<Pressable
			className="bg-card rounded-xl p-4 mb-4 border border-border"
			onPress={() => {
				router.push(`/(protected)/groups/${item.id}` as any);
			}}
		>
			<View className="flex-row items-start justify-between mb-2">
				<View className="flex-row items-center flex-1">
					{item.icon && <Text className="text-2xl mr-3">{item.icon}</Text>}
					<View className="flex-1">
						<Text className="font-semibold text-foreground text-lg">
							{item.name}
						</Text>
						{item.location && (
							<Text className="text-muted-foreground text-xs">
								📍 {item.location}
							</Text>
						)}
					</View>
				</View>
				<Text className="text-muted-foreground text-sm">
					{item.member_count} members
				</Text>
			</View>

			{item.description && (
				<Text className="text-muted-foreground text-sm mb-2" numberOfLines={2}>
					{item.description}
				</Text>
			)}
			<View className="flex-row items-center justify-between">
				<View className="bg-secondary/50 self-start px-3 py-1 rounded-full">
					<Text className="text-secondary-foreground text-xs font-medium">
						{item.category}
					</Text>
				</View>
				<Text className="text-muted-foreground text-xs">
					{item.post_count} posts
				</Text>
			</View>
		</Pressable>
	);

	const renderTabContent = () => {
		switch (activeTab) {
			case "popular":
				if (popularPostsLoading || popularGroupsLoading) {
					return (
						<View className="px-4 py-8 items-center">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="text-muted-foreground mt-2">
								Loading popular content...
							</Text>
						</View>
					);
				}

				return (
					<View className="px-4">
						{/* Popular Posts Section */}
						<View className="flex-row items-center justify-between mb-4">
							<Text className="text-xl font-semibold text-foreground">
								🔥 Most Viewed Posts
							</Text>
							{newPostsCount > 0 && (
								<View className="bg-red-500 px-2 py-1 rounded-full">
									<Text className="text-white text-xs font-bold">
										{newPostsCount} new
									</Text>
								</View>
							)}
						</View>
						{popularPostsError ? (
							<View className="py-4 items-center mb-6">
								<Text className="text-muted-foreground">
									Error loading popular posts
								</Text>
							</View>
						) : popularPosts.length === 0 ? (
							<View className="py-4 items-center mb-6">
								<Text className="text-muted-foreground">No posts yet</Text>
								<Text className="text-muted-foreground text-sm mt-1">
									Be the first to create one!
								</Text>
							</View>
						) : (
							<View className="mb-8">
								<FlatList
									data={popularPosts}
									renderItem={renderPost}
									keyExtractor={(item) => item.id.toString()}
									scrollEnabled={false}
								/>
							</View>
						)}

						{/* Popular Groups Section */}
						<View className="flex-row items-center justify-between mb-4">
							<Text className="text-xl font-semibold text-foreground">
								👥 Top Communities
							</Text>
							{newGroupUpdatesCount > 0 && (
								<View className="bg-blue-500 px-2 py-1 rounded-full">
									<Text className="text-white text-xs font-bold">
										{newGroupUpdatesCount} updates
									</Text>
								</View>
							)}
						</View>
						{popularGroupsError ? (
							<View className="py-4 items-center">
								<Text className="text-muted-foreground">
									Error loading popular groups
								</Text>
							</View>
						) : popularGroups.length === 0 ? (
							<View className="py-4 items-center">
								<Text className="text-muted-foreground">No groups yet</Text>
								<Text className="text-muted-foreground text-sm mt-1">
									Be the first to create one!
								</Text>
							</View>
						) : (
							<FlatList
								data={popularGroups}
								renderItem={renderGroup}
								keyExtractor={(item) => item.id.toString()}
								scrollEnabled={false}
							/>
						)}
					</View>
				);

			case "posts":
				if (postsLoading) {
					return (
						<View className="px-4 py-8 items-center">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="text-muted-foreground mt-2">
								Loading posts...
							</Text>
						</View>
					);
				}

				return (
					<View className="px-4">
						<View className="flex-row items-center justify-between mb-4">
							<Text className="text-xl font-semibold text-foreground">
								Recent Posts
							</Text>
							{newPostsCount > 0 && (
								<View className="bg-green-500 px-2 py-1 rounded-full">
									<Text className="text-white text-xs font-bold">
										{newPostsCount} new
									</Text>
								</View>
							)}
						</View>
						{postsError ? (
							<View className="py-8 items-center">
								<Text className="text-muted-foreground">
									Error loading posts
								</Text>
							</View>
						) : posts.length === 0 ? (
							<View className="py-8 items-center">
								<Text className="text-muted-foreground">No posts yet</Text>
								<Text className="text-muted-foreground text-sm mt-1">
									Be the first to create one!
								</Text>
							</View>
						) : (
							<FlatList
								data={posts}
								renderItem={renderPost}
								keyExtractor={(item) => item.id.toString()}
								scrollEnabled={false}
							/>
						)}
					</View>
				);

			case "groups":
				if (groupsLoading) {
					return (
						<View className="px-4 py-8 items-center">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="text-muted-foreground mt-2">
								Loading groups...
							</Text>
						</View>
					);
				}

				return (
					<View className="px-4">
						<View className="flex-row items-center justify-between mb-4">
							<Text className="text-xl font-semibold text-foreground">
								Community Groups
							</Text>
							{newGroupUpdatesCount > 0 && (
								<View className="bg-purple-500 px-2 py-1 rounded-full">
									<Text className="text-white text-xs font-bold">
										{newGroupUpdatesCount} updates
									</Text>
								</View>
							)}
						</View>
						<Text className="text-muted-foreground text-sm mb-4">
							Join groups based on your interests and location
						</Text>

						{groupsError ? (
							<View className="py-8 items-center">
								<Text className="text-muted-foreground">
									Error loading groups
								</Text>
							</View>
						) : groups.length === 0 ? (
							<View className="py-8 items-center">
								<Text className="text-muted-foreground">No groups yet</Text>
								<Text className="text-muted-foreground text-sm mt-1">
									Be the first to create one!
								</Text>
							</View>
						) : (
							<FlatList
								data={groups}
								renderItem={renderGroup}
								keyExtractor={(item) => item.id.toString()}
								scrollEnabled={false}
							/>
						)}
					</View>
				);

			default:
				return null;
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
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
				{/* Header with notification and profile */}
				<View className="flex-row justify-between items-center px-4 py-3 mb-4">
					<TouchableOpacity
						onPress={() => router.push("/(protected)/notification-modal")}
					>
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">🔔</Text>
							{unreadCount > 0 && (
								<View className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
									<Text className="text-white text-xs font-bold">
										{unreadCount > 99 ? '99+' : unreadCount}
									</Text>
								</View>
							)}
							{/* Community-specific notification indicator */}
							{communityNotificationCount > 0 && (
								<View className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border border-background" />
							)}
						</View>
					</TouchableOpacity>

					<H1>Community</H1>

					<TouchableOpacity
						onPress={() => router.push("/(protected)/(tabs)/profile")}
					>
						<View className="w-10 h-10 items-center justify-center overflow-hidden rounded-full">
							{avatarUrl ? (
								<Image
									source={{ uri: avatarUrl }}
									className="w-10 h-10"
									resizeMode="cover"
								/>
							) : (
								<View className="w-10 h-10 bg-primary/80 rounded-full items-center justify-center">
									<Text className="text-white text-lg font-bold">
										{username ? username.charAt(0).toUpperCase() : "U"}
									</Text>
								</View>
							)}
						</View>
					</TouchableOpacity>
				</View>

				{/* Community notification summary */}
				{communityNotificationCount > 0 && (
					<TouchableOpacity
						onPress={() => router.push("/(protected)/notification-modal")}
						className="mx-4 mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
						activeOpacity={0.7}
					>
						<View className="flex-row items-center">
							<View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mr-3">
								<Text className="text-white text-sm font-bold">
									{communityNotificationCount}
								</Text>
							</View>
							<View className="flex-1">
								<Text className="font-semibold text-green-700 dark:text-green-300">
									Community Updates
								</Text>
								<Text className="text-sm text-green-600 dark:text-green-400">
									{communityNotificationCount === 1 
										? "You have 1 new community notification"
										: `You have ${communityNotificationCount} new community notifications`
									}
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color="#059669" />
						</View>
					</TouchableOpacity>
				)}

				{/* Tab Navigation */}
				<View className="px-4 mb-6">
					<View className="flex-row">
						{communityTabs.map((tab, index) => (
							<Pressable
								key={tab.id}
								onPress={() => setActiveTab(tab.id)}
								className={cn(
									"flex-1 px-4 py-3 rounded-full border items-center justify-center relative",
									index === 0
										? "mr-2"
										: index === communityTabs.length - 1
											? "ml-2"
											: "mx-1",
									activeTab === tab.id
										? "bg-green-600 border-green-600"
										: "bg-secondary border-border",
								)}
							>
								<Text
									className={cn(
										"font-medium text-center",
										activeTab === tab.id ? "text-white" : "text-foreground",
									)}
								>
									{tab.name}
								</Text>
								{/* Tab-specific notification indicators */}
								{tab.id === "popular" && (newPostsCount > 0 || newGroupUpdatesCount > 0) && (
									<View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
								)}
								{tab.id === "posts" && newPostsCount > 0 && (
									<View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
										<Text className="text-white text-xs font-bold">
											{newPostsCount > 9 ? '9+' : newPostsCount}
										</Text>
									</View>
								)}
								{tab.id === "groups" && newGroupUpdatesCount > 0 && (
									<View className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
										<Text className="text-white text-xs font-bold">
											{newGroupUpdatesCount > 9 ? '9+' : newGroupUpdatesCount}
										</Text>
									</View>
								)}
							</Pressable>
						))}
					</View>
				</View>

				{/* Tab Content */}
				{renderTabContent()}

				{/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>

			{/* Floating Action Buttons */}
			<View className="absolute bottom-14 right-6">
				{/* Secondary FAB - Group creation (above main FAB) */}
				{activeTab !== "groups" && (
					<TouchableOpacity
						onPress={() => router.push("/(protected)/create-group-modal")}
						className="w-16 h-16 rounded-full shadow-lg active:scale-95 mb-3"
						style={{
							backgroundColor: colorScheme === "dark" ? "#0369a1" : "#0ea5e9",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.3,
							shadowRadius: 8,
							elevation: 8,
						}}
						activeOpacity={0.8}
					>
						<View className="flex-1 items-center justify-center">
							<Ionicons name="people" size={28} color="#FFFFFF" />
						</View>
					</TouchableOpacity>
				)}

				{/* Main Create FAB */}
				<TouchableOpacity
					onPress={() => {
						// Navigate based on active tab
						if (activeTab === "groups") {
							router.push("/(protected)/create-group-modal");
						} else {
							router.push("/(protected)/create-post-modal");
						}
					}}
					className="w-16 h-16 rounded-full shadow-lg active:scale-95"
					style={{
						backgroundColor: colorScheme === "dark" ? "#10b981" : "#10b981",
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.7,
						shadowRadius: 8,
						elevation: 8,
					}}
					activeOpacity={0.8}
				>
					<View className="flex-1 items-center justify-center">
						<Ionicons name="add" size={28} color="#FFFFFF" />
					</View>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}