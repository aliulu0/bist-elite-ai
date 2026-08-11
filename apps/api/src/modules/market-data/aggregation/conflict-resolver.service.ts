import { Injectable } from '@nestjs/common';
import { ConflictRecord } from './aggregation.types';

interface FieldSource {
  provider: string;
  value: unknown;
  priority: number;
  timestamp: string;
}

@Injectable()
export class ConflictResolver {
  resolve<T extends Record<string, unknown>>(
    fieldName: string,
    sources: FieldSource[],
  ): { value: unknown; resolution: ConflictRecord['resolution'] } | null {
    if (sources.length === 0) return null;

    const validSources = sources.filter((s) => this.isValidValue(s.value));
    if (validSources.length === 0) return null;
    if (validSources.length === 1) {
      return { value: validSources[0].value, resolution: 'single_source' };
    }

    const uniqueValues = this.getUniqueValues(validSources);
    if (uniqueValues.size === 1) {
      return { value: validSources[0].value, resolution: 'single_source' };
    }

    const majorityResult = this.tryMajorityVote(validSources, uniqueValues);
    if (majorityResult) return majorityResult;

    const latestResult = this.preferLatestTimestamp(validSources);
    if (latestResult) return latestResult;

    const priorityResult = this.preferHighestPriority(validSources);
    if (priorityResult) return priorityResult;

    return { value: validSources[0].value, resolution: 'single_source' };
  }

  resolveNumeric(
    fieldName: string,
    sources: FieldSource[],
  ): { value: number | null; resolution: ConflictRecord['resolution'] } | null {
    if (sources.length === 0) return null;

    const numericSources = sources
      .filter((s) => typeof s.value === 'number' && !Number.isNaN(s.value))
      .map((s) => ({ ...s, value: s.value as number }));

    if (numericSources.length === 0) return null;
    if (numericSources.length === 1) {
      return { value: numericSources[0].value, resolution: 'single_source' };
    }

    const uniqueValues = new Set(numericSources.map((s) => s.value));
    if (uniqueValues.size === 1) {
      return { value: numericSources[0].value, resolution: 'single_source' };
    }

    const majorityResult = this.tryNumericMajority(numericSources, uniqueValues);
    if (majorityResult) return majorityResult;

    const avg = numericSources.reduce((sum, s) => sum + s.value, 0) / numericSources.length;
    return { value: Math.round(avg * 100) / 100, resolution: 'average' };
  }

  resolveList<T>(fieldName: string, lists: Array<{ provider: string; items: T[]; priority: number; timestamp: string }>): T[] {
    if (lists.length === 0) return [];
    if (lists.length === 1) return lists[0].items;

    const seen = new Set<string>();
    const merged: T[] = [];

    const sorted = [...lists].sort((a, b) => a.priority - b.priority);

    for (const list of sorted) {
      for (const item of list.items) {
        const key = this.itemKey(item);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
    }

    return merged;
  }

  buildConflictRecord(
    field: string,
    sources: FieldSource[],
    chosenValue: unknown,
    resolution: ConflictRecord['resolution'],
  ): ConflictRecord {
    return {
      field,
      values: sources.map((s) => ({
        provider: s.provider,
        value: s.value,
        priority: s.priority,
        timestamp: s.timestamp,
      })),
      resolution,
      chosenValue,
    };
  }

  private isValidValue(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'number' && (Number.isNaN(value) || !Number.isFinite(value))) return false;
    return true;
  }

  private getUniqueValues(sources: FieldSource[]): Set<string> {
    return new Set(sources.map((s) => JSON.stringify(s.value)));
  }

  private tryMajorityVote(
    sources: FieldSource[],
    uniqueValues: Set<string>,
  ): { value: unknown; resolution: ConflictRecord['resolution'] } | null {
    if (uniqueValues.size >= sources.length) return null;

    const counts = new Map<string, { value: unknown; count: number }>();
    for (const s of sources) {
      const key = JSON.stringify(s.value);
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { value: s.value, count: 1 });
      }
    }

    let maxCount = 0;
    let majorityValue: unknown = null;
    for (const { value, count } of counts.values()) {
      if (count > maxCount) {
        maxCount = count;
        majorityValue = value;
      }
    }

    if (maxCount > sources.length / 2) {
      return { value: majorityValue, resolution: 'majority' };
    }
    return null;
  }

  private tryNumericMajority(
    sources: Array<FieldSource & { value: number }>,
    uniqueValues: Set<number>,
  ): { value: number; resolution: ConflictRecord['resolution'] } | null {
    if (uniqueValues.size >= sources.length) return null;

    const counts = new Map<number, { value: number; count: number }>();
    for (const s of sources) {
      const existing = counts.get(s.value);
      if (existing) {
        existing.count++;
      } else {
        counts.set(s.value, { value: s.value, count: 1 });
      }
    }

    let maxCount = 0;
    let majorityValue = 0;
    for (const { value, count } of counts.values()) {
      if (count > maxCount) {
        maxCount = count;
        majorityValue = value;
      }
    }

    if (maxCount > sources.length / 2) {
      return { value: majorityValue, resolution: 'majority' };
    }
    return null;
  }

  private preferLatestTimestamp(
    sources: FieldSource[],
  ): { value: unknown; resolution: ConflictRecord['resolution'] } | null {
    const sorted = [...sources].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });

    if (sorted.length > 0) {
      return { value: sorted[0].value, resolution: 'latest_timestamp' };
    }
    return null;
  }

  private preferHighestPriority(
    sources: FieldSource[],
  ): { value: unknown; resolution: ConflictRecord['resolution'] } | null {
    const sorted = [...sources].sort((a, b) => a.priority - b.priority);
    if (sorted.length > 0) {
      return { value: sorted[0].value, resolution: 'highest_priority' };
    }
    return null;
  }

  private itemKey(item: unknown): string {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj.title && obj.date) return `${obj.title}:${obj.date}`;
      if (obj.symbol && obj.period) return `${obj.symbol}:${obj.period}`;
    }
    return JSON.stringify(item);
  }
}
