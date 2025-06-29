import React from "react";
import {
	ScrollView,
	TouchableOpacity,
	View,
	Text,
	StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { useAchievements, UserAchievement } from "@/hooks/useAchievements";
import { useColorScheme } from "@/lib/useColorScheme";

// Category display names and colors
const CATEGORY_CONFIG = {
	listing: { name: "Marketplace", color: "#10b981", icon: "📦" },
	purchasing: { name: "Shopping", color: "#3b82f6", icon: "🛒" },
	plant_listing: { name: "Plant Sales", color: "#22c55e", icon: "🌱" },
	forum: { name: "Community", color: "#8b5cf6", icon: "💬" },
	plant_care: { name: "Plant Care", color: "#059669", icon: "🌿" },
	ai: { name: "AI Features", color: "#f59e0b", icon: "🤖" },
} as const;

// Helper function to get category config with fallback
const getCategoryConfig = (category: string) => {
	return (
		CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || {
			name: category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
			color: "#6b7280",
			icon: "🏆",
		}
	);
};

function AchievementCard({
	userAchievement,
}: {
	userAchievement: UserAchievement;
}) {
	const { achievement, current_progress, is_completed } = userAchievement;
	const progressPercentage = Math.min(
		(current_progress / achievement.target_value) * 100,
		100,
	);

	const categoryConfig = getCategoryConfig(achievement.category);

	return (
		<View
			className={`p-4 rounded-xl border-2 mb-3 ${
				is_completed
					? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
					: "bg-secondary/30 border-border"
			}`}
		>
			<View className="flex-row items-center justify-between mb-2">
				<View className="flex-row items-center flex-1">
					<Text className="text-2xl mr-3">{achievement.icon}</Text>
					<View className="flex-1">
						<Text className="text-lg font-bold text-foreground">
							{achievement.name}
						</Text>
						<Text className="text-sm text-muted-foreground">
							{achievement.description}
						</Text>
					</View>
				</View>

				<View className="items-center ml-2">
					<Text
						className="text-xs font-medium"
						style={{ color: categoryConfig.color }}
					>
						{Math.round(progressPercentage)}%
					</Text>
				</View>
			</View>

			<View className="flex-row items-center justify-between mb-2">
				<Text className="text-sm text-muted-foreground">
					{current_progress} / {achievement.target_value}
				</Text>
				<Text
					className="text-sm font-medium"
					style={{ color: categoryConfig.color }}
				>
					+{achievement.points} pts
				</Text>
			</View>

			<View className="w-full h-2 bg-secondary rounded-full overflow-hidden">
				<View
					className="h-2 rounded-full transition-all duration-300"
					style={{
						width: `${progressPercentage}%`,
						backgroundColor: is_completed ? categoryConfig.color : "#d1d5db",
					}}
				/>
			</View>
		</View>
	);
}

function CategorySection({
	categoryKey,
	achievements,
}: {
	categoryKey: string;
	achievements: UserAchievement[];
}) {
	const categoryConfig = getCategoryConfig(categoryKey);

	const completedCount = achievements.filter((ua) => ua.is_completed).length;

	return (
		<View className="mb-6">
			<View className="flex-row items-center mb-4">
				<Text className="text-2xl mr-2">{categoryConfig.icon}</Text>
				<View className="flex-1">
					<Text className="text-lg font-bold text-foreground">
						{categoryConfig.name}
					</Text>
					<Text className="text-sm text-muted-foreground">
						{completedCount} of {achievements.length} completed
					</Text>
				</View>
				<View
					className="px-3 py-1 rounded-full"
					style={{ backgroundColor: categoryConfig.color + "20" }}
				>
					<Text
						className="text-sm font-medium"
						style={{ color: categoryConfig.color }}
					>
						{completedCount}/{achievements.length}
					</Text>
				</View>
			</View>

			{achievements.map((ua) => (
				<AchievementCard key={ua.id} userAchievement={ua} />
			))}
		</View>
	);
}

export default function AchievementsModal() {
	const { userAchievements, loading, getStats, getAchievementsByCategory } =
		useAchievements();
	const { colorScheme } = useColorScheme();

	const stats = getStats();
	const achievementsByCategory = getAchievementsByCategory();

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
				<View className="flex-row items-center">
					<Text className="text-2xl mr-2">🏆</Text>
					<Text className="text-xl font-bold text-foreground">
						Achievements
					</Text>
				</View>
				<TouchableOpacity onPress={() => router.back()} className="p-2">
					<Text className="text-muted-foreground text-lg">✕</Text>
				</TouchableOpacity>
			</View>

			{/* Stats Overview - Positioned directly below header */}
			<View style={styles.statsContainer}>
				<BlurView
					intensity={70}
					tint={colorScheme === "dark" ? "dark" : "light"}
					style={styles.blurView}
					experimentalBlurMethod="dimezisBlurView"
				>
					<View className="px-4 py-4 border-b border-border/50">
						<View className="flex-row justify-between items-center">
							<View className="items-center flex-1">
								<Text className="text-2xl font-bold text-green-600 dark:text-green-400">
									{stats.completedCount}
								</Text>
								<Text className="text-xs text-muted-foreground">Completed</Text>
							</View>

							<View className="items-center flex-1">
								<Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{stats.totalAchievements}
								</Text>
								<Text className="text-xs text-muted-foreground">Total</Text>
							</View>

							<View className="items-center flex-1">
								<Text className="text-2xl font-bold text-amber-600 dark:text-amber-400">
									{stats.earnedPoints}
								</Text>
								<Text className="text-xs text-muted-foreground">Points</Text>
							</View>

							<View className="items-center flex-1">
								<Text className="text-2xl font-bold text-purple-600 dark:text-purple-400">
									{stats.completionPercentage}%
								</Text>
								<Text className="text-xs text-muted-foreground">Progress</Text>
							</View>
						</View>

						{/* Overall Progress Bar */}
						<View className="mt-4">
							<View className="w-full h-3 bg-secondary/50 rounded-full overflow-hidden">
								<View
									className="h-3 bg-green-500 rounded-full transition-all duration-500"
									style={{ width: `${stats.completionPercentage}%` }}
								/>
							</View>
						</View>
					</View>
				</BlurView>
			</View>

			{/* Achievement Categories - Positioned below stats with overlap for blur effect */}
			<View style={styles.contentContainer}>
				<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
					{/* Top padding to account for stats overlay */}
					<View style={styles.topPadding} />

					<View className="p-4">
						{loading ? (
							<View className="items-center py-8">
								<Text className="text-muted-foreground">
									Loading achievements...
								</Text>
							</View>
						) : Object.keys(achievementsByCategory).length === 0 ? (
							<View className="items-center py-8">
								<Text className="text-4xl mb-4">🏆</Text>
								<Text className="text-xl font-bold text-center mb-2">
									No Achievements Yet
								</Text>
								<Text className="text-muted-foreground text-center">
									Start using FoodLoop to unlock your first achievements!
								</Text>
							</View>
						) : (
							Object.entries(achievementsByCategory).map(
								([categoryKey, achievements]) => (
									<CategorySection
										key={categoryKey}
										categoryKey={categoryKey}
										achievements={achievements}
									/>
								),
							)
						)}
					</View>

					{/* Bottom padding to ensure content can scroll past the footer */}
					<View style={{ height: 100 }} />
				</ScrollView>
			</View>

			{/* Footer */}
			<View className="px-4 py-3 border-t border-border">
				<Button
					variant="default"
					onPress={() => router.back()}
					className="w-full"
				>
					<Text className="text-primary-foreground font-medium">Close</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	statsContainer: {
		position: "relative",
		zIndex: 10,
	},
	blurView: {
		overflow: "hidden",
	},
	contentContainer: {
		flex: 1,
		marginTop: -80, // Pull content up slightly to create overlap for blur effect
	},
	topPadding: {
		height: 80, // Small padding to ensure content doesn't get hidden behind stats
	},
});
