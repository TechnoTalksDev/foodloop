import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import {
	format,
	subDays,
	subWeeks,
	subMonths,
	startOfDay,
	endOfDay,
	differenceInDays,
} from "date-fns";

interface ImpactData {
	totalCO2Saved: number;
	totalMoneySaved: number;
	totalFoodRescued: number; // in pounds
	totalMealsEquivalent: number;
	totalWaterSaved: number; // in gallons
	totalTreesEquivalent: number;
	streakDays: number;
	impactRank: number;
	monthlyProgress: MonthlyProgress[];
	categoryBreakdown: CategoryImpact[];
	comparisonData: ComparisonData;
	totalOrders: number;
	averageOrderSavings: number;
}

interface MonthlyProgress {
	month: string;
	co2Saved: number;
	moneySaved: number;
	foodRescued: number;
	orderCount: number;
}

interface CategoryImpact {
	category: string;
	percentage: number;
	co2Saved: number;
	color: string;
	icon: string;
	orderCount: number;
}

interface ComparisonData {
	vsAverage: {
		co2Percentage: number;
		moneyPercentage: number;
		foodPercentage: number;
	};
	ranking: {
		percentile: number;
		totalUsers: number;
	};
}

// Database types for order history system
interface OrderHistoryItem {
	id: number;
	seller_id: string;
	buyer_id: string;
	product_id: number;
	price: number;
	quantity: number;
	created_at: string;
	product?: {
		id: number;
		name: string;
		price: number;
		original_price: number | null;
		trash: number | null;
		tags: { label: string; icon: string }[] | null;
		amount: number | null;
	};
}

const screenWidth = Dimensions.get("window").width;

