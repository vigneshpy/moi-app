interface Event {
	_id?: Types.ObjectId;
	event_name: string;
	event_date: Date;
	location: string;
	description?: string;
	status: "upcoming" | "ongoing" | "completed";
	type: "wedding" | "birthday" | "corporate" | "other";
	budget?: number;
	currency?: string;
	user_id: Types.ObjectId;
	organizers?: Types.ObjectId[];
	generate_rsvp?: boolean;
	qr_code_url?: string;
	total_collected?: number;
	reminder_date?: Date;
	recurring?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

interface Gift {
	id: string;
	eventId: string;
	partnerName: string;
	amount: number;
	paymentType: "UPI" | "Cash";
}
