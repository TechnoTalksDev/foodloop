import React, { useState, useEffect } from "react";
import {
	View,
	Image,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
	Alert,
	RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/config/supabase";
import { useCart } from "@/context/cart-provider";
import { useAuth } from "@/context/supabase-provider";
import { isProductSoldOut, getSoldOutMessage } from '@/lib/product-cleanup';
import { differenceInDays } from 'date-fns';

import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

// Placeholder product data matching database schema
const PLACEHOLDER_PRODUCT: ProductType = {
	id: "1",
	created_at: "2025-06-15T10:00:00Z",
	name: "Organic Fresh Green Cabbage",
	amount: 5, // 5 available
	description:
		"Green cabbage, commonly known as green cabbage, the cannonball cabbage is one of the most popular cabbage varieties. It is so named for the way its leaves wound tightly over one another.",
	location: "Student Store, Building A",
	price: 6.9,
	originalPrice: 8.15, // UI field for showing discount
	expiry: "2025-06-23T23:59:59Z", // Expires in 3 days
	trash: 2.5, // 2.5 pounds of food saved from waste
	tags: [
		{ label: "Vegetarian", icon: "vegetarian" as const },
		{ label: "Organic", icon: "organic" as const },
		{ label: "Local", icon: "local" as const },
	],
	user_id: "business_123",
	shop: "Alisha Mart", // Added for UI
	image_url: [
		"https://bjs.scene7.com/is/image/bjs/15571?$bjs-Initial600$",
		"https://www.kroger.com/product/images/large/front/0000000004555",
		"https://www.farmfreshxpress.com/cdn/shop/products/GreenCabbage_b72e8489-7a21-4afd-af41-2af752c659c9_1.jpg?v=1655839691",
		"https://www.freshpoint.com/wp-content/uploads/2020/02/Freshpoint-green-cabbage.jpg",
	], // URL to the product image
	rating: 4.5, // UI field for ratings
};

interface Tag {
	label: string;
	icon: keyof typeof tagIcons;
}

// Interface to match database schema
interface ProductType {
	id: string;
	created_at: string;
	name: string;
	amount: number; // Available quantity
	description: string;
	location: string;
	price: number;
	expiry: string; // Date string
	trash: number; // Pounds of food saved
	tags: Tag[];
	user_id: string; // Posted by
	image_url: string[] | string; // Can be array of image URLs or a single URL
	original_price?: string; // Original price from the database

	// UI-specific fields (not in DB)
	originalPrice?: number; // For displaying discount
	shop?: string; // Name of the business
	rating?: number; // Product rating (UI only)
}

const tagIcons = {
	vegetarian: "leaf",
	halal: "checkmark-circle",
	glutenFree: "water",
	organic: "nutrition",
	local: "home",
	sustainable: "earth",
};

export default function ProductDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { session } = useAuth();
	const { colorScheme } = useColorScheme();
	const [quantity, setQuantity] = useState(1);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [product, setProduct] = useState<ProductType>(PLACEHOLDER_PRODUCT);
	const [loading, setLoading] = useState(true);
	const [addingToCart, setAddingToCart] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const screenWidth = Dimensions.get("window").width;
	const scrollViewRef = React.useRef<ScrollView>(null);
	// Cart functionality
	const { addToCart, updateCartItem, removeFromCart, getCartItemByProductId } =
		useCart();
	const existingCartItem = getCartItemByProductId(id || "");
	const isInCart = !!existingCartItem;

	const fetchProduct = async () => {
		try {
			setLoading(true);

			// Fetch the product with the given ID
			const { data, error } = await supabase
				.from("product")
				.select("*")
				.eq("id", id)
				.single();

			if (error) {
				console.error("Error fetching product:", error);
				return; // Keep using placeholder data
			}

			if (data) {
				// Fetch business info based on user_id
				let businessName = "Local Business"; // Default

				if (data.user_id) {
					const { data: userData, error: userError } = await supabase
						.from("users")
						.select("id, username, name")
						.eq("id", data.user_id)
						.single();

					if (!userError && userData) {
						businessName = userData.username || userData.name || businessName;
					}
				}

				// Process the data to match our UI requirements
				const formattedProduct = {
					...data,
					shop: businessName,
					originalPrice: data.original_price
						? parseFloat(data.original_price)
						: undefined,
					rating: 4.5, // Default rating since not in DB
					// Make sure tags is an array with the correct structure
					tags: Array.isArray(data.tags) ? data.tags : [],
				};

				setProduct(formattedProduct);
			}
		} catch (err) {
			console.error("Error in fetch product:", err);
			// Keep using placeholder data if there's an error
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProduct();
	}, [id]);

	// Pull to refresh handler
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchProduct();
		} catch (error) {
			console.error('Error refreshing product:', error);
		} finally {
			setRefreshing(false);
		}
	};

	// Set initial quantity based on cart item if it exists
	useEffect(() => {
		if (existingCartItem && quantity !== existingCartItem.quantity) {
			setQuantity(existingCartItem.quantity);
		}
	}, [existingCartItem, quantity]);

	if (loading) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" color="#10b981" />
			</SafeAreaView>
		);
	}
	// If no product data was found in the database, we'll use the placeholder
	// Note: This has been removed because we now start with PLACEHOLDER_PRODUCT

	// Ensure image_url is always an array
	const productImages = Array.isArray(product.image_url)
		? product.image_url
		: [product.image_url];
	// Function to scroll to the selected image
	const scrollToImage = (index: number) => {
		if (scrollViewRef.current) {
			scrollViewRef.current.scrollTo({
				x: index * screenWidth,
				animated: true,
			});
			setCurrentImageIndex(index);
		}
	};

	// Cart functionality handlers
	const handleAddToCart = async () => {
		if (!id) return;

		setAddingToCart(true);
		try {
			const success = await addToCart(id, quantity);
			if (success) {
				Alert.alert(
					"Added to Cart",
					`${quantity} ${quantity > 1 ? "items" : "item"} added to your cart successfully!`,
					[
						{ text: "Continue Shopping", style: "cancel" },
						{
							text: "View Cart",
							onPress: () => router.push("/(protected)/cart-modal"),
						},
					],
				);
			} else {
				// Check if this is the user's own product
				if (product.user_id === session?.user?.id) {
					Alert.alert(
						"Cannot Add to Cart", 
						"You cannot purchase your own products. Other users can buy this item from the marketplace."
					);
				} else {
					Alert.alert("Error", "Failed to add item to cart. Please try again.");
				}
			}
		} catch (error) {
			console.error("Error adding to cart:", error);
			Alert.alert("Error", "Failed to add item to cart. Please try again.");
		} finally {
			setAddingToCart(false);
		}
	};

	const handleUpdateCartQuantity = async (newQuantity: number) => {
		if (!existingCartItem) return;

		setAddingToCart(true);
		try {
			const success = await updateCartItem(existingCartItem.id, newQuantity);
			if (success) {
				Alert.alert("Cart Updated", "Item quantity updated successfully!");
			} else {
				Alert.alert("Error", "Failed to update cart. Please try again.");
			}
		} catch (error) {
			console.error("Error updating cart:", error);
			Alert.alert("Error", "Failed to update cart. Please try again.");
		} finally {
			setAddingToCart(false);
		}
	};

	const handleRemoveFromCart = async () => {
		if (!existingCartItem) return;

		Alert.alert(
			"Remove from Cart",
			"Are you sure you want to remove this item from your cart?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: async () => {
						setAddingToCart(true);
						try {
							const success = await removeFromCart(existingCartItem.id);
							if (success) {
								Alert.alert("Removed", "Item removed from cart successfully!");
							} else {
								Alert.alert(
									"Error",
									"Failed to remove item from cart. Please try again.",
								);
							}
						} catch (error) {
							console.error("Error removing from cart:", error);
							Alert.alert(
								"Error",
								"Failed to remove item from cart. Please try again.",
							);
						} finally {
							setAddingToCart(false);
						}
					},
				},
			],
		);
	};

	// Color variables based on color scheme
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;
	const bgColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;
	const mutedTextColor =
		colorScheme === "dark"
			? colors.dark.mutedForeground
			: colors.light.mutedForeground;

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
			<ScrollView 
				className="flex-1"
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#10b981"
						colors={["#10b981"]}
					/>
				}
			>
				{/* Header with back button and favorite icon */}
				<View className="flex-row justify-between items-center px-4 py-2 absolute top-0 left-0 right-0 z-10">
					<TouchableOpacity
						onPress={() => router.back()}
						className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/30 items-center justify-center"
					>
						<Ionicons name="chevron-back" size={24} color={textColor} />
					</TouchableOpacity>

					{/* <TouchableOpacity className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/30 items-center justify-center">
						<Ionicons name="heart-outline" size={24} color={textColor} />
					</TouchableOpacity> */}
				</View>
				{/* Product Image Carousel */}
				<ScrollView
					ref={scrollViewRef}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					onMomentumScrollEnd={(event) => {
						const slideWidth = event.nativeEvent.layoutMeasurement.width;
						const index = Math.floor(
							event.nativeEvent.contentOffset.x / slideWidth,
						);
						setCurrentImageIndex(index);
					}}
					className="w-full aspect-square bg-black"
				>
					{productImages.map((imageUrl, index) => (
						<View
							key={index}
							className="w-full aspect-square bg-black rounded-2xl overflow-hidden"
							style={{ width: screenWidth }}
						>
							<Image
								source={{ uri: imageUrl }}
								className="w-full h-full rounded-2xl"
								resizeMode="contain"
							/>
						</View>
					))}
				</ScrollView>
				{/* Pagination dots */}
				<View className="flex-row justify-center space-x-1 my-2 gap-2">
					{productImages.map((_, index) => (
						<TouchableOpacity key={index} onPress={() => scrollToImage(index)}>
							<View
								className={`h-1.5 rounded-full ${
									currentImageIndex === index
										? "w-6 bg-green-400"
										: "w-1.5 bg-gray-300"
								}`}
							/>
						</TouchableOpacity>
					))}
				</View>
				{/* Product Information */}
				<View className="px-6 py-2">
					{/* Title and rating */}
					<View className="flex-row justify-between items-start">
						<Text
							className="text-2xl font-bold flex-1"
							style={{ color: textColor }}
						>
							{product.name}
						</Text>
						<View className="flex-row items-center">
							<Ionicons name="star" size={16} color="#FFD700" />
							<Text className="ml-1 font-semibold">{product.rating}</Text>
						</View>
					</View>
					{/* Shop name */}
					<Text className="text-md mb-4" style={{ color: mutedTextColor }}>
						Listed by: <Text className="font-semibold">{product.shop}</Text>
					</Text>
					{/* Tags */}
					<View className="flex-row flex-wrap mt-2 mb-6 gap-2">
						{product.tags.map((tag, index) => (
							<View
								key={index}
								className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"
							>
								<View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-1">
									<Ionicons
										name={tagIcons[tag.icon] as any}
										size={16}
										color="green"
									/>
								</View>
								<Text className="text-xs" style={{ color: mutedTextColor }}>
									{tag.label}
								</Text>
							</View>
						))}
					</View>
					{/* Location & Availability */}
					<View className="mt-4 flex-row justify-between">
						<View className="flex-1">
							<View className="flex-row items-center mb-1">
								<Ionicons name="location" size={20} color="green" />
								<Text
									className="text-base font-medium ml-1"
									style={{ color: textColor }}
								>
									Location
								</Text>
							</View>
							<Text className="text-base" style={{ color: mutedTextColor }}>
								{product.location}
							</Text>
						</View>
						<View className="flex-1">
							<View className="flex-row items-center mb-1">
								<Ionicons name="calendar" size={20} color="orange" />
								<Text
									className="text-base font-medium ml-1"
									style={{ color: textColor }}
								>
									Expires
								</Text>
							</View>
							<Text className="text-base" style={{ color: mutedTextColor }}>
								{new Date(product.expiry).toLocaleDateString()}
							</Text>
						</View>
					</View>
					{/* Amount Available */}
					<View className="mt-4">
						<View className="flex-row items-center mb-1">
							<Ionicons name="cube" size={20} color={isProductSoldOut(product) ? "red" : "blue"} />
							<Text
								className="text-base font-medium ml-1"
								style={{ color: textColor }}
							>
								Available
							</Text>
						</View>
						{isProductSoldOut(product) ? (
							<View className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
								<Text className="text-red-600 font-medium">
									{getSoldOutMessage(differenceInDays(new Date(), new Date(product.created_at)))}
								</Text>
								<Text className="text-red-500 text-sm mt-1">
									This listing will be automatically removed after 2 days
								</Text>
							</View>
						) : (
							<Text className="text-base" style={{ color: mutedTextColor }}>
								{product.amount} {product.amount === 1 ? "item" : "items"} left
							</Text>
						)}
					</View>
					{/* Environmental Impact */}
					<View className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
						<View className="flex-row items-center mb-2">
							<Ionicons name="leaf" size={22} color="green" />
							<Text
								className="text-base font-medium ml-2"
								style={{ color: textColor }}
							>
								Environmental Impact
							</Text>
						</View>
						<Text className="text-base" style={{ color: mutedTextColor }}>
							By purchasing this item, you help save
							<Text className="font-bold text-green-600">
								{" "}
								{product.trash} pounds{" "}
							</Text>
							of food from going to waste.
						</Text>
					</View>
					{/* Details section */}
					<View className="mt-4">
						<Text
							className="text-lg font-semibold mb-2"
							style={{ color: textColor }}
						>
							Details
						</Text>
						<Text className="text-base" style={{ color: mutedTextColor }}>
							{product.description}
						</Text>
					</View>
					{/* Price section */}
					<View className="mt-6">
						<Text className="text-base" style={{ color: mutedTextColor }}>
							Price
						</Text>
						<View className="flex-row items-center mt-1">
							<Text
								className="text-2xl font-bold mr-2"
								style={{ color: textColor }}
							>
								${product.price.toFixed(2)}
							</Text>
							{product.originalPrice && (
								<Text
									className="text-base line-through"
									style={{ color: mutedTextColor }}
								>
									${product.originalPrice.toFixed(2)}
								</Text>
							)}
						</View>
					</View>
					{/* Quantity selector */}
					<View className="mt-5 mb-5">
						<Text className="text-base mb-2" style={{ color: mutedTextColor }}>
							Quantity
						</Text>
						<View className="flex-row items-center">
							<TouchableOpacity
								className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
								onPress={() => setQuantity(Math.max(1, quantity - 1))}
								disabled={quantity <= 1}
								style={{ opacity: quantity <= 1 ? 0.5 : 1 }}
							>
								<Ionicons name="remove" size={20} color={textColor} />
							</TouchableOpacity>
							<View className="px-4">
								<Text
									className="text-lg font-medium"
									style={{ color: textColor }}
								>
									{quantity}
								</Text>
							</View>
							<TouchableOpacity
								className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
								onPress={() =>
									setQuantity(Math.min(product.amount, quantity + 1))
								}
								disabled={quantity >= product.amount}
								style={{ opacity: quantity >= product.amount ? 0.5 : 1 }}
							>
								<Ionicons name="add" size={20} color={textColor} />
							</TouchableOpacity>
						</View>
						{quantity >= product.amount && (
							<Text className="text-sm text-amber-500 mt-1.5">
								Maximum available quantity selected
							</Text>
						)}
					</View>
				</View>
			</ScrollView>
			{/* Cart actions - fixed at bottom */}
			<View className="p-4 border-t border-gray-200 dark:border-gray-800">
				<View className="mb-2 flex-row justify-center items-center">
					<Ionicons name="leaf" size={18} color="green" />
					<Text className="text-base text-green-600 ml-1">
						You'll save {(product.trash * quantity).toFixed(1)} lbs of food
						waste
					</Text>
				</View>

				{isInCart ? (
					// Item is already in cart - show update/remove options
					<View className="gap-2">
						<View className="flex-row gap-2">
							<Button
								className="flex-1 bg-blue-500 rounded-full"
								onPress={() => handleUpdateCartQuantity(quantity)}
								disabled={
									addingToCart || quantity === existingCartItem?.quantity
								}
							>
								{addingToCart ? (
									<ActivityIndicator size="small" color="#ffffff" />
								) : (
									<Text className="text-white font-semibold">
										Update Cart ({quantity} items) - $
										{(product.price * quantity).toFixed(2)}
									</Text>
								)}
							</Button>
							<Button
								className="bg-red-500 rounded-full px-4"
								onPress={handleRemoveFromCart}
								disabled={addingToCart}
							>
								<Ionicons name="trash" size={20} color="white" />
							</Button>
						</View>
						<Button
							variant="outline"
							className="rounded-full"
							onPress={() => router.push("/(protected)/cart-modal")}
						>
							<Text>View Cart</Text>
						</Button>
					</View>
				) : (
					// Item not in cart - show add to cart button
					<Button
						className={
							isProductSoldOut(product) || product.user_id === session?.user?.id 
								? "bg-gray-400 rounded-full" 
								: "bg-green-500 rounded-full"
						}
						onPress={handleAddToCart}
						disabled={addingToCart || isProductSoldOut(product) || product.user_id === session?.user?.id}
					>
						{addingToCart ? (
							<View className="flex-row items-center">
								<ActivityIndicator size="small" color="#ffffff" />
								<Text className="text-white font-semibold ml-2">Adding...</Text>
							</View>
						) : isProductSoldOut(product) ? (
							<Text className="text-white font-semibold">
								Sold Out
							</Text>
						) : product.user_id === session?.user?.id ? (
							<Text className="text-white font-semibold">
								Your Product
							</Text>
						) : (
							<Text className="text-white font-semibold">
								Add {quantity > 1 ? `${quantity} items` : "to Cart"} - $
								{(product.price * quantity).toFixed(2)}
							</Text>
						)}
					</Button>
				)}
			</View>
		</SafeAreaView>
	);
}
