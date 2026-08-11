import { create } from 'zustand';

export interface EventItem {
  id: string;
  type: string;
  category: string;
  timestamp: string;
  data: string;
}

export interface EventsState {
  events: EventItem[];
  search: string;
  loading: boolean;
  error: string;

  setEvents: (events: EventItem[]) => void;
  addEvent: (event: EventItem) => void;
  setSearch: (search: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  search: '',
  loading: false,
  error: '',

  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 500) })),
  setSearch: (search) => set({ search }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
