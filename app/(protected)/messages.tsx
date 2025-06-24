import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3 } from "@/components/ui/typography";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { format, formatDistanceToNow } from "date-fns";

interface Conversation {
	id: string;
	buyer_id: string;
	seller_id: string;
	product_id: string;
	status: string;
	last_message_at: string;
	created_at: string;
	// Joined data
	other_user?: {
		id: string;
		name: string;
		username: string;
		avatar: string;
	};
	product?: {
		id: string;
		name: string;
		price: number;
		image_url: string[] | string;
	};
	last_message?: {
		content: string;
		sender_id: string;
		created_at: string;
		message_type: string;
	};
	unread_count?: number;
}

export default function MessagesScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const fetchConversations = async () => {
		if (!session?.user?.id) return;

		try {
			// Fetch conversations where user is either buyer or seller
			const { data: conversationsData, error: conversationsError } =
				await supabase
					.from("conversations")
					.select(
						`
					id,
					buyer_id,
					seller_id,
					product_id,
					status,
					last_message_at,
					created_at
				`,
					)
					.or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
					.order("last_message_at", { ascending: false });

			if (conversationsError) {
				console.error("Error fetching conversations:", conversationsError);
				return;
			}

			if (!conversationsData || conversationsData.length === 0) {
				setConversations([]);
				return;
			}

			// Get other user IDs and product IDs
			const otherUserIds = conversationsData.map((conv) =>
				conv.buyer_id === session.user.id ? conv.seller_id : conv.buyer_id,
			);
			const productIds = conversationsData.map((conv) => conv.product_id);

			// Fetch other users info
			const { data: usersData } = await supabase
				.from("users")
				.select("id, name, username, avatar")
				.in("id", otherUserIds);

			// Fetch products info
			const { data: productsData } = await supabase
				.from("product")
				.select("id, name, price, image_url")
				.in("id", productIds);

			// Fetch last messages for each conversation
			const conversationIds = conversationsData.map((conv) => conv.id);
			const { data: lastMessages } = await supabase
				.from("messages")
				.select("conversation_id, content, sender_id, created_at, message_type")
				.in("conversation_id", conversationIds)
				.order("created_at", { ascending: false });

			// Fetch unread counts
			const unreadCounts = await Promise.all(
				conversationIds.map(async (convId) => {
					const { count } = await supabase
						.from("messages")
						.select("id", { count: "exact" })
						.eq("conversation_id", convId)
						.neq("sender_id", session.user.id)
						.is("read_at", null);
					return { conversationId: convId, count: count || 0 };
				}),
			);

			// Create lookup maps
			const usersMap = new Map();
			usersData?.forEach((user) => usersMap.set(user.id, user));

			const productsMap = new Map();
			productsData?.forEach((product) => productsMap.set(product.id, product));

			const lastMessagesMap = new Map();
			lastMessages?.forEach((msg) => {
				if (!lastMessagesMap.has(msg.conversation_id)) {
					lastMessagesMap.set(msg.conversation_id, msg);
				}
			});

			const unreadMap = new Map();
			unreadCounts.forEach(({ conversationId, count }) =>
				unreadMap.set(conversationId, count),
			);

			// Combine all data
			const enrichedConversations: Conversation[] = conversationsData.map(
				(conv) => {
					const otherUserId =
						conv.buyer_id === session.user.id ? conv.seller_id : conv.buyer_id;
					const otherUser = usersMap.get(otherUserId);
					const product = productsMap.get(conv.product_id);
					const lastMessage = lastMessagesMap.get(conv.id);
					const unreadCount = unreadMap.get(conv.id);

					return {
						...conv,
						other_user: otherUser,
						product: product,
						last_message: lastMessage,
						unread_count: unreadCount,
					};
				},
			);

			setConversations(enrichedConversations);
		} catch (error) {
			console.error("Error in fetchConversations:", error);
		} finally {
			setLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchConversations();
		setRefreshing(false);
	};

	useEffect(() => {
		fetchConversations();
	}, [session?.user?.id]);

	// Auto-refresh conversations every 1 second
	useEffect(() => {
		if (!session?.user?.id || loading) return;

		const interval = setInterval(() => {
			fetchConversations();
		}, 1000); // 1 second

		return () => clearInterval(interval);
	}, [session?.user?.id, loading]);

	const renderConversationItem = (conversation: Conversation) => {
		const otherUser = conversation.other_user;
		const product = conversation.product;
		const lastMessage = conversation.last_message;

		const displayName =
			otherUser?.name || otherUser?.username || "Unknown User";
		const productImage = product?.image_url
			? Array.isArray(product.image_url)
				? product.image_url[0]
				: product.image_url
			: null;

		const timeAgo = conversation.last_message_at
			? formatDistanceToNow(new Date(conversation.last_message_at), {
					addSuffix: true,
				})
			: formatDistanceToNow(new Date(conversation.created_at), {
					addSuffix: true,
				});

		const isUnread = (conversation.unread_count || 0) > 0;

		return (
			<TouchableOpacity
				key={conversation.id}
				className={`p-4 border-b border-border ${isUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
				onPress={() => router.push(`/conversation/${conversation.id}` as any)}
			>
				<View className="flex-row items-center">
					{/* User Avatar */}
					<View className="w-12 h-12 rounded-full bg-secondary items-center justify-center mr-3">
						{otherUser?.avatar ? (
							<Image
								source={{ uri: otherUser.avatar }}
								className="w-12 h-12 rounded-full"
								resizeMode="cover"
							/>
						) : (
							<Text className="text-lg font-bold">
								{displayName.charAt(0).toUpperCase()}
							</Text>
						)}
					</View>

					{/* Conversation Details */}
					<View className="flex-1 mr-3">
						<View className="flex-row items-center justify-between mb-1">
							<Text
								className={`font-semibold text-base ${isUnread ? "text-blue-700 dark:text-blue-300" : ""}`}
							>
								{displayName}
							</Text>
							<Text className="text-xs text-muted-foreground">{timeAgo}</Text>
						</View>

						{product && (
							<Text className="text-sm text-muted-foreground mb-1">
								{product.name} • ${product.price.toFixed(2)}
							</Text>
						)}

						{lastMessage && (
							<Text
								className={`text-sm ${isUnread ? "font-medium" : "text-muted-foreground"}`}
								numberOfLines={2}
							>
								{lastMessage.sender_id === session?.user?.id ? "You: " : ""}
								{lastMessage.message_type === "offer"
									? "💰 Sent an offer"
									: lastMessage.content}
							</Text>
						)}
					</View>

					{/* Product Image & Indicators */}
					<View className="items-center">
						{productImage && (
							<Image
								source={{ uri: productImage }}
								className="w-10 h-10 rounded-lg mb-1"
								resizeMode="cover"
							/>
						)}
						{isUnread && (
							<View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
								<Text className="text-white text-xs font-bold">
									{conversation.unread_count}
								</Text>
							</View>
						)}
						<Ionicons name="chevron-forward" size={16} color="#666" />
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#10b981" />
					<Text className="mt-4 text-muted-foreground">
						Loading conversations...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
				<TouchableOpacity onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={24} color="#666" />
				</TouchableOpacity>
				<H1 className="flex-1 text-center">Messages</H1>
				<View className="w-6" />
			</View>

			{conversations.length === 0 ? (
				// Empty state
				<View className="flex-1 items-center justify-center p-6">
					<Text className="text-6xl mb-4">💬</Text>
					<H3 className="text-center mb-2">No conversations yet</H3>
					<Text className="text-center text-muted-foreground mb-6">
						Start shopping and add items to your cart to begin conversations
						with business owners
					</Text>
					<TouchableOpacity
						className="bg-primary px-6 py-3 rounded-xl"
						onPress={() => {
							router.back();
							router.push("/(protected)/(tabs)/marketplace");
						}}
					>
						<Text className="text-primary-foreground font-semibold">
							Browse Marketplace
						</Text>
					</TouchableOpacity>
				</View>
			) : (
				// Conversations list
				<ScrollView
					className="flex-1"
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							colors={["#10b981"]}
							tintColor="#10b981"
						/>
					}
				>
					{conversations.map(renderConversationItem)}
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
