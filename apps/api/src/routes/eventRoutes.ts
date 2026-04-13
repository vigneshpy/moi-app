//@ts-nocheck
import express from "express";
import Event from "../models/eventModel.js";
import multer from "multer";
import {
	uploadToS3,
	generatePreSignURL,
	deleteS3Image,
} from "../controllers/s3Uploader.js";
import RSVP from "../models/RSVPModel.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create event
router.post("/create", upload.single("cover_image"), async (req, res) => {
	try {
		const {
			event_name,
			description,
			location,
			event_date,
			generate_rsvp,
			budget,
			user_id,
		} = req.body;

		let imageUrl = "";
		if (req.file) {
			imageUrl = await uploadToS3(req.file.buffer, req.file.mimetype);
		}

		const newEvent = new Event({
			event_name,
			description,
			location,
			event_date,
			generate_rsvp,
			budget,
			user_id,
			cover_image: { cover_url: imageUrl },
		});

		const savedEvent = await newEvent.save();
		const rsvp = await RSVP.findOne({ event_id: savedEvent._id });
		console.log("rsvp: ", rsvp);

		res.status(201).json({ success: true, event: savedEvent });
	} catch (error) {
		console.error("Error creating event:", error);
		res.status(500).json({ error: "Event creation failed" });
	}
});

// List all events created by a specific user
router.get("/user/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const events = await Event.find({ user_id: userId });

		// Generate pre-signed URLs for images
		const eventsWithPresignedUrls = await Promise.all(
			events.map(async (event) => {
				if (event.cover_image?.cover_url) {
					event.cover_image.presigned_url = await generatePreSignURL(
						event.cover_image.cover_url
					);
				}
				return event;
			})
		);

		res.status(200).json(eventsWithPresignedUrls);
	} catch (error) {
		console.error("Error fetching events:", error);
		res.status(400).json({ error: error.message });
	}
});

// Get a specific event by ID
router.get("/:eventId", async (req, res) => {
	try {
		const include_rsvp = Boolean(req.query?.rsvp || false);
		console.log("include_rsvp: ", include_rsvp);

		const { eventId } = req.params;

		const event = await Event.findById(eventId).lean();

		if (!event) return res.status(404).json({ error: "Event not found" });

		// Generate pre-signed URL for cover image
		if (event.cover_image?.cover_url) {
			event.cover_image.presigned_url = await generatePreSignURL(
				event.cover_image.cover_url
			);
		}

		if (include_rsvp) {
			const rsvp = await RSVP.findOne({ event_id: eventId })
				.sort({ created_at: -1 })
				.lean();
			return res.status(200).json({ event, rsvp });
		}
		res.status(200).json(event);
	} catch (error) {
		console.error("Error fetching event:", error);
		res.status(400).json({ error: error.message });
	}
});

// Delete an event
router.delete("/:eventId", async (req, res) => {
	try {
		const { eventId } = req.params;
		const event = await Event.findByIdAndDelete(eventId);
		if (!event) return res.status(404).json({ error: "Event not found" });
		if (event.cover_image.cover_url) deleteS3Image(event.cover_image.cover_url);
		res.status(200).json({ success: true, deletedEventId: event._id });
	} catch (error) {
		console.error("Error deleting event:", error);
		res.status(400).json({ error: error.message });
	}
});

// Update an event
router.put("/:eventId", upload.single("cover_image"), async (req, res) => {
	try {
		const { eventId } = req.params;
		let updateData = { ...req.body };

		// If a new image is uploaded, upload to S3
		if (req?.file) {
			updateData.cover_image = {
				cover_url: await uploadToS3(req.file.buffer, req.file.mimetype),
			};
		}

		const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, {
			new: true,
		});

		if (!updatedEvent)
			return res.status(404).json({ error: "Event not found" });

		// Generate pre-signed URL for updated image
		if (updatedEvent.cover_image?.cover_url) {
			updatedEvent.cover_image.presigned_url = await generatePreSignURL(
				updatedEvent.cover_image.cover_url
			);
		}

		res.status(200).json(updatedEvent);
	} catch (error) {
		console.error("Error updating event:", error);
		res.status(400).json({ error: error.message });
	}
});

// Handle invalid requests
router.get("/", (req, res) => {
	res.status(400).json({ error: "Invalid request" });
});

export default router;
