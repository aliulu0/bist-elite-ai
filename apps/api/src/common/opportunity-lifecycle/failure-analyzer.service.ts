import { Injectable } from '@nestjs/common';
import {
  OpportunityRecord,
  OpportunityFailure,
  FailureCategory,
  LIFECYCLE_CONFIG_DEFAULTS,
  LifecycleConfig,
} from './types';

@Injectable()
export class FailureAnalyzerService {
  private config: LifecycleConfig = { ...LIFECYCLE_CONFIG_DEFAULTS };

  analyzeFailures(record: OpportunityRecord): OpportunityFailure[] {
    const failures: OpportunityFailure[] = [];
    const snapshots = record.snapshots;
    const thresholds = this.config.failureThresholds;

    if (snapshots.length === 0) return failures;

    const latest = snapshots[snapshots.length - 1];

    if (latest.eliteScore < thresholds.minScore) {
      failures.push({
        category: FailureCategory.WEAK_OPPORTUNITY,
        severity: (thresholds.minScore - latest.eliteScore) / thresholds.minScore,
        reason: `Elite skor cok dusuk: ${latest.eliteScore.toFixed(1)}`,
        indicators: ['eliteScore'],
        detectedAt: latest.timestamp,
        impact: 0.7,
      });
    }

    if (latest.riskScore > thresholds.maxRisk) {
      failures.push({
        category: FailureCategory.HIGH_RISK_OPPORTUNITY,
        severity: (latest.riskScore - thresholds.maxRisk) / (1 - thresholds.maxRisk),
        reason: `Risk seviyesi cok yuksek: ${(latest.riskScore * 100).toFixed(1)}%`,
        indicators: ['riskScore'],
        detectedAt: latest.timestamp,
        impact: 0.8,
      });
    }

    if (latest.confidence < thresholds.minConfidence) {
      failures.push({
        category: FailureCategory.WEAK_OPPORTUNITY,
        severity: (thresholds.minConfidence - latest.confidence) / thresholds.minConfidence,
        reason: `Guvenilirlik cok dusuk: ${(latest.confidence * 100).toFixed(1)}%`,
        indicators: ['confidence'],
        detectedAt: latest.timestamp,
        impact: 0.6,
      });
    }

    if (snapshots.length >= 2) {
      const firstScore = snapshots[0].eliteScore;
      const decline = ((firstScore - latest.eliteScore) / firstScore) * 100;
      if (decline > thresholds.maxDeclinePercent) {
        failures.push({
          category: FailureCategory.FALSE_OPPORTUNITY,
          severity: Math.min(1, decline / 100),
          reason: `Skor cok dustu: %${decline.toFixed(1)} dusus`,
          indicators: ['eliteScore_trend'],
          detectedAt: latest.timestamp,
          impact: 0.9,
        });
      }
    }

    if (record.completedAt && record.detectedAt) {
      const daysHeld =
        (new Date(record.completedAt).getTime() - new Date(record.detectedAt).getTime()) /
        86400000;
      if (
        daysHeld > thresholds.maxHoldingDaysWithoutGain &&
        (!record.actualReturn || record.actualReturn <= 0)
      ) {
        failures.push({
          category: FailureCategory.LATE_OPPORTUNITY,
          severity: Math.min(1, daysHeld / 30),
          reason: `${daysHeld.toFixed(0)} gun pozisyonda kalindi, getiri yok`,
          indicators: ['holding_period', 'actual_return'],
          detectedAt: latest.timestamp,
          impact: 0.5,
        });
      }
    }

    if (record.stage === 'CANCELLED' as any) {
      failures.push({
        category: FailureCategory.CANCELLED_OPPORTUNITY,
        severity: 0.3,
        reason: 'Firsat iptal edildi',
        indicators: ['stage'],
        detectedAt: latest.timestamp,
        impact: 0.2,
      });
    }

    record.failures = failures;
    return failures;
  }

  getOverallFailureScore(record: OpportunityRecord): number {
    if (record.failures.length === 0) return 0;
    return record.failures.reduce((max, f) => Math.max(max, f.severity), 0);
  }

  getFailureSummary(record: OpportunityRecord): {
    totalFailures: number;
    categories: Record<FailureCategory, number>;
    avgSeverity: number;
    maxSeverity: number;
  } {
    const categories: Record<FailureCategory, number> = {
      [FailureCategory.FALSE_OPPORTUNITY]: 0,
      [FailureCategory.WEAK_OPPORTUNITY]: 0,
      [FailureCategory.LATE_OPPORTUNITY]: 0,
      [FailureCategory.CANCELLED_OPPORTUNITY]: 0,
      [FailureCategory.HIGH_RISK_OPPORTUNITY]: 0,
    };

    for (const f of record.failures) {
      categories[f.category]++;
    }

    const severities = record.failures.map((f) => f.severity);
    return {
      totalFailures: record.failures.length,
      categories,
      avgSeverity: severities.length > 0
        ? severities.reduce((a, b) => a + b, 0) / severities.length
        : 0,
      maxSeverity: severities.length > 0 ? Math.max(...severities) : 0,
    };
  }
}
