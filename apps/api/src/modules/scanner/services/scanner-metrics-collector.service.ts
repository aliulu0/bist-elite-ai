import { Injectable } from '@nestjs/common';
import { ScannerMetrics, ScannerCategory, ScanMode, FilterStats } from '../scanner.types';
import { OpportunityLevel, Priority } from '../../opportunity-detection/opportunity-detection.types';

@Injectable()
export class ScannerMetricsCollector {
  private readonly categoryDistribution: Record<ScannerCategory, number> = {
    HOT: 0, TRENDING: 0, EMERGING: 0, RECOVERY: 0, UNDERVALUED: 0,
    MOMENTUM: 0, INCOME: 0, GROWTH: 0, SPECULATIVE: 0, DEFENSIVE: 0, CUSTOM: 0,
  };
  private readonly levelDistribution: Record<OpportunityLevel, number> = {
    SUPPORT: 0, NONE: 0, WATCH: 0, INTERESTING: 0, EMERGING: 0,
    STRONG: 0, VERY_STRONG: 0, EXCEPTIONAL: 0,
  };
  private readonly priorityDistribution: Record<Priority, number> = {
    CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, IGNORE: 0,
  };
  private totalScore = 0;
  private totalConfidence = 0;
  private totalRisk = 0;
  private candidateCount = 0;
  private rejectedCount = 0;
  private duplicateCount = 0;

  recordCandidate(
    scannerScore: number,
    confidence: number,
    risk: number,
    category: ScannerCategory,
    level: OpportunityLevel,
    priority: Priority,
    duplicates: number,
  ): void {
    this.categoryDistribution[category]++;
    this.levelDistribution[level]++;
    this.priorityDistribution[priority]++;
    this.totalScore += scannerScore;
    this.totalConfidence += confidence;
    this.totalRisk += risk;
    this.candidateCount++;
    this.duplicateCount += duplicates;
  }

  recordRejection(): void {
    this.rejectedCount++;
  }

  getMetrics(
    scanDurationMs: number,
    totalScanned: number,
    filterStats: FilterStats,
    scanMode: ScanMode,
  ): ScannerMetrics {
    return {
      scanDurationMs,
      candidatesFound: this.candidateCount,
      totalScanned,
      rejectedCount: this.rejectedCount,
      averageScore: this.candidateCount > 0 ? Math.round((this.totalScore / this.candidateCount) * 100) / 100 : 0,
      averageConfidence: this.candidateCount > 0 ? Math.round((this.totalConfidence / this.candidateCount) * 100) / 100 : 0,
      averageRisk: this.candidateCount > 0 ? Math.round((this.totalRisk / this.candidateCount) * 100) / 100 : 0,
      duplicateCount: this.duplicateCount,
      filterStats,
      categoryDistribution: { ...this.categoryDistribution },
      levelDistribution: { ...this.levelDistribution },
      priorityDistribution: { ...this.priorityDistribution },
      scanMode,
      timestamp: new Date().toISOString(),
    };
  }

  reset(): void {
    for (const key of Object.keys(this.categoryDistribution) as ScannerCategory[]) {
      this.categoryDistribution[key] = 0;
    }
    for (const key of Object.keys(this.levelDistribution) as OpportunityLevel[]) {
      this.levelDistribution[key] = 0;
    }
    for (const key of Object.keys(this.priorityDistribution) as Priority[]) {
      this.priorityDistribution[key] = 0;
    }
    this.totalScore = 0;
    this.totalConfidence = 0;
    this.totalRisk = 0;
    this.candidateCount = 0;
    this.rejectedCount = 0;
    this.duplicateCount = 0;
  }
}
