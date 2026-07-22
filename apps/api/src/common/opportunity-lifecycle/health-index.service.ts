import { Injectable } from '@nestjs/common';
import {
  OpportunityRecord,
  HealthIndex,
  HealthFactor,
  HealthLevel,
  SignalDirection,
  LIFECYCLE_CONFIG_DEFAULTS,
  LifecycleConfig,
} from './types';

@Injectable()
export class HealthIndexService {
  private config: LifecycleConfig = { ...LIFECYCLE_CONFIG_DEFAULTS };

  calculateHealth(record: OpportunityRecord): HealthIndex {
    const snapshots = record.snapshots;
    if (snapshots.length === 0) {
      return this.createEmptyHealth();
    }

    const latest = snapshots[snapshots.length - 1];
    const factors: HealthFactor[] = [];

    const scoreFactor = this.createFactor(
      'Skor Kalitesi',
      latest.eliteScore / 100,
      this.config.healthWeights.scoreWeight,
    );
    factors.push(scoreFactor);

    const confidenceFactor = this.createFactor(
      'Guvenilirlik',
      latest.confidence,
      this.config.healthWeights.confidenceWeight,
    );
    factors.push(confidenceFactor);

    const momentumFactor = this.createFactor(
      'Momentum',
      latest.momentumScore,
      this.config.healthWeights.momentumWeight,
    );
    factors.push(momentumFactor);

    const riskInverse = 1 - latest.riskScore;
    const riskFactor = this.createFactor(
      'Risk Seviyesi',
      riskInverse,
      this.config.healthWeights.riskWeight,
    );
    factors.push(riskFactor);

    const stability = this.calculateStability(snapshots.map((s) => s.eliteScore));
    const stabilityFactor = this.createFactor(
      'Stabilite',
      stability,
      this.config.healthWeights.stabilityWeight,
    );
    factors.push(stabilityFactor);

    const overall = factors.reduce((sum, f) => sum + f.contribution, 0);
    const overallScore = Math.round(Math.min(100, Math.max(0, overall * 100)));

    return {
      overall: overallScore,
      stability,
      momentum: latest.momentumScore,
      riskLevel: latest.riskScore,
      quality: latest.eliteScore / 100,
      level: this.getHealthLevel(overallScore),
      factors,
      calculatedAt: new Date().toISOString(),
    };
  }

  calculateStabilityScore(values: number[]): number {
    return this.calculateStability(values);
  }

  getHealthLevel(score: number): HealthLevel {
    return this.getHealthLevelFromScore(score);
  }

  private calculateStability(values: number[]): number {
    if (values.length < 2) return 0.5;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const normalizedStdDev = mean !== 0 ? stdDev / Math.abs(mean) : 0;
    return Math.max(0, Math.min(1, 1 - normalizedStdDev));
  }

  private createFactor(name: string, value: number, weight: number): HealthFactor {
    const contribution = value * weight;
    return {
      factor: name,
      value,
      weight,
      contribution,
      impact: value > 0.5 ? SignalDirection.STRENGTHENING : value < 0.5 ? SignalDirection.WEAKENING : SignalDirection.NEUTRAL,
      description: `${name}: ${(value * 100).toFixed(1)}%`,
    };
  }

  private getHealthLevelFromScore(score: number): HealthLevel {
    if (score >= 80) return HealthLevel.EXCELLENT;
    if (score >= 60) return HealthLevel.GOOD;
    if (score >= 40) return HealthLevel.FAIR;
    if (score >= 20) return HealthLevel.POOR;
    return HealthLevel.CRITICAL;
  }

  private createEmptyHealth(): HealthIndex {
    return {
      overall: 0,
      stability: 0,
      momentum: 0,
      riskLevel: 1,
      quality: 0,
      level: HealthLevel.CRITICAL,
      factors: [],
      calculatedAt: new Date().toISOString(),
    };
  }
}
