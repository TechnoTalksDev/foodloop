import React from "react";
import {
	TouchableOpacity,
	View,
	Image,
	Text,
	GestureResponderEvent,
} from "react-native";

interface ProductCardProps {
	image: any;
	name: string;
	business: string;
	price: number;
	originalPrice: number;
	discount: string;
	eco: string;
	onPress?: (event: GestureResponderEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
	image,
	name,
	business,
	price,
	originalPrice,
	discount,
	eco,
	onPress,
}) => (
	<TouchableOpacity
		className="w-[48%] bg-secondary/50 rounded-xl mb-4 overflow-hidden shadow-sm border border-border"
		style={{ elevation: 2 }}
		onPress={onPress}
		activeOpacity={0.85}
	>
		<View className="relative">
			<Image source={image} className="w-full h-48" resizeMode="cover" />
			<View className="absolute top-2 left-2 bg-green-600 px-2 py-1 rounded-full">
				<Text className="text-xs text-white font-medium">{discount}</Text>
			</View>
			{/* <TouchableOpacity className="absolute top-2 right-2 w-8 h-8 bg-white/30 rounded-full items-center justify-center">
        <Text className="text-lg">🛒</Text>
      </TouchableOpacity> */}
		</View>
		<View className="p-3">
			<Text className="text-xs text-foreground mb-1">{business}</Text>
			<Text className="font-medium text-base text-foreground mb-1">{name}</Text>
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center">
					<Text className="font-bold text-base text-foreground">
						${price.toFixed(2)}
					</Text>
					<Text className="ml-2 text-xs text-muted-foreground line-through">
						${originalPrice.toFixed(2)}
					</Text>
				</View>
			</View>
			<Text className="text-xs text-green-600 mt-1">🌱 {eco}</Text>
		</View>
	</TouchableOpacity>
);
