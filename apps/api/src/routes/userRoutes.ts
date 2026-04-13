import express from "express";
import User from "../models/userModel.js";

const router = express.Router();

router.post("/add", async (req, res) => {
	try {
		const newUser = new User(req.body);
		const saveUser = await newUser.save();
		res.status(201).json(saveUser);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

//get all the users needs to be removed or add pagination
router.get("/all", async (req, res) => {
	try {
		const users = await User.find({}, "id first_name last_name email");
		res.status(200).json(users);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

//get user by id
router.get("/:userId", async (req, res) => {
	try {
		const userID = req.params?.userId;
		const user = await User.findById(userID);
		res.status(200).json(user);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

//get user by email
router.get("/email/:email", async (req, res) => {
	try {
		const email = req.params?.email;
		const user = await User.findOne({ email }, "id first_name last_name email");
		res.status(200).json(user);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

router.get("/phone/:phone_number", async (req, res) => {
	try {
		const phone = req.params?.phone_number;
		const user = await User.findOne({ phone }, "id first_name last_name email");
		res.status(200).json(user);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

router.get("/", async (req, res) => {
	try {
		res.send("");
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

export default router;
