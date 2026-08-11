import { Injectable } from '@nestjs/common';
import { OpportunityResult } from '../../opportunity-detection/opportunity-detection.types';
import { DuplicateMergeConfig, ScanHistoryEntry } from '../scanner.types';

export interface MergedResult {
  opportunity: OpportunityResult;
  duplicateCount: number;
  history: ScanHistoryEntry[];
}

@Injectable()
export class DuplicateMerger {
  private readonly config: DuplicateMergeConfig;
  private readonly history: Map<string, ScanHistoryEntry[]> = new Map();

  constructor(config: DuplicateMergeConfig) {
    this.config = config;
  }

  merge(opportunities: OpportunityResult[]): MergedResult[] {
    const seen = new Map<string, OpportunityResult>();
    const duplicateCounts = new Map<string, number>();

    for (const opp of opportunities) {
      const existing = seen.get(opp.symbol);
      if (existing) {
        duplicateCounts.set(opp.symbol, (duplicateCounts.get(opp.symbol) ?? 0) + 1);
        const merged = this.mergeOpportunities(existing, opp);
        seen.set(opp.symbol, merged);
      } else {
        seen.set(opp.symbol, opp);
        duplicateCounts.set(opp.symbol, 0);
      }
    }

    const results: MergedResult[] = [];
    for (const [symbol, opp] of seen) {
      const entryHistory = this.history.get(symbol) ?? [];
      this.updateHistory(symbol, opp);
      results.push({
        opportunity: opp,
        duplicateCount: duplicateCounts.get(symbol) ?? 0,
        history: entryHistory,
      });
    }
    return results;
  }

  private mergeOpportunities(existing: OpportunityResult, incoming: OpportunityResult): OpportunityResult {
    if (this.config.mergeStrategy === 'HIGHEST') {
      return incoming.opportunityScore >= existing.opportunityScore ? incoming : existing;
    }
    if (this.config.mergeStrategy === 'AVERAGE') {
      return {
        ...incoming,
        opportunityScore: (incoming.opportunityScore + existing.opportunityScore) / 2,
        confidence: (incoming.confidence + existing.confidence) / 2,
      };
    }
    return incoming;
  }

  private updateHistory(symbol: string, opp: OpportunityResult): void {
    const hist = this.history.get(symbol) ?? [];
    hist.push({
      timestamp: opp.timestamp,
      scannerScore: opp.opportunityScore,
      opportunityScore: opp.opportunityScore,
      priority: opp.priority,
      category: 'CUSTOM',
      status: 'ACTIVE',
      firstSeen: hist.length > 0 ? hist[0].timestamp : opp.timestamp,
    });
    if (hist.length > this.config.maxHistory) {
      this.history.set(symbol, hist.slice(-this.config.maxHistory));
    } else {
      this.history.set(symbol, hist);
    }
  }

  getHistory(symbol: string): ScanHistoryEntry[] {
    return this.history.get(symbol) ?? [];
  }

  clearHistory(): void {
    this.history.clear();
  }
}
