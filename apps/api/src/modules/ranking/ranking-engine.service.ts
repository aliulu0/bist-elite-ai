import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  RankedOpportunity,
  RankingConfig,
  RankingFactor,
  RankedOpportunityMetadata,
  RankingMetrics,
  RankingTrend,
  ComparisonView,
  TopMover,
  RANKING_VERSION,
  RankHistoryEntry,
} from './ranking.types';
import { DEFAULT_RANKING_CONFIG } from './ranking.config';
import { ScannerResult } from '../scanner/scanner.types';
import { Normalizer } from './services/normalizer.service';
import { RankingCalculator } from './services/ranking-calculator.service';
import { GradeAssigner } from './services/grade-assigner.service';
import { RecommendationEngine } from './services/recommendation-engine.service';
import { TieBreaker } from './services/tie-breaker.service';
import { RankingStabilizer } from './services/ranking-stabilizer.service';
import { RankingHistory } from './services/ranking-history.service';
import { RankingComparator } from './services/ranking-comparator.service';
import { RankingMetricsCollector } from './services/ranking-metrics-collector.service';

@Injectable()
export class RankingEngine {
  private readonly logger = new Logger(RankingEngine.name);
  private readonly config: RankingConfig;
  private readonly normalizer: Normalizer;
  private readonly calculator: RankingCalculator;
  private readonly gradeAssigner: GradeAssigner;
  private readonly recommendationEngine: RecommendationEngine;
  private readonly tieBreaker: TieBreaker;
  private readonly stabilizer: RankingStabilizer;
  private readonly history: RankingHistory;
  private readonly comparator: RankingComparator;
  private readonly metricsCollector: RankingMetricsCollector;

  constructor(@Optional() config?: Partial<RankingConfig>) {
    this.config = { ...DEFAULT_RANKING_CONFIG, ...config };
    this.normalizer = new Normalizer(this.config.normalization);
    this.calculator = new RankingCalculator(this.config.factorWeights);
    this.gradeAssigner = new GradeAssigner(this.config.gradeThresholds);
    this.recommendationEngine = new RecommendationEngine(this.config.recommendationThresholds);
    this.tieBreaker = new TieBreaker();
    this.stabilizer = new RankingStabilizer(this.config.stability);
    this.history = new RankingHistory(this.config.history);
    this.comparator = new RankingComparator();
    this.metricsCollector = new RankingMetricsCollector();
  }

