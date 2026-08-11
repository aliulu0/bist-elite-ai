import { Injectable } from '@nestjs/common';
import { RankingMetrics, InvestmentGrade, RankingRecommendation, TopMover } from '../ranking.types';

@Injectable()
export class RankingMetricsCollector {
  private readonly gradeDistribution: Record<InvestmentGrade, number> = {
    AAA: 0, AA: 0, A: 0, BBB: 0, BB: 0, B: 0, C: 0, REJECT: 0,
  };
  private readonly recommendationDistribution: Record<RankingRecommendation, number> = {
    STRONG_BUY: 0, BUY: 0, WATCH: 0, NEUTRAL: 0, REDUCE: 0, AVOID: 0,
  };
  private readonly rankChangeDistribution: Record<string, number> = {
    improved: 0,
    stable: 0,
    declined: 0,
    new: 0,
  };
  private totalScore = 0;
  private totalRank = 0;
  private candidateCount = 0;

  recordCandidate(
    rankingScore: number,
    rank: number,
    grade: InvestmentGrade,
    recommendation: RankingRecommendation,
    rankChange: number | null,
  ): void {
    this.gradeDistribution[grade]++;
    this.recommendationDistribution[recommendation]++;
    this.totalScore += rankingScore;
    this.totalRank += rank;
    this.candidateCount++;

    if (rankChange === null) {
      this.rankChangeDistribution.new++;
    } else if (rankChange < 0) {
      this.rankChangeDistribution.improved++;
    } else if (rankChange > 0) {
      this.rankChangeDistribution.declined++;
    } else {
      this.rankChangeDistribution.stable++;
    }
  }

  getMetrics(rankingDurationMs: number, topMovers: TopMover[]): RankingMetrics {
    return {
      rankingDurationMs,
      totalRanked: this.candidateCount,
      averageRankingScore: this.candidateCount > 0 ? Math.round((this.totalScore / this.candidateCount) * 100) / 100 : 0,
      averageRank: this.candidateCount > 0 ? Math.round((this.totalRank / this.candidateCount) * 100) / 100 : 0,
      gradeDistribution: { ...this.gradeDistribution },
      recommendationDistribution: { ...this.recommendationDistribution },
      rankChangeDistribution: { ...this.rankChangeDistribution },
      topMovers,
      timestamp: new Date().toISOString(),
    };
  }

  reset(): void {
    for (const key of Object.keys(this.gradeDistribution) as InvestmentGrade[]) {
      this.gradeDistribution[key] = 0;
    }
    for (const key of Object.keys(this.recommendationDistribution) as RankingRecommendation[]) {
      this.recommendationDistribution[key] = 0;
    }
    this.rankChangeDistribution.improved = 0;
    this.rankChangeDistribution.stable = 0;
    this.rankChangeDistribution.declined = 0;
    this.rankChangeDistribution.new = 0;
    this.totalScore = 0;
    this.totalRank = 0;
    this.candidateCount = 0;
  }
}
