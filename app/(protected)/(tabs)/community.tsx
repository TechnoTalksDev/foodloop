import React, { useState, useRef, useEffect } from "react";
import {
	ScrollView,
	View,
	Pressable,
	RefreshControl,
	FlatList,
	TouchableOpacity,
	Image,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { cn } from "@/lib/utils";

// Tab categories for the community
const communityTabs = [
	{ id: "popular", name: "Popular" },
	{ id: "recommend", name: "Recommend" },
	{ id: "plugin", name: "Groups" },
	{ id: "issue", name: "Challenges" },
];

// Recommended posts data (placeholder)
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

// Forum posts data (placeholder)
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

// Groups data (placeholder)
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

// Challenges data (placeholder)
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
	const [activeTab, setActiveTab] = useState("recommend");
	const [refreshing, setRefreshing] = useState(false);

	// User authentication state
	const { session } = useAuth();
	const [username, setUsername] = useState<string | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [loadingUser, setLoadingUser] = useState(true);
	
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
		// Simulate API call
		setTimeout(() => {
			setRefreshing(false);
		}, 1000);
	};
	const renderRecommendedPost = ({ item }: { item: any }) => (
		<View className="mr-4">
			<Pressable className={cn("w-32 h-32 rounded-2xl p-4 justify-between", item.color)}>
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
	const renderForumPost = ({ item }: { item: any }) => (
		<Pressable className="bg-card rounded-xl p-4 mb-4 border border-border">
			<View className="flex-row items-start justify-between mb-2">
				<Text className="flex-1 font-semibold text-foreground text-base leading-6 mr-2">
					{item.title}
				</Text>
				<Text className="text-muted-foreground text-2xl">{item.arrow}</Text>
			</View>
			
			<Text className="text-muted-foreground text-sm mb-3 leading-5">
				{item.description}
			</Text>
			
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center">
					<Text className="text-2xl mr-2">{item.author.avatar}</Text>
					<Text className="text-muted-foreground text-sm">
						{item.answers} answers, {item.date}
					</Text>
				</View>
				<Text className="text-green-500 text-sm font-medium">{item.tag}</Text>
			</View>
		</Pressable>
	);
	const renderGroup = ({ item }: { item: any }) => (
		<Pressable className="bg-card rounded-xl p-4 mb-4 border border-border">
			<View className="flex-row items-start justify-between mb-2">
				<Text className="font-semibold text-foreground text-lg">{item.name}</Text>
				<Text className="text-muted-foreground text-sm">{item.members} members</Text>
			</View>
			<Text className="text-muted-foreground text-sm mb-2">{item.description}</Text>
			<View className="bg-secondary/50 self-start px-3 py-1 rounded-full">
				<Text className="text-secondary-foreground text-xs font-medium">{item.category}</Text>
			</View>
		</Pressable>
	);
	const renderChallenge = ({ item }: { item: any }) => (
		<Pressable className="bg-card rounded-xl p-4 mb-4 border border-border">
			<View className="flex-row items-start justify-between mb-2">
				<Text className="flex-1 font-semibold text-foreground text-lg mr-2">
					{item.title}
				</Text>
				<Text className="text-green-500 text-sm font-medium">
					{item.daysLeft} days left
				</Text>
			</View>
			
			<Text className="text-muted-foreground text-sm mb-3">{item.description}</Text>
			
			<View className="mb-3">
				<View className="flex-row items-center justify-between mb-1">
					<Text className="text-muted-foreground text-xs">Progress</Text>
					<Text className="text-foreground text-xs font-medium">{item.progress}%</Text>
				</View>
				<View className="bg-secondary rounded-full h-2">
					<View 
						className="bg-green-500 rounded-full h-2" 
						style={{ width: `${item.progress}%` }}
					/>
				</View>
			</View>
			
			<Text className="text-muted-foreground text-sm">
				{item.participants} participants
			</Text>
		</Pressable>
	);

	const renderTabContent = () => {
		switch (activeTab) {
			case "popular":				return (
					<View className="px-4">
						<Text className="text-xl font-semibold mb-4 text-foreground">
							Popular in Community
						</Text>
						<FlatList
							data={forumPosts.slice(0, 2)}
							renderItem={renderForumPost}
							keyExtractor={(item) => item.id.toString()}
							scrollEnabled={false}
						/>
					</View>
				);

			case "recommend":
				return (					<View>
						{/* Recommended Posts Section */}
						<View className="px-4 mb-6">
							<Text className="text-xl font-semibold mb-4 text-foreground">
								Recommended posts
							</Text>
							<FlatList
								data={recommendedPosts}
								renderItem={renderRecommendedPost}
								keyExtractor={(item) => item.id.toString()}
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ paddingRight: 16 }}
							/>
						</View>

						{/* Forum Posts */}
						<View className="px-4">
							<FlatList
								data={forumPosts}
								renderItem={renderForumPost}
								keyExtractor={(item) => item.id.toString()}
								scrollEnabled={false}
							/>
						</View>
					</View>
				);

			case "plugin":				return (
					<View className="px-4">
						<Text className="text-xl font-semibold mb-4 text-foreground">
							Community Groups
						</Text>
						<Text className="text-muted-foreground text-sm mb-4">
							Join groups based on your interests and location
						</Text>
						<FlatList
							data={communityGroups}
							renderItem={renderGroup}
							keyExtractor={(item) => item.id.toString()}
							scrollEnabled={false}
						/>
					</View>
				);

			case "issue":				return (
					<View className="px-4">
						<Text className="text-xl font-semibold mb-4 text-foreground">
							Active Challenges
						</Text>
						<Text className="text-muted-foreground text-sm mb-4">
							Participate in community challenges to make a bigger impact
						</Text>
						<FlatList
							data={activeChallenges}
							renderItem={renderChallenge}
							keyExtractor={(item) => item.id.toString()}
							scrollEnabled={false}
						/>
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
				}			>
				{/* Header with notification and profile */}
				<View className="flex-row justify-between items-center px-4 py-3 mb-4">
					<TouchableOpacity onPress={() => router.push("/(protected)/notification-modal")}> 
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">🔔</Text>
							<View className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
								<Text className="text-white text-xs font-bold">2</Text>
							</View>
						</View>
					</TouchableOpacity>

					<H1>Community</H1>

					<TouchableOpacity onPress={() => router.push("/(protected)/(tabs)/profile")}> 
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
										: "bg-secondary border-border"
								)}
							>
								<Text
									className={cn(
										"font-medium",
										activeTab === tab.id
											? "text-white"
											: "text-foreground"
									)}
								>
									{tab.name}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>

				{/* Tab Content */}
				{renderTabContent()}

				{/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>
		</SafeAreaView>
	);
}
