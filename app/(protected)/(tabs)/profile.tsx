import { View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, Muted } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { Image } from "@/components/image";
import { format } from "date-fns";

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
	const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
	const [orderLoading, setOrderLoading] = useState(true);
	const [impactStats, setImpactStats] = useState<ImpactStats>({
		totalMeals: 0,
		totalMoneySaved: 0,
		totalCO2Saved: 0,
	});

	useEffect(() => {
		if (session?.user?.id) {
			fetchUserProfile(session.user.id);
			fetchOrderHistory(session.user.id);
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
				.limit(10);

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

				setOrderHistory(processedOrders);
				calculateImpactStats(processedOrders, userId);
			}
		} catch (error) {
			console.error("Error in fetchOrderHistory:", error);
		} finally {
			setOrderLoading(false);
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

	const handleViewAllOrders = () => {
		// Navigate to a dedicated order history screen (you can create this later)
		router.push("/(protected)/order-history" as any);
	};

	// Get display name from user data
	const displayName =
		user?.name || user?.username || session?.user?.email || "User";

	// Format created date if available
	const memberSince = user?.created_at
		? new Date(user.created_at).getFullYear()
		: new Date().getFullYear();

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView className="flex-1">
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
									{user?.name && (
										<View>
											<Text className="font-medium mb-1">Name</Text>
											<Muted>{user.name}</Muted>
										</View>
									)}
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

						{/* Order History */}
						<View className="bg-card p-4 rounded-lg">
							<View className="flex-row items-center justify-between mb-3">
								<H2>Recent Orders</H2>
								{orderHistory.length > 3 && (
									<TouchableOpacity onPress={handleViewAllOrders}>
										<Text className="text-primary font-medium text-sm">View All</Text>
									</TouchableOpacity>
								)}
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
							) : orderHistory.length === 0 ? (
								<View className="items-center py-8">
									<Text className="text-4xl mb-2">📦</Text>
									<Text className="text-center text-muted-foreground mb-2">
										No orders yet
									</Text>
									<Text className="text-center text-sm text-muted-foreground">
										Start shopping to see your order history here
									</Text>
								</View>
							) : (
								<View className="gap-y-3">
									{orderHistory.slice(0, 3).map((order) => (
										<View key={order.id} className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0">
											<View className="flex-1">
												<Text className="font-medium">
													{order.quantity}x {order.product_name}
												</Text>
												<Muted>
													{format(new Date(order.created_at), "MMM d, yyyy")} • 
													${order.price.toFixed(2)} • 
													{order.is_seller ? ` Sold to ${order.buyer_name}` : ` From ${order.seller_name}`}
												</Muted>
											</View>
											<View className="items-end">
												<Text className={`text-sm font-medium ${order.is_seller ? 'text-green-600' : 'text-blue-600'}`}>
													{order.is_seller ? 'Sold' : 'Bought'}
												</Text>
											</View>
										</View>
									))}
								</View>
							)}
						</View>

						{/* Preferences */}
						<View className="bg-card p-4 rounded-lg">
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
						</View>

						{/* Action Buttons */}
						<View className="gap-y-3 mt-6">
							<Button variant="outline" className="w-full">
								<Text>Edit Profile</Text>
							</Button>
							<Button 
								variant="outline" 
								className="w-full"
								onPress={handleViewAllOrders}
							>
								<Text>Order History</Text>
							</Button>
							<Button variant="outline" className="w-full">
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
		</SafeAreaView>
	);
}