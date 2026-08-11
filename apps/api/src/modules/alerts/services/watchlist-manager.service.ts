import { Injectable, Logger } from '@nestjs/common';
import { WatchlistName } from '../alerts.types';

export interface WatchlistEntry {
  symbol: string;
  addedAt: string;
  notes?: string;
}

@Injectable()
export class WatchlistManager {
  private readonly logger = new Logger(WatchlistManager.name);
  private readonly watchlists: Map<WatchlistName, WatchlistEntry[]> = new Map();

  private static readonly DEFAULT_WATCHLISTS: WatchlistName[] = [
    'FAVORITES',
    'PORTFOLIO',
    'LONG_TERM',
    'SHORT_TERM',
    'GROWTH',
    'DIVIDEND',
  ];

  constructor() {
    for (const name of WatchlistManager.DEFAULT_WATCHLISTS) {
      this.watchlists.set(name, []);
    }
    this.watchlists.set('CUSTOM', []);
  }

  getWatchlistNames(): WatchlistName[] {
    return Array.from(this.watchlists.keys());
  }

  getWatchlist(name: WatchlistName): WatchlistEntry[] {
    return this.watchlists.get(name) ?? [];
  }

  addToWatchlist(name: WatchlistName, symbol: string, notes?: string): boolean {
    if (!this.watchlists.has(name)) {
      this.watchlists.set(name, []);
    }
    const list = this.watchlists.get(name)!;
    if (list.some((e) => e.symbol === symbol)) {
      return false;
    }
    list.push({ symbol, addedAt: new Date().toISOString(), notes });
    this.logger.debug(`Added ${symbol} to ${name}`);
    return true;
  }

  removeFromWatchlist(name: WatchlistName, symbol: string): boolean {
    const list = this.watchlists.get(name);
    if (!list) return false;
    const index = list.findIndex((e) => e.symbol === symbol);
    if (index === -1) return false;
    list.splice(index, 1);
    this.logger.debug(`Removed ${symbol} from ${name}`);
    return true;
  }

  isInWatchlist(symbol: string, names?: WatchlistName[]): boolean {
    const targetNames = names ?? Array.from(this.watchlists.keys());
    for (const name of targetNames) {
      const list = this.watchlists.get(name);
      if (list?.some((e) => e.symbol === symbol)) return true;
    }
    return false;
  }

  getSymbolsInWatchlists(names?: WatchlistName[]): string[] {
    const targetNames = names ?? Array.from(this.watchlists.keys());
    const symbols = new Set<string>();
    for (const name of targetNames) {
      const list = this.watchlists.get(name);
      if (list) {
        for (const entry of list) {
          symbols.add(entry.symbol);
        }
      }
    }
    return Array.from(symbols);
  }

  createWatchlist(name: WatchlistName): boolean {
    if (this.watchlists.has(name)) return false;
    this.watchlists.set(name, []);
    return true;
  }

  deleteWatchlist(name: WatchlistName): boolean {
    if (WatchlistManager.DEFAULT_WATCHLISTS.includes(name)) return false;
    return this.watchlists.delete(name);
  }

  getWatchlistCount(name: WatchlistName): number {
    return this.watchlists.get(name)?.length ?? 0;
  }

  getAllSymbols(): string[] {
    return this.getSymbolsInWatchlists();
  }

  clear(): void {
    for (const name of this.watchlists.keys()) {
      this.watchlists.set(name, []);
    }
  }
}
