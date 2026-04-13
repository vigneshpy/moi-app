import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./connection/db";
import eventRoutes from "./routes/eventRoutes";
import giftRoutes from "./routes/giftRoutes";
import userRoutes from "./routes/userRoutes";
import accountRoutes from "./routes/accountRoutes"; // Fixed typo
import authRoutes from "./routes/authRoutes";
import otpRoutes from "./routes/otpRoutes";
import rsvpRoutes from "./routes/rsvpRoutes";
import cors from "cors";
import { verifyToken } from "./middleware/auth.middleware";

dotenv.config();
const app = express();

connectDB();

app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);
app.options("*", cors());

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => {
	res.send("MOI APP API");
});

app.get("/healthz", (req, res) => {
	res.send("Running successfully");
});

app.use("/events", verifyToken, eventRoutes);
app.use("/gifts", verifyToken, giftRoutes);
app.use("/users", verifyToken, userRoutes);
app.use("/accounts", verifyToken, accountRoutes);
app.use("/auth", authRoutes);
app.use("/rsvp", rsvpRoutes);
app.use("/otp", otpRoutes);

if (process.env.IS_LAMBDA !== "true") {
	const port = process.env.PORT || 3000;
	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
}

export default app;
