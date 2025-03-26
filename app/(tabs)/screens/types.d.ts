interface CoverImage {
	cover_url: string;
	presigned_url: string;
}

interface Event {
	event_name: string;
	event_date: string;
	location: string;
	description?: string;
	type: "wedding" | "birthday" | "corporate" | "other";
	budget?: number;
	user_id: Types.ObjectId;
	organizers?: Types.ObjectId[];
	generate_rsvp?: boolean;
	qr_code_url?: string;
	cover_image?: CoverImage;
	total_collected?: number;
	reminder_date?: Date;
	recurring?: boolean;
}

interface Gift {
	id: string;
	eventId: string;
	partnerName: string;
	amount: number;
	paymentType: "UPI" | "Cash";
}

interface RSVPResponse {
	uid: string;
	name: string;
	email?: string;
	phone?: string;
	number_of_guest?: number;
	response: "Yes" | "No";
	comment?: string;
	created_at?: Date;
}

interface RSVP {
	event_id: Types.ObjectId;
	rsvp_link?: string;
	token?: string;
	rsvp_greetings?: string;
	responses?: RSVPResponse[];
	createdAt?: Date;
	updatedAt?: Date;
}
