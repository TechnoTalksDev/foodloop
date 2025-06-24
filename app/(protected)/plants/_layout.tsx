// app/(protected)/plants/_layout.tsx - NEW FILE

import React from "react";
import { Stack } from "expo-router";

export default function PlantsLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="add-plant" />
			<Stack.Screen name="ai-calendar" />
			<Stack.Screen name="plant-detail" />
			<Stack.Screen name="weather-details" />
			<Stack.Screen name="plant-list" />
		</Stack>
	);
}