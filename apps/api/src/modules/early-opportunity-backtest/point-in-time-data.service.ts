import { Injectable } from '@nestjs/common';
import { OHLCV } from '../indicators/indicator.types';

export interface PointInTimeFilterResult<T> {
  data: T[];
  rejectedCount: number;
  totalCount: number;
  cutOffTimestamp: string;
}

@Injectable()
export class PointInTimeDataService {
  filterCandles(candles: OHLCV[], decisionTimestamp: string): PointInTimeFilterResult<OHLCV> {
    const cutOff = new Date(decisionTimestamp).getTime();
    const filtered: OHLCV[] = [];
    let rejectedCount = 0;
    for (const c of candles) {
      const ts = new Date(c.timestamp).getTime();
      if (ts <= cutOff) {
        filtered.push(c);
      } else {
        rejectedCount++;
      }
    }
    return {
      data: filtered,
      rejectedCount,
      totalCount: candles.length,
      cutOffTimestamp: decisionTimestamp,
    };
  }

  filterByTimestamp<T extends { timestamp?: string; publicationDate?: string; date?: string; publishedAt?: string }>(
    items: T[],
    decisionTimestamp: string,
    dateField: 'timestamp' | 'publicationDate' | 'date' | 'publishedAt' = 'timestamp',
  ): PointInTimeFilterResult<T> {
    const cutOff = new Date(decisionTimestamp).getTime();
    const filtered: T[] = [];
    let rejectedCount = 0;
    let unsortedCount = 0;
    for (const item of items) {
      const ts = item[dateField];
      if (!ts) {
        unsortedCount++;
        continue;
      }
      if (new Date(ts).getTime() <= cutOff) {
        filtered.push(item);
      } else {
        rejectedCount++;
      }
    }
    return {
      data: filtered,
      rejectedCount: rejectedCount + unsortedCount,
      totalCount: items.length,
      cutOffTimestamp: decisionTimestamp,
    };
  }

  verifyNoFutureData<T extends { timestamp?: string; publicationDate?: string; date?: string; publishedAt?: string }>(
    items: T[],
    decisionTimestamp: string,
    dateField: 'timestamp' | 'publicationDate' | 'date' | 'publishedAt' = 'timestamp',
  ): { pass: boolean; futureCount: number } {
    const cutOff = new Date(decisionTimestamp).getTime();
    let futureCount = 0;
    for (const item of items) {
      const ts = item[dateField];
      if (ts && new Date(ts).getTime() > cutOff) {
        futureCount++;
      }
    }
    return { pass: futureCount === 0, futureCount };
  }

  isWithinPointInTime(dataTimestamp: string, decisionTimestamp: string): boolean {
    return new Date(dataTimestamp).getTime() <= new Date(decisionTimestamp).getTime();
  }
}