import { Injectable, Logger } from '@nestjs/common';
import { MarketScannerEngine } from './market-scanner.engine';
import { SymbolAnalysis, RankedSymbol, MarketScannerResult, ScannerStatistics } from './market-scanner.types';

export interface ScannerPage {
  items: RankedSymbol[];
  total: number;
  offset: number;
  limit: number;
}

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);
  private lastResult: MarketScannerResult | null = null;

  constructor(private readonly engine: MarketScannerEngine) {}

  runScan(symbols: SymbolAnalysis[]): MarketScannerResult {
    this.lastResult = this.engine.scan(symbols);
    this.logger.debug(
      `Scan complete: ${this.lastResult.statistics.topCandidateCount} top, ` +
      `${this.lastResult.statistics.watchlistCount} watchlist, ` +
      `${this.lastResult.statistics.rejectedCount} rejected`,
    );
    return this.lastResult;
  }

  getResult(): MarketScannerResult | null {
    return this.lastResult;
  }

  getTopCandidates(offset = 0, limit = 10, sortBy: keyof RankedSymbol = 'compositeScore', sortDir: 'asc' | 'desc' = 'desc'): ScannerPage {
    const items = this.sortItems(this.lastResult?.topCandidates ?? [], sortBy, sortDir);
    return this.paginate(items, offset, limit);
  }

  getWatchlist(offset = 0, limit = 20, sortBy: keyof RankedSymbol = 'compositeScore', sortDir: 'asc' | 'desc' = 'desc'): ScannerPage {
    const items = this.sortItems(this.lastResult?.watchlist ?? [], sortBy, sortDir);
    return this.paginate(items, offset, limit);
  }

  getRejected(offset = 0, limit = 50, sortBy: keyof RankedSymbol = 'compositeScore', sortDir: 'asc' | 'desc' = 'desc'): ScannerPage {
    const items = this.sortItems(this.lastResult?.rejected ?? [], sortBy, sortDir);
    return this.paginate(items, offset, limit);
  }

  getStatistics(): ScannerStatistics | null {
    return this.lastResult?.statistics ?? null;
  }

  private sortItems(items: RankedSymbol[], sortBy: keyof RankedSymbol, sortDir: 'asc' | 'desc'): RankedSymbol[] {
    return [...items].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  private paginate(items: RankedSymbol[], offset: number, limit: number): ScannerPage {
    const total = items.length;
    const page = items.slice(offset, offset + limit);
    return { items: page, total, offset, limit };
  }
}
