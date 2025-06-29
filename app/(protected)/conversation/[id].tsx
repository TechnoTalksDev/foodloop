import React, { useState, useEffect, useRef } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
	Image,
	RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { format } from "date-fns";
import { filterProfanity, containsProfanity } from "@/lib/profanity-filter";

interface Message {
	id: string;
	conversation_id: string;
	sender_id: string;
	content: string;
	message_type: "text" | "offer" | "location" | "image" | "payment_info";
	metadata?: any;
	created_at: string;
	read_at?: string;
}

interface ConversationDetails {
	id: string;
	buyer_id: string;
	seller_id: string;
	product_id: string;
	status: string;
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
		location: string;
		amount: number;
	};
}

export default function ConversationScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { session } = useAuth();
	const scrollViewRef = useRef<ScrollView>(null);

	const [conversation, setConversation] = useState<ConversationDetails | null>(
		null,
	);
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [newMessage, setNewMessage] = useState("");
	const [showOfferInput, setShowOfferInput] = useState(false);
	const [offerAmount, setOfferAmount] = useState("");
	const [processingOffer, setProcessingOffer] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	// Check if current user is the seller
	const isSeller = conversation?.seller_id === session?.user?.id;

	const fetchConversationData = async () => {
		if (!id || !session?.user?.id) return;

		try {
			const { data: convData, error: convError } = await supabase
				.from("conversations")
				.select("*")
				.eq("id", id)
				.single();

			if (convError || !convData) {
				Alert.alert("Error", "Conversation not found");
				router.back();
				return;
			}

			if (
				convData.buyer_id !== session.user.id &&
				convData.seller_id !== session.user.id
			) {
				Alert.alert("Error", "You don't have access to this conversation");
				router.back();
				return;
			}

			const otherUserId =
				convData.buyer_id === session.user.id
					? convData.seller_id
					: convData.buyer_id;
			const { data: otherUser } = await supabase
				.from("users")
				.select("id, name, username, avatar")
				.eq("id", otherUserId)
				.single();

			const { data: product } = await supabase
				.from("product")
				.select("id, name, price, image_url, location, amount")
				.eq("id", convData.product_id)
				.single();

			setConversation({
				...convData,
				other_user: otherUser,
				product: product,
			});

			const { data: messagesData, error: messagesError } = await supabase
				.from("messages")
				.select("*")
				.eq("conversation_id", id)
				.order("created_at", { ascending: true });

			if (!messagesError && messagesData) {
				setMessages(messagesData);
				await markMessagesAsRead();
			}
		} catch (error) {
			console.error("Error fetching conversation data:", error);
		} finally {
			setLoading(false);
		}
	};

	const markMessagesAsRead = async () => {
		if (!session?.user?.id || !id) return;
		try {
			await supabase
				.from("messages")
				.update({ read_at: new Date().toISOString() })
				.eq("conversation_id", id)
				.neq("sender_id", session.user.id)
				.is("read_at", null);
		} catch (error) {
			console.error("Error marking messages as read:", error);
		}
	};
	const sendMessage = async (
		content: string,
		messageType: "text" | "offer" = "text",
		metadata?: any,
	) => {
		if (!session?.user?.id || !id || !content.trim()) return;

		console.log(`📤 [Conversation ${id}] Sending message:`, {
			content,
			messageType,
			metadata,
		});

		// Filter profanity from the message content
		const originalContent = content.trim();
		const filteredContent = filterProfanity(originalContent);
		// Warn user if profanity was detected and filtered
		if (containsProfanity(originalContent)) {
			console.log(`🚫 [Conversation ${id}] Profanity detected and filtered`);
			Alert.alert(
				"Message Filtered",
				"Your message contained inappropriate language and has been filtered to maintain a professional environment.",
				[{ text: "OK" }],
			);
		}

		// Clear input immediately for better UX (optimistic update)
		setNewMessage("");
		setOfferAmount("");
		setShowOfferInput(false);

		setSending(true);
		try {
			console.log(`💾 [Conversation ${id}] Inserting message into database`);
			const { error } = await supabase.from("messages").insert({
				conversation_id: id,
				sender_id: session.user.id,
				content: filteredContent,
				message_type: messageType,
				metadata: metadata,
			});

			if (error) {
				console.error(`❌ [Conversation ${id}] Failed to send message:`, error);
				Alert.alert("Error", "Failed to send message");
				// Restore input if there was an error
				setNewMessage(originalContent);
				return;
			}
			console.log(`✅ [Conversation ${id}] Message sent successfully`);
			console.log(
				`📅 [Conversation ${id}] Updating conversation last_message_at`,
			);
			await supabase
				.from("conversations")
				.update({ last_message_at: new Date().toISOString() })
				.eq("id", id); // Don't fetch conversation data - realtime will handle adding the message
			// await fetchConversationData(); // REMOVED - this was the bottleneck!

			// Input fields already cleared optimistically above

			// Scroll to bottom after a brief delay to allow realtime message to appear
			setTimeout(() => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}, 100);
		} catch (error) {
			Alert.alert("Error", "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	const sendOffer = async () => {
		const amount = parseFloat(offerAmount);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert("Invalid Amount", "Please enter a valid offer amount");
			return;
		}

		const offerContent = `💰 Offered $${amount.toFixed(2)} for ${conversation?.product?.name}`;
		const metadata = {
			amount: amount,
			product_id: conversation?.product_id,
			type: "price_offer",
		};

		await sendMessage(offerContent, "offer", metadata);
	};

	const handleAcceptOffer = async (message: Message) => {
		if (!message.metadata || !conversation?.product) return;

		setProcessingOffer(message.id);

		try {
			const offerAmount = message.metadata.amount;
			const quantity = message.metadata.quantity || 1; // Default to 1 if not specified

			// Update product quantity in database
			const newAmount = conversation.product.amount - quantity;

			if (newAmount < 0) {
				Alert.alert("Error", "This product is no longer available");
				return;
			}

			// Start a transaction-like operation
			const { error: productError } = await supabase
				.from("product")
				.update({ amount: newAmount })
				.eq("id", conversation.product.id);

			if (productError) {
				console.error("Error updating product:", productError);
				Alert.alert("Error", "Failed to update product. Please try again.");
				return;
			}

			// Create order history record
			const { error: orderError } = await supabase
				.from("order_history")
				.insert({
					seller_id: conversation.seller_id,
					buyer_id: conversation.buyer_id,
					product_id: conversation.product.id,
					price: offerAmount,
					quantity: quantity,
				});

			if (orderError) {
				console.error("Error creating order history:", orderError);
				// Rollback product update if order creation fails
				await supabase
					.from("product")
					.update({ amount: conversation.product.amount })
					.eq("id", conversation.product.id);
				Alert.alert(
					"Error",
					"Failed to complete transaction. Please try again.",
				);
				return;
			}

			// Send acceptance message
			const acceptanceContent = `✅ Offer accepted! $${offerAmount.toFixed(2)} for ${quantity}x ${conversation.product.name}. Transaction completed. Please coordinate pickup/delivery details.`;
			await sendMessage(acceptanceContent, "text");
			Alert.alert(
				"Transaction Completed!",
				`You've accepted the offer of $${offerAmount.toFixed(2)} for ${quantity}x ${conversation.product.name}. The transaction has been recorded.`,
				[{ text: "OK" }],
			);

			// Don't refresh conversation - realtime will handle the message update
			// await fetchConversationData(); // REMOVED - this was another bottleneck!
		} catch (error) {
			console.error("Error accepting offer:", error);
			Alert.alert("Error", "Failed to accept offer. Please try again.");
		} finally {
			setProcessingOffer(null);
		}
	};

	const handleDeclineOffer = async (message: Message) => {
		if (!message.metadata || !conversation?.product) return;

		setProcessingOffer(message.id);

		try {
			const offerAmount = message.metadata.amount;
			const declineContent = `❌ Offer declined. The offer of $${offerAmount.toFixed(2)} for ${conversation.product.name} was not accepted.`;

			await sendMessage(declineContent, "text");
		} catch (error) {
			console.error("Error declining offer:", error);
			Alert.alert("Error", "Failed to decline offer. Please try again.");
		} finally {
			setProcessingOffer(null);
		}
	};
	useEffect(() => {
		fetchConversationData();
	}, [id, session?.user?.id]);

	// Pull to refresh handler
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchConversationData();
		} catch (error) {
			console.error("Error refreshing conversation:", error);
		} finally {
			setRefreshing(false);
		}
	};
	// Set up realtime subscriptions for messages and conversations
	useEffect(() => {
		if (!id || !session?.user?.id || loading) return;

		console.log(
			`📡 [Conversation ${id}] Setting up realtime subscriptions for user:`,
			session.user.id,
		);

		// Subscribe to new messages in this conversation
		const messagesChannel = supabase
			.channel(`messages-${id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "messages",
					filter: `conversation_id=eq.${id}`,
				},
				(payload) => {
					console.log(
						`✉️ [Conversation ${id}] New message received:`,
						payload.new,
					);
					const newMessage = payload.new as Message;
					setMessages((prev) => {
						// Avoid duplicates by checking if message already exists
						if (prev.some((msg) => msg.id === newMessage.id)) {
							console.log(
								`⚠️ [Conversation ${id}] Duplicate message detected, skipping`,
							);
							return prev;
						}
						console.log(`✅ [Conversation ${id}] Adding new message to state`);
						return [...prev, newMessage];
					});

					// Mark new messages as read if they're not from the current user
					if (newMessage.sender_id !== session.user.id) {
						console.log(`👁️ [Conversation ${id}] Marking new message as read`);
						markMessagesAsRead();
					}
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "messages",
					filter: `conversation_id=eq.${id}`,
				},
				(payload) => {
					console.log(`📝 [Conversation ${id}] Message updated:`, payload.new);
					const updatedMessage = payload.new as Message;
					setMessages((prev) =>
						prev.map((msg) =>
							msg.id === updatedMessage.id ? updatedMessage : msg,
						),
					);
				},
			)
			.subscribe((status) => {
				console.log(`📡 [Conversation ${id}] Messages channel status:`, status);
			});

		// Subscribe to conversation updates (for status changes, etc.)
		const conversationChannel = supabase
			.channel(`conversation-${id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "conversations",
					filter: `id=eq.${id}`,
				},
				(payload) => {
					console.log(
						`💬 [Conversation ${id}] Conversation updated:`,
						payload.new,
					);
					// Refresh conversation data when conversation is updated
					fetchConversationData();
				},
			)
			.subscribe((status) => {
				console.log(
					`📡 [Conversation ${id}] Conversation channel status:`,
					status,
				);
			});

		console.log(`🚀 [Conversation ${id}] Realtime subscriptions active`);

		// Cleanup subscriptions on unmount
		return () => {
			console.log(`🧹 [Conversation ${id}] Cleaning up realtime subscriptions`);
			supabase.removeChannel(messagesChannel);
			supabase.removeChannel(conversationChannel);
		};
	}, [id, session?.user?.id, loading]);

	useEffect(() => {
		if (messages.length > 0) {
			setTimeout(() => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}
	}, [messages]);

	const renderMessage = (message: Message) => {
		const isOwnMessage = message.sender_id === session?.user?.id;
		const messageTime = format(new Date(message.created_at), "h:mm a");

		return (
			<View
				key={message.id}
				className={`mb-4 ${isOwnMessage ? "items-end" : "items-start"}`}
			>
				<View
					className={`max-w-[80%] p-3 rounded-2xl ${
						isOwnMessage
							? "bg-primary rounded-tr-sm"
							: "bg-secondary rounded-tl-sm"
					}`}
				>
					{message.message_type === "offer" && (
						<View className="flex-row items-center mb-2">
							<Text className="text-lg mr-2">💰</Text>
							<Text
								className={`font-semibold ${isOwnMessage ? "text-primary-foreground" : "text-foreground"}`}
							>
								{isOwnMessage ? "Your Offer" : "Price Offer"}
							</Text>
						</View>
					)}

					<Text
						className={`text-base ${
							isOwnMessage ? "text-primary-foreground" : "text-foreground"
						}`}
					>
						{filterProfanity(message.content)}
					</Text>

					{/* Add Accept/Decline buttons for sellers receiving offers */}
					{message.message_type === "offer" && !isOwnMessage && isSeller && (
						<View className="flex-row gap-2 mt-3">
							<Button
								onPress={() => handleDeclineOffer(message)}
								disabled={processingOffer === message.id}
								className="flex-1 bg-red-500"
								size="sm"
							>
								{processingOffer === message.id ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Text className="text-white text-sm">Decline</Text>
								)}
							</Button>
							<Button
								onPress={() => handleAcceptOffer(message)}
								disabled={processingOffer === message.id}
								className="flex-1 bg-green-500"
								size="sm"
							>
								{processingOffer === message.id ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Text className="text-white text-sm">Accept</Text>
								)}
							</Button>
						</View>
					)}

					<Text
						className={`text-xs mt-2 ${
							isOwnMessage
								? "text-primary-foreground/70"
								: "text-muted-foreground"
						}`}
					>
						{messageTime}
					</Text>
				</View>
			</View>
		);
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#10b981" />
				</View>
			</SafeAreaView>
		);
	}

	if (!conversation) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<Text>Conversation not found</Text>
				</View>
			</SafeAreaView>
		);
	}

	const otherUser = conversation.other_user;
	const product = conversation.product;

	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="flex-row items-center px-4 py-3 border-b border-border">
				<TouchableOpacity onPress={() => router.back()} className="mr-3">
					<Ionicons name="chevron-back" size={24} color="#666" />
				</TouchableOpacity>

				<View className="flex-1 flex-row items-center">
					<View className="w-10 h-10 rounded-full bg-secondary items-center justify-center mr-3">
						{otherUser?.avatar ? (
							<Image
								source={{ uri: otherUser.avatar }}
								className="w-10 h-10 rounded-full"
								resizeMode="cover"
							/>
						) : (
							<Text className="text-sm font-bold">
								{(otherUser?.name || otherUser?.username || "U")
									.charAt(0)
									.toUpperCase()}
							</Text>
						)}
					</View>

					<View className="flex-1">
						<Text className="font-semibold text-base">
							{otherUser?.name || otherUser?.username || "Unknown User"}
						</Text>
						{product && (
							<Text className="text-sm text-muted-foreground">
								{product.name} • ${product.price.toFixed(2)} • {product.amount}{" "}
								left
							</Text>
						)}
					</View>
				</View>

				{product?.image_url && (
					<TouchableOpacity
						onPress={() => router.push(`/(protected)/product/${product.id}`)}
					>
						<Image
							source={{
								uri: Array.isArray(product.image_url)
									? product.image_url[0]
									: product.image_url,
							}}
							className="w-10 h-10 rounded-lg"
							resizeMode="cover"
						/>
					</TouchableOpacity>
				)}
			</View>

			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					ref={scrollViewRef}
					className="flex-1 px-4 py-4"
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#10b981"
							colors={["#10b981"]}
						/>
					}
				>
					{messages.map(renderMessage)}
				</ScrollView>

				{/* Show out of stock warning */}
				{product && product.amount <= 0 && (
					<View className="px-4 py-3 bg-red-50 border-t border-red-200">
						<Text className="text-red-600 text-center">
							⚠️ This product is now out of stock
						</Text>
					</View>
				)}

				{showOfferInput && !isSeller && (
					<View className="px-4 py-3 border-t border-border bg-secondary/30">
						<Text className="font-semibold mb-2">Make an Offer</Text>
						<View className="flex-row items-center">
							<Text className="mr-2">$</Text>
							<TextInput
								value={offerAmount}
								onChangeText={setOfferAmount}
								placeholder="0.00"
								keyboardType="decimal-pad"
								className="flex-1 border border-border rounded-lg px-3 py-2 mr-2 text-foreground"
							/>
							<Button onPress={sendOffer} className="mr-2">
								<Text>Send</Text>
							</Button>
							<TouchableOpacity onPress={() => setShowOfferInput(false)}>
								<Ionicons name="close" size={24} color="#666" />
							</TouchableOpacity>
						</View>
					</View>
				)}

				<View className="flex-row items-center px-4 py-3 border-t border-border">
					{/* Only show offer button for buyers, not sellers */}
					{!isSeller && product && product.amount > 0 && (
						<TouchableOpacity
							onPress={() => setShowOfferInput(!showOfferInput)}
							className="mr-3 p-2"
						>
							<Ionicons name="cash" size={24} color="#10b981" />
						</TouchableOpacity>
					)}

					<View className="flex-1 flex-row items-center border border-border rounded-full px-4 py-2">
						<TextInput
							value={newMessage}
							onChangeText={setNewMessage}
							placeholder="Type a message..."
							className="flex-1 text-base text-foreground"
							multiline
							maxLength={500}
						/>
						<TouchableOpacity
							onPress={() => sendMessage(newMessage)}
							disabled={!newMessage.trim() || sending}
							className="ml-2"
						>
							{sending ? (
								<ActivityIndicator size="small" color="#10b981" />
							) : (
								<Ionicons
									name="send"
									size={20}
									color={newMessage.trim() ? "#10b981" : "#ccc"}
								/>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
