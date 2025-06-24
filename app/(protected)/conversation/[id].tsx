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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { format } from "date-fns";

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

		setSending(true);
		try {
			const { error } = await supabase.from("messages").insert({
				conversation_id: id,
				sender_id: session.user.id,
				content: content.trim(),
				message_type: messageType,
				metadata: metadata,
			});

			if (error) {
				Alert.alert("Error", "Failed to send message");
				return;
			}

			await supabase
				.from("conversations")
				.update({ last_message_at: new Date().toISOString() })
				.eq("id", id);

			await fetchConversationData();
			setNewMessage("");
			setOfferAmount("");
			setShowOfferInput(false);

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

	useEffect(() => {
		fetchConversationData();
	}, [id, session?.user?.id]);

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
						{message.content}
					</Text>

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
								{product.name} • ${product.price.toFixed(2)}
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
				>
					{messages.map(renderMessage)}
				</ScrollView>

				{showOfferInput && (
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
					<TouchableOpacity
						onPress={() => setShowOfferInput(!showOfferInput)}
						className="mr-3 p-2"
					>
						<Ionicons name="cash" size={24} color="#10b981" />
					</TouchableOpacity>
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
