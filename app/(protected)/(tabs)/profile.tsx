import { View, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, H3, Muted } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { Image } from "@/components/image";
import { format } from "date-fns";
import { useNotifications } from "@/context/notification-provider";

// Define a User type for TypeScript
type User = {
	id: string;
	username: string | null;
	name: string | null;
	avatar: string | null;
	email: string | null;
	created_at?: string;
};

// Define OrderHistory type
type OrderHistory = {
	id: string;
	seller_id: string;
	buyer_id: string;
	product_id: string;
	price: number;
	quantity: number;
	created_at: string;
	product_name: string;
	seller_name?: string;
	buyer_name?: string;
	is_seller: boolean; // Whether current user was the seller
};

// Define ImpactStats type
type ImpactStats = {
	totalMeals: number;
	totalMoneySaved: number;
	totalCO2Saved: number;
};

export default function Profile() {
	const { session, signOut } = useAuth();
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [purchaseHistory, setPurchaseHistory] = useState<OrderHistory[]>([]);
	const [salesHistory, setSalesHistory] = useState<OrderHistory[]>([]);
	const [allOrderHistory, setAllOrderHistory] = useState<OrderHistory[]>([]);
	const [orderLoading, setOrderLoading] = useState(true);
	const [impactStats, setImpactStats] = useState<ImpactStats>({
		totalMeals: 0,
		totalMoneySaved: 0,
		totalCO2Saved: 0,
	});
	const { preferences, updatePreferences } = useNotifications();

	// Modal states
	const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
	const [orderHistoryModalVisible, setOrderHistoryModalVisible] = useState(false);
	const [helpModalVisible, setHelpModalVisible] = useState(false);
	
	// Edit profile states
	const [editName, setEditName] = useState("");
	const [savingProfile, setSavingProfile] = useState(false);

	// Pull to refresh state
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		if (session?.user?.id) {
			fetchUserProfile(session.user.id);
			fetchOrderHistory(session.user.id);
			fetchAllOrderHistory(session.user.id);
		}
	}, [session?.user?.id]);

	const fetchUserProfile = async (userId: string) => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("id", userId)
				.single();

			if (error) {
				console.error("Error fetching user data:", error);
			} else if (data) {
				setUser(data);
			}
		} catch (error) {
			console.error("Unexpected error:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchOrderHistory = async (userId: string) => {
		try {
			setOrderLoading(true);
			
			// Fetch order history with product and user details
			const { data: orders, error } = await supabase
				.from("order_history")
				.select(`
					*,
					product:product(name),
					seller:seller_id(name, username),
					buyer:buyer_id(name, username)
				`)
				.or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
				.order("created_at", { ascending: false })
				.limit(20);

			if (error) {
				console.error("Error fetching order history:", error);
				return;
			}

			if (orders) {
				// Process the orders to include user names and seller/buyer info
				const processedOrders: OrderHistory[] = orders.map((order: any) => ({
					id: order.id,
					seller_id: order.seller_id,
					buyer_id: order.buyer_id,
					product_id: order.product_id,
					price: order.price,
					quantity: order.quantity,
					created_at: order.created_at,
					product_name: order.product?.name || "Unknown Product",
					seller_name: order.seller?.name || order.seller?.username || "Unknown Seller",
					buyer_name: order.buyer?.name || order.buyer?.username || "Unknown Buyer",
					is_seller: order.seller_id === userId,
				}));

				// Separate orders into purchases and sales
				const purchases = processedOrders.filter(order => order.buyer_id === userId);
				const sales = processedOrders.filter(order => order.seller_id === userId);
				
				setPurchaseHistory(purchases);
				setSalesHistory(sales);
				calculateImpactStats(processedOrders, userId);
			}
		} catch (error) {
			console.error("Error in fetchOrderHistory:", error);
		} finally {
			setOrderLoading(false);
		}
	};

	const fetchAllOrderHistory = async (userId: string) => {
		try {
			// Fetch all order history for the full order history modal
			const { data: orders, error } = await supabase
				.from("order_history")
				.select(`
					*,
					product:product(name),
					seller:seller_id(name, username),
					buyer:buyer_id(name, username)
				`)
				.or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error fetching all order history:", error);
				return;
			}

			if (orders) {
				const processedOrders: OrderHistory[] = orders.map((order: any) => ({
					id: order.id,
					seller_id: order.seller_id,
					buyer_id: order.buyer_id,
					product_id: order.product_id,
					price: order.price,
					quantity: order.quantity,
					created_at: order.created_at,
					product_name: order.product?.name || "Unknown Product",
					seller_name: order.seller?.name || order.seller?.username || "Unknown Seller",
					buyer_name: order.buyer?.name || order.buyer?.username || "Unknown Buyer",
					is_seller: order.seller_id === userId,
				}));

				setAllOrderHistory(processedOrders);
			}
		} catch (error) {
			console.error("Error in fetchAllOrderHistory:", error);
		}
	};

	const calculateImpactStats = (orders: OrderHistory[], userId: string) => {
		const buyerOrders = orders.filter(order => order.buyer_id === userId);
		
		const totalMeals = buyerOrders.reduce((sum, order) => sum + order.quantity, 0);
		const totalMoneySaved = buyerOrders.reduce((sum, order) => {
			// Assume 20% savings on average (you can make this more sophisticated)
			return sum + (order.price * 0.2);
		}, 0);
		const totalCO2Saved = buyerOrders.reduce((sum, order) => {
			// Assume 2.5kg CO2 saved per item (you can make this more sophisticated)
			return sum + (order.quantity * 2.5);
		}, 0);

		setImpactStats({
			totalMeals: Math.round(totalMeals),
			totalMoneySaved: Math.round(totalMoneySaved * 100) / 100,
			totalCO2Saved: Math.round(totalCO2Saved * 100) / 100,
		});
	};

	const handleSignOut = async () => {
		await signOut();
	};

	const handleEditProfile = () => {
		setEditName(user?.name || "");
		setEditProfileModalVisible(true);
	};

	const handleSaveProfile = async () => {
		if (!session?.user?.id || !editName.trim()) return;
		
		setSavingProfile(true);
		try {
			const { error } = await supabase
				.from("users")
				.update({ name: editName.trim() })
				.eq("id", session.user.id);

			if (error) {
				console.error("Error updating profile:", error);
				Alert.alert("Error", "Failed to update profile. Please try again.");
			} else {
				setUser(prev => prev ? { ...prev, name: editName.trim() } : null);
				setEditProfileModalVisible(false);
				Alert.alert("Success", "Profile updated successfully!");
			}
		} catch (error) {
			console.error("Error in handleSaveProfile:", error);
			Alert.alert("Error", "Failed to update profile. Please try again.");
		} finally {
			setSavingProfile(false);
		}
	};

	const handleViewAllOrders = () => {
		setOrderHistoryModalVisible(true);
	};

	const handleHelpSupport = () => {
		setHelpModalVisible(true);
	};

	const handleEmailDeveloper = async (email: string, name: string) => {
		try {
			const emailUrl = `mailto:${email}?subject=FoodLoop Support Request&body=Hi ${name},%0D%0A%0D%0AI need help with FoodLoop.%0D%0A%0D%0APlease describe your issue here:%0D%0A`;
			const canOpen = await Linking.canOpenURL(emailUrl);
			if (canOpen) {
				await Linking.openURL(emailUrl);
			} else {
				Alert.alert("Email not available", `Please contact ${name} directly at ${email}`);
			}
		} catch (error) {
			console.error("Error opening email:", error);
			Alert.alert("Error", `Could not open email app. Please contact ${name} directly at ${email}`);
		}
	};

	// Get display name from user data
	const displayName =
		user?.name || user?.username || session?.user?.email || "User";

	// Format created date if available
	const memberSince = user?.created_at
		? new Date(user.created_at).getFullYear()
		: new Date().getFullYear();

	// Pull to refresh handler
	const onRefresh = async () => {
		if (!session?.user?.id) return;
		
		setRefreshing(true);
		try {
			await Promise.all([
				fetchUserProfile(session.user.id),
				fetchOrderHistory(session.user.id),
				fetchAllOrderHistory(session.user.id)
			]);
		} catch (error) {
			console.error('Error refreshing profile data:', error);
		} finally {
			setRefreshing(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView 
				className="flex-1" 
				contentContainerStyle={{ paddingBottom: 120 }}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#10b981"
						colors={["#10b981"]}
					/>
				}
			>
				<View className="p-6">
					{/* Header */}
					<View className="items-center mb-8">
						{loading ? (
							<>
								<Skeleton className="w-24 h-24 rounded-full mb-4" />
								<Skeleton className="h-8 w-36 mb-2" />
								<Skeleton className="h-4 w-32" />
							</>
						) : (
							<>
								{user?.avatar ? (
									<Image
										source={{ uri: user.avatar }}
										className="w-24 h-24 bg-muted rounded-full mb-4"
										contentFit="cover"
									/>
								) : (
									<View className="w-24 h-24 bg-muted rounded-full items-center justify-center mb-4">
										<Ionicons name="person" size={48} color="#666" />
									</View>
								)}
								<H1 className="text-center mb-2">{displayName}</H1>
								<Muted className="text-center">
									Member since {memberSince}
								</Muted>
							</>
						)}
					</View>

					{/* Profile Stats */}
					<View className="bg-card p-4 rounded-lg mb-6">
						<H2 className="mb-4">Your Impact</H2>
						{loading || orderLoading ? (
							<View className="flex-row justify-between">
								<View className="items-center flex-1">
									<Skeleton className="h-8 w-12 mb-2" />
									<Skeleton className="h-4 w-16" />
								</View>
								<View className="items-center flex-1">
									<Skeleton className="h-8 w-12 mb-2" />
									<Skeleton className="h-4 w-16" />
								</View>
								<View className="items-center flex-1">
									<Skeleton className="h-8 w-12 mb-2" />
									<Skeleton className="h-4 w-16" />
								</View>
							</View>
						) : (
							<View className="flex-row justify-between">
								<View className="items-center flex-1">
									<Text className="text-2xl font-bold text-primary">
										{impactStats.totalMeals}
									</Text>
									<Muted className="text-center">Meals Saved</Muted>
								</View>
								<View className="items-center flex-1">
									<Text className="text-2xl font-bold text-primary">
										${impactStats.totalMoneySaved}
									</Text>
									<Muted className="text-center">Money Saved</Muted>
								</View>
								<View className="items-center flex-1">
									<Text className="text-2xl font-bold text-primary">
										{impactStats.totalCO2Saved}kg
									</Text>
									<Muted className="text-center">CO₂ Prevented</Muted>
								</View>
							</View>
						)}
					</View>

					{/* Profile Sections */}
					<View className="gap-y-4">
						{/* Personal Information */}
						<View className="bg-card p-4 rounded-lg">
							<H2 className="mb-3">Personal Information</H2>
							{loading ? (
								<View className="gap-y-3">
									<View>
										<Skeleton className="h-5 w-16 mb-1" />
										<Skeleton className="h-4 w-32" />
									</View>
									<View>
										<Skeleton className="h-5 w-24 mb-1" />
										<Skeleton className="h-4 w-40" />
									</View>
									<View>
										<Skeleton className="h-5 w-16 mb-1" />
										<Skeleton className="h-4 w-48" />
									</View>
								</View>
							) : (
								<View className="gap-y-3">
									<View>
										<Text className="font-medium mb-1">Name</Text>
										<Muted>{user?.name || "Not set"}</Muted>
									</View>
									{user?.username && (
										<View>
											<Text className="font-medium mb-1">Username</Text>
											<Muted>{user.username}</Muted>
										</View>
									)}
									<View>
										<Text className="font-medium mb-1">Email</Text>
										<Muted>
											{user?.email || session?.user?.email || "Not available"}
										</Muted>
									</View>
								</View>
							)}
						</View>

						{/* Purchases History */}
						<View className="bg-card p-4 rounded-lg">
							<View className="flex-row items-center justify-between mb-3">
								<H2>Recent Purchases</H2>
							</View>
							
							{orderLoading ? (
								<View className="gap-y-3">
									{[1, 2, 3].map((i) => (
										<View key={i} className="flex-row justify-between items-center py-2 border-b border-border">
											<View>
												<Skeleton className="h-5 w-48 mb-1" />
												<Skeleton className="h-4 w-32" />
											</View>
											<Skeleton className="h-5 w-20" />
										</View>
									))}
								</View>
							) : purchaseHistory.length === 0 ? (
								<View className="items-center py-8">
									<Text className="text-4xl mb-2">🛒</Text>
									<Text className="text-center text-muted-foreground mb-2">
										No purchases yet
									</Text>
									<Text className="text-center text-sm text-muted-foreground">
										Start shopping to see your purchases here
									</Text>
								</View>
							) : (
								<View className="gap-y-3">
									{purchaseHistory.slice(0, 3).map((order) => (
										<View key={order.id} className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0">
											<View className="flex-1">
												<Text className="font-medium">
													{order.quantity}x {order.product_name}
												</Text>
												<Muted>
													{format(new Date(order.created_at), "MMM d, yyyy")} • 
													${order.price.toFixed(2)} • 
													From {order.seller_name}
												</Muted>
											</View>
											<View className="items-end">
												<Text className="text-sm font-medium text-blue-600">
													Bought
												</Text>
											</View>
										</View>
									))}
								</View>
							)}
						</View>

						{/* Sales History */}
						<View className="bg-card p-4 rounded-lg mt-4">
							<View className="flex-row items-center justify-between mb-3">
								<H2>Recent Sales</H2>
							</View>
							
							{orderLoading ? (
								<View className="gap-y-3">
									{[1, 2, 3].map((i) => (
										<View key={i} className="flex-row justify-between items-center py-2 border-b border-border">
											<View>
												<Skeleton className="h-5 w-48 mb-1" />
												<Skeleton className="h-4 w-32" />
											</View>
											<Skeleton className="h-5 w-20" />
										</View>
									))}
								</View>
							) : salesHistory.length === 0 ? (
								<View className="items-center py-8">
									<Text className="text-4xl mb-2">�</Text>
									<Text className="text-center text-muted-foreground mb-2">
										No sales yet
									</Text>
									<Text className="text-center text-sm text-muted-foreground">
										List items for sale to see your sales here
									</Text>
								</View>
							) : (
								<View className="gap-y-3">
									{salesHistory.slice(0, 3).map((order) => (
										<View key={order.id} className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0">
											<View className="flex-1">
												<Text className="font-medium">
													{order.quantity}x {order.product_name}
												</Text>
												<Muted>
													{format(new Date(order.created_at), "MMM d, yyyy")} • 
													${order.price.toFixed(2)} • 
													Sold to {order.buyer_name}
												</Muted>
											</View>
											<View className="items-end">
												<Text className="text-sm font-medium text-green-600">
													Sold
												</Text>
											</View>
										</View>
									))}
								</View>
							)}
						</View>

						<View className="bg-card p-4 rounded-lg mb-6">
							<H2 className="mb-3">Notification Preferences</H2>
							
							<View className="flex-row items-center justify-between py-3">
								<Text className="text-foreground">Message Notifications</Text>
								<Switch
									checked={preferences.messages}
									onCheckedChange={(checked) => updatePreferences({ messages: checked })}
								/>
							</View>

							<View className="flex-row items-center justify-between py-3">
								<Text className="text-foreground">Plant Care Reminders</Text>
								<Switch
									checked={preferences.plant_reminders}
									onCheckedChange={(checked) => updatePreferences({ plant_reminders: checked })}
								/>
							</View>

							<View className="flex-row items-center justify-between py-3">
								<Text className="text-foreground">Weather Alerts</Text>
								<Switch
									checked={preferences.weather_alerts}
									onCheckedChange={(checked) => updatePreferences({ weather_alerts: checked })}
								/>
							</View>

							<View className="flex-row items-center justify-between py-3">
								<Text className="text-foreground">Achievement Notifications</Text>
								<Switch
									checked={preferences.achievements}
									onCheckedChange={(checked) => updatePreferences({ achievements: checked })}
								/>
							</View>

							<View className="flex-row items-center justify-between py-3">
								<Text className="text-foreground">Marketplace Updates</Text>
								<Switch
									checked={preferences.marketplace_updates}
									onCheckedChange={(checked) => updatePreferences({ marketplace_updates: checked })}
								/>
							</View>
						</View>

						{/* Preferences */}
						{/* <View className="bg-card p-4 rounded-lg">
							<H2 className="mb-3">Preferences</H2>
							<View className="gap-y-3">
								<View className="flex-row justify-between items-center">
									<Text>Push Notifications</Text>
									<Muted>Enabled</Muted>
								</View>
								<View className="flex-row justify-between items-center">
									<Text>Dietary Restrictions</Text>
									<Muted>None</Muted>
								</View>
								<View className="flex-row justify-between items-center">
									<Text>Location</Text>
									<Muted>Not set</Muted>
								</View>
							</View>
						</View> */}

						{/* Action Buttons */}
						<View className="gap-y-3 mt-6">
							<Button variant="outline" className="w-full" onPress={handleEditProfile}>
								<Text>Edit Profile</Text>
							</Button>
							<Button 
								variant="outline" 
								className="w-full"
								onPress={handleViewAllOrders}
							>
								<Text>Order History</Text>
							</Button>
							<Button variant="outline" className="w-full" onPress={handleHelpSupport}>
								<Text>Help & Support</Text>
							</Button>
							<Button
								variant="destructive"
								className="w-full mt-4"
								onPress={handleSignOut}
							>
								<Text>Sign Out</Text>
							</Button>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* Edit Profile Modal */}
			<Modal
				visible={editProfileModalVisible}
				animationType="fade"
				transparent={true}
				onRequestClose={() => setEditProfileModalVisible(false)}
			>
				<View className="flex-1 bg-black/30">
					<View className="flex-row h-full">
						<TouchableOpacity 
							activeOpacity={1}
							onPress={() => setEditProfileModalVisible(false)}
							className="flex-1"
						/>
						<SafeAreaView className="w-[100%] bg-background">
							<View className="flex-1 p-6">
								<View className="flex-row items-center justify-between mb-6">
									<TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
										<Ionicons name="chevron-back" size={24} color="#666" />
									</TouchableOpacity>
									<H2>Edit Profile</H2>
									<View style={{ width: 24 }} />
								</View>

								<View className="gap-y-4">
									<View>
										<Text className="font-medium mb-2">Name</Text>
										<Input
											value={editName}
											onChangeText={setEditName}
											placeholder="Enter your name"
											className="mb-4"
										/>
									</View>

									<View className="gap-y-3 mt-6">
										<Button
											onPress={handleSaveProfile}
											disabled={savingProfile || !editName.trim()}
											className="w-full"
										>
											<Text>{savingProfile ? "Saving..." : "Save Changes"}</Text>
										</Button>
										<Button
											variant="outline"
											onPress={() => setEditProfileModalVisible(false)}
											className="w-full"
										>
											<Text>Cancel</Text>
										</Button>
									</View>
								</View>
							</View>
						</SafeAreaView>
					</View>
				</View>
			</Modal>

			{/* Order History Modal */}
			<Modal
				visible={orderHistoryModalVisible}
				animationType="fade"
				transparent={true}
				onRequestClose={() => setOrderHistoryModalVisible(false)}
			>
				<View className="flex-1 bg-black/30">
					<View className="flex-row h-full">
						<TouchableOpacity 
							activeOpacity={1}
							onPress={() => setOrderHistoryModalVisible(false)}
							className="flex-1"
						/>
						<SafeAreaView className="w-[100%] bg-background">
							<View className="flex-1">
								<View className="flex-row items-center justify-between p-6 border-b border-border">
									<TouchableOpacity onPress={() => setOrderHistoryModalVisible(false)}>
										<Ionicons name="chevron-back" size={24} color="#666" />
									</TouchableOpacity>
									<H2>Order History</H2>
									<View style={{ width: 24 }} />
								</View>

								{/* Purchase History Section */}
								<ScrollView className="flex-1">
									<View className="p-6">
										<H3 className="mb-4 text-blue-600">Your Purchases</H3>
										{allOrderHistory.filter(order => !order.is_seller).length === 0 ? (
											<View className="items-center py-6 mb-6">
												<Text className="text-4xl mb-4">�</Text>
												<Text className="text-center text-muted-foreground">
													No purchases yet. Start shopping to see your purchase history here.
												</Text>
											</View>
										) : (
											<View className="gap-y-4 mb-6">
												{allOrderHistory
													.filter(order => !order.is_seller)
													.map((order) => (
														<View key={order.id} className="bg-card p-4 rounded-lg border-l-4 border-l-blue-600">
															<View className="flex-row justify-between items-start mb-2">
																<View className="flex-1">
																	<Text className="font-semibold text-lg">
																		{order.quantity}x {order.product_name}
																	</Text>
																	<Text className="text-muted-foreground">
																		{format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
																	</Text>
																</View>
																<View className="items-end">
																	<Text className="text-lg font-bold text-blue-600">
																		${order.price.toFixed(2)}
																	</Text>
																	<Text className="text-sm font-medium text-blue-600">
																		Bought
																	</Text>
																</View>
															</View>
															<Text className="text-muted-foreground">
																From {order.seller_name}
															</Text>
														</View>
													))}
											</View>
										)}

										{/* Sale History Section */}
										<H3 className="mb-4 text-green-600">Your Sales</H3>
										{allOrderHistory.filter(order => order.is_seller).length === 0 ? (
											<View className="items-center py-6">
												<Text className="text-4xl mb-4">💰</Text>
												<Text className="text-center text-muted-foreground">
													No sales yet. List items in the marketplace to start selling.
												</Text>
											</View>
										) : (
											<View className="gap-y-4">
												{allOrderHistory
													.filter(order => order.is_seller)
													.map((order) => (
														<View key={order.id} className="bg-card p-4 rounded-lg border-l-4 border-l-green-600">
															<View className="flex-row justify-between items-start mb-2">
																<View className="flex-1">
																	<Text className="font-semibold text-lg">
																		{order.quantity}x {order.product_name}
																	</Text>
																	<Text className="text-muted-foreground">
																		{format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
																	</Text>
																</View>
																<View className="items-end">
																	<Text className="text-lg font-bold text-green-600">
																		${order.price.toFixed(2)}
																	</Text>
																	<Text className="text-sm font-medium text-green-600">
																		Sold
																	</Text>
																</View>
															</View>
															<Text className="text-muted-foreground">
																Sold to {order.buyer_name}
															</Text>
														</View>
													))}
											</View>
										)}
									</View>
								</ScrollView>
							</View>
						</SafeAreaView>
					</View>
				</View>
			</Modal>

			{/* Help & Support Modal */}
			<Modal
				visible={helpModalVisible}
				animationType="fade"
				transparent={true}
				onRequestClose={() => setHelpModalVisible(false)}
			>
				<View className="flex-1 bg-black/30">
					<View className="flex-row h-full">
						<TouchableOpacity 
							activeOpacity={1}
							onPress={() => setHelpModalVisible(false)}
							className="flex-1"
						/>
						<SafeAreaView className="w-[100%] bg-background">
							<View className="flex-1">
								<View className="flex-row items-center justify-between p-6 border-b border-border">
									<TouchableOpacity onPress={() => setHelpModalVisible(false)}>
										<Ionicons name="chevron-back" size={24} color="#666" />
									</TouchableOpacity>
									<H2>Help & Support</H2>
									<View style={{ width: 24 }} />
								</View>

								<ScrollView className="flex-1 p-6">
									<View className="gap-y-6">
										<View>
											<H3 className="mb-4">Contact Our Development Team</H3>
											<Text className="text-muted-foreground mb-6">
												Need help with FoodLoop? Our development team is here to assist you. Feel free to reach out to any of our developers:
											</Text>
										</View>

										<View className="gap-y-4">
											<View className="bg-card p-4 rounded-lg">
												<Text className="font-semibold text-lg mb-1">Ryan Panda</Text>
												<TouchableOpacity 
													onPress={() => handleEmailDeveloper("ryanpanda123@gmail.com", "Ryan Panda")}
												>
													<Text className="text-primary">ryanpanda123@gmail.com</Text>
												</TouchableOpacity>
											</View>

											<View className="bg-card p-4 rounded-lg">
												<Text className="font-semibold text-lg mb-1">Murali Sri Chandan Chengalvala</Text>
												<TouchableOpacity 
													onPress={() => handleEmailDeveloper("MSCC@gmail.com", "Murali Sri Chandan Chengalvala")}
												>
													<Text className="text-primary">MSCC@gmail.com</Text>
												</TouchableOpacity>
											</View>

											<View className="bg-card p-4 rounded-lg">
												<Text className="font-semibold text-lg mb-1">Naman Agrawal</Text>
												<TouchableOpacity 
													onPress={() => handleEmailDeveloper("namanagrawal@outlook.com", "Naman Agrawal")}
												>
													<Text className="text-primary">namanagrawal@outlook.com</Text>
												</TouchableOpacity>
											</View>
										</View>

										<View className="mt-6">
											<H3 className="mb-2">Common Issues</H3>
											<View className="gap-y-2">
												<Text className="text-muted-foreground">• Unable to place an order</Text>
												<Text className="text-muted-foreground">• Payment processing issues</Text>
												<Text className="text-muted-foreground">• Account login problems</Text>
												<Text className="text-muted-foreground">• App crashes or performance issues</Text>
												<Text className="text-muted-foreground">• Questions about sustainable food practices</Text>
											</View>
										</View>

										<View className="mt-6 mb-8">
											<Text className="text-muted-foreground text-sm">
												When contacting support, please include details about your issue and any error messages you're seeing. This helps us assist you more effectively.
											</Text>
										</View>
									</View>
								</ScrollView>
							</View>
						</SafeAreaView>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}