import { getDb, generateId } from "./index";

export type EventType = "wedding" | "birthday" | "corporate" | "other";

export interface EventRow {
	id: string;
	event_name: string;
	event_type: EventType;
	event_date: string | null;
	location: string | null;
	description: string | null;
	cover_uri: string | null;
	budget: number | null;
	created_at: number;
}

export interface EventWithTotals extends EventRow {
	total_collected: number;
	entry_count: number;
}

export interface EventInput {
	event_name: string;
	event_type?: EventType;
	event_date?: string | null;
	location?: string | null;
	description?: string | null;
	cover_uri?: string | null;
	budget?: number | null;
}

export async function listEvents(): Promise<EventWithTotals[]> {
	const db = await getDb();
	return db.getAllAsync<EventWithTotals>(`
		SELECT
			e.*,
			COALESCE(SUM(g.amount), 0) AS total_collected,
			COUNT(g.id)                AS entry_count
		FROM events e
		LEFT JOIN gifts g ON g.event_id = e.id
		GROUP BY e.id
		ORDER BY e.created_at DESC
	`);
}

export async function getEvent(id: string): Promise<EventWithTotals | null> {
	const db = await getDb();
	return db.getFirstAsync<EventWithTotals>(
		`
		SELECT
			e.*,
			COALESCE(SUM(g.amount), 0) AS total_collected,
			COUNT(g.id)                AS entry_count
		FROM events e
		LEFT JOIN gifts g ON g.event_id = e.id
		WHERE e.id = ?
		GROUP BY e.id
	`,
		[id],
	);
}

export async function createEvent(input: EventInput): Promise<EventRow> {
	const db = await getDb();
	const id = generateId();
	await db.runAsync(
		`INSERT INTO events
			(id, event_name, event_type, event_date, location, description, cover_uri, budget)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			input.event_name,
			input.event_type ?? "wedding",
			input.event_date ?? null,
			input.location ?? null,
			input.description ?? null,
			input.cover_uri ?? null,
			input.budget ?? null,
		],
	);
	const row = await db.getFirstAsync<EventRow>(
		"SELECT * FROM events WHERE id = ?",
		[id],
	);
	if (!row) throw new Error("event insert failed");
	return row;
}

export async function updateEvent(
	id: string,
	input: Partial<EventInput>,
): Promise<void> {
	const db = await getDb();
	const fields: string[] = [];
	const values: (string | number | null)[] = [];
	for (const [k, v] of Object.entries(input)) {
		fields.push(`${k} = ?`);
		values.push(v as string | number | null);
	}
	if (!fields.length) return;
	values.push(id);
	await db.runAsync(
		`UPDATE events SET ${fields.join(", ")} WHERE id = ?`,
		values,
	);
}

export async function deleteEvent(id: string): Promise<void> {
	const db = await getDb();
	await db.runAsync("DELETE FROM events WHERE id = ?", [id]);
}
