import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	Alert,
	TouchableOpacity,
	Pressable,
	FlatList,
} from "react-native";
import { useRouter } from "expo-router";
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
import { useCreatePost, useGroups } from "@/hooks/useCommunity";
import { CreatePostData } from "@/types/community";

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
	const { colorScheme } = useColorScheme();
	const { createPost, loading, error } = useCreatePost();
	const { groups } = useGroups();

	// Form state
	const [formData, setFormData] = useState({
		title: "",
		content: "",
		group_id: "",
		post_type: "discussion",
		tags: [] as string[],
		location: "",
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

	const handleSubmit = async () => {
		if (!formData.title.trim()) {
			Alert.alert("Error", "Post title is required");
			return;
		}

		if (!formData.content.trim()) {
			Alert.alert("Error", "Post content is required");
			return;
		}

		const postData: CreatePostData = {
			title: formData.title.trim(),
			content: formData.content.trim(),
			group_id: formData.group_id ? parseInt(formData.group_id) : undefined,
			post_type: formData.post_type,
			tags: formData.tags.length > 0 ? formData.tags : undefined,
			location: formData.location.trim() || undefined,
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
					<Text className="font-medium text-foreground">{item.name}</Text>
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
			<ScrollView showsVerticalScrollIndicator={false}>
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
						<RadioGroup
							value={formData.post_type}
							onValueChange={(value) =>
								setFormData((prev) => ({ ...prev, post_type: value }))
							}
						>
							{POST_TYPES.map((type) => (
								<View
									key={type.id}
									className="flex-row items-center space-x-2 mb-3"
								>
									<RadioGroupItem value={type.id} />
									<View className="flex-1">
										<Text className="text-foreground font-medium">
											{type.label}
										</Text>
										<Text className="text-muted-foreground text-sm">
											{type.description}
										</Text>
									</View>
								</View>
							))}
						</RadioGroup>
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

					{/* Location */}
					<View className="mb-8">
						<Label className="mb-2">Location (Optional)</Label>
						<Input
							placeholder="e.g., San Francisco, CA"
							value={formData.location}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, location: text }))
							}
							className="text-foreground"
						/>
						<Text className="text-muted-foreground text-xs mt-1">
							Share your location if relevant to your post
						</Text>
					</View>

					{/* Submit Button */}
					<Button
						onPress={handleSubmit}
						disabled={
							loading || !formData.title.trim() || !formData.content.trim()
						}
						className="w-full mb-8"
					>
						<Text className="text-primary-foreground font-semibold">
							{loading ? "Creating..." : "Create Post"}
						</Text>
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
