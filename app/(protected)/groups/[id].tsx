import React, { useState } from "react";
import {
	ScrollView,
	View,
	TouchableOpacity,
	RefreshControl,
	FlatList,
	ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { format } from "date-fns";

// Import community hooks and types
import { useGroup, usePosts, useJoinGroup } from "@/hooks/useCommunity";
import { Post } from "@/types/community";

export default function GroupDetail() {
	const { id } = useLocalSearchParams();
	const { colorScheme } = useColorScheme();
	const [refreshing, setRefreshing] = useState(false);

	const groupId = parseInt(id as string);
	const {
		group,
		loading: groupLoading,
		error: groupError,
		refetch: refetchGroup,
	} = useGroup(groupId);
	const {
		posts,
		loading: postsLoading,
		error: postsError,
		refetch: refetchPosts,
	} = usePosts({ groupId });
	const { joinGroup, leaveGroup, loading: joinLoading } = useJoinGroup();

	const onRefresh = async () => {
		setRefreshing(true);
		await Promise.all([refetchGroup(), refetchPosts()]);
		setRefreshing(false);
	};

	const handleJoinGroup = async () => {
		if (!group) return;

		if (group.is_member) {
			await leaveGroup(group.id);
		} else {
			await joinGroup(group.id);
		}
		await refetchGroup();
	};

	const renderPost = ({ item }: { item: Post }) => (
		<TouchableOpacity
			className="bg-card rounded-xl p-4 mb-4 border border-border"
			onPress={() => router.push(`/(protected)/post/${item.id}` as any)}
		>
			<View className="flex-row items-start justify-between mb-2">
				<Text className="flex-1 font-semibold text-foreground text-base leading-6 mr-2">
					{item.title}
				</Text>
				<Text className="text-muted-foreground text-2xl">→</Text>
			</View>

			<Text
				className="text-muted-foreground text-sm mb-3 leading-5"
				numberOfLines={2}
			>
				{item.content}
			</Text>

			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center">
					<View className="w-6 h-6 bg-primary/80 rounded-full items-center justify-center mr-2">
						<Text className="text-white text-xs font-bold">
							{item.author?.name
								? item.author.name.charAt(0).toUpperCase()
								: "U"}
						</Text>
					</View>
					<Text className="text-muted-foreground text-sm">
						{item.reply_count} replies •{" "}
						{format(new Date(item.created_at), "MMM dd")}
					</Text>
				</View>
				<View className="flex-row items-center">
					<Ionicons name="arrow-up" size={16} color="#10b981" />
					<Text className="text-muted-foreground text-sm ml-1">
						{item.upvotes}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);

	if (groupLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#10b981" />
					<Text className="text-muted-foreground mt-2">Loading group...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (groupError || !group) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center px-4">
					<Text className="text-muted-foreground text-center mb-4">
						{groupError || "Group not found"}
					</Text>
					<Button onPress={() => router.back()}>
						<Text>Go Back</Text>
					</Button>
				</View>
			</SafeAreaView>
		);
	}

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
				{/* Header */}
				<View className="flex-row items-center justify-between px-4 py-3 mb-4">
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons
							name="arrow-back"
							size={24}
							color={colorScheme === "dark" ? "#fff" : "#000"}
						/>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() =>
							router.push(
								`/(protected)/create-post-modal?groupId=${groupId}` as any,
							)
						}
					>
						<Ionicons name="add" size={24} color="#10b981" />
					</TouchableOpacity>
				</View>

				{/* Group Info */}
				<View className="px-4 mb-6">
					<View className="flex-row items-center mb-3">
						{group.icon && <Text className="text-4xl mr-3">{group.icon}</Text>}
						<View className="flex-1">
							<H1 className="mb-1">{group.name}</H1>
							<Text className="text-muted-foreground">
								{group.member_count} members • {group.post_count} posts
							</Text>
						</View>
					</View>

					{group.description && (
						<Text className="text-muted-foreground mb-4 leading-5">
							{group.description}
						</Text>
					)}

					<View className="flex-row items-center justify-between mb-4">
						<View className="flex-row items-center">
							<View className="bg-secondary/50 px-3 py-1 rounded-full mr-2">
								<Text className="text-secondary-foreground text-xs font-medium">
									{group.category}
								</Text>
							</View>
							{group.location && (
								<Text className="text-muted-foreground text-sm">
									📍 {group.location}
								</Text>
							)}
						</View>
					</View>

					{/* Join/Leave Button */}
					<Button
						onPress={handleJoinGroup}
						disabled={joinLoading}
						className={group.is_member ? "bg-secondary" : "bg-primary"}
					>
						<Text
							className={
								group.is_member
									? "text-secondary-foreground"
									: "text-primary-foreground"
							}
						>
							{joinLoading
								? "Loading..."
								: group.is_member
									? "Leave Group"
									: "Join Group"}
						</Text>
					</Button>
				</View>

				{/* Posts Section */}
				<View className="px-4">
					<View className="flex-row items-center justify-between mb-4">
						<Text className="text-xl font-semibold text-foreground">
							Recent Posts
						</Text>
						<TouchableOpacity
							onPress={() =>
								router.push(
									`/(protected)/create-post-modal?groupId=${groupId}` as any,
								)
							}
						>
							<Text className="text-primary font-medium">Create Post</Text>
						</TouchableOpacity>
					</View>

					{postsLoading ? (
						<View className="py-8 items-center">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="text-muted-foreground mt-2">
								Loading posts...
							</Text>
						</View>
					) : postsError ? (
						<View className="py-8 items-center">
							<Text className="text-muted-foreground">Error loading posts</Text>
						</View>
					) : posts.length === 0 ? (
						<View className="py-8 items-center">
							<Text className="text-muted-foreground">No posts yet</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								{group.is_member
									? "Be the first to create one!"
									: "Join the group to see and create posts!"}
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

				{/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>
		</SafeAreaView>
	);
}
