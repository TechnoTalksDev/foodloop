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
import { supabase } from "@/config/supabase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

// Import community hooks and types
import { useGroups, usePosts, usePostVoting } from "@/hooks/useCommunity";
import { Group, Post } from "@/types/community";

// Tab categories for the community
const communityTabs = [
	{ id: "popular", name: "Popular" },
	{ id: "groups", name: "Groups" },
	{ id: "posts", name: "Posts" },
	{ id: "growing", name: "Growing Tips" },
	{ id: "challenges", name: "Challenges" },
];

// Original recommended posts data
const recommendedPosts = [
	{
		id: 1,
		title: "Greens",
		count: "25 posts",
		color: "bg-green-600",
		icon: "🍃",
	},
	{
		id: 2,
		title: "Tutorials",
		count: "34 posts",
		color: "bg-green-700",
		icon: "📚",
	},
	{
		id: 3,
		title: "Q&A",
		count: "164 posts",
		color: "bg-green-800",
		icon: "❓",
	},
];

// Plant recommended posts
const plantRecommendedPosts = [
	{
		id: 1,
		title: "Tomato Care",
		count: "89 posts",
		color: "bg-red-600",
		icon: "🍅",
	},
	{
		id: 2,
		title: "Herb Garden",
		count: "156 posts",
		color: "bg-green-600",
		icon: "🌿",
	},
	{
		id: 3,
		title: "Pest Control",
		count: "234 posts",
		color: "bg-yellow-600",
		icon: "🐛",
	},
];

// Original forum posts
const forumPosts = [
	{
		id: 1,
		title: "Exported artboards are not overwriting existing exports",
		description:
			"If you have exported artboards (say PNG), make changes, and then export again a dialog prompts you to overwrite...",
		author: {
			name: "Jane Doe",
			avatar: "👤",
		},
		answers: 15,
		date: "March 23",
		tag: "#artboard",
		arrow: "→",
	},
	{
		id: 2,
		title: "Exporting to Zeplin",
		description:
			"What's the right way to export a designed card to Zeplin without detaching it from a shared library?",
		author: {
			name: "John Smith",
			avatar: "👤",
		},
		answers: 5,
		date: "March 14",
		tag: "#zeplin",
		arrow: "→",
	},
	{
		id: 3,
		title: "How to reduce food waste in restaurants?",
		description:
			"Looking for practical tips and strategies that work for small to medium sized restaurants...",
		author: {
			name: "Chef Maria",
			avatar: "👨‍🍳",
		},
		answers: 23,
		date: "March 20",
		tag: "#sustainability",
		arrow: "→",
	},
	{
		id: 4,
		title: "Best practices for food donation programs",
		description:
			"Starting a food donation program at our local store. What are the legal requirements and best practices?",
		author: {
			name: "Store Manager",
			avatar: "🏪",
		},
		answers: 12,
		date: "March 18",
		tag: "#donation",
		arrow: "→",
	},
];

// Plant forum posts
const plantForumPosts = [
	{
		id: 1,
		title: "My tomatoes are getting yellow leaves - what should I do?",
		description:
			"I planted cherry tomatoes 6 weeks ago and they were doing great, but now the bottom leaves are turning yellow...",
		author: {
			name: "GardenNewbie",
			avatar: "🌱",
		},
		answers: 12,
		date: "2 hours ago",
		tag: "#tomatoes",
		arrow: "→",
	},
	{
		id: 2,
		title: "Best companion plants for peppers?",
		description:
			"Starting my pepper garden next month and want to know what grows well alongside them for natural pest control...",
		author: {
			name: "SpicyGrower",
			avatar: "🌶️",
		},
		answers: 8,
		date: "5 hours ago",
		tag: "#peppers",
		arrow: "→",
	},
	{
		id: 3,
		title: "Successful indoor herb garden setup - photos included!",
		description:
			"After 3 months of trial and error, finally got my indoor herbs thriving. Here's my setup and lessons learned...",
		author: {
			name: "HerbMaster",
			avatar: "🌿",
		},
		answers: 25,
		date: "1 day ago",
		tag: "#herbs",
		arrow: "→",
	},
	{
		id: 4,
		title: "When to harvest lettuce for best flavor?",
		description:
			"My buttercrunch lettuce is looking good but I'm not sure when to harvest. Should I wait longer or pick now?",
		author: {
			name: "LeafyLover",
			avatar: "🥬",
		},
		answers: 7,
		date: "1 day ago",
		tag: "#lettuce",
		arrow: "→",
	},
	{
		id: 5,
		title: "DIY organic fertilizer that actually works!",
		description:
			"Made this simple fertilizer from kitchen scraps and my plants have never looked better. Recipe and results inside...",
		author: {
			name: "OrganicGuru",
			avatar: "♻️",
		},
		answers: 34,
		date: "2 days ago",
		tag: "#organic",
		arrow: "→",
	},
];

// Original groups data
const communityGroups = [
	{
		id: 1,
		name: "Local Food Rescue",
		members: 245,
		description: "Connecting businesses with surplus food to local charities",
		category: "Neighborhood",
	},
	{
		id: 2,
		name: "Zero Waste Living",
		members: 1203,
		description: "Tips and tricks for reducing household food waste",
		category: "Lifestyle",
	},
	{
		id: 3,
		name: "Student Store Partners",
		members: 89,
		description: "University partnerships for campus food waste reduction",
		category: "Education",
	},
];

