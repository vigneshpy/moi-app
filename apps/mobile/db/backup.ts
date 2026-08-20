import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { getDb, generateId } from "./index";
import { SCHEMA_VERSION } from "./schema";
import { normaliseName } from "./names";
import type { EventRow } from "./events";
import type { GiftRow } from "./gifts";
import type { HouseholdRow, HouseholdMemberRow, NameAliasRow } from "./households";
import type { NotebookPageRow } from "./notebook";

/**
 * Local backup: one JSON file, shared through the OS share sheet.
 *
 * No encryption, no server, no account — the same offline promise as the rest
 * of the app. That also means the file is readable by anything the user
 * shares it with, which the UI says plainly.
 *
 * Photo files are NOT bundled. Notebook page rows travel as references only,
 * so the file stays small enough to share reliably; a restore onto a new
 * device keeps every entry but shows those pages as missing.
 */

/** Bumped only when the backup envelope itself changes shape. */
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupFile {
	format: "moi-backup";
	formatVersion: number;
	/** Database schema the export was taken from. */
	schemaVersion: number;
	exportedAt: string;
	photosIncluded: false;
	events: EventRow[];
	gifts: GiftRow[];
	households: HouseholdRow[];
	householdMembers: HouseholdMemberRow[];
	nameAliases: NameAliasRow[];
	notebookPages: NotebookPageRow[];
}

export interface BackupSummary {
	eventCount: number;
	giftCount: number;
	householdCount: number;
	pageCount: number;
	/** ISO dates of the oldest and newest entry, or null when there are none. */
	earliest: string | null;
	latest: string | null;
	schemaVersion: number;
	exportedAt: string | null;
}

export type BackupErrorCode =
	| "MALFORMED"
	| "UNSUPPORTED_VERSION"
	| "EMPTY"
	| "WRITE_FAILED";

/** Carries a translation key so both languages get the same specific message. */
export class BackupError extends Error {
	code: BackupErrorCode;
	constructor(code: BackupErrorCode, message?: string) {
		super(message ?? code);
		this.name = "BackupError";
		this.code = code;
	}
	/** i18n key under `backup.errors`. */
	get i18nKey(): string {
		return `backup.errors.${this.code}`;
	}
}

/* ------------------------------------------------------------------ *
 * Export
 * ------------------------------------------------------------------ */

export async function buildBackup(): Promise<BackupFile> {
	const db = await getDb();
	const [events, gifts, households, householdMembers, nameAliases, notebookPages] =
		await Promise.all([
			db.getAllAsync<EventRow>("SELECT * FROM events"),
			db.getAllAsync<GiftRow>("SELECT * FROM gifts"),
			db.getAllAsync<HouseholdRow>("SELECT * FROM households"),
			db.getAllAsync<HouseholdMemberRow>("SELECT * FROM household_members"),
			db.getAllAsync<NameAliasRow>("SELECT * FROM name_aliases"),
			db.getAllAsync<NotebookPageRow>("SELECT * FROM notebook_pages"),
		]);

	return {
		format: "moi-backup",
		formatVersion: BACKUP_FORMAT_VERSION,
		schemaVersion: SCHEMA_VERSION,
		exportedAt: new Date().toISOString(),
		photosIncluded: false,
		events,
		gifts,
		households,
		householdMembers,
		nameAliases,
		notebookPages,
	};
}

/** Write the backup to a cache file and hand it to the OS share sheet. */
export async function exportBackup(): Promise<void> {
	const backup = await buildBackup();
	const stamp = new Date().toISOString().slice(0, 10);
	const path = `${FileSystem.cacheDirectory}moi-backup-${stamp}.json`;

	await FileSystem.writeAsStringAsync(path, JSON.stringify(backup), {
		encoding: FileSystem.EncodingType.UTF8,
	});
	await Sharing.shareAsync(path, {
		mimeType: "application/json",
		UTI: "public.json",
		dialogTitle: `Moi backup — ${stamp}`,
	});
}

/* ------------------------------------------------------------------ *
 * Import
 * ------------------------------------------------------------------ */

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireArray(v: unknown, field: string): unknown[] {
	if (v === undefined || v === null) return [];
	if (!Array.isArray(v)) {
		throw new BackupError("MALFORMED", `${field} is not an array`);
	}
	return v;
}

/**
 * Parse and validate a backup file without writing anything.
 *
 * Always call this first and show the user what the file holds — an import
 * can replace everything they have, so it must never be a blind action.
 */
