import mongoose from "mongoose";
import RSVP from "./RSVPModel";

const eventSchema = new mongoose.Schema(
	{
		event_name: { type: String, required: true },
		event_date: { type: Date, required: true },
		location: { type: String, required: true },
		description: { type: String, default: "" },
		type: {
			type: String,
			enum: ["wedding", "birthday", "corporate", "other"],
			required: true,
			default: "other",
		},
		budget: { type: Number, default: 0 },
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			immutable: true,
		},
		organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		generate_rsvp: { type: Boolean, default: false },
		qr_code_url: { type: String, default: "" },
		cover_image: {
			cover_url: { type: "String", default: "" },
			presigned_url: { type: "String", default: "" },
		},
		total_collected: { type: Number, default: 0 },
		reminder_date: { type: Date },
		recurring: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

eventSchema.pre("save", async function (next) {
	if (this.event_date) {
		const reminderDate = new Date(this.event_date);
		reminderDate.setDate(reminderDate.getDate() - 2);
		this.reminder_date = reminderDate;
	}

	// Handle RSVP
	if (this.generate_rsvp) {
		const existingRSVP = await RSVP.findOne({ event_id: this._id });
		if (!existingRSVP) {
			const quotes = `You're Invited to our ${this.event_name}`;
			const newRSVP = new RSVP({ event_id: this._id, rsvp_greetings: quotes });
			await newRSVP.save();
		}
	}

	next();
});

const Event = mongoose.model("Event", eventSchema);
export default Event;
