import { Injectable } from '@nestjs/common';
import { OpportunityDetectionMetrics, OpportunityLevel } from '../opportunity-detection.types';

@Injectable()
export class MetricsCollector {
  private readonly distribution: Record<OpportunityLevel, number> = {
    SUPPORT: 0,
    NONE: 0,
    WATCH: 0,
    INTERESTING: 0,
    EMERGING: 0,
    STRONG: 0,
    VERY_STRONG: 0,
    EXCEPTIONAL: 0,
  };
  private totalScore = 0;
  private totalConfidence = 0;
  private totalRisk = 0;
  private detectionCount = 0;
  private rejectedCount = 0;

  recordDetection(
    level: OpportunityLevel,
    score: number,
    confidence: number,
    risk: number,
  ): void {
    this.distribution[level]++;
    this.totalScore += score;
    this.totalConfidence += confidence;
    this.totalRisk += risk;
    this.detectionCount++;
  }

  recordRejection(): void {
    this.rejectedCount++;
  }

  getMetrics(detectionTimeMs: number, moduleDurations: Record<string, number>): OpportunityDetectionMetrics {
    return {
      detectionTimeMs,
      moduleDurations,
      opportunityDistribution: { ...this.distribution },
      averageScore: this.detectionCount > 0 ? this.totalScore / this.detectionCount : 0,
      averageConfidence: this.detectionCount > 0 ? this.totalConfidence / this.detectionCount : 0,
      averageRisk: this.detectionCount > 0 ? this.totalRisk / this.detectionCount : 0,
      detectionCount: this.detectionCount,
      rejectedOpportunities: this.rejectedCount,
    };
  }

  reset(): void {
    for (const key of Object.keys(this.distribution) as OpportunityLevel[]) {
      this.distribution[key] = 0;
    }
    this.totalScore = 0;
    this.totalConfidence = 0;
    this.totalRisk = 0;
    this.detectionCount = 0;
    this.rejectedCount = 0;
  }
}
