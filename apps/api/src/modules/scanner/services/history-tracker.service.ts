import { Injectable } from '@nestjs/common';
import { ScannerResult, ScanHistoryEntry, ScanStatus, ScannerCategory } from '../scanner.types';

@Injectable()
export class HistoryTracker {
  private readonly history: Map<string, ScanHistoryEntry[]> = new Map();

  track(result: ScannerResult): void {
    const hist = this.history.get(result.symbol) ?? [];
    const firstSeen = hist.length > 0 ? hist[0].firstSeen : result.timestamp;
    const lastSeen = hist.length > 0 ? hist[hist.length - 1].timestamp : result.timestamp;
    const previousEntry = hist.length > 0 ? hist[hist.length - 1] : null;

    const status = this.determineStatus(result, previousEntry);

    hist.push({
      timestamp: result.timestamp,
      scannerScore: result.scannerScore,
      opportunityScore: result.opportunityScore,
      priority: result.priority,
      category: result.category,
      status,
      firstSeen,
    });

    if (hist.length > 50) {
      this.history.set(result.symbol, hist.slice(-50));
    } else {
      this.history.set(result.symbol, hist);
    }
  }

  trackAll(results: ScannerResult[]): void {
    for (const result of results) {
      this.track(result);
    }
  }

  getHistory(symbol: string): ScanHistoryEntry[] {
    return this.history.get(symbol) ?? [];
  }

  getFirstSeen(symbol: string): string | null {
    const hist = this.history.get(symbol);
    return hist && hist.length > 0 ? hist[0].firstSeen : null;
  }

  getLastSeen(symbol: string): string | null {
    const hist = this.history.get(symbol);
    return hist && hist.length > 0 ? hist[hist.length - 1].timestamp : null;
  }

  getScoreDelta(symbol: string): number | null {
    const hist = this.history.get(symbol);
    if (!hist || hist.length < 2) return null;
    return hist[hist.length - 1].scannerScore - hist[hist.length - 2].scannerScore;
  }

  getPriorityDelta(symbol: string): string | null {
    const hist = this.history.get(symbol);
    if (!hist || hist.length < 2) return null;
    return hist[hist.length - 1].priority;
  }

  getCategoryDelta(symbol: string): ScannerCategory | null {
    const hist = this.history.get(symbol);
    if (!hist || hist.length < 2) return null;
    return hist[hist.length - 1].category;
  }

  private determineStatus(result: ScannerResult, previous: ScanHistoryEntry | null): ScanStatus {
    if (!previous) return 'NEW';
    if (result.scannerScore > previous.scannerScore * 1.1) return 'ACTIVE';
    if (result.scannerScore < previous.scannerScore * 0.9) return 'DECLINING';
    if (result.priority === 'IGNORE') return 'EXPIRED';
    return 'ACTIVE';
  }

  clearHistory(): void {
    this.history.clear();
  }
}
