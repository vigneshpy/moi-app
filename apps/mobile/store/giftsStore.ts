import { create } from "zustand";
import {
	listGiftsForEvent,
	createGift,
	updateGift,
	deleteGift,
	type GiftInput,
	type GiftRow,
} from "@/db/gifts";
import { useEventsStore } from "./eventsStore";

interface GiftsState {
	byEvent: Record<string, GiftRow[]>;
	loadingEvent: string | null;
	error: string | null;

	loadFor: (eventId: string) => Promise<void>;
	add: (input: GiftInput) => Promise<GiftRow>;
	update: (
		id: string,
		eventId: string,
		patch: Partial<Omit<GiftInput, "event_id">>,
	) => Promise<GiftRow>;
	remove: (id: string, eventId: string) => Promise<void>;
}

export const useGiftsStore = create<GiftsState>((set, get) => ({
	byEvent: {},
	loadingEvent: null,
	error: null,

	loadFor: async (eventId) => {
		set({ loadingEvent: eventId, error: null });
		try {
			const rows = await listGiftsForEvent(eventId);
			set((s) => ({
				byEvent: { ...s.byEvent, [eventId]: rows },
				loadingEvent: null,
			}));
		} catch (e: unknown) {
			set({ error: (e as Error).message, loadingEvent: null });
		}
	},

	add: async (input) => {
		const row = await createGift(input);
		set((s) => ({
			byEvent: {
				...s.byEvent,
				[input.event_id]: [row, ...(s.byEvent[input.event_id] ?? [])],
			},
		}));
		// Refresh the parent event's totals so Events list & header stay current.
		await useEventsStore.getState().reload(input.event_id);
		return row;
	},

	update: async (id, eventId, patch) => {
		const row = await updateGift(id, patch);
		set((s) => ({
			byEvent: {
				...s.byEvent,
				[eventId]: (s.byEvent[eventId] ?? []).map((g) =>
					g.id === id ? row : g,
				),
			},
		}));
		// Amount may have changed → refresh the event's running totals.
		await useEventsStore.getState().reload(eventId);
		return row;
	},

	remove: async (id, eventId) => {
		await deleteGift(id);
		set((s) => ({
			byEvent: {
				...s.byEvent,
				[eventId]: (s.byEvent[eventId] ?? []).filter((g) => g.id !== id),
			},
		}));
		await useEventsStore.getState().reload(eventId);
	},
}));
