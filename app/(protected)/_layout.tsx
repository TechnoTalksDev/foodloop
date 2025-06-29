import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/context/supabase-provider";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

export default function ProtectedLayout() {
	const { initialized, session } = useAuth();

	if (!initialized) {
		return null;
	}

	if (!session) {
		return <Redirect href="/welcome" />;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="modal" options={{ presentation: "modal" }} />
			<Stack.Screen name="cart-modal" options={{ presentation: "modal" }} />
			<Stack.Screen
				name="create-product-modal"
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen name="smartplate-ai" options={{ presentation: "card" }} />
			<Stack.Screen
				name="impact-dashboard"
				options={{ presentation: "card" }}
			/>
			<Stack.Screen name="messages" options={{ presentation: "card" }} />
			<Stack.Screen name="conversation" />
		</Stack>
	);
}
