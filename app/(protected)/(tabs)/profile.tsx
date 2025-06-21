import { View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, Muted } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { Image } from "@/components/image";

// Define a User type for TypeScript
type User = {
	id: string;
	username: string | null;
	name: string | null;
	avatar: string | null;
	email: string | null;
	created_at?: string;
};

export default function Profile() {
	const { session, signOut } = useAuth();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (session?.user?.id) {
			fetchUserProfile(session.user.id);
		}
	}, [session?.user?.id]);
	const fetchUserProfile = async (userId: string) => {
		try {
			setLoading(true);
			console.log(userId);
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

	const handleSignOut = async () => {
		await signOut();
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
						{loading ? (
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
									<Text className="text-2xl font-bold text-primary">12</Text>
									<Muted className="text-center">Meals Saved</Muted>
								</View>
								<View className="items-center flex-1">
									<Text className="text-2xl font-bold text-primary">$48</Text>
									<Muted className="text-center">Money Saved</Muted>
								</View>
								<View className="items-center flex-1">
									<Text className="text-2xl font-bold text-primary">8.2kg</Text>
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
									<View>
										<Skeleton className="h-5 w-20 mb-1" />
										<Skeleton className="h-4 w-56" />
									</View>
									<View>
										<Skeleton className="h-5 w-36 mb-1" />
										<Skeleton className="h-4 w-32" />
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
									<View>
										<Text className="font-medium mb-1">User ID</Text>
										<Muted>
											{user?.id || session?.user?.id || "Not available"}
										</Muted>
									</View>
									{user?.created_at && (
										<View>
											<Text className="font-medium mb-1">Account Created</Text>
											<Muted>
												{new Date(user.created_at).toLocaleDateString()}
											</Muted>
										</View>
									)}
								</View>
							)}
						</View>
						{/* Preferences */}
						<View className="bg-card p-4 rounded-lg">
							<H2 className="mb-3">Preferences</H2>
							{loading ? (
								<View className="gap-y-3">
									<View className="flex-row justify-between items-center">
										<Skeleton className="h-5 w-32" />
										<Skeleton className="h-4 w-16" />
									</View>
									<View className="flex-row justify-between items-center">
										<Skeleton className="h-5 w-40" />
										<Skeleton className="h-4 w-12" />
									</View>
									<View className="flex-row justify-between items-center">
										<Skeleton className="h-5 w-24" />
										<Skeleton className="h-4 w-16" />
									</View>
								</View>
							) : (
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
							)}
						</View>
						{/* Order History */}
						<View className="bg-card p-4 rounded-lg">
							<H2 className="mb-3">Recent Orders</H2>
							{loading ? (
								<View className="gap-y-3">
									<View className="flex-row justify-between items-center py-2 border-b border-border">
										<View>
											<Skeleton className="h-5 w-48 mb-1" />
											<Skeleton className="h-4 w-32" />
										</View>
										<Skeleton className="h-5 w-20" />
									</View>
									<View className="flex-row justify-between items-center py-2 border-b border-border">
										<View>
											<Skeleton className="h-5 w-40 mb-1" />
											<Skeleton className="h-4 w-36" />
										</View>
										<Skeleton className="h-5 w-20" />
									</View>
									<View className="flex-row justify-between items-center py-2">
										<View>
											<Skeleton className="h-5 w-44 mb-1" />
											<Skeleton className="h-4 w-28" />
										</View>
										<Skeleton className="h-5 w-20" />
									</View>
								</View>
							) : (
								<View className="gap-y-3">
									<View className="flex-row justify-between items-center py-2 border-b border-border">
										<View>
											<Text className="font-medium">
												Student Store Sandwich
											</Text>
											<Muted>2 days ago • $3.99</Muted>
										</View>
										<Text className="text-green-600">Completed</Text>
									</View>
									<View className="flex-row justify-between items-center py-2 border-b border-border">
										<View>
											<Text className="font-medium">Cafe Salad Bowl</Text>
											<Muted>1 week ago • $5.49</Muted>
										</View>
										<Text className="text-green-600">Completed</Text>
									</View>
									<View className="flex-row justify-between items-center py-2">
										<View>
											<Text className="font-medium">Bakery Pastries (3x)</Text>
											<Muted>2 weeks ago • $8.99</Muted>
										</View>
										<Text className="text-green-600">Completed</Text>
									</View>
								</View>
							)}
						</View>
						{/* Action Buttons */}
						<View className="gap-y-3 mt-6">
							<Button variant="outline" className="w-full">
								<Text>Edit Profile</Text>
							</Button>
							<Button variant="outline" className="w-full">
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
