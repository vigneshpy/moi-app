import express from "express";
import Gift from "../models/giftModel.js";

const router = express.Router();

//create gift
router.post("/create", async (req, res) => {
	try {
		const newGift = new Gift(req.body);
		const saveGift = await newGift.save();
		res.status(201).json(saveGift);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

//List all the gifts from  the user
router.get("/user/:userId", async (req, res) => {
	try {
		const currentUserId = req.params?.userId;
		const gift = await Gift.find({ user_id: currentUserId });
		res.status(201).json(gift);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

//List all the gifts from  the event
router.get("/event/:eventId", async (req, res) => {
	try {
		const eventId = req.params?.eventId;
		const gift = await Gift.find({ event_id: eventId });
		res.status(201).json(gift);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

export default router;
