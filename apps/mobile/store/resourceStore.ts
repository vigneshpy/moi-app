import { create } from "zustand";

type EventStore = {
	events: Event[];
	gifts: Gift[];
	setEvents: (event: Event) => void;
	setGifts: (gift: Gift) => void;
};

export const useResourceStore = create<EventStore>((set) => ({
	events: [],
	gifts: [],
	setEvents: (event) => set((state) => ({ events: [...state.events, event] })),
	setGifts: (gift) => set((state) => ({ gifts: [...state.gifts, gift] })),
}));
