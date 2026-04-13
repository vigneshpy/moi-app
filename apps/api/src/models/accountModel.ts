import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		upi_id: { type: String, default: "" },
		balance: { type: Number, default: 0 },
		transactions: [
			{
				transaction_id: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Transaction",
				},
				amount: { type: Number, required: true },
				payment_method: { type: String, enum: ["UPI", "Cash"], required: true },
				status: {
					type: String,
					enum: ["pending", "completed", "failed"],
					default: "pending",
				},
				created_at: { type: Date, default: Date.now },
			},
		],
		created_at: { type: Date, default: Date.now },
		updated_at: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

const Account = mongoose.model("Account", accountSchema);

export default Account;
