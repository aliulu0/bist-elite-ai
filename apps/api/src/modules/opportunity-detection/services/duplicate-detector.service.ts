import { Injectable } from '@nestjs/common';
import { OpportunityHistoryEntry, OpportunityLevel } from '../opportunity-detection.types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingEntry: OpportunityHistoryEntry | null;
  duplicateCount: number;
}

@Injectable()
export class DuplicateDetector {
  detect(
    symbol: string,
    currentScore: number,
    history: OpportunityHistoryEntry[],
    scoreThreshold: number = 10,
    timeWindowMs: number = 60 * 60 * 1000,
  ): DuplicateCheckResult {
    const recentEntries = history.filter(
      (entry) => Date.now() - new Date(entry.timestamp).getTime() < timeWindowMs,
    );

    if (recentEntries.length === 0) {
      return { isDuplicate: false, existingEntry: null, duplicateCount: 0 };
    }

    for (const entry of recentEntries) {
      if (Math.abs(entry.score - currentScore) < scoreThreshold) {
        return {
          isDuplicate: true,
          existingEntry: entry,
          duplicateCount: recentEntries.length,
        };
      }
    }

    return { isDuplicate: false, existingEntry: null, duplicateCount: 0 };
  }

  mergeEntries(entries: OpportunityHistoryEntry[], maxHistory: number): OpportunityHistoryEntry[] {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return sorted.slice(-maxHistory);
  }
}
