import { Injectable } from '@nestjs/common';
import { RankingRecommendation, RecommendationThresholds, InvestmentGrade } from '../ranking.types';

@Injectable()
export class RecommendationEngine {
  private readonly thresholds: RecommendationThresholds;

  constructor(thresholds: RecommendationThresholds) {
    this.thresholds = thresholds;
  }

  generate(rankingScore: number, grade: InvestmentGrade, risk: number, confidence: number): {
    recommendation: RankingRecommendation;
    explanation: string;
  } {
    if (grade === 'REJECT') {
      return { recommendation: 'AVOID', explanation: 'Investment grade is REJECT — does not meet minimum criteria' };
    }
    if (rankingScore >= this.thresholds.strongBuy && risk < 40 && confidence > 70) {
      return {
        recommendation: 'STRONG_BUY',
        explanation: `Strong buy: ranking score ${rankingScore} with low risk (${risk}) and high confidence (${confidence})`,
      };
    }
    if (rankingScore >= this.thresholds.buy) {
      return {
        recommendation: 'BUY',
        explanation: `Buy: ranking score ${rankingScore} exceeds buy threshold (${this.thresholds.buy})`,
      };
    }
    if (rankingScore >= this.thresholds.watch) {
      return {
        recommendation: 'WATCH',
        explanation: `Watch: ranking score ${rankingScore} is promising but not yet strong enough for buy`,
      };
    }
    if (rankingScore >= this.thresholds.neutral) {
      return {
        recommendation: 'NEUTRAL',
        explanation: `Neutral: ranking score ${rankingScore} is within neutral range`,
      };
    }
    if (rankingScore >= this.thresholds.reduce) {
      return {
        recommendation: 'REDUCE',
        explanation: `Reduce: ranking score ${rankingScore} is declining — consider reducing exposure`,
      };
    }
    return {
      recommendation: 'AVOID',
      explanation: `Avoid: ranking score ${rankingScore} is below all thresholds`,
    };
  }

  getRecommendationDistribution(recommendations: RankingRecommendation[]): Record<RankingRecommendation, number> {
    const dist: Record<RankingRecommendation, number> = {
      STRONG_BUY: 0, BUY: 0, WATCH: 0, NEUTRAL: 0, REDUCE: 0, AVOID: 0,
    };
    for (const r of recommendations) dist[r]++;
    return dist;
  }
}
