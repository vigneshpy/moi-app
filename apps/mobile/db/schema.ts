/**
 * SQLite schema + migrations for local Moi storage.
 *
 * Migration pattern: each bump appends a block. We track current version in
 * the `user_version` pragma and only run the delta.
 */

export const SCHEMA_VERSION = 1;

export const MIGRATIONS: Record<number, string> = {
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
};