export function parseBackup(raw: string): BackupFile {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new BackupError("MALFORMED", "not valid JSON");
	}

	if (!isRecord(parsed)) {
		throw new BackupError("MALFORMED", "root is not an object");
	}
	if (parsed.format !== "moi-backup") {
		throw new BackupError("MALFORMED", "not a Moi backup file");
	}

	const schemaVersion = Number(parsed.schemaVersion);
	if (!Number.isFinite(schemaVersion)) {
		throw new BackupError("MALFORMED", "missing schemaVersion");
	}
	// A file from a newer build may use columns this version doesn't have.
	// Older files are fine: the migrations that follow bring them forward.
	if (schemaVersion > SCHEMA_VERSION) {
		throw new BackupError(
			"UNSUPPORTED_VERSION",
			`file schema v${schemaVersion} > app schema v${SCHEMA_VERSION}`,
		);
	}

	const events = requireArray(parsed.events, "events") as EventRow[];
	const gifts = requireArray(parsed.gifts, "gifts") as GiftRow[];

	if (events.length === 0 && gifts.length === 0) {
		throw new BackupError("EMPTY", "no functions or entries in file");
	}
	for (const e of events) {
		if (!isRecord(e) || typeof e.id !== "string" || typeof e.event_name !== "string") {
			throw new BackupError("MALFORMED", "an event row is missing id or name");
		}
	}
	for (const g of gifts) {
		if (
			!isRecord(g) ||
			typeof g.id !== "string" ||
			typeof g.event_id !== "string" ||
			typeof g.recipient_name !== "string" ||
			typeof g.amount !== "number"
		) {
			throw new BackupError("MALFORMED", "an entry row is missing required fields");
		}
	}

	return {
		format: "moi-backup",
		formatVersion: Number(parsed.formatVersion) || 1,
		schemaVersion,
		exportedAt:
			typeof parsed.exportedAt === "string" ? parsed.exportedAt : "",
		photosIncluded: false,
		events,
		gifts,
		households: requireArray(parsed.households, "households") as HouseholdRow[],
		householdMembers: requireArray(
			parsed.householdMembers,
			"householdMembers",
		) as HouseholdMemberRow[],
		nameAliases: requireArray(parsed.nameAliases, "nameAliases") as NameAliasRow[],
		notebookPages: requireArray(
			parsed.notebookPages,
			"notebookPages",
		) as NotebookPageRow[],
	};
}

/** What the file holds, for the confirmation step. */
export function summarise(backup: BackupFile): BackupSummary {
	const dates = backup.gifts
		.map((g) => Number(g.gift_date))
		.filter((n) => Number.isFinite(n) && n > 0)
		.sort((a, b) => a - b);

	return {
		eventCount: backup.events.length,
		giftCount: backup.gifts.length,
		householdCount: backup.households.length,
		pageCount: backup.notebookPages.length,
		earliest: dates.length ? new Date(dates[0]).toISOString() : null,
		latest: dates.length
			? new Date(dates[dates.length - 1]).toISOString()
			: null,
		schemaVersion: backup.schemaVersion,
		exportedAt: backup.exportedAt || null,
	};
}

export type ImportMode = "replace" | "merge";

export interface ImportResult {
	mode: ImportMode;
	eventsAdded: number;
	giftsAdded: number;
	giftsSkipped: number;
}

/**
 * Write a validated backup into the database.
 *
 * `replace` clears everything first. `merge` keeps what's there and skips any
 * entry that already exists, matched on function, name and amount.
 *
 * The whole thing runs in one transaction: a failure part-way leaves the
 * user's existing data exactly as it was rather than half-overwritten.
 */
