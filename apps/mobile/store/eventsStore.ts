import { create } from "zustand";
import {
	listEvents,
	createEvent,
	deleteEvent,
	getEvent,
	type EventInput,
	type EventWithTotals,
} from "@/db/events";
import { deleteCover, deleteNotebookPageFile } from "@/db/media";
import { pageUrisForEvent } from "@/db/notebook";

interface EventsState {
	events: EventWithTotals[];
	loading: boolean;
	error: string | null;

	refresh: () => Promise<void>;
	add: (input: EventInput) => Promise<EventWithTotals>;
	remove: (id: string) => Promise<void>;
	reload: (id: string) => Promise<void>; // re-fetch totals for one event
}

export const useEventsStore = create<EventsState>((set, get) => ({
	events: [],
	loading: false,
	error: null,

	refresh: async () => {
		set({ loading: true, error: null });
		try {
			const rows = await listEvents();
			set({ events: rows, loading: false });
		} catch (e: unknown) {
			set({ error: (e as Error).message, loading: false });
		}
	},

	add: async (input) => {
		// Use the id createEvent returns rather than looking the row back up by
		// name — two functions can legitimately share a name.
		const created = await createEvent(input);
		await get().refresh();
		const fresh = get().events.find((e) => e.id === created.id);
		return fresh ?? { ...created, total_collected: 0, entry_count: 0 };
	},

	remove: async (id) => {
		const existing = get().events.find((e) => e.id === id);
		// Collect the page files before the rows go: the FK cascade clears
		// notebook_pages but cannot touch the files on disk.
		const pageUris = await pageUrisForEvent(id);

		await deleteEvent(id);

		if (existing?.cover_uri) await deleteCover(existing.cover_uri);
		for (const uri of pageUris) await deleteNotebookPageFile(uri);

		set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
	},

	reload: async (id) => {
		const fresh = await getEvent(id);
		if (!fresh) return;
		set((s) => ({
			events: s.events.map((e) => (e.id === id ? fresh : e)),
		}));
	},
}));
