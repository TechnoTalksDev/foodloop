import React, { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
	Image,
	ScrollView,
	TouchableOpacity,
	View,
	TextInput,
	ActivityIndicator,
	RefreshControl,
	Alert,
} from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSequence,
	Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/config/supabase";
import { useCart } from "@/context/cart-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { useNotifications } from "@/context/notification-provider";

// Enhanced Product interface
interface Product {
	id: number;
	name: string;
	price: number;
	original_price?: string;
	description?: string;
	image_url?: string[];
	created_at: string;
	expiry?: string;
	trash?: number;
	tags?: { label: string; icon: string }[];
	user_id: string;
	location: string;
	amount: number;
	business?: string;
	discount?: string;
	eco?: string;
	distance?: number;
}

interface FilterOptions {
	category: string[];
	priceRange: [number, number];
	location: string;
	tags: string[];
	sortBy: "newest" | "price_low" | "price_high" | "expiry" | "distance";
	searchQuery: string;
}

// Food categories with enhanced filtering
const foodCategories = [
	{ id: "all", name: "All", icon: "🍽️" },
	{ id: "fruits", name: "Fruits", icon: "🍎" },
	{ id: "vegetables", name: "Veggies", icon: "🥦" },
	{ id: "bakery", name: "Bakery", icon: "🍞" },
	{ id: "dairy", name: "Dairy", icon: "🥛" },
	{ id: "meals", name: "Meals", icon: "🍲" },
	{ id: "beverages", name: "Drinks", icon: "🧃" },
	{ id: "snacks", name: "Snacks", icon: "🍪" },
];

const sortOptions = [
	{ id: "newest", label: "Newest First", icon: "time" },
	{ id: "price_low", label: "Price: Low to High", icon: "arrow-up" },
	{ id: "price_high", label: "Price: High to Low", icon: "arrow-down" },
	{ id: "expiry", label: "Expiring Soon", icon: "hourglass" },
	{ id: "distance", label: "Nearest First", icon: "location" },
];

const commonTags = [
	"Organic",
	"Local",
	"Vegetarian",
	"Vegan",
	"Gluten Free",
	"Fresh",
	"Sustainable",
	"Farm Fresh",
	"Artisan",
	"Seasonal",
];

