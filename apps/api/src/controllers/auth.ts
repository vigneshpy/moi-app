import User from "../models/userModel.js";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, NODE_ENV } from "../connection/constants.js";

// Register function
export const register: any = async (req: Request, res: Response) => {
	const { first_name, last_name, email, password, phone_number } = req.body;

	if (!email || !password) {
		return res.status(400).send("Email and password are required");
	}

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return res.status(400).send("User already exists");
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		const newUser = new User({
			first_name,
			last_name,
			email,
			password: hashedPassword,
			phone_number,
		});

		await newUser.save();
		return res
			.status(201)
			.send({ message: "User registered successfully", user: newUser });
	} catch (error) {
		return res.status(500).send("Error registering user");
	}
};

export const login = async (req: any, res: any) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		const bcryptPassword = user?.password || "";

		if (!user || !bcryptPassword) {
			return res.status(400).send("User not found");
		}

		const isMatch = await bcrypt.compare(password, bcryptPassword);
		if (!isMatch) return res.status(400).send("Invalid credentials");

		const token = jwt.sign({ userID: user._id }, JWT_SECRET, {
			expiresIn: "24h",
		});

		res.cookie("token", token, {
			httpOnly: true,
			secure: NODE_ENV,
			sameSite: "Strict",
			maxAge: 24 * 60 * 60 * 1000,
		});

		res.status(200).send("Login successful");
	} catch (error) {
		res.status(500).send("error logging in");
	}
};

export const logout = async (_: Request, res: any) => {
	try {
		res.clearCookie("token", {
			httpOnly: true,
			sameSite: "Strict",
			secure: process.env.NODE_ENV,
		});

		res.status(200).send("logout successful");
	} catch (error) {
		res.status(500).send("Error logging out");
	}
};
