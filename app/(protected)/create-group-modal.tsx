import React, { useState } from "react";
import {
	View,
	ScrollView,
	Alert,
	TouchableOpacity,
	Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useCreateGroup } from "@/hooks/useCommunity";
import { CreateGroupData } from "@/types/community";

const GROUP_CATEGORIES = [
	{ id: "gardening", label: "🌱 Gardening", value: "gardening" },
	{ id: "food-waste", label: "♻️ Food Waste", value: "food-waste" },
	{ id: "sustainability", label: "🌍 Sustainability", value: "sustainability" },
	{
		id: "local-community",
		label: "🏘️ Local Community",
		value: "local-community",
	},
	{ id: "education", label: "📚 Education", value: "education" },
	{ id: "cooking", label: "👨‍🍳 Cooking", value: "cooking" },
	{ id: "nutrition", label: "🥗 Nutrition", value: "nutrition" },
	{ id: "other", label: "📂 Other", value: "other" },
];

const GROUP_ICONS = [
	"🌱",
	"🌿",
	"🍅",
	"🥕",
	"🥬",
	"🌽",
	"🥒",
	"🌶️",
	"♻️",
	"🌍",
	"💚",
	"🌳",
	"🍃",
	"🌺",
	"🌻",
	"🌞",
	"👥",
	"🏘️",
	"🏪",
	"🏫",
	"🏢",
	"🏭",
	"🎯",
	"📚",
];

const GROUP_COLORS = [
	"#10b981",
	"#059669",
	"#047857",
	"#065f46",
	"#84cc16",
	"#65a30d",
	"#4d7c0f",
	"#365314",
	"#f59e0b",
	"#d97706",
	"#b45309",
	"#92400e",
	"#ef4444",
	"#dc2626",
	"#b91c1c",
	"#991b1b",
	"#8b5cf6",
	"#7c3aed",
	"#6d28d9",
	"#5b21b6",
	"#06b6d4",
	"#0891b2",
	"#0e7490",
	"#155e75",
];