export default function Marketplace() {
	const { focusSearch, timestamp, appliedFilters } = useLocalSearchParams();
	const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
	const { colorScheme } = useColorScheme();
	const { unreadCount } = useNotifications();

	// State for products and filtering
	const [products, setProducts] = useState<Product[]>([]);
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Filter state
	const [filters, setFilters] = useState<FilterOptions>({
		category: [],
		priceRange: [0, 100],
		location: "",
		tags: [],
		sortBy: "newest",
		searchQuery: "",
	});

	// Cart functionality
	const { getTotalItems } = useCart();

	// Animation values for the search bar
	const searchBgColor = useSharedValue(0);
	const searchScale = useSharedValue(0.9);

	// Animated styles for the search bar
	const animatedSearchStyle = useAnimatedStyle(() => {
		const backgroundColor = `rgba(144, 202, 249, ${searchBgColor.value})`;
		return {
			backgroundColor,
			transform: [{ scale: searchScale.value }],
		};
	});

	const fetchProducts = async () => {
		try {
			setLoading(true);

			const { data, error } = await supabase
				.from("product")
				.select("*")
				.gt("amount", 0)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error fetching products:", error);
				return;
			}

			if (data) {
				const userIds = data
					.map((product) => product.user_id)
					.filter((id) => id !== null && id !== undefined);

				const { data: users, error: usersError } = await supabase
					.from("users")
					.select("id, username, name")
					.in("id", userIds);

				if (usersError) {
					console.error("Error fetching users:", usersError);
				}

				const userMap = new Map();
				if (users) {
					users.forEach((user) => {
						userMap.set(user.id, user);
					});
				}

				const formattedProducts: Product[] = data.map((product) => {
					let discountPercentage = "";
					if (product.original_price && product.price) {
						const originalPrice = parseFloat(product.original_price);
						const savings = originalPrice - product.price;
						const percentage = Math.round((savings / originalPrice) * 100);
						discountPercentage = `${percentage}% off`;
					}

					const eco = product.trash
						? `Saves ${product.trash}kg CO₂`
						: "Eco-friendly";

					let business = "Local Business";
					if (product.user_id) {
						const user = userMap.get(product.user_id);
						if (user) {
							business = user.username || user.name || business;
						}
					}

					return {
						...product,
						discount: discountPercentage,
						eco,
						business,
					};
				});

				setProducts(formattedProducts);
				setFilteredProducts(formattedProducts);
			}
		} catch (error) {
			console.error("Error fetching products:", error);
		} finally {
			setLoading(false);
		}
	};

	const applyFilters = () => {
		let filtered = [...products];

		// Search query filter
		if (filters.searchQuery.trim()) {
			const query = filters.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(product) =>
					product.name.toLowerCase().includes(query) ||
					product.description?.toLowerCase().includes(query) ||
					product.business?.toLowerCase().includes(query) ||
					product.tags?.some((tag) => tag.label.toLowerCase().includes(query)),
			);
		}

		// Category filter
		if (filters.category.length > 0 && !filters.category.includes("all")) {
			filtered = filtered.filter((product) => {
				const productCategory = categorizeProduct(product);
				return filters.category.includes(productCategory);
			});
		}

		// Price range filter
		filtered = filtered.filter(
			(product) =>
				product.price >= filters.priceRange[0] &&
				product.price <= filters.priceRange[1],
		);

		// Tags filter
		if (filters.tags.length > 0) {
			filtered = filtered.filter((product) =>
				product.tags?.some((tag) => filters.tags.includes(tag.label)),
			);
		}

		// Location filter
		if (filters.location.trim()) {
			const locationQuery = filters.location.toLowerCase();
			filtered = filtered.filter((product) =>
				product.location.toLowerCase().includes(locationQuery),
			);
		}

		// Sort products
		switch (filters.sortBy) {
			case "price_low":
				filtered.sort((a, b) => a.price - b.price);
				break;
			case "price_high":
				filtered.sort((a, b) => b.price - a.price);
				break;
			case "expiry":
				filtered.sort((a, b) => {
					if (!a.expiry && !b.expiry) return 0;
					if (!a.expiry) return 1;
					if (!b.expiry) return -1;
					return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
				});
				break;
			case "distance":
				// Would implement with user location
				break;
			case "newest":
			default:
				filtered.sort(
					(a, b) =>
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
				);
				break;
		}

		setFilteredProducts(filtered);
	};

	const categorizeProduct = (product: Product): string => {
		const name = product.name.toLowerCase();
		const description = product.description?.toLowerCase() || "";
		const tags =
			product.tags?.map((t) => t.label.toLowerCase()).join(" ") || "";
		const content = `${name} ${description} ${tags}`;

		if (
			content.includes("fruit") ||
			content.includes("apple") ||
			content.includes("banana")
		)
			return "fruits";
		if (
			content.includes("vegetable") ||
			content.includes("veggie") ||
			content.includes("lettuce")
		)
			return "vegetables";
		if (
			content.includes("bread") ||
			content.includes("pastry") ||
			content.includes("cake")
		)
			return "bakery";
		if (
			content.includes("milk") ||
			content.includes("cheese") ||
			content.includes("yogurt")
		)
			return "dairy";
		if (
			content.includes("meal") ||
			content.includes("lunch") ||
			content.includes("dinner")
		)
			return "meals";
		if (
			content.includes("drink") ||
			content.includes("juice") ||
			content.includes("water")
		)
			return "beverages";
		if (
			content.includes("snack") ||
			content.includes("chip") ||
			content.includes("cookie")
		)
			return "snacks";

		return "all";
	};

	const handleSearch = (query: string) => {
		setFilters((prev) => ({ ...prev, searchQuery: query }));
	};

	const handleCategoryFilter = (categoryId: string) => {
		setFilters((prev) => ({
			...prev,
			category: categoryId === "all" ? [] : [categoryId],
		}));
	};

	const clearFilters = () => {
		setFilters({
			category: [],
			priceRange: [0, 100],
			location: "",
			tags: [],
			sortBy: "newest",
			searchQuery: "",
		});
	};

	const getActiveFiltersCount = (): number => {
		let count = 0;
		if (filters.category.length > 0) count++;
		if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100) count++;
		if (filters.location.trim()) count++;
		if (filters.tags.length > 0) count++;
		if (filters.sortBy !== "newest") count++;
		return count;
	};

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchProducts();
		} finally {
			setRefreshing(false);
		}
	};

	// Apply filters when they come back from the filter modal
	useEffect(() => {
		if (appliedFilters) {
			try {
				const newFilters = JSON.parse(appliedFilters as string);
				setFilters(newFilters);
			} catch (error) {
				console.error("Error parsing applied filters:", error);
			}
		}
	}, [appliedFilters]);

	// Apply filters whenever filter state changes
	useEffect(() => {
		applyFilters();
	}, [filters, products]);

	useEffect(() => {
		fetchProducts();
	}, []);

	// Animation effect for search focus
	useEffect(() => {
		if (focusSearch === "true" && timestamp) {
			searchScale.value = 0.9;
			searchBgColor.value = 0;

			setTimeout(() => {
				searchScale.value = withSequence(
					withTiming(1.05, { duration: 200, easing: Easing.out(Easing.quad) }),
					withTiming(1, { duration: 150 }),
				);

				searchBgColor.value = withSequence(
					withTiming(0.3, { duration: 300 }),
					withTiming(0, { duration: 700 }),
				);

				setTimeout(() => {
					if (searchInputRef.current) {
						searchInputRef.current.focus();
					}
				}, 250);
			}, 50);
		}
	}, [focusSearch, timestamp]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView>
				{/* REPLACE the existing header with this updated version */}
				<View className="flex-row justify-between items-center px-4 py-3">
					<TouchableOpacity onPress={() => router.push("/(protected)/notification-modal")}>
						<View className="w-10 h-10 items-center justify-center">
							<Text className="text-2xl">🔔</Text>
							{/* ADD THIS notification badge */}
							{unreadCount > 0 && (
								<View className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
									<Text className="text-white text-xs font-bold">
										{unreadCount > 99 ? "99+" : unreadCount}
									</Text>
								</View>
							)}
						</View>
					</TouchableOpacity>
					<H1>Marketplace</H1>
					<TouchableOpacity
						onPress={() => router.push("/(protected)/cart-modal")}
						className="w-12 h-12 rounded-full bg-secondary/30 items-center justify-center active:bg-secondary/50"
						activeOpacity={0.7}
					>
						<Text className="text-2xl">🛒</Text>
						{getTotalItems() > 0 && (
							<View className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full items-center justify-center border-2 border-background">
								<Text className="text-black text-xs font-bold">
									{getTotalItems() > 99 ? "99+" : getTotalItems()}
								</Text>
							</View>
						)}
					</TouchableOpacity>
				</View>
				{/* Search bar */}
				<View className="mb-5 w-full">
					<Animated.View style={[{ borderRadius: 24 }, animatedSearchStyle]}>
						<View className="flex-row items-center bg-secondary rounded-full px-4 py-4 border border-secondary/50 shadow-sm min-h-[44px]">
							<Text className="text-foreground/60 mr-2 text-xl">🔍</Text>
							<TextInput
								ref={searchInputRef}
								value={filters.searchQuery}
								onChangeText={handleSearch}
								placeholder="Search products, businesses, tags..."
								className="flex-1 bg-transparent border-0 p-0 text-foreground text-lg w-full"
								placeholderTextColor="#A0A0A0"
							/>
							<TouchableOpacity
								onPress={() => router.push({
									pathname: "/(protected)/filter-modal",
									params: { filters: JSON.stringify(filters) }
								})}
								className="ml-2 p-1"
							>
								<View className="flex-row items-center">
									<Ionicons name="options" size={24} color="#10b981" />
									{getActiveFiltersCount() > 0 && (
										<View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
											<Text className="text-white text-xs font-bold">
												{getActiveFiltersCount()}
											</Text>
										</View>
									)}
								</View>
							</TouchableOpacity>
						</View>
					</Animated.View>
				</View>
				{/* Active Filters Display */}
				{(filters.searchQuery || getActiveFiltersCount() > 0) && (
					<View className="px-4 mb-4">
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							{filters.searchQuery && (
								<View className="bg-primary/10 border border-primary rounded-full px-3 py-1 mr-2 flex-row items-center">
									<Text className="text-primary text-sm">
										"{filters.searchQuery}"
									</Text>
									<TouchableOpacity
										onPress={() => handleSearch("")}
										className="ml-2"
									>
										<Ionicons name="close" size={14} color="#10b981" />
									</TouchableOpacity>
								</View>
							)}
							{filters.category.map((cat) => (
								<View
									key={cat}
									className="bg-secondary rounded-full px-3 py-1 mr-2 flex-row items-center"
								>
									<Text className="text-foreground text-sm">
										{foodCategories.find((c) => c.id === cat)?.name}
									</Text>
									<TouchableOpacity
										onPress={() =>
											setFilters((prev) => ({
												...prev,
												category: prev.category.filter((c) => c !== cat),
											}))
										}
										className="ml-2"
									>
										<Ionicons name="close" size={14} color="#666" />
									</TouchableOpacity>
								</View>
							))}
							{filters.tags.map((tag) => (
								<View
									key={tag}
									className="bg-green-100 rounded-full px-3 py-1 mr-2 flex-row items-center"
								>
									<Text className="text-green-700 text-sm">{tag}</Text>
									<TouchableOpacity
										onPress={() =>
											setFilters((prev) => ({
												...prev,
												tags: prev.tags.filter((t) => t !== tag),
											}))
										}
										className="ml-2"
									>
										<Ionicons name="close" size={14} color="#059669" />
									</TouchableOpacity>
								</View>
							))}
						</ScrollView>
					</View>
				)}
				{/* Results Summary */}
				<View className="px-4 mb-4 flex-row items-center justify-between">
					<Text className="text-muted-foreground">
						{filteredProducts.length}{" "}
						{filteredProducts.length === 1 ? "result" : "results"} found
					</Text>
					<TouchableOpacity
						onPress={() => router.push({
							pathname: "/(protected)/filter-modal",
							params: { filters: JSON.stringify(filters) }
						})}
						className="flex-row items-center"
					>
						<Ionicons name="swap-vertical" size={16} color="#666" />
						<Text className="text-muted-foreground ml-1 capitalize">
							{sortOptions
								.find((s) => s.id === filters.sortBy)
								?.label.split(":")[0] || "Sort"}
						</Text>
					</TouchableOpacity>
				</View>
				{/* Food categories */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					className="pl-4 mb-6"
				>
					{foodCategories.map((category) => (
						<TouchableOpacity
							key={category.id}
							className="items-center mr-6"
							onPress={() => handleCategoryFilter(category.id)}
						>
							<View
								className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
									filters.category.includes(category.id) ||
									(category.id === "all" && filters.category.length === 0)
										? "bg-primary"
										: "bg-secondary"
								}`}
							>
								<Text className="text-3xl">{category.icon}</Text>
							</View>
							<Text
								className={`text-sm text-center font-medium ${
									filters.category.includes(category.id) ||
									(category.id === "all" && filters.category.length === 0)
										? "text-primary"
										: "text-foreground"
								}`}
							>
								{category.name}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
				{/* Products section */}
				<View className="px-4 mb-6">
					{loading ? (
						<View className="items-center justify-center py-8">
							<ActivityIndicator size="large" color="#10b981" />
							<Text className="mt-4 text-muted-foreground">
								Loading products...
							</Text>
						</View>
					) : filteredProducts.length === 0 ? (
						<View className="items-center justify-center py-8">
							<Text className="text-6xl mb-4">🔍</Text>
							<Text className="text-xl font-semibold mb-2">
								No products found
							</Text>
							<Text className="text-muted-foreground text-center mb-4">
								Try adjusting your search or filters to find what you're looking
								for
							</Text>
							<Button onPress={clearFilters} variant="outline">
								<Text>Clear All Filters</Text>
							</Button>
						</View>
					) : (
						<>
							{/* Quick stats */}
							<View className="flex-row justify-between mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
								<View className="items-center">
									<Text className="font-bold text-green-600">
										$
										{filteredProducts
											.reduce(
												(sum, p) =>
													sum + (parseFloat(p.original_price || "0") - p.price),
												0,
											)
											.toFixed(0)}
									</Text>
									<Text className="text-xs text-green-600">Total Savings</Text>
								</View>
								<View className="items-center">
									<Text className="font-bold text-green-600">
										{filteredProducts
											.reduce((sum, p) => sum + (p.trash || 0), 0)
											.toFixed(1)}
										kg
									</Text>
									<Text className="text-xs text-green-600">CO₂ Saved</Text>
								</View>
								<View className="items-center">
									<Text className="font-bold text-green-600">
										{
											Array.from(
												new Set(filteredProducts.map((p) => p.business)),
											).length
										}
									</Text>
									<Text className="text-xs text-green-600">
										Local Businesses
									</Text>
								</View>
							</View>

							<View className="flex-row flex-wrap justify-between">
								{filteredProducts.map((product) => (
									<ProductCard
										key={product.id}
										image={
											product.image_url && product.image_url.length > 0
												? { uri: product.image_url[0] }
												: require("@/assets/foodloop.png")
										}
										name={product.name}
										business={product.business || "Local Business"}
										price={product.price}
										originalPrice={
											product.original_price
												? parseFloat(product.original_price)
												: 0
										}
										discount={product.discount || ""}
										eco={product.eco || "Eco-friendly"}
										onPress={() =>
											router.push({
												pathname: "/(protected)/product/[id]",
												params: { id: product.id },
											})
										}
									/>
								))}
							</View>
						</>
					)}
				</View>
			</ScrollView>

			{/* Floating Action Button */}
			<TouchableOpacity
				onPress={() => router.push("/(protected)/create-product-modal")}
				className="absolute bottom-14 right-6 w-16 h-16 rounded-full shadow-lg active:scale-95"
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
		</SafeAreaView>
	);
}
