import { router } from "expo-router";
import {
	ScrollView,
	View,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	Alert,
	Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/context/cart-provider";

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

export default function Cart() {
	const {
		cartItems,
		loading,
		refreshing,
		updateCartItem,
		removeFromCart,
		getTotalPrice,
		refreshCart,
	} = useCart();

	const handleQuantityChange = async (
		cartItemId: string,
		newQuantity: number,
	) => {
		if (newQuantity < 1) return;

		try {
			const success = await updateCartItem(cartItemId, newQuantity);
			if (!success) {
				Alert.alert(
					"Error",
					"Failed to update item quantity. Please try again.",
				);
			}
		} catch (error) {
			console.error("Error updating quantity:", error);
			Alert.alert("Error", "Failed to update item quantity. Please try again.");
		}
	};

	const handleRemoveItem = async (cartItemId: string, productName: string) => {
		Alert.alert(
			"Remove Item",
			`Are you sure you want to remove "${productName}" from your cart?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: async () => {
						try {
							const success = await removeFromCart(cartItemId);
							if (!success) {
								Alert.alert(
									"Error",
									"Failed to remove item from cart. Please try again.",
								);
							}
						} catch (error) {
							console.error("Error removing item:", error);
							Alert.alert(
								"Error",
								"Failed to remove item from cart. Please try again.",
							);
						}
					},
				},
			],
		);
	};
	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				{/* Header even when loading */}
				<View className="flex-row justify-between items-center px-4 py-4 border-b border-border bg-background">
					<TouchableOpacity
						onPress={() => router.back()}
						className="w-10 h-10 rounded-full bg-secondary items-center justify-center active:bg-secondary/80"
						activeOpacity={0.7}
					>
						<Ionicons name="close" size={20} color="#666" />
					</TouchableOpacity>
					<H1 className="flex-1 text-center">Your Cart</H1>
					<View className="w-10" />
				</View>

				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#10b981" />
					<Text className="mt-4 text-muted-foreground">
						Loading your cart...
					</Text>
				</View>
			</SafeAreaView>
		);
	}
	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Modal Header */}
			<View className="flex-row justify-between items-center px-4 py-4 border-b border-border bg-background">
				<TouchableOpacity
					onPress={() => router.back()}
					className="w-10 h-10 rounded-full bg-secondary items-center justify-center active:bg-secondary/80"
					activeOpacity={0.7}
				>
					<Ionicons name="close" size={20} color="#666" />
				</TouchableOpacity>
				<H1 className="flex-1 text-center">Your Cart</H1>
				<View className="w-10 h-10 items-center justify-center">
					{cartItems.length > 0 && (
						<View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
							<Text className="text-black text-xs font-bold">
								{cartItems.reduce((sum, item) => sum + item.quantity, 0)}
							</Text>
						</View>
					)}
				</View>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refreshCart}
						colors={["#10b981"]}
						tintColor="#10b981"
					/>
				}
			>
				<View className="p-4">
					{cartItems.length === 0 ? (
						// Empty cart state
						<>
							<Muted className="mb-6">
								Items you've added for purchase will appear here
							</Muted>
							<View className="items-center justify-center p-10 bg-secondary/30 rounded-xl">
								<Text className="text-4xl mb-4">🛒</Text>
								<H3 className="text-center mb-2">Your cart is empty</H3>
								<Muted className="text-center mb-6">
									Add items to your cart to get started with your order
								</Muted>
								<Button
									onPress={() => {
										router.back();
										router.push("/(protected)/(tabs)/marketplace");
									}}
									className="w-full"
									variant="default"
									size="default"
								>
									<Text>Start Shopping</Text>
								</Button>
							</View>
						</>
					) : (
						// Cart with items
						<>
							<Muted className="mb-4">
								{cartItems.length} {cartItems.length === 1 ? "item" : "items"}{" "}
								in your cart
							</Muted>
							{/* Cart Items */}
							<View className="gap-4 mb-6">
								{cartItems.map((item) => {
									const product = item.product;
									if (!product) return null;

									const imageSource = product.image_url
										? Array.isArray(product.image_url) &&
											product.image_url.length > 0
											? { uri: product.image_url[0] }
											: typeof product.image_url === "string"
												? { uri: product.image_url }
												: require("@/assets/foodloop.png")
										: require("@/assets/foodloop.png");

									return (
										<View
											key={item.id}
											className="bg-card p-4 rounded-xl border border-border"
										>
											<View className="flex-row">
												{/* Product Image */}
												<Image
													source={imageSource}
													className="w-20 h-20 rounded-lg bg-muted mr-4"
												/>

												{/* Product Details */}
												<View className="flex-1">
													<Text className="font-semibold text-base mb-1">
														{product.name}
													</Text>
													<Text className="text-muted-foreground text-sm mb-1">
														{product.shop || "Local Business"}
													</Text>
													<Text className="text-muted-foreground text-sm mb-2">
														📍 {product.location}
													</Text>

													{/* Price */}
													<View className="flex-row items-center mb-3">
														<Text className="font-bold text-lg text-primary">
															${product.price.toFixed(2)}
														</Text>
														{product.original_price && (
															<Text className="ml-2 text-sm line-through text-muted-foreground">
																${parseFloat(product.original_price).toFixed(2)}
															</Text>
														)}
													</View>

													{/* Quantity Controls */}
													<View className="flex-row items-center justify-between">
														<View className="flex-row items-center">
															<TouchableOpacity
																className="w-8 h-8 rounded-full bg-secondary items-center justify-center"
																onPress={() =>
																	handleQuantityChange(
																		item.id,
																		item.quantity - 1,
																	)
																}
																disabled={item.quantity <= 1}
																style={{
																	opacity: item.quantity <= 1 ? 0.5 : 1,
																}}
															>
																<Ionicons
																	name="remove"
																	size={16}
																	color="#666"
																/>
															</TouchableOpacity>
															<Text className="mx-4 text-lg font-medium">
																{item.quantity}
															</Text>
															<TouchableOpacity
																className="w-8 h-8 rounded-full bg-secondary items-center justify-center"
																onPress={() =>
																	handleQuantityChange(
																		item.id,
																		item.quantity + 1,
																	)
																}
																disabled={
																	item.quantity >= (product.amount || 999)
																}
																style={{
																	opacity:
																		item.quantity >= (product.amount || 999)
																			? 0.5
																			: 1,
																}}
															>
																<Ionicons name="add" size={16} color="#666" />
															</TouchableOpacity>
														</View>

														{/* Remove Button */}
														<TouchableOpacity
															className="p-2"
															onPress={() =>
																handleRemoveItem(item.id, product.name)
															}
														>
															<Ionicons
																name="trash-outline"
																size={20}
																color="#ef4444"
															/>
														</TouchableOpacity>
													</View>
												</View>
											</View>

											{/* Subtotal for this item */}
											<View className="mt-3 pt-3 border-t border-border flex-row justify-between items-center">
												<Text className="text-muted-foreground">Subtotal:</Text>
												<Text className="font-semibold text-lg">
													${(product.price * item.quantity).toFixed(2)}
												</Text>
											</View>
										</View>
									);
								})}
							</View>
							{/* Cart Summary */}
							<View className="bg-card p-4 rounded-xl border border-border mb-6">
								<H3 className="mb-4">Order Summary</H3>
								<View className="flex-row justify-between items-center mb-2">
									<Text className="text-muted-foreground">
										Items (
										{cartItems.reduce((sum, item) => sum + item.quantity, 0)})
									</Text>
									<Text className="font-medium">
										${getTotalPrice().toFixed(2)}
									</Text>
								</View>
								<View className="flex-row justify-between items-center mb-4 pt-3 border-t border-border">
									<Text className="font-semibold text-lg">Total</Text>
									<Text className="font-bold text-xl text-primary">
										${getTotalPrice().toFixed(2)}
									</Text>
								</View>

								<Muted className="mb-4">
									Tax and other fees will be calculated at checkout
								</Muted>

								{/* Environmental Impact */}
								<View className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
									<View className="flex-row items-center">
										<Ionicons name="leaf" size={20} color="green" />
										<Text className="ml-2 text-green-600 font-medium">
											🌱 You're helping reduce food waste!
										</Text>
									</View>
								</View>
							</View>
							{/* Checkout Button */}
							<Button
								onPress={() => {
									// TODO: Implement checkout functionality
									Alert.alert(
										"Checkout",
										"Checkout functionality will be implemented soon!",
										[{ text: "OK" }],
									);
								}}
								className="w-full mb-3"
								variant="default"
								size="lg"
							>
								<Text className="font-semibold text-base">
									Proceed to Checkout • ${getTotalPrice().toFixed(2)}
								</Text>
							</Button>
							{/* Continue Shopping Button */}
							<Button
								onPress={() => {
									router.back();
								}}
								className="w-full mb-4"
								variant="outline"
								size="default"
							>
								<Text>Continue Shopping</Text>
							</Button>
						</>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
