import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "@/theme/tokens";

function TabIcon({
	name,
	color,
}: {
	name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
	color: string;
}) {
	return <MaterialCommunityIcons size={26} name={name} color={color} />;
}

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.maroon,
				tabBarInactiveTintColor: colors.inkMuted,
				tabBarStyle: {
					backgroundColor: colors.cream,
					borderTopColor: colors.gold,
					borderTopWidth: 1,
				},
				tabBarLabelStyle: { fontSize: 11 },
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<TabIcon name="home-variant-outline" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="screens/events"
				options={{
					title: "Functions",
					tabBarIcon: ({ color }) => (
						<TabIcon name="notebook-outline" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="screens/profile"
				options={{
					title: "Settings",
					tabBarIcon: ({ color }) => (
						<TabIcon name="cog-outline" color={color} />
					),
				}}
			/>
			{/* Hide non-screen files that expo-router picks up */}
			<Tabs.Screen name="screens/gifts" options={{ href: null }} />
		</Tabs>
	);
}
