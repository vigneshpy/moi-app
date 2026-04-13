import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { RSVP_URL } from "../connection/constants";

const rsvpSchema = new mongoose.Schema(
	{
		event_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
			immutable: true,
		},
		rsvp_link: { type: String, unique: true },
		token: {
			type: String,
			unique: true,
		},
		rsvp_greetings: {
			type: String,
		},
		responses: [
			{
				uid: { type: String, unique: true },
				name: { type: String, required: true },
				email: { type: String, sparse: true },
				phone: { type: String, sparse: true },
				number_of_guest: {
					type: Number,
					default: 1,
				},
				response: {
					type: String,
					enum: ["Yes", "No"],
					required: true,
				},
				comment: { type: String, default: "" },
				created_at: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true }
);

// Auto-generate RSVP link
rsvpSchema.pre("save", function (next) {
	if (!this.rsvp_link) {
		const token = uuidv4();
		this.rsvp_link = `${RSVP_URL}/invite/${this.event_id}/${token}`;
		this.token = token;
	}
	next();
});

const RSVP = mongoose.model("RSVP", rsvpSchema);
export default RSVP;
