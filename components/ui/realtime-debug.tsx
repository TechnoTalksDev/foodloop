import React, { useEffect, useState } from 'react';
import { View, Alert, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { supabase, initializeRealtime } from '@/config/supabase';
import { useAuth } from '@/context/supabase-provider';

/**
 * Debug component to test realtime functionality
 * Add this to any screen temporarily to verify realtime is working
 */
export const RealtimeDebug = () => {
	const { session } = useAuth();
	const [connectionStatus, setConnectionStatus] = useState<string>('Not Connected');
	const [testMessage, setTestMessage] = useState<any>(null);

	useEffect(() => {
		// Initialize realtime on component mount
		initializeRealtime();
	}, []);

	const testRealtimeConnection = () => {
		console.log('🧪 [Debug] Testing realtime connection...');
		
		const testChannel = supabase
			.channel('debug-test-channel')
			.subscribe((status) => {
				console.log('🔍 [Debug] Test channel status:', status);
				setConnectionStatus(status);
				
				if (status === 'SUBSCRIBED') {
					Alert.alert('✅ Success', 'Realtime connection is working!');
				} else if (status === 'CHANNEL_ERROR') {
					Alert.alert('❌ Error', 'Realtime connection failed. Check your Supabase publications settings.');
				}
			});

		// Clean up after 3 seconds
		setTimeout(() => {
			supabase.removeChannel(testChannel);
			console.log('🧹 [Debug] Test channel cleaned up');
		}, 3000);
	};

	const testMessageSubscription = () => {
		if (!session?.user?.id) {
			Alert.alert('Error', 'No user session found');
			return;
		}

		console.log('📧 [Debug] Testing message subscription...');
		
		const messageTestChannel = supabase
			.channel('debug-messages-test')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
				},
				(payload) => {
					console.log('🎉 [Debug] Message received via realtime:', payload.new);
					setTestMessage(payload.new);
					Alert.alert('🎉 Message Received!', `Got realtime message: "${payload.new.content}"`);
				}
			)
			.subscribe((status) => {
				console.log('📡 [Debug] Message subscription status:', status);
				if (status === 'SUBSCRIBED') {
					Alert.alert('✅ Subscribed', 'Now listening for messages. Send a message to test!');
				}
			});

		// Clean up after 30 seconds
		setTimeout(() => {
			supabase.removeChannel(messageTestChannel);
			console.log('🧹 [Debug] Message test channel cleaned up');
		}, 30000);
	};

	const checkSupabaseConfig = () => {
		const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
		const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
		
		console.log('🔧 [Debug] Supabase URL:', url ? 'Set' : 'Missing');
		console.log('🔧 [Debug] Supabase Key:', key ? 'Set' : 'Missing');
		console.log('👤 [Debug] User session:', session?.user?.id ? 'Active' : 'None');
		
		Alert.alert('Config Check', `
URL: ${url ? '✅ Set' : '❌ Missing'}
Key: ${key ? '✅ Set' : '❌ Missing'}
User: ${session?.user?.id ? '✅ Active' : '❌ None'}
Status: ${connectionStatus}
		`);
	};

	return (
		<View className="p-4 bg-gray-100 dark:bg-gray-800 m-4 rounded-lg">
			<Text className="text-lg font-bold mb-2">🔧 Realtime Debug Panel</Text>
			
			<Text className="mb-2">Connection Status: {connectionStatus}</Text>
			
			{testMessage && (
				<Text className="mb-2 text-green-600">
					Last Message: {testMessage.content}
				</Text>
			)}
			
			<View className="gap-2">
				<Button onPress={testRealtimeConnection}>
					<Text>Test Connection</Text>
				</Button>
				
				<Button onPress={testMessageSubscription}>
					<Text>Test Message Subscription</Text>
				</Button>
				
				<Button onPress={checkSupabaseConfig} variant="outline">
					<Text>Check Config</Text>
				</Button>
			</View>
			
			<Text className="text-xs mt-2 text-gray-600">
				Remove this component in production
			</Text>
		</View>
	);
};
