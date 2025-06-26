import "../global.css";

import { Stack } from "expo-router";

import { AuthProvider } from "@/context/supabase-provider";
import { CartProvider } from "@/context/cart-provider";
import { ChatProvider } from "@/context/chat-provider";
import { NotificationProvider } from "@/context/notification-provider";
import { AgencyModeProvider } from "@/context/agency-mode-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function AppLayout() {
	const { colorScheme } = useColorScheme();

	return (
		<AuthProvider>
			<CartProvider>
				<ChatProvider>
					<NotificationProvider>
						<AgencyModeProvider>
							<Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
								<Stack.Screen name="(protected)" />
								<Stack.Screen name="welcome" />
								<Stack.Screen name="onboarding" />
								<Stack.Screen name="onboarding-complete" />
								<Stack.Screen
									name="sign-up"
									options={{
										presentation: "modal",
										headerShown: true,
										headerTitle: "Sign Up",
										headerStyle: {
											backgroundColor:
												colorScheme === "dark"
													? colors.dark.background
													: colors.light.background,
										},
										headerTintColor:
											colorScheme === "dark"
												? colors.dark.foreground
												: colors.light.foreground,
										gestureEnabled: true,
									}}
								/>
								<Stack.Screen
									name="sign-in"
									options={{
										presentation: "modal",
										headerShown: true,
										headerTitle: "Sign In",
										headerStyle: {
											backgroundColor:
												colorScheme === "dark"
													? colors.dark.background
													: colors.light.background,
										},
										headerTintColor:
											colorScheme === "dark"
												? colors.dark.foreground
												: colors.light.foreground,
										gestureEnabled: true,
									}}
								/>
							</Stack>
						</AgencyModeProvider>
					</NotificationProvider>
				</ChatProvider>
			</CartProvider>
		</AuthProvider>
	);
}