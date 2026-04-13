import express from "express";
import RSVP from "../models/RSVPModel";
const router = express.Router();

//verify RSVP
router.post("/submit", async (req: any, res: any) => {
	try {
		const { event_id, name, phone, response, comment, number_of_guest } =
			req.body;

		// Validate required fields
		if (!event_id || !name || !phone || !response) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		const rsvp = await RSVP.findOne({ event_id });
		if (!rsvp) {
			return res
				.status(404)
				.json({ message: "Event not found or no RSVP available" });
		}

		const existing = rsvp.responses.find((resp) => resp.phone === phone);

		if (existing) {
			return res
				.status(400)
				.json({ message: "You have already submitted an RSVP" });
		}
		rsvp.responses.push({ name, phone, response, comment, number_of_guest });
		await rsvp.save();

		res.json({ success: true, message: "RSVP submitted successfully" });
	} catch (error) {
		console.error("Error submitting RSVP:", error);
		res.status(500).json({ message: "Failed to submit RSVP" });
	}
});

router.get("/:rsvpID", async (req: any, res: any) => {
	try {
		const rsvp = await RSVP.findOne({ _id: req.params.rsvpID });
		if (!rsvp) {
			return res.status(404).json({ message: "RSVP Not found" });
		}

		res.json(rsvp);
	} catch (error) {
		res.status(500).json({ message: "Error", error });
	}
});

router.get("/event/:eventID", async (req: any, res: any) => {
	try {
		const rsvp = await RSVP.findOne({ event_id: req.params.eventID }, "token");
		if (!rsvp) {
			return res.status(404).json({ message: "RSVP Not found" });
		}

		res.json(rsvp);
	} catch (error) {
		res.status(500).json({ message: "Error", error });
	}
});

export default router;
