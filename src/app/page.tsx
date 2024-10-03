"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import OutlinedCard from "src/app/components/cards/Cards"; // Adjust the import path if necessary

interface Event {
	title: string;
	subtitle: string;
	description: string;
	buttonLabel?: string;
}

const events: Event[] = [
	{
		title: "Tech Conference 2024",
		subtitle: "January 25, 2024",
		description:
			"Join us for a day of exciting tech talks and networking with industry leaders.",
	},
	{
		title: "Web Development Workshop",
		subtitle: "February 10, 2024",
		description:
			"A hands-on workshop on modern web development practices and tools.",
	},
	{
		title: "Design Thinking Seminar",
		subtitle: "March 15, 2024",
		description:
			"Learn the fundamentals of design thinking and how to apply it to your projects.",
	},
	{
		title: "AI and Machine Learning Symposium",
		subtitle: "April 20, 2024",
		description:
			"Explore the latest advancements in AI and machine learning at our annual symposium.",
	},
];

const UpcomingEventsPage: React.FC = () => {
	return (
		<Box sx={{ flexGrow: 1, p: 2 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Past Events
			</Typography>
			<Grid container spacing={2}>
				{events.map((event, index) => (
					<Grid item xs={12} sm={6} md={4} key={index}>
						<OutlinedCard
							title={event.title}
							subtitle={event.subtitle}
							description={event.description}
							buttonLabel={event.buttonLabel}
						/>
					</Grid>
				))}
			</Grid>
		</Box>
	);
};

export default UpcomingEventsPage;
