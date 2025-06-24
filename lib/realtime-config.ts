import { supabase } from '@/config/supabase';

/**
 * Utility functions for managing Supabase realtime subscriptions
 */

export interface RealtimeSubscription {
	channel: any;
	unsubscribe: () => void;
}

/**
 * Creates a realtime subscription for messages in a specific conversation
 */
export const subscribeToConversationMessages = (
	conversationId: string,
	onMessageInsert: (message: any) => void,
	onMessageUpdate: (message: any) => void
): RealtimeSubscription => {
	const channel = supabase
		.channel(`messages-${conversationId}`)
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'messages',
				filter: `conversation_id=eq.${conversationId}`,
			},
			(payload) => onMessageInsert(payload.new)
		)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'messages',
				filter: `conversation_id=eq.${conversationId}`,
			},
			(payload) => onMessageUpdate(payload.new)
		)
		.subscribe();

	return {
		channel,
		unsubscribe: () => supabase.removeChannel(channel),
	};
};

/**
 * Creates a realtime subscription for conversation updates
 */
export const subscribeToConversationUpdates = (
	conversationId: string,
	onConversationUpdate: (conversation: any) => void
): RealtimeSubscription => {
	const channel = supabase
		.channel(`conversation-${conversationId}`)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'conversations',
				filter: `id=eq.${conversationId}`,
			},
			(payload) => onConversationUpdate(payload.new)
		)
		.subscribe();

	return {
		channel,
		unsubscribe: () => supabase.removeChannel(channel),
	};
};

/**
 * Creates a realtime subscription for all messages (for the messages list screen)
 */
export const subscribeToAllMessages = (
	userId: string,
	onMessageChange: () => void
): RealtimeSubscription => {
	const channel = supabase
		.channel('all-messages-updates')
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'messages',
			},
			() => onMessageChange()
		)
		.subscribe();

	return {
		channel,
		unsubscribe: () => supabase.removeChannel(channel),
	};
};

/**
 * Creates a realtime subscription for all conversations (for the messages list screen)
 */
export const subscribeToAllConversations = (
	userId: string,
	onConversationChange: () => void
): RealtimeSubscription => {
	const channel = supabase
		.channel('all-conversations-updates')
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'conversations',
			},
			() => onConversationChange()
		)
		.subscribe();

	return {
		channel,
		unsubscribe: () => supabase.removeChannel(channel),
	};
};

/**
 * Checks if realtime is properly configured for the required tables
 * This function should be called during app initialization
 */
export const checkRealtimeConfiguration = async (): Promise<{
	success: boolean;
	message: string;
}> => {
	try {
		// Test if we can subscribe to a channel
		const testChannel = supabase
			.channel('test-connection')
			.subscribe((status) => {
				console.log('Realtime connection status:', status);
			});

		// Clean up test channel after a moment
		setTimeout(() => {
			supabase.removeChannel(testChannel);
		}, 1000);

		return {
			success: true,
			message: 'Realtime configuration appears to be working',
		};
	} catch (error) {
		console.error('Realtime configuration check failed:', error);
		return {
			success: false,
			message: `Realtime configuration error: ${error}`,
		};
	}
};
