import { getDb } from "./index";
import { normaliseName } from "./names";
import { escapeLike, type PaymentMethod } from "./gifts";
import { resolveHouseholdKeys } from "./households";
import type { Direction } from "./events";

/**
 * Reciprocity: what a person or household gave us, and what we gave them.
 *
 * This is a history, not a balance. Nothing here computes a difference, and
 * callers must not present one — the user reads the two columns and draws
 * their own conclusions.
 */

export interface ReciprocityEntry {
	gift_id: string;
	event_id: string;
	event_name: string;
	event_date: string | null;
	direction: Direction;
	recipient_name: string;
	amount: number;
	payment_method: PaymentMethod;
	given_by: string | null;
	gift_date: number;
	/** Calendar year of the entry, always shown on the row. */
	year: number;
}

export interface ReciprocitySide {
	entries: ReciprocityEntry[];
	total: number;
	mostRecent: ReciprocityEntry | null;
}

export interface ReciprocityResult {
	/** The name as searched. */
	query: string;
	/** Set when the matched name belongs to a household. */
	householdId: string | null;
	householdName: string | null;
	/** Every normalised key folded into this result. */
	keys: string[];
	/** Distinct spellings actually found in the data, for the merge UI. */
	spellings: string[];
	receivedFromThem: ReciprocitySide;
	gaveToThem: ReciprocitySide;
}

/** A name that exists in the data, for search results and the merge picker. */
export interface PersonSummary {
	name_key: string;
	display_name: string;
	entry_count: number;
	last_seen: number;
}

const SELECT_ENTRY = `
	SELECT g.id            AS gift_id,
	       g.event_id      AS event_id,
	       e.event_name    AS event_name,
	       e.event_date    AS event_date,
	       e.direction     AS direction,
	       g.recipient_name,
	       g.amount,
	       g.payment_method,
	       g.given_by,
	       g.gift_date
	  FROM gifts g
	  JOIN events e ON e.id = g.event_id
`;

/**
 * Partial, case-insensitive name search across everything recorded.
 *
 * Matches the raw name and the normalised key, so "raja" finds a row stored
 * as "ராஜா" and vice versa. Backed by idx_gifts_name_key.
 */
export async function searchPeople(
	query: string,
	limit = 30,
): Promise<PersonSummary[]> {
	const q = query.trim();
	if (!q) return [];
	const db = await getDb();
	const key = normaliseName(q);

	return db.getAllAsync<PersonSummary>(
		`SELECT name_key,
		        recipient_name  AS display_name,
		        COUNT(*)        AS entry_count,
		        MAX(gift_date)  AS last_seen
		   FROM gifts
		  WHERE recipient_name LIKE ? ESCAPE '\\' COLLATE NOCASE
		     OR (? <> '' AND name_key LIKE ? ESCAPE '\\')
		  GROUP BY name_key, recipient_name
		  ORDER BY last_seen DESC
		  LIMIT ?`,
		[`%${escapeLike(q)}%`, key, `${escapeLike(key)}%`, limit],
	);
}

function toEntry(row: Omit<ReciprocityEntry, "year">): ReciprocityEntry {
	return { ...row, year: new Date(row.gift_date).getFullYear() };
}

function summarise(entries: ReciprocityEntry[]): ReciprocitySide {
	return {
		entries,
		total: entries.reduce((sum, e) => sum + (e.amount || 0), 0),
		// Entries arrive newest-first from SQL.
		mostRecent: entries[0] ?? null,
	};
}

/**
 * Both sides of the history for one person or household.
 *
 * Widens the lookup across manually merged spellings and, when the name is
 * linked to a household, across every name in that household.
 */
export async function getReciprocity(
	displayName: string,
): Promise<ReciprocityResult> {
	const { householdId, householdName, keys } =
		await resolveHouseholdKeys(displayName);

	const empty: ReciprocitySide = { entries: [], total: 0, mostRecent: null };
	if (!keys.length) {
		return {
			query: displayName,
			householdId: null,
			householdName: null,
			keys: [],
			spellings: [],
			receivedFromThem: empty,
			gaveToThem: empty,
		};
	}

	const db = await getDb();
	const placeholders = keys.map(() => "?").join(",");

	const rows = await db.getAllAsync<Omit<ReciprocityEntry, "year">>(
		`${SELECT_ENTRY}
		  WHERE g.name_key IN (${placeholders})
		  ORDER BY g.gift_date DESC, g.created_at DESC`,
		keys,
	);

	const entries = rows.map(toEntry);

	// HOSTED = our function, so the moi came to us.
	// ATTENDED = their function, so the moi went out from us.
	const received = entries.filter((e) => e.direction === "HOSTED");
	const gave = entries.filter((e) => e.direction === "ATTENDED");

	const spellings = Array.from(
		new Set(entries.map((e) => e.recipient_name)),
	).sort((a, b) => a.localeCompare(b));

	return {
		query: displayName,
		householdId,
		householdName,
		keys,
		spellings,
		receivedFromThem: summarise(received),
		gaveToThem: summarise(gave),
	};
}
