"use client";

import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import BottomNavigation from "@mui/material/BottomNavigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import HomeIcon from "@mui/icons-material/Home";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupIcon from "@mui/icons-material/Group";
import SummarizeIcon from "@mui/icons-material/Summarize";

interface NavigationItem {
	name: string;
	href: string;
	icon: React.ComponentType;
}

const navigation: NavigationItem[] = [
	{ name: "Home", href: "/", icon: HomeIcon },
	{ name: "Events", href: "/events", icon: EventAvailableIcon },
	{ name: "Guest", href: "/guest", icon: GroupIcon },
	{ name: "Report", href: "/report", icon: SummarizeIcon },
];

export default function NavBar() {
	const [value, setValue] = useState("/");
	const router = useRouter();

	const handleNavigation = (href: string) => {
		console.log(`Navigating to: ${href}`);
		router.push(href);
	};

	return (
		<BottomNavigation
			showLabels
			value={value}
			onChange={(event, newValue) => {
				setValue(newValue);
				handleNavigation(newValue);
			}}
		>
			{navigation.map((item: NavigationItem) => {
				const IconComponent = item.icon;
				return (
					<BottomNavigationAction
						key={item.name}
						label={item.name}
						value={item.href}
						icon={<IconComponent />}
						onClick={() => handleNavigation(item.href)}
					/>
				);
			})}
		</BottomNavigation>
	);
}