export async function importBackup(
	backup: BackupFile,
	mode: ImportMode,
): Promise<ImportResult> {
	const db = await getDb();
	const result: ImportResult = {
		mode,
		eventsAdded: 0,
		giftsAdded: 0,
		giftsSkipped: 0,
	};

	try {
		await db.withTransactionAsync(async () => {
			if (mode === "replace") {
				// gifts and notebook_pages cascade from events; households and
				// aliases are independent, so clear them explicitly.
				await db.execAsync(`
					DELETE FROM events;
					DELETE FROM household_members;
					DELETE FROM households;
					DELETE FROM name_aliases;
				`);
			}

			// Map incoming event ids to the ids actually used, so gift rows stay
			// attached to the right function even when an id was remapped.
			const eventIdMap = new Map<string, string>();

			for (const e of backup.events) {
				const existing =
					mode === "merge"
						? await db.getFirstAsync<{ id: string }>(
								"SELECT id FROM events WHERE id = ?",
								[e.id],
						  )
						: null;

				if (existing) {
					eventIdMap.set(e.id, existing.id);
					continue;
				}

				eventIdMap.set(e.id, e.id);
				await db.runAsync(
					`INSERT INTO events
						(id, event_name, event_type, event_date, location, description,
						 cover_uri, budget, direction, host_family_name, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[
						e.id,
						e.event_name,
						e.event_type ?? "wedding",
						e.event_date ?? null,
						e.location ?? null,
						e.description ?? null,
						e.cover_uri ?? null,
						e.budget ?? null,
						e.direction === "ATTENDED" ? "ATTENDED" : "HOSTED",
						e.host_family_name ?? null,
						Number(e.created_at) || Date.now(),
					],
				);
				result.eventsAdded++;
			}

			// Notebook pages go in before the entries that point at them, so
			// gifts.page_id resolves against a row that already exists. The image
			// files are not in the backup — these are references only, and the UI
			// shows a page whose file is gone as missing rather than failing.
			const restoredPageIds = new Set<string>();
			for (const p of backup.notebookPages) {
				const eventId = eventIdMap.get(p.event_id) ?? p.event_id;
				const parent = await db.getFirstAsync<{ id: string }>(
					"SELECT id FROM events WHERE id = ?",
					[eventId],
				);
				if (!parent) continue;
				await db.runAsync(
					`INSERT OR IGNORE INTO notebook_pages
						(id, event_id, file_uri, page_index, created_at)
					 VALUES (?, ?, ?, ?, ?)`,
					[
						p.id,
						eventId,
						p.file_uri,
						Number(p.page_index) || 0,
						Number(p.created_at) || Date.now(),
					],
				);
				restoredPageIds.add(p.id);
			}

			for (const g of backup.gifts) {
				const eventId = eventIdMap.get(g.event_id) ?? g.event_id;

				// The function must exist, or the FK insert fails and takes the
				// whole restore down with it.
				const parent = await db.getFirstAsync<{ id: string }>(
					"SELECT id FROM events WHERE id = ?",
					[eventId],
				);
				if (!parent) {
					result.giftsSkipped++;
					continue;
				}

				if (mode === "merge") {
					// Duplicate check on what the user would call the same entry:
					// same function, same person, same amount.
					const dup = await db.getFirstAsync<{ id: string }>(
						`SELECT id FROM gifts
						  WHERE event_id = ?
						    AND recipient_name = ? COLLATE NOCASE
						    AND amount = ?
						  LIMIT 1`,
						[eventId, g.recipient_name, g.amount],
					);
					if (dup) {
						result.giftsSkipped++;
						continue;
					}
				}

				await db.runAsync(
					`INSERT OR REPLACE INTO gifts
						(id, event_id, recipient_name, partner_name, amount, payment_method,
						 note, given_by, name_key, page_id, gift_date, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[
						// A merge into a database that already holds this id would
						// otherwise overwrite an unrelated row.
						mode === "merge" ? generateId() : g.id,
						eventId,
						g.recipient_name,
						g.partner_name ?? null,
						g.amount,
						g.payment_method === "UPI" ? "UPI" : "Cash",
						g.note ?? null,
						g.given_by ?? null,
						// Recompute rather than trust the file: normalisation rules can
						// change between versions.
						normaliseName(g.recipient_name),
						g.page_id && restoredPageIds.has(g.page_id) ? g.page_id : null,
						Number(g.gift_date) || Date.now(),
						Number(g.created_at) || Date.now(),
					],
				);
				result.giftsAdded++;
			}

			for (const h of backup.households) {
				await db.runAsync(
					"INSERT OR IGNORE INTO households (id, name, created_at) VALUES (?, ?, ?)",
					[h.id, h.name, Number(h.created_at) || Date.now()],
				);
			}
			for (const m of backup.householdMembers) {
				await db.runAsync(
					`INSERT OR IGNORE INTO household_members
						(household_id, name_key, display_name, created_at)
					 VALUES (?, ?, ?, ?)`,
					[
						m.household_id,
						m.name_key,
						m.display_name,
						Number(m.created_at) || Date.now(),
					],
				);
			}
			for (const a of backup.nameAliases) {
				await db.runAsync(
					`INSERT OR IGNORE INTO name_aliases (name_key, canonical_key, created_at)
					 VALUES (?, ?, ?)`,
					[a.name_key, a.canonical_key, Number(a.created_at) || Date.now()],
				);
			}
		});
	} catch (e) {
		if (e instanceof BackupError) throw e;
		console.error("import failed", e);
		throw new BackupError("WRITE_FAILED", (e as Error)?.message);
	}

	return result;
}