  rank(candidates: ScannerResult[]): {
    ranked: RankedOpportunity[];
    metrics: RankingMetrics;
  } {
    const startTime = Date.now();
    this.metricsCollector.reset();

    try {
      const eligible = candidates.filter((c) => c.scannerScore >= this.config.minScoreThreshold);

      const allFactorValues = this.collectAllFactorValues(eligible);

      const preRanked = eligible.map((candidate) => {
        try {
          const consistency = this.history.getHistoryCount(candidate.symbol) > 0 ? 70 : 50;
          const factors = this.calculator.calculateFactors(candidate, consistency);
          const normalizedFactors = this.normalizer.normalize(factors, allFactorValues);
          const rawScore = this.calculator.calculateRawScore(normalizedFactors);

          const allScores = eligible.map(() => rawScore);
          const normalizedScore = this.normalizer.normalizeScore(rawScore, allScores);

          const previousRank = this.history.getPreviousRank(candidate.symbol);
          const bestRank = this.history.getBestRank(candidate.symbol) || eligible.length;
          const worstRank = this.history.getWorstRank(candidate.symbol) || 1;
          const averageRank = this.history.getAverageRank(candidate.symbol) || eligible.length;
          const trend = this.history.getRankTrend(candidate.symbol);

          const grade = this.gradeAssigner.assign(normalizedScore);
          const { recommendation, explanation } = this.recommendationEngine.generate(
            normalizedScore, grade, candidate.risk, candidate.confidence,
          );

          const riskReward = this.calculateRiskReward(candidate.risk, normalizedScore);
          const expectedReturn = this.estimateExpectedReturn(normalizedScore, candidate.risk);

          const reasons = this.buildReasons(candidate, normalizedScore, grade, recommendation);

          const rank = 0;
          return this.buildRankedOpportunity(
            candidate, rank, normalizedScore, normalizedFactors, grade,
            recommendation, explanation, expectedReturn, riskReward,
            previousRank, bestRank, worstRank, averageRank, trend,
          );
        } catch (error) {
          this.logger.warn(`Failed to rank ${candidate.symbol}: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        }
      }).filter((r): r is RankedOpportunity => r !== null);

      const tieBroken = this.tieBreaker.breakTies(preRanked);

      const ranked = tieBroken.map((r, i) => ({ ...r, rank: i + 1 }));

      const stabilized = this.stabilizer.stabilize(ranked, new Map());

      for (const r of stabilized) {
        this.history.record(r.symbol, r.rank, r.rankingScore, r.investmentGrade, r.recommendation);
        this.metricsCollector.recordCandidate(
          r.rankingScore, r.rank, r.investmentGrade, r.recommendation, r.metadata.rankChange,
        );
      }

      const topMovers = this.findTopMovers(stabilized);
      const rankingDurationMs = Date.now() - startTime;
      const metrics = this.metricsCollector.getMetrics(rankingDurationMs, topMovers);

      return { ranked: stabilized, metrics };
    } catch (error) {
      this.logger.error(`Ranking failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  getComparison(candidates: RankedOpportunity[], view: ComparisonView, limit?: number): RankedOpportunity[] {
    return this.comparator.compare(candidates, view, limit);
  }

  getHistory(symbol: string): RankHistoryEntry[] {
    return this.history.getHistory(symbol);
  }

  private collectAllFactorValues(candidates: ScannerResult[]): Map<string, number[]> {
    const values = new Map<string, number[]>();
    const factorNames = [
      'opportunityScore', 'scannerScore', 'confidence', 'risk',
      'trendStrength', 'momentum', 'sectorStrength', 'liquidity',
      'financialQuality', 'growth', 'valuation', 'providerConfidence',
      'aggregationQuality', 'freshness', 'confirmation', 'historicalConsistency',
      'duplicatePenalty', 'age',
    ];

    for (const name of factorNames) {
      values.set(name, []);
    }

    for (const c of candidates) {
      values.get('opportunityScore')!.push(c.opportunityScore);
      values.get('scannerScore')!.push(c.scannerScore);
      values.get('confidence')!.push(c.confidence);
      values.get('risk')!.push(100 - c.risk);
      values.get('providerConfidence')!.push(c.metadata?.providerConfidence ?? 50);
      values.get('aggregationQuality')!.push(c.metadata?.aggregationQuality ?? 50);
      values.get('freshness')!.push(this.calcFreshness(c.timestamp));
      values.get('duplicatePenalty')!.push(c.metadata?.duplicateCount ?? 0);

      for (const m of c.metadata?.supportingMetrics ?? []) {
        if (typeof m.value === 'number' && values.has(m.name)) {
          values.get(m.name)!.push(m.value);
        }
      }
    }

    for (const [key, arr] of values) {
      if (arr.length === 0) values.set(key, [50]);
    }

    return values;
  }

  private calcFreshness(timestamp: string): number {
    const age = Date.now() - new Date(timestamp).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (age < oneDay) return 100;
    if (age < 3 * oneDay) return 80;
    if (age < 7 * oneDay) return 60;
    if (age < 30 * oneDay) return 40;
    return 20;
  }

  private calculateRiskReward(risk: number, score: number): number {
    if (risk === 0) return score > 0 ? 10 : 0;
    return Math.round(((100 - risk) / risk) * score * 100) / 100;
  }

  private estimateExpectedReturn(score: number, risk: number): number {
    return Math.round((score * 0.6 - risk * 0.3) * 100) / 100;
  }

  private buildReasons(
    candidate: ScannerResult,
    score: number,
    grade: string,
    recommendation: string,
  ): string[] {
    const reasons: string[] = [];
    reasons.push(`Ranking score: ${score.toFixed(1)}`);
    reasons.push(`Investment grade: ${grade}`);
    reasons.push(`Recommendation: ${recommendation}`);
    if (candidate.strengths.length > 0) reasons.push(`Strengths: ${candidate.strengths.slice(0, 3).join(', ')}`);
    if (candidate.risks.length > 0) reasons.push(`Risks: ${candidate.risks.slice(0, 2).join(', ')}`);
    return reasons;
  }

  private buildRankedOpportunity(
    candidate: ScannerResult,
    rank: number,
    normalizedScore: number,
    factors: RankingFactor[],
    grade: any,
    recommendation: any,
    explanation: string,
    expectedReturn: number,
    riskReward: number,
    previousRank: number | null,
    bestRank: number,
    worstRank: number,
    averageRank: number,
    trend: RankingTrend,
  ): RankedOpportunity {
    const rankChange = previousRank !== null ? rank - previousRank : null;
    return {
      symbol: candidate.symbol,
      rank,
      rankingScore: normalizedScore,
      scannerScore: candidate.scannerScore,
      opportunityScore: candidate.opportunityScore,
      confidence: candidate.confidence,
      priority: candidate.priority,
      risk: candidate.risk,
      expectedReturnEstimate: expectedReturn,
      riskRewardRatio: riskReward,
      investmentGrade: grade,
      recommendation,
      recommendationExplanation: explanation,
      reasons: this.buildReasons(candidate, normalizedScore, grade, recommendation),
      rankingFactors: factors,
      timestamp: candidate.timestamp,
      firstSeen: candidate.firstSeen,
      lastSeen: candidate.lastSeen,
      metadata: {
        rankingDurationMs: 0,
        previousRank,
        rankChange,
        bestRank,
        worstRank,
        averageRank,
        rankingTrend: trend,
        historyEntries: this.history.getHistoryCount(candidate.symbol),
        normalizedScore,
        gradeDistribution: {} as any,
        recommendationDistribution: {} as any,
      },
    };
  }

  private findTopMovers(candidates: RankedOpportunity[]): TopMover[] {
    const movers: TopMover[] = [];
    for (const c of candidates) {
      if (c.metadata.rankChange !== null && c.metadata.rankChange !== 0) {
        movers.push({
          symbol: c.symbol,
          rankChange: c.metadata.rankChange,
          scoreChange: c.metadata.normalizedScore - (c.metadata.previousRank ?? c.rank),
          direction: c.metadata.rankChange < 0 ? 'UP' : 'DOWN',
        });
      } else if (c.metadata.previousRank === null) {
        movers.push({
          symbol: c.symbol,
          rankChange: 0,
          scoreChange: 0,
          direction: 'NEW',
        });
      }
    }
    return movers.sort((a, b) => Math.abs(b.rankChange) - Math.abs(a.rankChange)).slice(0, 10);
  }
}
