import * as FileSystem from "expo-file-system";
import { generateId } from "./index";

const COVERS_DIR = FileSystem.documentDirectory + "covers/";
const NOTEBOOK_DIR = FileSystem.documentDirectory + "notebook/";

async function ensureDir(dir: string): Promise<void> {
	const info = await FileSystem.getInfoAsync(dir);
	if (!info.exists) {
		await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
	}
}

function extensionOf(uri: string): string {
	return uri.match(/\.([a-z0-9]{3,4})(\?|$)/i)?.[1]?.toLowerCase() || "jpg";
}

/**
 * Copy a picked-image URI (content:// or file://) into the app's private
 * documents/covers folder and return the stable local file:// URI.
 *
 * Image-picker URIs can be invalidated once the user leaves the picker —
 * persisting means re-opening the event later still renders the cover.
 */
export async function saveCover(pickedUri: string): Promise<string> {
	await ensureDir(COVERS_DIR);
	const dest = `${COVERS_DIR}${generateId()}.${extensionOf(pickedUri)}`;
	await FileSystem.copyAsync({ from: pickedUri, to: dest });
	return dest;
}

export async function deleteCover(uri: string | null | undefined): Promise<void> {
	if (!uri || !uri.startsWith(COVERS_DIR)) return;
	try {
		await FileSystem.deleteAsync(uri, { idempotent: true });
	} catch {
		// non-fatal
	}
}

/**
 * Copy a photo of a notebook page into documents/notebook/.
 *
 * Only the returned path goes into SQLite; the bytes stay on disk. Everything
 * that removes a page row must also call deleteNotebookPageFile, since the
 * FK cascade only reaches the database.
 */
export async function saveNotebookPage(pickedUri: string): Promise<string> {
	await ensureDir(NOTEBOOK_DIR);
	const dest = `${NOTEBOOK_DIR}${generateId()}.${extensionOf(pickedUri)}`;
	await FileSystem.copyAsync({ from: pickedUri, to: dest });
	return dest;
}

export async function deleteNotebookPageFile(
	uri: string | null | undefined,
): Promise<void> {
	if (!uri || !uri.startsWith(NOTEBOOK_DIR)) return;
	try {
		await FileSystem.deleteAsync(uri, { idempotent: true });
	} catch {
		// non-fatal
	}
}

/** True when the file behind a stored path is still present. */
export async function mediaExists(uri: string | null | undefined): Promise<boolean> {
	if (!uri) return false;
	try {
		const info = await FileSystem.getInfoAsync(uri);
		return info.exists;
	} catch {
		return false;
	}
}

/**
 * Delete media files no row points at any more.
 *
 * A cascade delete, a crash between the file copy and the row insert, or a
 * restore from a backup that carries only references can all leave files
 * behind. Called once at startup; failures are swallowed because an orphaned
 * file is never worth blocking the app over.
 */
export async function sweepOrphanedMedia(
	referenced: Iterable<string>,
): Promise<number> {
	const keep = new Set(referenced);
	let removed = 0;

	for (const dir of [COVERS_DIR, NOTEBOOK_DIR]) {
		try {
			const info = await FileSystem.getInfoAsync(dir);
			if (!info.exists) continue;
			const names = await FileSystem.readDirectoryAsync(dir);
			for (const name of names) {
				const uri = `${dir}${name}`;
				if (keep.has(uri)) continue;
				await FileSystem.deleteAsync(uri, { idempotent: true });
				removed++;
			}
		} catch (e) {
			console.warn("media sweep failed for", dir, e);
		}
	}
	return removed;
}