export default function CreateGroupModal() {
	const router = useRouter();
	const { colorScheme } = useColorScheme();
	const { createGroup, loading, error } = useCreateGroup();

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		category: "",
		subcategory: "",
		location: "",
		location_radius: "",
		is_public: true,
		rules: "",
		tags: "",
		icon: GROUP_ICONS[0],
		color: GROUP_COLORS[0],
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
		if (!formData.name.trim()) {
			Alert.alert("Error", "Group name is required");
			return;
		}

		if (!formData.category) {
			Alert.alert("Error", "Please select a category");
			return;
		}

		const groupData: CreateGroupData = {
			name: formData.name.trim(),
			description: formData.description.trim() || undefined,
			category: formData.category,
			subcategory: formData.subcategory.trim() || undefined,
			location: formData.location.trim() || undefined,
			location_radius: formData.location_radius
				? parseInt(formData.location_radius)
				: undefined,
			is_public: formData.is_public,
			rules: formData.rules.trim() || undefined,
			tags: formData.tags
				? formData.tags
						.split(",")
						.map((tag) => tag.trim())
						.filter(Boolean)
				: undefined,
			icon: formData.icon,
			color: formData.color,
		};

		const result = await createGroup(groupData);

		if (result) {
			Alert.alert("Success", "Your group has been created successfully!", [
				{
					text: "OK",
					onPress: () => router.back(),
				},
			]);
		} else if (error) {
			Alert.alert("Error", error);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View className="flex-row items-center justify-between px-4 py-3 mb-4">
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="close" size={24} color={textColor} />
					</TouchableOpacity>
					<H1>Create Group</H1>
					<View style={{ width: 24 }} />
				</View>

				<View className="px-4">
					{/* Group Name */}
					<View className="mb-6">
						<Label className="mb-2">Group Name *</Label>
						<Input
							placeholder="Enter group name"
							value={formData.name}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, name: text }))
							}
							className="text-foreground"
						/>
					</View>
					{/* Description */}
					<View className="mb-6">
						<Label className="mb-2">Description</Label>
						<Textarea
							placeholder="Tell people what this group is about..."
							value={formData.description}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, description: text }))
							}
							numberOfLines={4}
							className="text-foreground"
						/>
					</View>
					{/* Category */}
					<View className="mb-6">
						<Label className="mb-3">Category *</Label>
						<View>
							{GROUP_CATEGORIES.map((category) => (
								<TouchableOpacity
									key={category.id}
									onPress={() =>
										setFormData((prev) => ({
											...prev,
											category: category.value,
										}))
									}
									className="flex-row items-center py-3 px-2 mb-2 rounded-lg"
									activeOpacity={0.7}
								>
									<View className="mr-4">
										<View
											className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
												formData.category === category.value
													? "border-primary bg-primary"
													: "border-border bg-background"
											}`}
										>
											{formData.category === category.value && (
												<View className="w-3 h-3 rounded-full bg-white" />
											)}
										</View>
									</View>
									<Text className="text-foreground flex-1">
										{category.label}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
					{/* Subcategory */}
					<View className="mb-6">
						<Label className="mb-2">Subcategory (Optional)</Label>
						<Input
							placeholder="e.g., Indoor Plants, Composting"
							value={formData.subcategory}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, subcategory: text }))
							}
							className="text-foreground"
						/>
					</View>
					{/* Location */}
					<View className="mb-6">
						<Label className="mb-2">Location (Optional)</Label>
						<Input
							placeholder="e.g., San Francisco, CA"
							value={formData.location}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, location: text }))
							}
							className="text-foreground"
						/>
					</View>
					{/* Location Radius */}
					{formData.location && (
						<View className="mb-6">
							<Label className="mb-2">Location Radius (miles)</Label>
							<Input
								placeholder="e.g., 10"
								value={formData.location_radius}
								onChangeText={(text) =>
									setFormData((prev) => ({ ...prev, location_radius: text }))
								}
								keyboardType="numeric"
								className="text-foreground"
							/>
						</View>
					)}
					{/* Icon Selection */}
					<View className="mb-6">
						<Label className="mb-3">Group Icon</Label>
						<View className="flex-row flex-wrap">
							{GROUP_ICONS.map((icon) => (
								<Pressable
									key={icon}
									onPress={() => setFormData((prev) => ({ ...prev, icon }))}
									className={`w-12 h-12 rounded-xl m-1 items-center justify-center border-2 ${
										formData.icon === icon
											? "border-primary bg-primary/10"
											: "border-border bg-card"
									}`}
								>
									<Text className="text-xl">{icon}</Text>
								</Pressable>
							))}
						</View>
					</View>
					{/* Color Selection */}
					<View className="mb-6">
						<Label className="mb-3">Group Color</Label>
						<View className="flex-row flex-wrap">
							{GROUP_COLORS.map((color) => (
								<Pressable
									key={color}
									onPress={() => setFormData((prev) => ({ ...prev, color }))}
									className={`w-10 h-10 rounded-full m-1 border-2 ${
										formData.color === color
											? "border-foreground"
											: "border-transparent"
									}`}
									style={{ backgroundColor: color }}
								/>
							))}
						</View>
					</View>
					{/* Privacy */}
					<View className="flex-row items-center justify-between mb-6">
						<View className="flex-1">
							<Label className="mb-1">Public Group</Label>
							<Text className="text-muted-foreground text-sm">
								Anyone can find and join this group
							</Text>
						</View>
						<Switch
							checked={formData.is_public}
							onCheckedChange={(checked) =>
								setFormData((prev) => ({ ...prev, is_public: checked }))
							}
						/>
					</View>
					{/* Rules */}
					<View className="mb-6">
						<Label className="mb-2">Group Rules (Optional)</Label>
						<Textarea
							placeholder="Set some ground rules for your group..."
							value={formData.rules}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, rules: text }))
							}
							numberOfLines={4}
							className="text-foreground"
						/>
					</View>
					{/* Tags */}
					<View className="mb-8">
						<Label className="mb-2">Tags (Optional)</Label>
						<Input
							placeholder="e.g., organic, beginner, urban (comma separated)"
							value={formData.tags}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, tags: text }))
							}
							className="text-foreground"
						/>
						<Text className="text-muted-foreground text-xs mt-1">
							Separate tags with commas
						</Text>
					</View>
					{/* Submit Button */}
					<Button
						onPress={handleSubmit}
						disabled={loading || !formData.name.trim() || !formData.category}
						className="w-full mb-8"
					>
						<Text className="text-primary-foreground font-semibold">
							{loading ? "Creating..." : "Create Group"}
						</Text>
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
