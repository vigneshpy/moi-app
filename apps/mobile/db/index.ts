import * as SQLite from "expo-sqlite";
import { MIGRATIONS, SCHEMA_VERSION } from "./schema";

const DB_NAME = "moi.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Open (or return cached) handle, running any pending migrations. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = (async () => {
			const db = await SQLite.openDatabaseAsync(DB_NAME);
			await db.execAsync("PRAGMA foreign_keys = ON;");

			const row = (await db.getFirstAsync<{ user_version: number }>(
				"PRAGMA user_version",
			)) ?? { user_version: 0 };
			const current = row.user_version;

			for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
				const sql = MIGRATIONS[v];
				if (!sql) continue;
				await db.execAsync(sql);
				// user_version can't be parameterized — it takes a literal integer
				await db.execAsync(`PRAGMA user_version = ${v}`);
			}
			return db;
		})();
	}
	return dbPromise;
}

/** Generate a short, sortable-ish id for local rows. */
export function generateId(): string {
	return (
		Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
	);
}
