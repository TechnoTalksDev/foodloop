// app/(protected)/notification-modal.tsx - ENHANCED VERSION

import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/notification-provider";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

const getNotificationTypeColor = (type: string) => {
	switch (type) {
		case 'message': return '#3b82f6'; // Blue
		case 'plant_reminder': return '#10b981'; // Green
		case 'harvest_ready': return '#f59e0b'; // Orange
		case 'weather_alert': return '#ef4444'; // Red
		case 'marketplace_update': return '#8b5cf6'; // Purple
		case 'order_update': return '#06b6d4'; // Cyan
		case 'community_post': return '#84cc16'; // Lime
		case 'achievement': return '#f59e0b'; // Amber
		case 'system': return '#6b7280'; // Gray
		default: return '#6b7280';
	}
};

const getNotificationTypeLabel = (type: string) => {
	switch (type) {
		case 'message': return 'Message';
		case 'plant_reminder': return 'Plant Care';
		case 'harvest_ready': return 'Harvest';
		case 'weather_alert': return 'Weather';
		case 'marketplace_update': return 'Marketplace';
		case 'order_update': return 'Order';
		case 'community_post': return 'Community';
		case 'achievement': return 'Achievement';
		case 'system': return 'System';
		default: return 'Notification';
	}
};

const formatNotificationDate = (dateString: string) => {
	const date = new Date(dateString);
	
	if (isToday(date)) {
		return format(date, 'h:mm a');
	} else if (isYesterday(date)) {
		return 'Yesterday';
	} else {
		return format(date, 'MMM d');
	}
};

