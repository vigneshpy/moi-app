import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			immutable: true,
		},
		event_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
			immutable: true,
		},
		amount: { type: Number, required: true },
		payment_method: { type: String, enum: ["UPI", "Cash"], required: true },
		payment_status: {
			type: String,
			enum: ["pending", "completed", "failed"],
			default: "pending",
		},
		transaction_date: { type: Date, default: Date.now },
		created_at: { type: Date, default: Date.now },
		updated_at: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
