import { Injectable } from '@nestjs/common';
import { ScannerResult, ScannerGroupBy, GroupConfig, ScannerSortMode } from '../scanner.types';

@Injectable()
export class Grouper {
  private readonly config: GroupConfig;

  constructor(config: GroupConfig) {
    this.config = config;
  }

  group(results: ScannerResult[], groupBy: ScannerGroupBy): Map<string, ScannerResult[]> {
    const groups = new Map<string, ScannerResult[]>();

    if (groupBy === 'NONE') {
      groups.set('ALL', [...results]);
      return groups;
    }

    for (const result of results) {
      const key = this.getGroupKey(result, groupBy);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(result);
    }

    for (const [key, groupResults] of groups) {
      groups.set(key, this.sortWithinGroup(groupResults));
      if (groupResults.length > this.config.maxGroupSize) {
        groups.set(key, groupResults.slice(0, this.config.maxGroupSize));
      }
    }

    return groups;
  }

  private getGroupKey(result: ScannerResult, groupBy: ScannerGroupBy): string {
    switch (groupBy) {
      case 'SECTOR': {
        const sectorMetric = result.metadata?.supportingMetrics?.find((m) => m.module === 'sectorStrength');
        return sectorMetric ? String(sectorMetric.value) : 'Unknown';
      }
      case 'INDUSTRY': {
        const industryMetric = result.metadata?.supportingMetrics?.find((m) => m.name?.includes('industry'));
        return industryMetric ? String(industryMetric.value) : 'Unknown';
      }
      case 'OPPORTUNITY_TYPE':
        return result.opportunityTypes.length > 0 ? result.opportunityTypes[0] : 'CUSTOM';
      case 'RISK':
        if (result.risk < 25) return 'LOW_RISK';
        if (result.risk < 50) return 'MEDIUM_RISK';
        if (result.risk < 75) return 'HIGH_RISK';
        return 'VERY_HIGH_RISK';
      case 'PRIORITY':
        return result.priority;
      case 'AGE':
        return result.age;
      case 'SIGNAL_STRENGTH':
        if (result.scannerScore >= 80) return 'STRONG';
        if (result.scannerScore >= 60) return 'MODERATE';
        return 'WEAK';
      case 'CATEGORY':
        return result.category;
      default:
        return 'ALL';
    }
  }

  private sortWithinGroup(results: ScannerResult[]): ScannerResult[] {
    return [...results].sort((a, b) => b.scannerScore - a.scannerScore);
  }
}