export default function NotificationModal() {
	const { colorScheme } = useColorScheme();
	const {
		notifications,
		unreadCount,
		markAsRead,
		markAllAsRead,
		deleteNotification,
		refreshNotifications,
		preferences,
		updatePreferences,
	} = useNotifications();

	const [filter, setFilter] = useState<'all' | 'unread'>('all');
	const [showSettings, setShowSettings] = useState(false);

	const textColor = colorScheme === 'dark' ? colors.dark.foreground : colors.light.foreground;
	const mutedTextColor = colorScheme === 'dark' ? colors.dark.mutedForeground : colors.light.mutedForeground;
	const bgColor = colorScheme === 'dark' ? colors.dark.background : colors.light.background;
	const cardBg = colorScheme === 'dark' ? colors.dark.card : colors.light.card;

	const filteredNotifications = filter === 'unread' 
		? notifications.filter(n => !n.read)
		: notifications;

	const handleNotificationPress = (notification: any) => {
		// Mark as read
		if (!notification.read) {
			markAsRead(notification.id);
		}

		// Navigate to action URL if provided
		if (notification.action_url) {
			router.back(); // Close modal first
			setTimeout(() => {
				router.push(notification.action_url);
			}, 100);
		}
	};

	const handleDeleteNotification = (notificationId: string, title: string) => {
		Alert.alert(
			"Delete Notification",
			`Are you sure you want to delete "${title}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => deleteNotification(notificationId)
				}
			]
		);
	};

	const renderNotificationSettings = () => (
		<View className="p-4 border-t border-border">
			<View className="flex-row items-center justify-between mb-4">
				<Text className="text-lg font-semibold">Notification Settings</Text>
				<TouchableOpacity onPress={() => setShowSettings(false)}>
					<Ionicons name="close" size={24} color={textColor} />
				</TouchableOpacity>
			</View>

			<ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
				{Object.entries(preferences).map(([key, value]) => {
					if (key.includes('quiet_hours')) return null; // Skip time settings for now
					
					const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
					
					return (
						<View key={key} className="flex-row items-center justify-between py-3 border-b border-border">
							<Text className="flex-1 capitalize">{label}</Text>
							<TouchableOpacity
								onPress={() => updatePreferences({ [key]: !value })}
								className={`w-12 h-6 rounded-full justify-center ${
									value ? 'bg-primary' : 'bg-muted'
								}`}
							>
								<View 
									className={`w-5 h-5 rounded-full bg-white shadow-sm ${
										value ? 'self-end mr-0.5' : 'self-start ml-0.5'
									}`}
								/>
							</TouchableOpacity>
						</View>
					);
				})}

				{/* Quiet Hours Settings */}
				<View className="mt-4 p-4 bg-muted/30 rounded-lg">
					<View className="flex-row items-center justify-between mb-3">
						<Text className="font-medium">Quiet Hours</Text>
						<TouchableOpacity
							onPress={() => updatePreferences({ 
								quiet_hours_enabled: !preferences.quiet_hours_enabled 
							})}
							className={`w-12 h-6 rounded-full justify-center ${
								preferences.quiet_hours_enabled ? 'bg-primary' : 'bg-muted'
							}`}
						>
							<View 
								className={`w-5 h-5 rounded-full bg-white shadow-sm ${
									preferences.quiet_hours_enabled ? 'self-end mr-0.5' : 'self-start ml-0.5'
								}`}
							/>
						</TouchableOpacity>
					</View>
					
					{preferences.quiet_hours_enabled && (
						<View>
							<Text className="text-sm text-muted-foreground mb-2">
								From {preferences.quiet_hours_start} to {preferences.quiet_hours_end}
							</Text>
							<Text className="text-xs text-muted-foreground">
								Non-urgent notifications will be silenced during quiet hours
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
			{/* Header */}
			<View className="flex-row items-center justify-between p-4 border-b border-border">
				<View className="flex-row items-center">
					<TouchableOpacity onPress={() => router.back()} className="mr-4">
						<Ionicons name="chevron-back" size={24} color={textColor} />
					</TouchableOpacity>
					<View>
						<H1>Notifications</H1>
						{unreadCount > 0 && (
							<Text className="text-sm text-primary">
								{unreadCount} unread
							</Text>
						)}
					</View>
				</View>
				
				<View className="flex-row items-center gap-3">
					<TouchableOpacity onPress={refreshNotifications}>
						<Ionicons name="refresh" size={20} color={textColor} />
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setShowSettings(true)}>
						<Ionicons name="settings" size={20} color={textColor} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Filter and Actions */}
			<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
				<View className="flex-row bg-secondary/30 rounded-lg p-1">
					<TouchableOpacity
						onPress={() => setFilter('all')}
						className={`px-4 py-2 rounded-md ${
							filter === 'all' ? 'bg-primary' : ''
						}`}
					>
						<Text className={`font-medium ${
							filter === 'all' ? 'text-primary-foreground' : 'text-foreground'
						}`}>
							All ({notifications.length})
						</Text>
					</TouchableOpacity>
					
					<TouchableOpacity
						onPress={() => setFilter('unread')}
						className={`px-4 py-2 rounded-md ${
							filter === 'unread' ? 'bg-primary' : ''
						}`}
					>
						<Text className={`font-medium ${
							filter === 'unread' ? 'text-primary-foreground' : 'text-foreground'
						}`}>
							Unread ({unreadCount})
						</Text>
					</TouchableOpacity>
				</View>

				{unreadCount > 0 && (
					<TouchableOpacity onPress={markAllAsRead}>
						<Text className="text-primary font-medium">Mark all as read</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Notifications List */}
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{filteredNotifications.length === 0 ? (
					<View className="flex-1 items-center justify-center p-8">
						<View className="items-center">
							<Text className="text-6xl mb-4">🔔</Text>
							<Text className="text-xl font-semibold mb-2 text-center">
								{filter === 'unread' ? 'All caught up!' : 'No notifications'}
							</Text>
							<Muted className="text-center mb-6">
								{filter === 'unread' 
									? "You don't have any unread notifications right now."
									: "You don't have any notifications yet. We'll notify you about messages, plant care, and more!"
								}
							</Muted>
							
							<Button
								onPress={refreshNotifications}
								variant="outline"
								size="default"
							>
								<Text>Refresh</Text>
							</Button>
						</View>
					</View>
				) : (
					<View className="p-4">
						{filteredNotifications.map((notification) => (
							<TouchableOpacity
								key={notification.id}
								onPress={() => handleNotificationPress(notification)}
								className={`p-4 rounded-xl mb-3 border ${
									notification.read 
										? 'bg-card border-border' 
										: 'bg-primary/10 border-primary/30'
								} ${notification.urgent ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
								style={{ backgroundColor: notification.read ? cardBg : undefined }}
								activeOpacity={0.7}
							>
								<View className="flex-row items-start">
									{/* Icon and Type Badge */}
									<View className="items-center mr-3">
										<View 
											className="w-12 h-12 rounded-full items-center justify-center mb-2"
											style={{ backgroundColor: getNotificationTypeColor(notification.type) + '20' }}
										>
											<Text className="text-2xl">{notification.icon}</Text>
										</View>
										<View 
											className="px-2 py-1 rounded-full"
											style={{ backgroundColor: getNotificationTypeColor(notification.type) }}
										>
											<Text className="text-white text-xs font-medium">
												{getNotificationTypeLabel(notification.type)}
											</Text>
										</View>
									</View>

									{/* Content */}
									<View className="flex-1 mr-2">
										<View className="flex-row items-start justify-between mb-1">
											<Text 
												className={`font-semibold text-base flex-1 mr-2 ${
													notification.read ? 'text-foreground' : 'text-primary'
												}`}
											>
												{notification.title}
											</Text>
											<Text className="text-xs text-muted-foreground">
												{formatNotificationDate(notification.created_at)}
											</Text>
										</View>

										<Text className={`text-sm mb-2 leading-5 ${
											notification.read ? 'text-muted-foreground' : 'text-foreground'
										}`}>
											{notification.message}
										</Text>

										{/* Urgency Indicator */}
										{notification.urgent && (
											<View className="flex-row items-center mb-2">
												<Ionicons name="warning" size={16} color="#ef4444" />
												<Text className="text-red-500 text-xs font-medium ml-1">
													Urgent
												</Text>
											</View>
										)}

										{/* Expiry Warning */}
										{notification.expires_at && (
											<Text className="text-xs text-amber-600 dark:text-amber-400">
												⏰ Expires {formatDistanceToNow(new Date(notification.expires_at), { addSuffix: true })}
											</Text>
										)}
									</View>

									{/* Actions */}
									<View className="items-center justify-center">
										{!notification.read && (
											<TouchableOpacity
												onPress={(e) => {
													e.stopPropagation();
													markAsRead(notification.id);
												}}
												className="p-2 mb-2"
											>
												<View className="w-3 h-3 rounded-full bg-primary" />
											</TouchableOpacity>
										)}
										
										<TouchableOpacity
											onPress={(e) => {
												e.stopPropagation();
												handleDeleteNotification(notification.id, notification.title);
											}}
											className="p-2"
										>
											<Ionicons 
												name="trash-outline" 
												size={18} 
												color={mutedTextColor} 
											/>
										</TouchableOpacity>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</View>
				)}
			</ScrollView>

			{/* Settings Panel */}
			{showSettings && renderNotificationSettings()}
		</SafeAreaView>
	);
}