import { View, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";

// Define notification data structure
interface Notification {
	id: string;
	title: string;
	date: string;
	icon: string;
	iconBgColor: string;
	read: boolean;
}

// Sample notification data
const notifications: Notification[] = [
	{
		id: "1",
		title: "Appointment Cancelled",
		date: "Today | 03:23 AM",
		icon: "📅",
		iconBgColor: "bg-red-950/30",
		read: false,
	},
	{
		id: "2",
		title: "Schedule Changed",
		date: "Tuesday | 05:23 PM",
		icon: "📝",
		iconBgColor: "bg-green-950/30",
		read: false,
	},
	{
		id: "3",
		title: "Appointment Success",
		date: "Friday | 05:00 PM",
		icon: "📅",
		iconBgColor: "bg-purple-950/30",
		read: false,
	},
	{
		id: "4",
		title: "New Service Available",
		date: "12 Dec 2024 | 04:00 PM",
		icon: "🎟️",
		iconBgColor: "bg-orange-950/30",
		read: false,
	},
	{
		id: "5",
		title: "Credit Card Connected",
		date: "02 Dec 2024 | 02:00 PM",
		icon: "💳",
		iconBgColor: "bg-blue-950/30",
		read: true,
	},
];

export default function NotificationModal() {
	return (
		<SafeAreaView className="flex flex-1 bg-background">

			{/* Header */}
			<View className="flex-row items-center justify-between p-4 border-b border-border">
				<View className="flex-row items-center">
					<TouchableOpacity onPress={() => router.back()} className="mr-4">
						<Text className="text-4xl text-foreground">←</Text>
					</TouchableOpacity>
					<H1>Notifications</H1>
				</View>
				<TouchableOpacity>
					<Text className="text-primary font-medium">Mark all as read</Text>
				</TouchableOpacity>
			</View>
			{/* Notification List */}
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{notifications.map((notification) => (
					<TouchableOpacity
						key={notification.id}
						className="flex-row items-center p-4 border-b border-border"
					>
						{/* Icon */}
						<View
							className={`w-12 h-12 rounded-full ${notification.iconBgColor} items-center justify-center mr-3`}
						>
							<Text className="text-2xl">{notification.icon}</Text>
						</View>

						{/* Content */}
						<View className="flex-1">
							<Text className="text-base font-medium text-foreground">
								{notification.title}
							</Text>
							<Muted>{notification.date}</Muted>
						</View>

						{/* Unread indicator */}
						{!notification.read && (
							<View className="w-3 h-3 rounded-full bg-primary" />
						)}
					</TouchableOpacity>
				))}
			</ScrollView>
		</SafeAreaView>
	);
}