export default function ImpactDashboard() {
	const router = useRouter();
	const { session } = useAuth();
	const { colorScheme } = useColorScheme();
	const [impactData, setImpactData] = useState<ImpactData | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;
	const mutedTextColor =
		colorScheme === "dark"
			? colors.dark.mutedForeground
			: colors.light.mutedForeground;
	const borderColor =
		colorScheme === "dark" ? colors.dark.border : colors.light.border;
	const secondaryBg =
		colorScheme === "dark" ? colors.dark.secondary : colors.light.secondary;
	const bgColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;

	useEffect(() => {
		fetchImpactData();
	}, [session?.user?.id]);

	const fetchImpactData = async () => {
		if (!session?.user?.id) return;

		try {
			setLoading(true);

			// Get all-time data (no date filtering for overall stats)
			const startDate = new Date(2024, 0, 1); // Beginning of platform

			// Fetch user's purchase history from order_history table
			const { data: orderHistory, error: orderError } = await supabase
				.from("order_history")
				.select(
					`
          *,
          product:product_id(
            id,
            name,
            price,
            original_price,
            trash,
            tags,
            amount
          )
        `,
				)
				.eq("buyer_id", session.user.id)
				.gte("created_at", startDate.toISOString())
				.order("created_at", { ascending: false });

			if (orderError) {
				console.error("Error fetching order history:", orderError);
				return;
			}

			const orders = (orderHistory as OrderHistoryItem[]) || [];

			// Calculate impact metrics using more accurate environmental factors
			let totalCO2Saved = 0;
			let totalMoneySaved = 0;
			let totalFoodRescued = 0;
			let totalOrders = orders.length;
			const monthlyData: { [key: string]: MonthlyProgress } = {};
			const categoryData: { [key: string]: CategoryImpact } = {};

			// Calculate streak days by checking consecutive days with orders
			const streakDays = calculateStreakDays(orders);

			orders.forEach((order) => {
				const product = order.product;
				if (!product) return;

				const quantity = order.quantity;
				const paidPrice = order.price;

				// Environmental impact calculations based on EPA data and research
				// Food rescued calculation: use product trash amount or estimate based on product type
				const trashAmount = product.trash ?? estimateTrashAmount(product);
				const foodRescued = trashAmount * quantity;
				totalFoodRescued += foodRescued;

				// CO2 savings: EPA estimates ~2.2 kg CO2 per pound of food waste prevented
				// Additional emissions from production, transport, processing (~6x multiplier)
				const co2Saved = foodRescued * 2.2 * 1.6; // 1.6 accounts for upstream emissions
				totalCO2Saved += co2Saved;

				// Money savings: difference between original price and discounted price
				const originalPrice = product.original_price ?? paidPrice * 1.5; // Fallback estimate
				const moneySaved = Math.max(0, (originalPrice - paidPrice) * quantity);
				totalMoneySaved += moneySaved;

				// Monthly breakdown
				const month = format(new Date(order.created_at), "MMM yyyy");
				if (!monthlyData[month]) {
					monthlyData[month] = {
						month,
						co2Saved: 0,
						moneySaved: 0,
						foodRescued: 0,
						orderCount: 0,
					};
				}
				monthlyData[month].co2Saved += co2Saved;
				monthlyData[month].moneySaved += moneySaved;
				monthlyData[month].foodRescued += foodRescued;
				monthlyData[month].orderCount += 1;

				// Category breakdown
				const category = getCategoryFromProduct(product);
				if (!categoryData[category.name]) {
					categoryData[category.name] = {
						category: category.name,
						percentage: 0,
						co2Saved: 0,
						color: category.color,
						icon: category.icon,
						orderCount: 0,
					};
				}
				categoryData[category.name].co2Saved += co2Saved;
				categoryData[category.name].orderCount += 1;
			});

			// Calculate category percentages
			Object.values(categoryData).forEach((category) => {
				category.percentage =
					totalFoodRescued > 0 ? (category.co2Saved / totalCO2Saved) * 100 : 0;
			});

			// Calculate derived metrics using scientific estimates
			const totalMealsEquivalent = Math.floor(totalFoodRescued / 1.2); // ~1.2 lbs per meal (USDA estimate)
			const totalWaterSaved = Math.round(totalFoodRescued * 25); // ~25 gallons per pound (Water Footprint Network)
			const totalTreesEquivalent = Math.round((totalCO2Saved / 22) * 100) / 100; // ~22kg CO2 per tree per year

			// Calculate ranking based on actual user data
			const { data: allUsersStats } = await supabase
				.from("order_history")
				.select("buyer_id")
				.gte("created_at", startDate.toISOString());

			const userCounts = (allUsersStats || []).reduce(
				(acc: Record<string, number>, order: any) => {
					acc[order.buyer_id] = (acc[order.buyer_id] || 0) + 1;
					return acc;
				},
				{},
			);

			const totalUsers = Object.keys(userCounts).length;
			const usersWithFewerOrders = Object.values(userCounts).filter(
				(count: number) => count < totalOrders,
			).length;
			const percentile =
				totalUsers > 0
					? Math.round((usersWithFewerOrders / totalUsers) * 100)
					: 50;

			// More realistic comparison data based on actual performance
			const avgOrdersPerUser =
				totalUsers > 0
					? Object.values(userCounts).reduce(
							(sum: number, count: number) => sum + count,
							0,
						) / totalUsers
					: 1;
			const comparisonData: ComparisonData = {
				vsAverage: {
					co2Percentage:
						avgOrdersPerUser > 0
							? Math.round((totalOrders / avgOrdersPerUser) * 100)
							: 100,
					moneyPercentage:
						avgOrdersPerUser > 0
							? Math.round((totalMoneySaved / totalOrders / 5) * 100)
							: 100, // Assume $5 avg savings
					foodPercentage:
						avgOrdersPerUser > 0
							? Math.round((totalFoodRescued / totalOrders / 2) * 100)
							: 100, // Assume 2lbs avg rescue
				},
				ranking: {
					percentile,
					totalUsers,
				},
			};

			const averageOrderSavings =
				totalOrders > 0
					? Math.round((totalMoneySaved / totalOrders) * 100) / 100
					: 0;

			const processedImpactData: ImpactData = {
				totalCO2Saved: Math.round(totalCO2Saved * 100) / 100,
				totalMoneySaved: Math.round(totalMoneySaved * 100) / 100,
				totalFoodRescued: Math.round(totalFoodRescued * 100) / 100,
				totalMealsEquivalent,
				totalWaterSaved,
				totalTreesEquivalent,
				streakDays,
				impactRank: percentile,
				monthlyProgress: Object.values(monthlyData).slice(-6),
				categoryBreakdown: Object.values(categoryData).filter(
					(cat) => cat.percentage > 0,
				),
				comparisonData,
				totalOrders,
				averageOrderSavings,
			};

			setImpactData(processedImpactData);
		} catch (error) {
			console.error("Error fetching impact data:", error);
		} finally {
			setLoading(false);
		}
	};

	// Helper function to calculate streak days
	const calculateStreakDays = (orders: OrderHistoryItem[]): number => {
		if (orders.length === 0) return 0;

		const orderDates = orders
			.map((order) => startOfDay(new Date(order.created_at)))
			.sort((a, b) => b.getTime() - a.getTime()) // Sort descending
			.filter(
				(date, index, arr) =>
					index === 0 || date.getTime() !== arr[index - 1].getTime(),
			); // Remove duplicates

		if (orderDates.length === 0) return 0;

		const today = startOfDay(new Date());
		let streak = 0;
		let currentDate = today;

		// Check if there's an order today or yesterday to start streak
		const daysSinceLastOrder = differenceInDays(today, orderDates[0]);
		if (daysSinceLastOrder > 1) return 0;

		for (const orderDate of orderDates) {
			const daysDiff = differenceInDays(currentDate, orderDate);

			if (daysDiff === 0) {
				streak++;
				currentDate = subDays(currentDate, 1);
			} else if (daysDiff === 1) {
				streak++;
				currentDate = orderDate;
				currentDate = subDays(currentDate, 1);
			} else {
				break;
			}
		}

		return streak;
	};

	// Helper function to estimate food waste amount if not provided
	const estimateTrashAmount = (product: any): number => {
		const name = product.name?.toLowerCase() || "";
		const amount = product.amount || 1;

		// Estimate based on product type and amount
		if (name.includes("bread") || name.includes("bakery")) return amount * 0.8;
		if (name.includes("fruit") || name.includes("vegetable"))
			return amount * 0.6;
		if (name.includes("dairy") || name.includes("milk")) return amount * 0.5;
		if (name.includes("meat") || name.includes("protein")) return amount * 0.4;

		return amount * 0.5; // Default estimate
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchImpactData();
		setRefreshing(false);
	};

	const getCategoryFromProduct = (
		product: any,
	): { name: string; color: string; icon: string } => {
		const name = product.name?.toLowerCase() || "";
		const tags =
			product.tags?.map((t: any) => t.label?.toLowerCase()).join(" ") || "";
		const content = `${name} ${tags}`;

		if (content.includes("fruit") || content.includes("apple")) {
			return { name: "Fruits", color: "#f59e0b", icon: "🍎" };
		}
		if (content.includes("vegetable") || content.includes("veggie")) {
			return { name: "Vegetables", color: "#10b981", icon: "🥦" };
		}
		if (content.includes("bread") || content.includes("bakery")) {
			return { name: "Bakery", color: "#d97706", icon: "🍞" };
		}
		if (content.includes("dairy") || content.includes("milk")) {
			return { name: "Dairy", color: "#3b82f6", icon: "🥛" };
		}
		return { name: "Other", color: "#6b7280", icon: "🍽️" };
	};

	const renderImpactCard = (
		title: string,
		value: string,
		subtitle: string,
		icon: string,
		color: string,
	) => (
		<View
			className="p-4 rounded-xl border border-border flex-1 mx-1 mb-4"
			style={{ backgroundColor: secondaryBg + "40" }}
		>
			<View className="flex-row items-center justify-between mb-2">
				<Text className="text-2xl">{icon}</Text>
				<View
					className={`w-3 h-3 rounded-full`}
					style={{ backgroundColor: color }}
				/>
			</View>
			<Text className="text-2xl font-bold mb-1" style={{ color: textColor }}>
				{value}
			</Text>
			<Text className="text-sm font-medium" style={{ color: textColor }}>
				{title}
			</Text>
			<Text className="text-xs mt-1" style={{ color: mutedTextColor }}>
				{subtitle}
			</Text>
		</View>
	);

	const renderProgressChart = () => {
		if (!impactData?.monthlyProgress.length) return null;

		const maxCO2Value = Math.max(
			...impactData.monthlyProgress.map((p) => p.co2Saved),
			1,
		);
		const maxOrderValue = Math.max(
			...impactData.monthlyProgress.map((p) => p.orderCount),
			1,
		);
		const chartHeight = 140;
		const chartWidth = screenWidth - 64;
		const barWidth = Math.max(
			(chartWidth - 60) / impactData.monthlyProgress.length,
			40,
		);

		return (
			<View
				className="p-4 rounded-xl border border-border mb-6"
				style={{ backgroundColor: secondaryBg + "40" }}
			>
				<H3 className="mb-4">Monthly Progress</H3>
				<View style={{ width: chartWidth, height: chartHeight }}>
					{impactData.monthlyProgress.map((data, index) => {
						const co2BarHeight = Math.max(
							(data.co2Saved / maxCO2Value) * (chartHeight - 60),
							5,
						);
						const orderBarHeight = Math.max(
							(data.orderCount / maxOrderValue) * (chartHeight - 60),
							3,
						);
						const x = index * barWidth + 30;
						const co2Y = chartHeight - co2BarHeight - 40;
						const orderY = chartHeight - orderBarHeight - 20;

						return (
							<View key={index} style={{ position: "absolute", left: x }}>
								{/* CO2 Bar */}
								<View
									style={{
										position: "absolute",
										top: co2Y,
										width: (barWidth - 10) * 0.6,
										height: co2BarHeight,
										backgroundColor: "#10b981",
										borderRadius: 4,
										opacity: 0.8,
									}}
								/>

								{/* Orders Bar */}
								<View
									style={{
										position: "absolute",
										top: orderY,
										left: (barWidth - 10) * 0.4,
										width: (barWidth - 10) * 0.4,
										height: orderBarHeight,
										backgroundColor: "#8b5cf6",
										borderRadius: 4,
										opacity: 0.8,
									}}
								/>

								{/* Month Label */}
								<Text
									style={{
										position: "absolute",
										top: chartHeight - 15,
										left: (barWidth - 10) / 2,
										fontSize: 10,
										color: mutedTextColor,
										textAlign: "center",
										width: barWidth - 10,
									}}
								>
									{data.month.split(" ")[0]}
								</Text>

								{/* CO2 Value */}
								{data.co2Saved > 0 && (
									<Text
										style={{
											position: "absolute",
											top: co2Y - 15,
											left: 0,
											fontSize: 8,
											color: "#10b981",
											textAlign: "center",
											width: (barWidth - 10) * 0.6,
										}}
									>
										{data.co2Saved.toFixed(1)}
									</Text>
								)}

								{/* Order Count */}
								{data.orderCount > 0 && (
									<Text
										style={{
											position: "absolute",
											top: orderY - 15,
											left: (barWidth - 10) * 0.4,
											fontSize: 8,
											color: "#8b5cf6",
											textAlign: "center",
											width: (barWidth - 10) * 0.4,
										}}
									>
										{data.orderCount}
									</Text>
								)}
							</View>
						);
					})}
				</View>

				{/* Legend */}
				<View className="flex-row justify-center mt-4 space-x-4">
					<View className="flex-row items-center">
						<View
							className="w-3 h-3 rounded mr-2"
							style={{ backgroundColor: "#10b981" }}
						/>
						<Text className="text-xs" style={{ color: mutedTextColor }}>
							CO₂ Saved (kg)
						</Text>
					</View>
					<View className="flex-row items-center ml-4">
						<View
							className="w-3 h-3 rounded mr-2"
							style={{ backgroundColor: "#8b5cf6" }}
						/>
						<Text className="text-xs" style={{ color: mutedTextColor }}>
							Orders
						</Text>
					</View>
				</View>
			</View>
		);
	};

	const renderCategoryBreakdown = () => {
		if (!impactData?.categoryBreakdown.length) return null;

		const radius = 60;
		let accumulatedPercentage = 0;

		return (
			<View
				className="p-4 rounded-xl border border-border mb-6"
				style={{ backgroundColor: secondaryBg + "40" }}
			>
				<H3 className="mb-4">Impact by Category</H3>
				<View className="flex-row items-center">
					<View className="mr-6">
						<View
							style={{
								width: 140,
								height: 140,
								position: "relative",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{/* Background circle */}
							<View
								style={{
									position: "absolute",
									width: radius * 2,
									height: radius * 2,
									borderRadius: radius,
									borderWidth: 20,
									borderColor: secondaryBg,
								}}
							/>

							{/* Category circles - simplified visualization */}
							{impactData.categoryBreakdown.map((category, index) => {
								const startAngle = (accumulatedPercentage / 100) * 360;
								accumulatedPercentage += category.percentage;

								return (
									<View
										key={index}
										style={{
											position: "absolute",
											width: 4,
											height: radius,
											backgroundColor: category.color,
											left: 70 - 2,
											top: 70 - radius,
											transformOrigin: "50% 100%",
											transform: [{ rotate: `${startAngle}deg` }],
										}}
									/>
								);
							})}

							{/* Center text */}
							<View style={{ position: "absolute", alignItems: "center" }}>
								<Text
									style={{ fontSize: 20, fontWeight: "bold", color: textColor }}
								>
									{impactData.totalCO2Saved.toFixed(1)}
								</Text>
								<Text style={{ fontSize: 10, color: mutedTextColor }}>
									kg CO₂
								</Text>
							</View>
						</View>
					</View>

					<View className="flex-1">
						{impactData.categoryBreakdown.map((category, index) => (
							<View key={index} className="flex-row items-center mb-2">
								<Text className="text-sm mr-2">{category.icon}</Text>
								<View
									className="w-3 h-3 rounded-full mr-3"
									style={{ backgroundColor: category.color }}
								/>
								<Text className="text-sm flex-1" style={{ color: textColor }}>
									{category.category}
								</Text>
								<Text
									className="text-sm font-medium"
									style={{ color: textColor }}
								>
									{category.percentage.toFixed(1)}%
								</Text>
							</View>
						))}
					</View>
				</View>
			</View>
		);
	};

	const renderComparisonSection = () => {
		if (!impactData) return null;

		return (
			<View
				className="p-4 rounded-xl border border-border mb-6"
				style={{ backgroundColor: secondaryBg + "40" }}
			>
				<H3 className="mb-4">How You Compare</H3>

				<View className="mb-4">
					<Text
						className="text-center text-2xl font-bold mb-2"
						style={{ color: "#10b981" }}
					>
						Top {100 - impactData.comparisonData.ranking.percentile}%
					</Text>
					<Text className="text-center" style={{ color: mutedTextColor }}>
						You're doing better than{" "}
						{impactData.comparisonData.ranking.percentile}% of FoodLoop users
					</Text>
				</View>

				<View className="space-y-3">
					<View className="flex-row items-center justify-between py-2">
						<Text className="text-sm" style={{ color: textColor }}>
							CO₂ Impact vs Average
						</Text>
						<View className="flex-row items-center">
							<Text className="font-medium mr-2" style={{ color: "#10b981" }}>
								{impactData.comparisonData.vsAverage.co2Percentage >= 100
									? "+"
									: ""}
								{impactData.comparisonData.vsAverage.co2Percentage - 100}%
							</Text>
							<Ionicons
								name={
									impactData.comparisonData.vsAverage.co2Percentage >= 100
										? "trending-up"
										: "trending-down"
								}
								size={16}
								color={
									impactData.comparisonData.vsAverage.co2Percentage >= 100
										? "#10b981"
										: "#ef4444"
								}
							/>
						</View>
					</View>

					<View className="flex-row items-center justify-between py-2">
						<Text className="text-sm" style={{ color: textColor }}>
							Money Saved vs Average
						</Text>
						<View className="flex-row items-center">
							<Text className="font-medium mr-2" style={{ color: "#10b981" }}>
								{impactData.comparisonData.vsAverage.moneyPercentage >= 100
									? "+"
									: ""}
								{impactData.comparisonData.vsAverage.moneyPercentage - 100}%
							</Text>
							<Ionicons
								name={
									impactData.comparisonData.vsAverage.moneyPercentage >= 100
										? "trending-up"
										: "trending-down"
								}
								size={16}
								color={
									impactData.comparisonData.vsAverage.moneyPercentage >= 100
										? "#10b981"
										: "#ef4444"
								}
							/>
						</View>
					</View>

					<View className="flex-row items-center justify-between py-2">
						<Text className="text-sm" style={{ color: textColor }}>
							Food Rescued vs Average
						</Text>
						<View className="flex-row items-center">
							<Text className="font-medium mr-2" style={{ color: "#10b981" }}>
								{impactData.comparisonData.vsAverage.foodPercentage >= 100
									? "+"
									: ""}
								{impactData.comparisonData.vsAverage.foodPercentage - 100}%
							</Text>
							<Ionicons
								name={
									impactData.comparisonData.vsAverage.foodPercentage >= 100
										? "trending-up"
										: "trending-down"
								}
								size={16}
								color={
									impactData.comparisonData.vsAverage.foodPercentage >= 100
										? "#10b981"
										: "#ef4444"
								}
							/>
						</View>
					</View>
				</View>
			</View>
		);
	};

	if (loading) {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center"
				style={{ backgroundColor: bgColor }}
			>
				<ActivityIndicator size="large" color="#10b981" />
				<Text className="mt-4" style={{ color: mutedTextColor }}>
					Loading your impact data...
				</Text>
			</SafeAreaView>
		);
	}

	if (!impactData || impactData.totalOrders === 0) {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center p-4"
				style={{ backgroundColor: bgColor }}
			>
				<View className="items-center">
					<Text className="text-6xl mb-4">🌱</Text>
					<Text
						className="text-xl font-semibold mb-2 text-center"
						style={{ color: textColor }}
					>
						Start Your Impact Journey
					</Text>
					<Text className="text-center mb-6" style={{ color: mutedTextColor }}>
						Make your first purchase through our messaging system to see your
						environmental impact!
					</Text>
					<Button
						onPress={() => router.push("/(protected)/(tabs)/marketplace")}
						className="px-6"
					>
						<Text>Explore Marketplace</Text>
					</Button>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
			{/* Header */}
			<View
				className="flex-row items-center justify-between px-4 py-3 border-b"
				style={{ borderBottomColor: borderColor }}
			>
				<TouchableOpacity onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={24} color={textColor} />
				</TouchableOpacity>
				<H1 className="text-center">Your Impact</H1>
				<View className="w-6" />
			</View>

			<ScrollView
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
				{/* Subtitle */}
				<View className="px-4 py-4">
					<Text className="text-center" style={{ color: mutedTextColor }}>
						Your environmental impact from sustainable purchases
					</Text>
				</View>

				{/* Main Impact Cards */}
				<View className="px-4 mb-6">
					<View className="flex-row mb-4">
						{renderImpactCard(
							"CO₂ Saved",
							`${impactData.totalCO2Saved} kg`,
							`= ${impactData.totalTreesEquivalent} trees/year`,
							"🌍",
							"#10b981",
						)}
						{renderImpactCard(
							"Money Saved",
							`$${impactData.totalMoneySaved}`,
							`Avg $${impactData.averageOrderSavings}/order`,
							"💰",
							"#f59e0b",
						)}
					</View>
					<View className="flex-row mb-4">
						{renderImpactCard(
							"Food Rescued",
							`${impactData.totalFoodRescued} lbs`,
							`= ${impactData.totalMealsEquivalent} meals`,
							"🍽️",
							"#3b82f6",
						)}
						{renderImpactCard(
							"Water Saved",
							`${impactData.totalWaterSaved} gal`,
							"water conservation",
							"💧",
							"#06b6d4",
						)}
					</View>
					<View className="flex-row">
						{renderImpactCard(
							"Orders Completed",
							`${impactData.totalOrders}`,
							"sustainable purchases",
							"📦",
							"#8b5cf6",
						)}
						{renderImpactCard(
							"Impact Rank",
							`Top ${100 - impactData.impactRank}%`,
							`of ${impactData.comparisonData.ranking.totalUsers} users`,
							"🏆",
							"#f97316",
						)}
					</View>
				</View>

				{/* Streak Counter */}
				<View className="px-4 mb-6">
					<View
						className="p-4 rounded-xl"
						style={{
							backgroundColor: colorScheme === "dark" ? "#f59e0b20" : "#fef3c7",
						}}
					>
						<View className="flex-row items-center justify-center">
							<Text className="text-4xl mr-3">🔥</Text>
							<View>
								<Text
									className="text-2xl font-bold"
									style={{
										color: colorScheme === "dark" ? "#f59e0b" : "#d97706",
									}}
								>
									{impactData.streakDays} Day
									{impactData.streakDays !== 1 ? "s" : ""} Active
								</Text>
								<Text
									style={{
										color: colorScheme === "dark" ? "#fbbf24" : "#92400e",
									}}
								>
									{impactData.streakDays === 0
										? "Make your first purchase!"
										: impactData.streakDays === 1
											? "Great start! Keep it up!"
											: impactData.streakDays < 7
												? "Building momentum!"
												: "Fantastic sustainability streak!"}
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Progress Chart */}
				<View className="px-4">{renderProgressChart()}</View>

				{/* Category Breakdown */}
				<View className="px-4">{renderCategoryBreakdown()}</View>

				{/* Comparison Section */}
				<View className="px-4">{renderComparisonSection()}</View>

				{/* Call to Action */}
				<View className="px-4 mb-6">
					<View
						className="p-4 rounded-xl"
						style={{ backgroundColor: secondaryBg + "40" }}
					>
						<Text
							className="text-center text-lg font-semibold mb-2"
							style={{ color: textColor }}
						>
							Keep Making an Impact!
						</Text>
						<Text
							className="text-center mb-4"
							style={{ color: mutedTextColor }}
						>
							Continue shopping sustainably to increase your positive impact
						</Text>
						<Button
							onPress={() => router.push("/(protected)/(tabs)/marketplace")}
							className="w-full"
						>
							<Text>Shop More Products</Text>
						</Button>
					</View>
				</View>

				{/* Bottom spacing */}
				<View className="h-20" />
			</ScrollView>
		</SafeAreaView>
	);
}
