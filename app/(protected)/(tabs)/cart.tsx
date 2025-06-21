import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

export default function Cart() {
	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				<View className="p-4">
					<H1 className="mb-4">Cart</H1>
					<Muted className="mb-6">
						Items you've added for purchase will appear here
					</Muted>
					
					{/* Placeholder content for empty cart */}
					<View className="items-center justify-center p-10 bg-secondary/30 rounded-xl">
						<Text className="text-4xl mb-4">🛒</Text>
						<H3 className="text-center mb-2">Your cart is empty</H3>
						<Muted className="text-center mb-6">
							Add items to your cart to get started with your order
						</Muted>
						<Button
							onPress={() => router.push("/")}
							className="w-full"
							variant="default"
							size="default"
						>
							<Text>Start Shopping</Text>
						</Button>
					</View>

					{/* Placeholder for future checkout button - not implementing checkout yet */}
					<View className="mt-8 opacity-0">
						<Button
							onPress={() => {}}
							className="w-full"
							variant="default"
							size="default"
						>
							<Text>Proceed to Checkout</Text>
						</Button>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
