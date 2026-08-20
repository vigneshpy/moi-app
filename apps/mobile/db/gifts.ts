import { getDb, generateId } from "./index";
import { normaliseName } from "./names";

export type PaymentMethod = "Cash" | "UPI";

export interface GiftRow {
	id: string;
	event_id: string;
	/**
	 * The other party's name, in both directions: on a HOSTED function this is
	 * who gave the moi to us; on an ATTENDED function it's the family we gave
	 * it to.
	 */
	recipient_name: string;
	partner_name: string | null;
	amount: number;
	payment_method: PaymentMethod;
	note: string | null;
	/** ATTENDED only — which family member handed it over. */
	given_by: string | null;
	/** Normalised match key derived from recipient_name. Never set by hand. */
	name_key: string;
	/** Notebook page this entry was transcribed from, if any. */
	page_id: string | null;
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
	given_by?: string | null;
	page_id?: string | null;
	gift_date?: number;
}

export interface NameSuggestion {
	recipient_name: string;
	last_used: number;
	times_used: number;
}

export async function listGiftsForEvent(eventId: string): Promise<GiftRow[]> {
	const db = await getDb();
	return db.getAllAsync<GiftRow>(
		"SELECT * FROM gifts WHERE event_id = ? ORDER BY gift_date DESC, created_at DESC",
		[eventId],
	);
}

export async function listGiftsForPage(pageId: string): Promise<GiftRow[]> {
	const db = await getDb();
	return db.getAllAsync<GiftRow>(
		"SELECT * FROM gifts WHERE page_id = ? ORDER BY created_at DESC",
		[pageId],
	);
}

/**
 * Names already recorded anywhere in the app, most recently used first.
 *
 * Deliberately spans every function — at a live function the person in front
 * of you is far more likely to be someone from a previous year's notebook
 * than someone already entered today. Served by idx_gifts_name_recent.
 */
export async function suggestNames(
	prefix: string,
	limit = 6,
): Promise<NameSuggestion[]> {
	const q = prefix.trim();
	if (!q) return [];
	const db = await getDb();

	// Match on the raw name (what the user is typing) OR the normalised key,
	// so typing "raja" also surfaces a name stored as "ராஜா".
	const key = normaliseName(q);
	return db.getAllAsync<NameSuggestion>(
		`SELECT recipient_name,
		        MAX(created_at) AS last_used,
		        COUNT(*)        AS times_used
		   FROM gifts
		  WHERE recipient_name LIKE ? ESCAPE '\\'
		     OR (? <> '' AND name_key LIKE ? ESCAPE '\\')
		  GROUP BY recipient_name
		  ORDER BY last_used DESC
		  LIMIT ?`,
		[`${escapeLike(q)}%`, key, `${escapeLike(key)}%`, limit],
	);
}

export async function createGift(input: GiftInput): Promise<GiftRow> {
	const db = await getDb();
	const id = generateId();
	const now = Date.now();
	await db.runAsync(
		`INSERT INTO gifts
			(id, event_id, recipient_name, partner_name, amount, payment_method,
			 note, given_by, name_key, page_id, gift_date)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			input.event_id,
			input.recipient_name,
			input.partner_name ?? null,
			input.amount,
			input.payment_method ?? "Cash",
			input.note ?? null,
			input.given_by ?? null,
			normaliseName(input.recipient_name),
			input.page_id ?? null,
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

export async function updateGift(
	id: string,
	input: Partial<Omit<GiftInput, "event_id">>,
): Promise<GiftRow> {
	const db = await getDb();
	const fields: string[] = [];
	const values: (string | number | null)[] = [];
	for (const [k, v] of Object.entries(input)) {
		fields.push(`${k} = ?`);
		values.push(v as string | number | null);
	}
	// The match key is derived, so it has to follow the name it came from.
	if (typeof input.recipient_name === "string") {
		fields.push("name_key = ?");
		values.push(normaliseName(input.recipient_name));
	}
	if (fields.length) {
		values.push(id);
		await db.runAsync(
			`UPDATE gifts SET ${fields.join(", ")} WHERE id = ?`,
			values,
		);
	}
	const row = await db.getFirstAsync<GiftRow>(
		"SELECT * FROM gifts WHERE id = ?",
		[id],
	);
	if (!row) throw new Error("gift not found after update");
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

/** Count of entries transcribed from one notebook page. */
export async function countForPage(pageId: string): Promise<number> {
	const db = await getDb();
	const row = await db.getFirstAsync<{ n: number }>(
		"SELECT COUNT(*) AS n FROM gifts WHERE page_id = ?",
		[pageId],
	);
	return row?.n ?? 0;
}

/** Escape LIKE wildcards so a name containing % or _ still matches literally. */
export function escapeLike(s: string): string {
	return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
