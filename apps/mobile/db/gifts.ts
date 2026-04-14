import { getDb, generateId } from "./index";

export type PaymentMethod = "Cash" | "UPI";

export interface GiftRow {
	id: string;
	event_id: string;
	recipient_name: string;
	partner_name: string | null;
	amount: number;
	payment_method: PaymentMethod;
	note: string | null;
	gift_date: number;
	created_at: number;
}

export interface GiftInput {
	event_id: string;
	recipient_name: string;
	partner_name?: string | null;
	amount: number;
	payment_method?: PaymentMethod;
	note?: string | null;
	gift_date?: number;
}

export async function listGiftsForEvent(eventId: string): Promise<GiftRow[]> {
	const db = await getDb();
	return db.getAllAsync<GiftRow>(
		"SELECT * FROM gifts WHERE event_id = ? ORDER BY gift_date DESC, created_at DESC",
		[eventId],
	);
}

export async function createGift(input: GiftInput): Promise<GiftRow> {
	const db = await getDb();
	const id = generateId();
	const now = Date.now();
	await db.runAsync(
		`INSERT INTO gifts
			(id, event_id, recipient_name, partner_name, amount, payment_method, note, gift_date)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			input.event_id,
			input.recipient_name,
			input.partner_name ?? null,
			input.amount,
			input.payment_method ?? "Cash",
			input.note ?? null,
			input.gift_date ?? now,
		],
	);
	const row = await db.getFirstAsync<GiftRow>(
		"SELECT * FROM gifts WHERE id = ?",
		[id],
	);
	if (!row) throw new Error("gift insert failed");
	return row;
}

export async function deleteGift(id: string): Promise<void> {
	const db = await getDb();
	await db.runAsync("DELETE FROM gifts WHERE id = ?", [id]);
}

export async function totalForEvent(eventId: string): Promise<number> {
	const db = await getDb();
	const row = await db.getFirstAsync<{ total: number }>(
		"SELECT COALESCE(SUM(amount), 0) AS total FROM gifts WHERE event_id = ?",
		[eventId],
	);
	return row?.total ?? 0;
}
