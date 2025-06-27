// app/(protected)/messages.tsx
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
	
	// Set up realtime subscriptions for conversations and messages
	useEffect(() => {
		if (!session?.user?.id || loading) return;

		console.log('📡 [Messages] Setting up realtime subscriptions for user:', session.user.id);

		let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

		// Debounced refresh function to avoid too many API calls
		const debouncedRefresh = () => {
			if (refreshTimeout) {
				clearTimeout(refreshTimeout);
			}
			refreshTimeout = setTimeout(() => {
				console.log('🔄 [Messages] Debounced refresh triggered');
				fetchConversations();
			}, 500); // Wait 500ms before refreshing
		};

		// Subscribe to new messages (to update last message and unread counts)
		const messagesChannel = supabase
			.channel('messages-updates')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
				},
				(payload) => {
					console.log('✉️ [Messages] New message received:', payload.new);
					// Always refresh when a new message is received
					// We'll filter relevance during the fetch process
					debouncedRefresh();
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'messages',
				},
				(payload) => {
					console.log('📝 [Messages] Message updated:', payload.new);
					// Refresh when messages are read (affects unread counts)
					debouncedRefresh();
				}
			)
			.subscribe((status) => {
				console.log('📡 [Messages] Messages channel status:', status);
			});

		// Subscribe to conversation changes
		const conversationsChannel = supabase
			.channel('conversations-updates')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'conversations',
				},
				(payload) => {
					console.log('💬 [Messages] Conversation changed:', payload);
					// Always refresh when conversations change
					debouncedRefresh();
				}
			)
			.subscribe((status) => {
				console.log('📡 [Messages] Conversations channel status:', status);
			});

		console.log('🚀 [Messages] Realtime subscriptions active');

		// Cleanup subscriptions and timeout on unmount
		return () => {
			console.log('🧹 [Messages] Cleaning up realtime subscriptions');
			if (refreshTimeout) {
				clearTimeout(refreshTimeout);
			}
			supabase.removeChannel(messagesChannel);
			supabase.removeChannel(conversationsChannel);
		};
	}, [session?.user?.id, loading]); // Removed 'conversations' from dependency array

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
				className="mx-4 mb-3 p-4 bg-card rounded-2xl border border-border/50 shadow-sm active:scale-[0.98] transition-all"
				onPress={() => router.push(`/conversation/${conversation.id}` as any)}
			>
				<View className="flex-row items-center">
					{/* User Avatar with online indicator */}
					<View className="relative mr-4">
						<View className="w-14 h-14 rounded-full bg-muted items-center justify-center border-2 border-background shadow-sm">
							{otherUser?.avatar ? (
								<Image
									source={{ uri: otherUser.avatar }}
									className="w-12 h-12 rounded-full"
									resizeMode="cover"
								/>
							) : (
								<Text className="text-lg font-bold text-muted-foreground">
									{displayName.charAt(0).toUpperCase()}
								</Text>
							)}
						</View>
						{/* Online indicator */}
						<View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
					</View>

					{/* Conversation Details */}
					<View className="flex-1 mr-3">
						<View className="flex-row items-center justify-between mb-2">
							<Text className={`font-semibold text-lg ${isUnread ? "text-foreground" : "text-foreground/90"}`}>
								{displayName}
							</Text>
							<Text className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
								{timeAgo}
							</Text>
						</View>

						{product && (
							<View className="flex-row items-center mb-2">
								<View className="w-2 h-2 bg-primary rounded-full mr-2" />
								<Text className="text-sm text-muted-foreground font-medium">
									{product.name}
								</Text>
								<Text className="text-sm font-bold text-primary ml-auto">
									${product.price.toFixed(2)}
								</Text>
							</View>
						)}

						{lastMessage && (
							<Text
								className={`text-sm leading-5 ${
									isUnread 
										? "text-foreground font-medium" 
										: "text-muted-foreground"
								}`}
								numberOfLines={2}
							>
								{lastMessage.sender_id === session?.user?.id ? (
									<Text className="text-primary font-medium">You: </Text>
								) : null}
								{lastMessage.message_type === "offer"
									? "💰 Sent an offer"
									: lastMessage.content}
							</Text>
						)}
					</View>

					{/* Product Image & Status Indicators */}
					<View className="items-center space-y-2">
						{productImage && (
							<View className="w-12 h-12 rounded-xl overflow-hidden border border-border/50 shadow-sm">
								<Image
									source={{ uri: productImage }}
									className="w-full h-full"
									resizeMode="cover"
								/>
							</View>
						)}
						
						<View className="flex-row items-center space-x-1">
							{isUnread && (
								<View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
									<Text className="text-primary-foreground text-xs font-bold">
										{conversation.unread_count}
									</Text>
								</View>
							)}
							<Ionicons 
								name="chevron-forward" 
								size={14} 
								color="#a1a1aa" 
								className="opacity-60" 
							/>
						</View>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<View className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
						<ActivityIndicator size="large" color="#10b981" />
						<Text className="mt-4 text-muted-foreground font-medium">
							Loading conversations...
						</Text>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Premium Header */}
			<View className="px-4 py-6 bg-card border-b border-border/50">
				<View className="flex-row items-center justify-between">
					<TouchableOpacity 
						onPress={() => router.back()}
						className="w-10 h-10 rounded-xl bg-muted items-center justify-center active:scale-95 transition-all"
					>
						<Ionicons name="chevron-back" size={20} color="#6b7280" />
					</TouchableOpacity>
					
					<View className="flex-1 items-center">
						<H1 className="text-2xl font-bold text-foreground">Messages</H1>
						<Text className="text-sm text-muted-foreground font-medium">
							{conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
						</Text>
					</View>
					
					<TouchableOpacity 
						onPress={onRefresh}
						className="w-10 h-10 rounded-xl bg-muted items-center justify-center active:scale-95 transition-all"
					>
						<Ionicons name="refresh" size={18} color="#6b7280" />
					</TouchableOpacity>
				</View>
			</View>

			{conversations.length === 0 ? (
				// Premium Empty State
				<View className="flex-1 items-center justify-center p-8">
					<View className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 max-w-sm w-full">
						<View className="w-20 h-20 rounded-full bg-muted items-center justify-center mx-auto mb-6">
							<Ionicons name="chatbubbles-outline" size={32} color="#6b7280" />
						</View>
						
						<H3 className="text-center mb-3 text-xl font-bold">No conversations yet</H3>
						<Text className="text-center text-muted-foreground mb-8 leading-6">
							Connect with sellers and buyers to start meaningful conversations about products you're interested in.
						</Text>
						
						<TouchableOpacity
							className="bg-primary py-4 px-6 rounded-xl shadow-sm active:scale-95 transition-all"
							onPress={() => {
								router.back();
								router.push("/(protected)/(tabs)/marketplace");
							}}
						>
							<Text className="text-primary-foreground font-semibold text-center text-base">
								Explore Marketplace
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			) : (
				// Premium Conversations List
				<ScrollView
					className="flex-1 pt-4"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 100 }} // Add padding for tab bar (88px + extra space)
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							colors={["#10b981"]}
							tintColor="#10b981"
							progressBackgroundColor="#ffffff"
						/>
					}
				>
					{conversations.map(renderConversationItem)}
				</ScrollView>
			)}
		</SafeAreaView>
	);
}