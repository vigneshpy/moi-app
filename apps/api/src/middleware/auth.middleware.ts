import jwt from "jsonwebtoken";
import { RequestHandler } from "express";
import { JWT_SECRET } from "../connection/constants";
export const verifyToken: RequestHandler = (req: any, res: any, next: any) => {
	try {
		if (!req.cookies || !req.cookies.token) {
			return res.status(401).send("Unauthorized");
		}

		const token = req.cookies.token;

		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid token" });
	}
};
