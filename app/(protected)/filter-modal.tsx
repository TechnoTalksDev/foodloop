import React, { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

interface FilterOptions {
	category: string[];
	priceRange: [number, number];
	location: string;
	tags: string[];
	sortBy: "newest" | "price_low" | "price_high" | "expiry" | "distance";
	searchQuery: string;
}

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

export default function FilterModal() {
	// Get current filters from URL params if available
	const params = useLocalSearchParams();

	const [filters, setFilters] = useState<FilterOptions>({
		category: [],
		priceRange: [0, 100],
		location: "",
		tags: [],
		sortBy: "newest",
		searchQuery: "",
	});

	// Parse filters from params on mount
	useEffect(() => {
		if (params.filters) {
			try {
				const parsedFilters = JSON.parse(params.filters as string);
				setFilters(parsedFilters);
			} catch (error) {
				console.error("Error parsing filters:", error);
			}
		}
	}, [params.filters]);

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

	const applyFilters = () => {
		// Navigate back with filters as params
		router.back();
		router.setParams({
			appliedFilters: JSON.stringify(filters),
			timestamp: Date.now().toString(),
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

	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="flex-row items-center justify-between p-4 border-b border-border">
				<TouchableOpacity onPress={() => router.back()}>
					<Text className="text-primary text-lg">Cancel</Text>
				</TouchableOpacity>
				<Text className="text-lg font-semibold">Filters</Text>
				<TouchableOpacity onPress={clearFilters}>
					<Text className="text-red-500 text-lg">Clear</Text>
				</TouchableOpacity>
			</View>

			<ScrollView className="flex-1 p-4">
				{/* Sort Options */}
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">Sort By</Text>
					{sortOptions.map((option) => (
						<TouchableOpacity
							key={option.id}
							onPress={() =>
								setFilters((prev) => ({ ...prev, sortBy: option.id as any }))
							}
							className={`flex-row items-center p-3 rounded-lg mb-2 ${
								filters.sortBy === option.id
									? "bg-primary/10 border border-primary"
									: "bg-secondary"
							}`}
						>
							<Ionicons name={option.icon as any} size={20} color="#666" />
							<Text className="ml-3 flex-1">{option.label}</Text>
							{filters.sortBy === option.id && (
								<Ionicons name="checkmark" size={20} color="#10b981" />
							)}
						</TouchableOpacity>
					))}
				</View>

				{/* Categories */}
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">Categories</Text>
					<View className="flex-row flex-wrap gap-2">
						{foodCategories.map((category) => (
							<TouchableOpacity
								key={category.id}
								onPress={() =>
									setFilters((prev) => ({
										...prev,
										category: prev.category.includes(category.id)
											? prev.category.filter((c) => c !== category.id)
											: category.id === "all"
												? []
												: [
														...prev.category.filter((c) => c !== "all"),
														category.id,
													],
									}))
								}
								className={`px-3 py-2 rounded-full border ${
									filters.category.includes(category.id) ||
									(category.id === "all" && filters.category.length === 0)
										? "bg-primary border-primary"
										: "bg-secondary border-border"
								}`}
							>
								<Text
									className={`text-sm ${
										filters.category.includes(category.id) ||
										(category.id === "all" && filters.category.length === 0)
											? "text-primary-foreground"
											: "text-foreground"
									}`}
								>
									{category.icon} {category.name}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Price Range */}
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">Price Range</Text>
					<View className="flex-row items-center justify-between">
						<Text>${filters.priceRange[0]}</Text>
						<Text>to</Text>
						<Text>${filters.priceRange[1]}</Text>
					</View>
					{/* Price range slider would be implemented here */}
				</View>

				{/* Tags Filter */}
				<View className="mb-6">
					<Text className="text-lg font-semibold mb-3">Tags</Text>
					<View className="flex-row flex-wrap gap-2">
						{commonTags.map((tag) => (
							<TouchableOpacity
								key={tag}
								onPress={() =>
									setFilters((prev) => ({
										...prev,
										tags: prev.tags.includes(tag)
											? prev.tags.filter((t) => t !== tag)
											: [...prev.tags, tag],
									}))
								}
								className={`px-3 py-2 rounded-full border ${
									filters.tags.includes(tag)
										? "bg-primary border-primary"
										: "bg-secondary border-border"
								}`}
							>
								<Text
									className={`text-sm ${
										filters.tags.includes(tag)
											? "text-primary-foreground"
											: "text-foreground"
									}`}
								>
									{tag}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>
			</ScrollView>

			<View className="p-4 border-t border-border">
				<Button onPress={applyFilters} className="w-full">
					<Text>Apply Filters ({getActiveFiltersCount()})</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
}