// Plant community groups
const plantCommunityGroups = [
	{
		id: 1,
		name: "Beginner Gardeners",
		members: 1247,
		description: "Safe space for new gardeners to ask questions and share wins",
		category: "Learning",
	},
	{
		id: 2,
		name: "Urban Container Gardens",
		members: 892,
		description: "Growing in small spaces - balconies, patios, and indoors",
		category: "Space-Saving",
	},
	{
		id: 3,
		name: "Organic Pest Control",
		members: 634,
		description: "Natural solutions for keeping pests away from your plants",
		category: "Organic",
	},
	{
		id: 4,
		name: "Seed Swappers",
		members: 445,
		description: "Trade seeds and cuttings with other local gardeners",
		category: "Trading",
	},
];

// Challenges data (original)
const activeChallenges = [
	{
		id: 1,
		title: "30-Day Food Waste Challenge",
		description: "Track and reduce your food waste for 30 days",
		participants: 156,
		progress: 75,
		daysLeft: 12,
	},
	{
		id: 2,
		title: "Local Business Hero",
		description: "Purchase from 5 different local businesses",
		participants: 89,
		progress: 40,
		daysLeft: 20,
	},
];

export default function Community() {
	const [activeTab, setActiveTab] = useState("popular");
	const [refreshing, setRefreshing] = useState(false);

	// User authentication state
	const { session } = useAuth();
	const { colorScheme } = useColorScheme();
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
		await Promise.all([refetchGroups(), refetchPosts()]);
		setRefreshing(false);
	};

	const handleVote = async (postId: number, voteType: "up" | "down") => {
		const success = await votePost(postId, voteType);
		if (success) {
			refetchPosts(); // Refresh posts to show updated vote counts
		}
	};

	const renderRecommendedPost = ({ item }: { item: any }) => (
		<View className="mr-4">
			<Pressable
				className={cn("w-32 h-32 rounded-2xl p-4 justify-between", item.color)}
			>
				<Text className="text-4xl">{item.icon}</Text>
				<View>
					<Text className="text-white font-semibold text-lg mb-1">
						{item.title}
					</Text>
					<Text className="text-white/80 text-sm">{item.count}</Text>
				</View>
			</Pressable>
		</View>
	);
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
				// Navigate to group detail or posts filtered by group
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
				if (postsLoading) {
					return (
						<View className="px-4 py-8 items-center">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="text-muted-foreground mt-2">
								Loading popular posts...
							</Text>
						</View>
					);
				}

				return (
					<View className="px-4">
						<Text className="text-xl font-semibold mb-4 text-foreground">
							Popular Posts
						</Text>
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
								data={posts.slice(0, 5)} // Show top 5 popular posts
								renderItem={renderPost}
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
						<Text className="text-xl font-semibold mb-4 text-foreground">
							Recent Posts
						</Text>
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
						<Text className="text-xl font-semibold mb-4 text-foreground">
							Community Groups
						</Text>
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

			case "growing":
				return (
					<View className="px-4">
						<Text className="text-xl font-semibold mb-4 text-foreground">
							Growing Tips & Guides
						</Text>
						<Text className="text-muted-foreground text-sm mb-4">
							Coming soon! Plant care guides and growing tips will be available
							here.
						</Text>

						{/* Placeholder content */}
						<View className="bg-card p-6 rounded-xl border border-border items-center">
							<Text className="text-6xl mb-4">🌱</Text>
							<Text className="font-semibold text-lg mb-2">Growing Tips</Text>
							<Text className="text-muted-foreground text-center text-sm">
								This section will contain helpful guides and tips for growing
								your plants successfully.
							</Text>
						</View>
					</View>
				);

			case "challenges":
				return (
					<View className="px-4">
						<Text className="text-xl font-semibold mb-4 text-foreground">
							Community Challenges
						</Text>
						<Text className="text-muted-foreground text-sm mb-4">
							Coming soon! Join community challenges to make a bigger impact.
						</Text>

						{/* Placeholder content */}
						<View className="bg-card p-6 rounded-xl border border-border items-center">
							<Text className="text-6xl mb-4">�</Text>
							<Text className="font-semibold text-lg mb-2">Challenges</Text>
							<Text className="text-muted-foreground text-center text-sm">
								This section will contain community challenges to help reduce
								waste and support sustainability.
							</Text>
						</View>
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
							<View className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
								<Text className="text-white text-xs font-bold">2</Text>
							</View>
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
				{/* Subtitle */}
				<View className="px-4 pb-2">
					<Text className="text-muted-foreground text-base">
						Connect, share, and learn with the FoodLoop community
					</Text>
				</View>
				{/* Tab Navigation */}
				<View className="px-4 mb-6">
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="flex-row"
						contentContainerStyle={{ paddingRight: 16 }}
					>
						{communityTabs.map((tab) => (
							<Pressable
								key={tab.id}
								onPress={() => setActiveTab(tab.id)}
								className={cn(
									"mr-3 px-4 py-2 rounded-full border",
									activeTab === tab.id
										? "bg-green-600 border-green-600"
										: "bg-secondary border-border",
								)}
							>
								<Text
									className={cn(
										"font-medium",
										activeTab === tab.id ? "text-white" : "text-foreground",
									)}
								>
									{tab.name}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>
				{/* Tab Content */}
				{renderTabContent()} {/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>
			{/* Floating Action Buttons */}
			<View className="absolute bottom-20 right-6">
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
					className="w-16 h-16 rounded-full shadow-lg active:scale-95 mb-3"
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

				{/* Secondary FAB - only show when not on the relevant tab */}
				{activeTab !== "groups" && (
					<TouchableOpacity
						onPress={() => router.push("/(protected)/create-group-modal")}
						className="w-12 h-12 rounded-full shadow-lg active:scale-95"
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
							<Ionicons name="people" size={18} color="#FFFFFF" />
						</View>
					</TouchableOpacity>
				)}
			</View>
		</SafeAreaView>
	);
}
