import { Box, Typography, Grid, InputLabel, Input } from "@mui/material";
import FormControl from "@mui/material/FormControl";

const AddEvents: React.FC = () => {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				flexDirection: "column",
				minHeight: "100vh",
			}}
		>
			<Typography
				variant="h4"
				component="h1"
				gutterBottom
				justifyContent={"center"}
				alignItems={"center"}
				alignContent={"center"}
			>
				Add Events
			</Typography>
			<Grid container spacing={2}>
				<Grid item xs={12} sm={4}>
					<FormControl fullWidth>
						<InputLabel htmlFor="event-name">Name of the event</InputLabel>
						<Input id="event-name" />
					</FormControl>
				</Grid>
				<Grid item xs={12} sm={4}>
					<FormControl fullWidth>
						<InputLabel htmlFor="event-date">Date of the event</InputLabel>
						<Input id="event-date" />
					</FormControl>
				</Grid>
				<Grid item xs={12} sm={4}>
					<FormControl fullWidth>
						<InputLabel htmlFor="event-date">Date of the event</InputLabel>
						<Input id="event-date" />
					</FormControl>
				</Grid>
			</Grid>
		</Box>
	);
};

export default AddEvents;
