import * as FileSystem from "expo-file-system";
import { generateId } from "./index";

const COVERS_DIR = FileSystem.documentDirectory + "covers/";

async function ensureDir(): Promise<void> {
	const info = await FileSystem.getInfoAsync(COVERS_DIR);
	if (!info.exists) {
		await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });
	}
}

/**
 * Copy a picked-image URI (content:// or file://) into the app's private
 * documents/covers folder and return the stable local file:// URI.
 *
 * Image-picker URIs can be invalidated once the user leaves the picker —
 * persisting means re-opening the event later still renders the cover.
 */
export async function saveCover(pickedUri: string): Promise<string> {
	await ensureDir();
	const ext =
		pickedUri.match(/\.([a-z0-9]{3,4})(\?|$)/i)?.[1]?.toLowerCase() || "jpg";
	const dest = `${COVERS_DIR}${generateId()}.${ext}`;
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
