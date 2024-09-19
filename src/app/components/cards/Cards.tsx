import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface CardProps {
	title: string;
	subtitle: string;
	description: string;
	buttonLabel?: string;
}

const OutlinedCard: React.FC<CardProps> = ({
	title,
	subtitle,
	description,
	buttonLabel,
}) => {
	return (
		<Box sx={{ minWidth: 275 }}>
			<Card
				variant="outlined"
				sx={{ border: "1px solid #ddd", borderRadius: 2 }}
			>
				<CardContent>
					<Typography
						gutterBottom
						sx={{ color: "text.secondary", fontSize: 14 }}
					>
						{title}
					</Typography>
					<Typography variant="h5" component="div">
						{description}
					</Typography>
					<Typography sx={{ color: "text.secondary", mb: 1.5 }}>
						{subtitle}
					</Typography>
					<Typography variant="body2">
						{description}
						<br />
					</Typography>
				</CardContent>
				<CardActions>
					{buttonLabel && <Button size="small">{buttonLabel}</Button>}
				</CardActions>
			</Card>
		</Box>
	);
};

export default OutlinedCard;
