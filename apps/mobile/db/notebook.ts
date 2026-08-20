import { getDb, generateId } from "./index";
import {
	saveNotebookPage,
	deleteNotebookPageFile,
	sweepOrphanedMedia,
} from "./media";

export interface NotebookPageRow {
	id: string;
	event_id: string;
	file_uri: string;
	page_index: number;
	created_at: number;
}

export interface NotebookPageWithCount extends NotebookPageRow {
	entry_count: number;
}

/** Pages attached to a function, in the order the user added them. */
export async function listPages(
	eventId: string,
): Promise<NotebookPageWithCount[]> {
	const db = await getDb();
	return db.getAllAsync<NotebookPageWithCount>(
		`SELECT p.*, COUNT(g.id) AS entry_count
		   FROM notebook_pages p
		   LEFT JOIN gifts g ON g.page_id = p.id
		  WHERE p.event_id = ?
		  GROUP BY p.id
		  ORDER BY p.page_index, p.created_at`,
		[eventId],
	);
}

export async function getPage(id: string): Promise<NotebookPageRow | null> {
	const db = await getDb();
	return db.getFirstAsync<NotebookPageRow>(
		"SELECT * FROM notebook_pages WHERE id = ?",
		[id],
	);
}

/**
 * Copy a picked photo into app storage and record it against the function.
 *
 * The file is copied first: a row pointing at a file that was never written
 * would render as a permanently broken page, whereas a file with no row is
 * just an orphan the startup sweep collects.
 */
export async function addPage(
	eventId: string,
	pickedUri: string,
): Promise<NotebookPageRow> {
	const db = await getDb();
	const fileUri = await saveNotebookPage(pickedUri);
	const id = generateId();

	const next = await db.getFirstAsync<{ next_index: number }>(
		"SELECT COALESCE(MAX(page_index) + 1, 0) AS next_index FROM notebook_pages WHERE event_id = ?",
		[eventId],
	);

	try {
		await db.runAsync(
			"INSERT INTO notebook_pages (id, event_id, file_uri, page_index) VALUES (?, ?, ?, ?)",
			[id, eventId, fileUri, next?.next_index ?? 0],
		);
	} catch (e) {
		// Don't leave the copied file behind if the row never landed.
		await deleteNotebookPageFile(fileUri);
		throw e;
	}

	const row = await db.getFirstAsync<NotebookPageRow>(
		"SELECT * FROM notebook_pages WHERE id = ?",
		[id],
	);
	if (!row) throw new Error("notebook page insert failed");
	return row;
}

/**
 * Remove a page and its file.
 *
 * Entries transcribed from it keep their moi record — gifts.page_id is
 * ON DELETE SET NULL, so losing the photo never deletes the data.
 */
export async function deletePage(id: string): Promise<void> {
	const db = await getDb();
	const row = await getPage(id);
	await db.runAsync("DELETE FROM notebook_pages WHERE id = ?", [id]);
	if (row) await deleteNotebookPageFile(row.file_uri);
}

/** Every page file belonging to a function, for cleanup before the row goes. */
export async function pageUrisForEvent(eventId: string): Promise<string[]> {
	const db = await getDb();
	const rows = await db.getAllAsync<{ file_uri: string }>(
		"SELECT file_uri FROM notebook_pages WHERE event_id = ?",
		[eventId],
	);
	return rows.map((r) => r.file_uri);
}

/**
 * Delete on-disk media that no row references.
 *
 * Runs once at startup. Reads both the covers and the notebook pages tables
 * so a file is only removed when nothing at all points at it.
 */
export async function cleanupOrphanedMedia(): Promise<number> {
	try {
		const db = await getDb();
		const covers = await db.getAllAsync<{ cover_uri: string | null }>(
			"SELECT cover_uri FROM events WHERE cover_uri IS NOT NULL",
		);
		const pages = await db.getAllAsync<{ file_uri: string }>(
			"SELECT file_uri FROM notebook_pages",
		);
		const referenced = [
			...covers.map((c) => c.cover_uri).filter((u): u is string => !!u),
			...pages.map((p) => p.file_uri),
		];
		return await sweepOrphanedMedia(referenced);
	} catch (e) {
		console.warn("orphan cleanup skipped", e);
		return 0;
	}
}
