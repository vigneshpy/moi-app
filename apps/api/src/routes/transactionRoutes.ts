import express from "express";
import Transaction from "../models/transactionModel";
const router = express.Router();

router.post("/add", async (req: any, res: any) => {
	try {
		const transaction = new Transaction(req.body);
		const saveTransaction = await transaction.save();
		res.status(201).json(saveTransaction);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

router.get("/", async (req, res) => {
	try {
		res.send("Add user");
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

export default router;
