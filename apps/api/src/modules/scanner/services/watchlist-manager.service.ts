import { Injectable } from '@nestjs/common';
import { ScannerResult, WatchlistConfig, WatchlistName, ScannerFilterConfig } from '../scanner.types';
import { DEFAULT_WATCHLISTS } from '../scanner.config';

@Injectable()
export class WatchlistManager {
  private readonly watchlists: Map<WatchlistName, WatchlistConfig>;
  private readonly watchlistData: Map<WatchlistName, ScannerResult[]> = new Map();

  constructor(customWatchlists?: WatchlistConfig[]) {
    const configs = customWatchlists ?? DEFAULT_WATCHLISTS;
    this.watchlists = new Map(configs.map((w) => [w.name, w]));
    for (const config of configs) {
      this.watchlistData.set(config.name, []);
    }
  }

  addToWatchlist(name: WatchlistName, result: ScannerResult): void {
    const config = this.watchlists.get(name);
    if (!config) return;
    const data = this.watchlistData.get(name) ?? [];
    if (data.length >= config.maxItems) return;
    if (!data.find((r) => r.symbol === result.symbol)) {
      data.push(result);
      this.watchlistData.set(name, data);
    }
  }

  removeFromWatchlist(name: WatchlistName, symbol: string): void {
    const data = this.watchlistData.get(name) ?? [];
    this.watchlistData.set(
      name,
      data.filter((r) => r.symbol !== symbol),
    );
  }

  getWatchlist(name: WatchlistName): ScannerResult[] {
    return this.watchlistData.get(name) ?? [];
  }

  getAllWatchlists(): Map<WatchlistName, ScannerResult[]> {
    return new Map(this.watchlistData);
  }

  populateAll(candidates: ScannerResult[]): void {
    for (const [name, config] of this.watchlists) {
      const filtered = candidates.filter((c) => this.matchesWatchlistFilter(c, config.filters));
      const sorted = this.sortForWatchlist(filtered, config.sortMode);
      this.watchlistData.set(name, sorted.slice(0, config.maxItems));
    }
  }

  private matchesWatchlistFilter(result: ScannerResult, filters: Partial<ScannerFilterConfig>): boolean {
    if (filters.minOpportunityScore !== undefined && result.opportunityScore < filters.minOpportunityScore) return false;
    if (filters.maxRisk !== undefined && result.risk > filters.maxRisk) return false;
    if (filters.minConfidence !== undefined && result.confidence < filters.minConfidence) return false;
    if (filters.allowedOpportunityTypes && filters.allowedOpportunityTypes.length > 0) {
      if (!result.opportunityTypes.some((t) => filters.allowedOpportunityTypes!.includes(t))) return false;
    }
    if (filters.allowedPriorityLevels && filters.allowedPriorityLevels.length > 0) {
      if (!filters.allowedPriorityLevels.includes(result.priority)) return false;
    }
    return true;
  }

  private sortForWatchlist(results: ScannerResult[], sortMode: string): ScannerResult[] {
    const sorted = [...results];
    switch (sortMode) {
      case 'SCORE_DESC':
        return sorted.sort((a, b) => b.scannerScore - a.scannerScore);
      case 'CONFIDENCE_DESC':
        return sorted.sort((a, b) => b.confidence - a.confidence);
      case 'RISK_ASC':
        return sorted.sort((a, b) => a.risk - b.risk);
      default:
        return sorted.sort((a, b) => b.scannerScore - a.scannerScore);
    }
  }

  getWatchlistConfig(name: WatchlistName): WatchlistConfig | undefined {
    return this.watchlists.get(name);
  }

  addCustomWatchlist(config: WatchlistConfig): void {
    this.watchlists.set(config.name, config);
    this.watchlistData.set(config.name, []);
  }
}
