export const getUpcomingEvents = (allEvents: Event[]) => {
	const now = new Date();
	return allEvents.filter((event: Event) => new Date(event.event_date) >= now);
};

export const getPastEvents = (allEvents: Event[]) => {
	const now = new Date();

	return allEvents.filter((event: Event) => new Date(event.event_date) < now);
};

// Function to handle event press - navigate to event details

// Get event category icon
export const getCategoryIcon = (description: string) => {
	if (!description) return "calendar-blank";

	const desc = description.toLowerCase();
	if (desc.includes("party") || desc.includes("celebration"))
		return "party-popper";

	if (desc.includes("meeting") || desc.includes("conference"))
		return "account-group";
	if (desc.includes("dinner") || desc.includes("lunch"))
		return "food-fork-drink";
	if (desc.includes("trip") || desc.includes("travel")) return "airplane";
	if (desc.includes("workout") || desc.includes("exercise")) return "run";
	return "calendar-blank"; // default
};

// Format relative time (today, tomorrow, x days away)
export const getRelativeTime = (dateString: string) => {
	const eventDate = new Date(dateString);
	const today = new Date();
	today.setHours(0, 0, 0, 0); // Set to beginning of day

	const timeDiff = eventDate.getTime() - today.getTime();
	const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

	if (dayDiff < 0) {
		return `${Math.abs(dayDiff)} days ago`;
	} else if (dayDiff === 0) {
		return "Today";
	} else if (dayDiff === 1) {
		return "Tomorrow";
	} else {
		return `In ${dayDiff} days`;
	}
};

// Get event status (Upcoming, Today, Past)
export const getEventStatus = (dateString: string) => {
	const eventDate = new Date(dateString);
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const timeDiff = eventDate.getTime() - today.getTime();
	const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

	if (dayDiff < 0) return { label: "Past", color: "#9e9e9e" };
	if (dayDiff === 0) return { label: "Today", color: "#4caf50" };
	if (dayDiff <= 3) return { label: "Soon", color: "#ff9800" };
	return { label: "Upcoming", color: "#2196f3" };
};
