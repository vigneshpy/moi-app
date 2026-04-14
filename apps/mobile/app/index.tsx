import { Redirect } from "expo-router";
import Toast from "react-native-toast-message";
import React from "react";

// Local-only app — no auth. Land on the tabs.
export default function Index() {
	return (
		<>
			<Redirect href="/(tabs)" />
			<Toast />
		</>
	);
}
