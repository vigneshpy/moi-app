import { getDb, generateId } from "./index";
import { normaliseName } from "./names";

export interface HouseholdRow {
	id: string;
	name: string;
	created_at: number;
}

export interface HouseholdMemberRow {
	household_id: string;
	name_key: string;
	display_name: string;
	created_at: number;
}

export interface HouseholdWithMembers extends HouseholdRow {
	members: HouseholdMemberRow[];
}

/**
 * Households group several recorded names into one family.
 *
 * This is strictly a layer on top: gift rows keep pointing at the individual
 * name they were recorded under, and nothing is ever merged automatically.
 * The user links names by hand, and can unlink them again.
 */
export async function listHouseholds(): Promise<HouseholdWithMembers[]> {
	const db = await getDb();
	const households = await db.getAllAsync<HouseholdRow>(
		"SELECT * FROM households ORDER BY name COLLATE NOCASE",
	);
	const members = await db.getAllAsync<HouseholdMemberRow>(
		"SELECT * FROM household_members",
	);
	return households.map((h) => ({
		...h,
		members: members.filter((m) => m.household_id === h.id),
	}));
}

export async function createHousehold(
	name: string,
	memberNames: string[] = [],
): Promise<HouseholdRow> {
	const db = await getDb();
	const id = generateId();
	await db.runAsync("INSERT INTO households (id, name) VALUES (?, ?)", [
		id,
		name.trim(),
	]);
	for (const member of memberNames) {
		await addHouseholdMember(id, member);
	}
	const row = await db.getFirstAsync<HouseholdRow>(
		"SELECT * FROM households WHERE id = ?",
		[id],
	);
	if (!row) throw new Error("household insert failed");
	return row;
}

export async function renameHousehold(id: string, name: string): Promise<void> {
	const db = await getDb();
	await db.runAsync("UPDATE households SET name = ? WHERE id = ?", [
		name.trim(),
		id,
	]);
}

export async function addHouseholdMember(
	householdId: string,
	displayName: string,
): Promise<void> {
	const key = normaliseName(displayName);
	if (!key) return;
	const db = await getDb();
	// A name belongs to at most one household; re-adding moves it.
	await db.runAsync("DELETE FROM household_members WHERE name_key = ?", [key]);
	await db.runAsync(
		`INSERT INTO household_members (household_id, name_key, display_name)
		 VALUES (?, ?, ?)`,
		[householdId, key, displayName.trim()],
	);
}

export async function removeHouseholdMember(
	householdId: string,
	nameKey: string,
): Promise<void> {
	const db = await getDb();
	await db.runAsync(
		"DELETE FROM household_members WHERE household_id = ? AND name_key = ?",
		[householdId, nameKey],
	);
}

export async function deleteHousehold(id: string): Promise<void> {
	const db = await getDb();
	// household_members cascades on the FK.
	await db.runAsync("DELETE FROM households WHERE id = ?", [id]);
}

/* ------------------------------------------------------------------ *
 * Manual spelling merge
 * ------------------------------------------------------------------ */

export interface NameAliasRow {
	name_key: string;
	canonical_key: string;
	created_at: number;
}

/**
 * Record that two spellings are the same person.
 *
 * Only ever called from an explicit user action — the normalised key already
 * catches the easy cases, and anything it misses is a judgement call the app
 * must not make on its own.
 */
export async function mergeNames(
	fromDisplayName: string,
	intoDisplayName: string,
): Promise<void> {
	const from = normaliseName(fromDisplayName);
	const into = normaliseName(intoDisplayName);
	if (!from || !into || from === into) return;

	const db = await getDb();
	await db.withTransactionAsync(async () => {
		// Point the losing key at the winner.
		await db.runAsync(
			`INSERT INTO name_aliases (name_key, canonical_key) VALUES (?, ?)
			 ON CONFLICT(name_key) DO UPDATE SET canonical_key = excluded.canonical_key`,
			[from, into],
		);
		// Anything that already pointed at the losing key follows it, so chains
		// stay one level deep and lookups never have to recurse.
		await db.runAsync(
			"UPDATE name_aliases SET canonical_key = ? WHERE canonical_key = ? AND name_key <> ?",
			[into, from, into],
		);
		// If the winner was itself merged away previously, drop that row.
		await db.runAsync("DELETE FROM name_aliases WHERE name_key = ?", [into]);
	});
}

/** Undo a merge. */
export async function unmergeName(nameKey: string): Promise<void> {
	const db = await getDb();
	await db.runAsync("DELETE FROM name_aliases WHERE name_key = ?", [nameKey]);
}

export async function listAliases(): Promise<NameAliasRow[]> {
	const db = await getDb();
	return db.getAllAsync<NameAliasRow>("SELECT * FROM name_aliases");
}

/**
 * Every key that resolves to the same person as `displayName`, including the
 * key itself. Used to widen a reciprocity lookup across merged spellings.
 */
export async function resolveKeys(displayName: string): Promise<string[]> {
	const key = normaliseName(displayName);
	if (!key) return [];
	const db = await getDb();

	const direct = await db.getFirstAsync<{ canonical_key: string }>(
		"SELECT canonical_key FROM name_aliases WHERE name_key = ?",
		[key],
	);
	const canonical = direct?.canonical_key ?? key;

	const merged = await db.getAllAsync<{ name_key: string }>(
		"SELECT name_key FROM name_aliases WHERE canonical_key = ?",
		[canonical],
	);

	return Array.from(new Set([key, canonical, ...merged.map((m) => m.name_key)]));
}

/**
 * Every key belonging to the household that `displayName` is linked to, or
 * just that name's own keys when it isn't in a household.
 */
export async function resolveHouseholdKeys(
	displayName: string,
): Promise<{ householdId: string | null; householdName: string | null; keys: string[] }> {
	const own = await resolveKeys(displayName);
	if (!own.length) return { householdId: null, householdName: null, keys: [] };

	const db = await getDb();
	const placeholders = own.map(() => "?").join(",");
	const membership = await db.getFirstAsync<{
		household_id: string;
		name: string;
	}>(
		`SELECT hm.household_id, h.name
		   FROM household_members hm
		   JOIN households h ON h.id = hm.household_id
		  WHERE hm.name_key IN (${placeholders})
		  LIMIT 1`,
		own,
	);

	if (!membership) {
		return { householdId: null, householdName: null, keys: own };
	}

	const siblings = await db.getAllAsync<{ name_key: string }>(
		"SELECT name_key FROM household_members WHERE household_id = ?",
		[membership.household_id],
	);

	// Each sibling may itself have merged spellings — pull those in too.
	const keys = new Set(own);
	for (const s of siblings) {
		keys.add(s.name_key);
		const aliases = await db.getAllAsync<{ name_key: string }>(
			"SELECT name_key FROM name_aliases WHERE canonical_key = ?",
			[s.name_key],
		);
		for (const a of aliases) keys.add(a.name_key);
	}

	return {
		householdId: membership.household_id,
		householdName: membership.name,
		keys: Array.from(keys),
	};
}
