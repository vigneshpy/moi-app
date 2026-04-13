import express, { Errback, Request, Response } from "express";
import Account from "../models/accountModel.js";

const router = express.Router();

router.post("/add", async (req: Request, res: Response) => {
	try {
		const newAccount = new Account(req.body);
		const saveAccount = await newAccount.save();
		res.status(201).json(saveAccount);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

router.get("/", async (req, res) => {
	try {
		res.send("Add account");
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
});

export default router;
