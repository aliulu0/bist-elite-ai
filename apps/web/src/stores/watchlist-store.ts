import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: string;
  updatedAt: string;
}

interface WatchlistState {
  watchlists: Watchlist[];
  activeWatchlistId: string | null;
  addWatchlist: (name: string) => void;
  removeWatchlist: (id: string) => void;
  renameWatchlist: (id: string, name: string) => void;
  addSymbolToWatchlist: (watchlistId: string, symbol: string) => void;
  removeSymbolFromWatchlist: (watchlistId: string, symbol: string) => void;
  setActiveWatchlist: (id: string | null) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      watchlists: [],
      activeWatchlistId: null,
      addWatchlist: (name) =>
        set((s) => ({
          watchlists: [
            ...s.watchlists,
            {
              id: crypto.randomUUID(),
              name,
              symbols: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      removeWatchlist: (id) =>
        set((s) => ({
          watchlists: s.watchlists.filter((w) => w.id !== id),
        })),
      renameWatchlist: (id, name) =>
        set((s) => ({
          watchlists: s.watchlists.map((w) =>
            w.id === id ? { ...w, name, updatedAt: new Date().toISOString() } : w,
          ),
        })),
      addSymbolToWatchlist: (watchlistId, symbol) =>
        set((s) => ({
          watchlists: s.watchlists.map((w) =>
            w.id === watchlistId && !w.symbols.includes(symbol)
              ? { ...w, symbols: [...w.symbols, symbol], updatedAt: new Date().toISOString() }
              : w,
          ),
        })),
      removeSymbolFromWatchlist: (watchlistId, symbol) =>
        set((s) => ({
          watchlists: s.watchlists.map((w) =>
            w.id === watchlistId
              ? { ...w, symbols: w.symbols.filter((sym) => sym !== symbol), updatedAt: new Date().toISOString() }
              : w,
          ),
        })),
      setActiveWatchlist: (id) => set({ activeWatchlistId: id }),
    }),
    {
      name: 'bist-elite-watchlists',
    },
  ),
);
