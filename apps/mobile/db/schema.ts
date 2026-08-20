/**
 * SQLite schema + migrations for local Moi storage.
 *
 * Migration pattern: each bump appends a block. We track current version in
 * the `user_version` pragma and only run the delta. A migration is either a
 * SQL string or a function, for steps that need JavaScript (see v2, which
 * backfills normalised name keys — Tamil transliteration can't be done in
 * SQL). Each migration runs inside a transaction, so a failure part-way
 * leaves `user_version` untouched and the whole step retries on next launch.
 */

import type * as SQLite from "expo-sqlite";
import { normaliseName } from "./names";

export const SCHEMA_VERSION = 3;

export type Migration =
	| string
	| ((db: SQLite.SQLiteDatabase) => Promise<void>);

const V2_SQL = `
    -- Direction: HOSTED = we received moi at our function.
    --            ATTENDED = we gave moi at someone else's function.
    -- Existing rows take the DEFAULT, which is exactly the "migrate all
    -- existing functions to HOSTED" step.
    ALTER TABLE events ADD COLUMN direction TEXT NOT NULL DEFAULT 'HOSTED';

    -- ATTENDED only: whose function it was. Occasion / date / place reuse the
    -- existing event_type / event_date / location columns.
    ALTER TABLE events ADD COLUMN host_family_name TEXT;

    -- ATTENDED only: which family member handed the moi over.
    ALTER TABLE gifts ADD COLUMN given_by TEXT;

    -- Normalised match key. Backfilled by the JS half of this migration.
    ALTER TABLE gifts ADD COLUMN name_key TEXT NOT NULL DEFAULT '';

    -- Optional grouping of several recorded names into one family. This is a
    -- layer on top: gift rows are never rewritten and nothing auto-merges.
    CREATE TABLE IF NOT EXISTS households (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
    );

    CREATE TABLE IF NOT EXISTS household_members (
      household_id  TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      name_key      TEXT NOT NULL,
      display_name  TEXT NOT NULL,
      created_at    INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000),
      PRIMARY KEY (household_id, name_key)
    );

    -- Manual spelling merge: name_key -> the key the user chose to keep.
    -- Reversible by deleting the row.
    CREATE TABLE IF NOT EXISTS name_aliases (
      name_key      TEXT PRIMARY KEY,
      canonical_key TEXT NOT NULL,
      created_at    INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_gifts_name_key      ON gifts(name_key);
    CREATE INDEX IF NOT EXISTS idx_gifts_event_namekey ON gifts(event_id, name_key);
    CREATE INDEX IF NOT EXISTS idx_gifts_name_recent   ON gifts(recipient_name, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_direction    ON events(direction);
    CREATE INDEX IF NOT EXISTS idx_hm_name_key         ON household_members(name_key);
    CREATE INDEX IF NOT EXISTS idx_aliases_canonical   ON name_aliases(canonical_key);
`;

/**
 * Backfill `gifts.name_key` for rows that predate the column.
 *
 * Only touches rows still holding the '' default, so a retry after a partial
 * run is safe and re-running is a no-op.
 */
async function backfillNameKeys(db: SQLite.SQLiteDatabase): Promise<void> {
	const rows = await db.getAllAsync<{ id: string; recipient_name: string }>(
		"SELECT id, recipient_name FROM gifts WHERE name_key = ''",
	);
	for (const row of rows) {
		await db.runAsync("UPDATE gifts SET name_key = ? WHERE id = ?", [
			normaliseName(row.recipient_name),
			row.id,
		]);
	}
}

const V3_SQL = `
    -- Photos of physical notebook pages, one or more per function. Only the
    -- path lives here; the file sits in documentDirectory/notebook/.
    CREATE TABLE IF NOT EXISTS notebook_pages (
      id          TEXT PRIMARY KEY,
      event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      file_uri    TEXT NOT NULL,
      page_index  INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
    );

    -- Which page an entry was transcribed from, so the original stays
    -- verifiable. SET NULL rather than CASCADE: losing the photo must not
    -- silently delete the recorded moi.
    ALTER TABLE gifts ADD COLUMN page_id TEXT REFERENCES notebook_pages(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_pages_event ON notebook_pages(event_id);
    CREATE INDEX IF NOT EXISTS idx_gifts_page  ON gifts(page_id);
`;

export const MIGRATIONS: Record<number, Migration> = {
	1: `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS events (
      id            TEXT PRIMARY KEY,
      event_name    TEXT NOT NULL,
      event_type    TEXT NOT NULL DEFAULT 'wedding',
      event_date    TEXT,
      location      TEXT,
      description   TEXT,
      cover_uri     TEXT,
      budget        REAL,
      created_at    INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
    );

    CREATE TABLE IF NOT EXISTS gifts (
      id              TEXT PRIMARY KEY,
      event_id        TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      recipient_name  TEXT NOT NULL,
      partner_name    TEXT,
      amount          REAL NOT NULL,
      payment_method  TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash','UPI')),
      note            TEXT,
      gift_date       INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000),
      created_at      INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_gifts_event ON gifts(event_id);
    CREATE INDEX IF NOT EXISTS idx_gifts_date  ON gifts(gift_date DESC);
  `,

	2: async (db) => {
		await db.execAsync(V2_SQL);
		await backfillNameKeys(db);
	},

	3: V3_SQL,
};
