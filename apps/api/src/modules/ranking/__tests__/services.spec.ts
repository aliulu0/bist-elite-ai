import { Normalizer } from '../services/normalizer.service';
import { RankingCalculator } from '../services/ranking-calculator.service';
import { GradeAssigner } from '../services/grade-assigner.service';
import { RecommendationEngine } from '../services/recommendation-engine.service';
import { TieBreaker } from '../services/tie-breaker.service';
import { RankingStabilizer } from '../services/ranking-stabilizer.service';
import { RankingHistory } from '../services/ranking-history.service';
import { RankingComparator } from '../services/ranking-comparator.service';
import { RankingMetricsCollector } from '../services/ranking-metrics-collector.service';
import {
  DEFAULT_NORMALIZATION,
  DEFAULT_GRADE_THRESHOLDS,
  DEFAULT_RECOMMENDATION_THRESHOLDS,
  DEFAULT_STABILITY,
  DEFAULT_HISTORY,
  DEFAULT_FACTOR_WEIGHTS,
} from '../ranking.config';
import { RankingFactor } from '../ranking.types';
import { buildScannerResult, buildRankedOpportunity, buildHistoryEntry } from './test-helpers';

describe('Normalizer', () => {
  let normalizer: Normalizer;

  beforeEach(() => {
    normalizer = new Normalizer(DEFAULT_NORMALIZATION);
  });

  it('should normalize scores using percentile mode', () => {
    const allValues = new Map([
      ['test', [30, 50, 70, 90]],
    ]);
    const factors: RankingFactor[] = [
      { name: 'test', rawValue: 70, normalizedValue: 0, weight: 0.5, contribution: 0, description: 'test' },
    ];
    const result = normalizer.normalize(factors, allValues);
    expect(result[0].normalizedValue).toBeGreaterThan(0);
    expect(result[0].normalizedValue).toBeLessThanOrEqual(100);
  });

  it('should normalize a single score against a dataset', () => {
    const score = normalizer.normalizeScore(75, [50, 60, 70, 80, 90]);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should handle empty dataset gracefully', () => {
    const score = normalizer.normalizeScore(50, []);
    expect(score).toBe(50);
  });

  it('should handle z-score mode', () => {
    const zNormalizer = new Normalizer({ ...DEFAULT_NORMALIZATION, mode: 'Z_SCORE' });
    const allValues = new Map([['test', [30, 50, 70, 90]]]);
    const factors: RankingFactor[] = [
      { name: 'test', rawValue: 70, normalizedValue: 0, weight: 0.5, contribution: 0, description: 'test' },
    ];
    const result = zNormalizer.normalize(factors, allValues);
    expect(result[0].normalizedValue).toBeGreaterThan(0);
    expect(result[0].normalizedValue).toBeLessThanOrEqual(100);
  });

  it('should handle min-max mode', () => {
    const mmNormalizer = new Normalizer({ ...DEFAULT_NORMALIZATION, mode: 'MIN_MAX' });
    const allValues = new Map([['test', [20, 40, 60, 80, 100]]]);
    const factors: RankingFactor[] = [
      { name: 'test', rawValue: 60, normalizedValue: 0, weight: 0.5, contribution: 0, description: 'test' },
    ];
    const result = mmNormalizer.normalize(factors, allValues);
    expect(result[0].normalizedValue).toBe(50);
  });

  it('should handle single-value dataset', () => {
    const score = normalizer.normalizeScore(50, [50]);
    expect(score).toBe(50);
  });
});

describe('RankingCalculator', () => {
  let calculator: RankingCalculator;

  beforeEach(() => {
    calculator = new RankingCalculator(DEFAULT_FACTOR_WEIGHTS);
  });

  it('should calculate factors from a scanner result', () => {
    const candidate = buildScannerResult();
    const factors = calculator.calculateFactors(candidate, 50);
    expect(factors.length).toBe(18);
    expect(factors[0].name).toBe('opportunityScore');
    expect(factors[0].rawValue).toBe(65);
  });

  it('should calculate raw score from factors', () => {
    const candidate = buildScannerResult();
    const factors = calculator.calculateFactors(candidate, 50);
    for (const f of factors) f.normalizedValue = f.rawValue;
    const score = calculator.calculateRawScore(factors);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should produce higher scores for stronger candidates', () => {
    const strong = buildScannerResult({ scannerScore: 90, confidence: 85, risk: 5 });
    const weak = buildScannerResult({ scannerScore: 30, confidence: 25, risk: 80 });
    const strongFactors = calculator.calculateFactors(strong, 50);
    const weakFactors = calculator.calculateFactors(weak, 50);
    for (const f of strongFactors) f.normalizedValue = f.rawValue;
    for (const f of weakFactors) f.normalizedValue = f.rawValue;
    expect(calculator.calculateRawScore(strongFactors)).toBeGreaterThan(calculator.calculateRawScore(weakFactors));
  });

  it('should extract metrics from supporting metrics', () => {
    const candidate = buildScannerResult({
      metadata: {
        ...buildScannerResult().metadata,
        supportingMetrics: [
          { name: 'trendStrength', value: 85, description: 'Trend', module: 'trendTransition' },
        ],
      },
    });
    const factors = calculator.calculateFactors(candidate, 50);
    const trend = factors.find((f) => f.name === 'trendStrength');
    expect(trend?.rawValue).toBe(85);
  });

  it('should use fallback when metric missing', () => {
    const candidate = buildScannerResult({
      metadata: { ...buildScannerResult().metadata, supportingMetrics: [] },
    });
    const factors = calculator.calculateFactors(candidate, 50);
    const trend = factors.find((f) => f.name === 'trendStrength');
    expect(trend?.rawValue).toBe(50);
  });
});

describe('GradeAssigner', () => {
  let assigner: GradeAssigner;

  beforeEach(() => {
    assigner = new GradeAssigner(DEFAULT_GRADE_THRESHOLDS);
  });

  it('should assign AAA for score >= 90', () => {
    expect(assigner.assign(95)).toBe('AAA');
    expect(assigner.assign(90)).toBe('AAA');
  });

  it('should assign AA for score >= 80', () => {
    expect(assigner.assign(85)).toBe('AA');
    expect(assigner.assign(80)).toBe('AA');
  });

  it('should assign A for score >= 70', () => {
    expect(assigner.assign(75)).toBe('A');
  });

  it('should assign BBB for score >= 60', () => {
    expect(assigner.assign(65)).toBe('BBB');
  });

  it('should assign BB for score >= 50', () => {
    expect(assigner.assign(55)).toBe('BB');
  });

  it('should assign B for score >= 40', () => {
    expect(assigner.assign(45)).toBe('B');
  });

  it('should assign C for score >= 0', () => {
    expect(assigner.assign(20)).toBe('C');
  });

  it('should return grade descriptions', () => {
    expect(assigner.getGradeDescription('AAA')).toContain('Exceptional');
    expect(assigner.getGradeDescription('REJECT')).toContain('Does not meet');
  });

  it('should compute grade distribution', () => {
    const dist = assigner.getGradeDistribution(['AAA', 'AA', 'A', 'AAA']);
    expect(dist.AAA).toBe(2);
    expect(dist.AA).toBe(1);
    expect(dist.A).toBe(1);
  });
});

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine(DEFAULT_RECOMMENDATION_THRESHOLDS);
  });

  it('should return STRONG_BUY for high score with low risk', () => {
    const result = engine.generate(90, 'AAA', 20, 85);
    expect(result.recommendation).toBe('STRONG_BUY');
  });

  it('should return BUY for score above buy threshold', () => {
    const result = engine.generate(75, 'A', 30, 70);
    expect(result.recommendation).toBe('BUY');
  });

  it('should return WATCH for moderate score', () => {
    const result = engine.generate(60, 'BBB', 40, 60);
    expect(result.recommendation).toBe('WATCH');
  });

  it('should return NEUTRAL for neutral range', () => {
    const result = engine.generate(45, 'BB', 50, 50);
    expect(result.recommendation).toBe('NEUTRAL');
  });

  it('should return REDUCE for low score', () => {
    const result = engine.generate(30, 'B', 60, 40);
    expect(result.recommendation).toBe('REDUCE');
  });

  it('should return AVOID for very low score', () => {
    const result = engine.generate(15, 'C', 70, 30);
    expect(result.recommendation).toBe('AVOID');
  });

  it('should return AVOID for REJECT grade', () => {
    const result = engine.generate(5, 'REJECT', 80, 20);
    expect(result.recommendation).toBe('AVOID');
  });

  it('should always include explanation', () => {
    const result = engine.generate(75, 'A', 30, 70);
    expect(result.explanation).toBeTruthy();
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it('should compute recommendation distribution', () => {
    const dist = engine.getRecommendationDistribution(['BUY', 'BUY', 'WATCH']);
    expect(dist.BUY).toBe(2);
    expect(dist.WATCH).toBe(1);
  });
});

describe('TieBreaker', () => {
  let tieBreaker: TieBreaker;

  beforeEach(() => {
    tieBreaker = new TieBreaker();
  });

  it('should break ties by confidence when scores equal', () => {
    const items = [
      { symbol: 'A', rankingScore: 70, confidence: 60, risk: 20, timestamp: new Date().toISOString() },
      { symbol: 'B', rankingScore: 70, confidence: 80, risk: 20, timestamp: new Date().toISOString() },
    ];
    const sorted = tieBreaker.breakTies(items);
    expect(sorted[0].symbol).toBe('B');
  });

  it('should break ties by risk when confidence equal', () => {
    const items = [
      { symbol: 'A', rankingScore: 70, confidence: 70, risk: 30, timestamp: new Date().toISOString() },
      { symbol: 'B', rankingScore: 70, confidence: 70, risk: 10, timestamp: new Date().toISOString() },
    ];
    const sorted = tieBreaker.breakTies(items);
    expect(sorted[0].symbol).toBe('B');
  });

  it('should break ties by ticker when all else equal', () => {
    const now = new Date().toISOString();
    const items = [
      { symbol: 'Z', rankingScore: 70, confidence: 70, risk: 20, timestamp: now },
      { symbol: 'A', rankingScore: 70, confidence: 70, risk: 20, timestamp: now },
    ];
    const sorted = tieBreaker.breakTies(items);
    expect(sorted[0].symbol).toBe('A');
  });

  it('should not mutate original array', () => {
    const items = [
      { symbol: 'B', rankingScore: 70, confidence: 80, risk: 20, timestamp: new Date().toISOString() },
      { symbol: 'A', rankingScore: 70, confidence: 60, risk: 20, timestamp: new Date().toISOString() },
    ];
    tieBreaker.breakTies(items);
    expect(items[0].symbol).toBe('B');
  });
});

describe('RankingStabilizer', () => {
  let stabilizer: RankingStabilizer;

  beforeEach(() => {
    stabilizer = new RankingStabilizer(DEFAULT_STABILITY);
  });

  it('should keep rank unchanged when delta below threshold', () => {
    const candidates = [
      buildRankedOpportunity({ symbol: 'A', rank: 3 }),
    ];
    stabilizer.stabilize(candidates, new Map());
    const candidates2 = [
      buildRankedOpportunity({ symbol: 'A', rank: 4 }),
    ];
    const result = stabilizer.stabilize(candidates2, new Map());
    expect(result[0].rank).toBe(3);
  });

  it('should allow rank change when delta above threshold', () => {
    const candidates = [
      buildRankedOpportunity({ symbol: 'A', rank: 3 }),
    ];
    stabilizer.stabilize(candidates, new Map());
    const candidates2 = [
      buildRankedOpportunity({ symbol: 'A', rank: 10 }),
    ];
    const result = stabilizer.stabilize(candidates2, new Map());
    expect(result[0].rank).toBe(10);
  });

  it('should return previous rank', () => {
    stabilizer.stabilize([buildRankedOpportunity({ symbol: 'A', rank: 5 })], new Map());
    expect(stabilizer.getPreviousRank('A')).toBe(5);
  });

  it('should clear state', () => {
    stabilizer.stabilize([buildRankedOpportunity({ symbol: 'A', rank: 5 })], new Map());
    stabilizer.clear();
    expect(stabilizer.getPreviousRank('A')).toBeNull();
  });
});

describe('RankingHistory', () => {
  let history: RankingHistory;

  beforeEach(() => {
    history = new RankingHistory(DEFAULT_HISTORY);
  });

  it('should record ranking history', () => {
    history.record('A', 1, 85, 'AAA', 'STRONG_BUY');
    expect(history.getHistory('A').length).toBe(1);
  });

  it('should get previous rank', () => {
    history.record('A', 5, 65, 'BBB', 'BUY');
    history.record('A', 3, 75, 'A', 'BUY');
    expect(history.getPreviousRank('A')).toBe(5);
  });

  it('should return null for first entry', () => {
    history.record('A', 1, 85, 'AAA', 'STRONG_BUY');
    expect(history.getPreviousRank('A')).toBeNull();
  });

  it('should get best rank', () => {
    history.record('A', 5, 65, 'BBB', 'BUY');
    history.record('A', 2, 80, 'AA', 'BUY');
    history.record('A', 4, 70, 'A', 'BUY');
    expect(history.getBestRank('A')).toBe(2);
  });

  it('should get worst rank', () => {
    history.record('A', 5, 65, 'BBB', 'BUY');
    history.record('A', 2, 80, 'AA', 'BUY');
    history.record('A', 8, 50, 'BB', 'WATCH');
    expect(history.getWorstRank('A')).toBe(8);
  });

  it('should get average rank', () => {
    history.record('A', 3, 70, 'A', 'BUY');
    history.record('A', 7, 55, 'BBB', 'WATCH');
    expect(history.getAverageRank('A')).toBe(5);
  });

  it('should get rank trend', () => {
    history.record('A', 10, 50, 'BB', 'WATCH');
    history.record('A', 5, 70, 'A', 'BUY');
    expect(history.getRankTrend('A')).toBe('IMPROVING');
  });

  it('should return NEW for single entry', () => {
    history.record('A', 5, 65, 'BBB', 'BUY');
    expect(history.getRankTrend('A')).toBe('NEW');
  });

  it('should return null for unknown symbol', () => {
    expect(history.getPreviousRank('UNKNOWN')).toBeNull();
    expect(history.getBestRank('UNKNOWN')).toBe(0);
  });

  it('should clear history', () => {
    history.record('A', 1, 85, 'AAA', 'STRONG_BUY');
    history.clear();
    expect(history.getHistory('A').length).toBe(0);
  });
});

describe('RankingComparator', () => {
  let comparator: RankingComparator;

  beforeEach(() => {
    comparator = new RankingComparator();
  });

  it('should return top gainers', () => {
    const candidates = [
      buildRankedOpportunity({ symbol: 'A', metadata: { ...buildRankedOpportunity().metadata, rankChange: -3, rankingTrend: 'IMPROVING' } }),
      buildRankedOpportunity({ symbol: 'B', metadata: { ...buildRankedOpportunity().metadata, rankChange: 2, rankingTrend: 'DECLINING' } }),
    ];
    const gainers = comparator.compare(candidates, 'TOP_GAINERS');
    expect(gainers.length).toBe(1);
    expect(gainers[0].symbol).toBe('A');
  });

  it('should return top losers', () => {
    const candidates = [
      buildRankedOpportunity({ symbol: 'A', metadata: { ...buildRankedOpportunity().metadata, rankChange: -3 } }),
      buildRankedOpportunity({ symbol: 'B', metadata: { ...buildRankedOpportunity().metadata, rankChange: 5 } }),
    ];
    const losers = comparator.compare(candidates, 'TOP_LOSERS');
    expect(losers.length).toBe(1);
    expect(losers[0].symbol).toBe('B');
  });

  it('should return highest confidence', () => {
    const candidates = [
      buildRankedOpportunity({ symbol: 'A', confidence: 60 }),
      buildRankedOpportunity({ symbol: 'B', confidence: 90 }),
    ];
    const result = comparator.compare(candidates, 'HIGHEST_CONFIDENCE');
    expect(result[0].symbol).toBe('B');
  });

  it('should return lowest risk', () => {
    const candidates = [
      buildRankedOpportunity({ symbol: 'A', risk: 50 }),
      buildRankedOpportunity({ symbol: 'B', risk: 10 }),
    ];
    const result = comparator.compare(candidates, 'LOWEST_RISK');
    expect(result[0].symbol).toBe('B');
  });

  it('should respect limit', () => {
    const candidates = Array.from({ length: 20 }, (_, i) =>
      buildRankedOpportunity({ symbol: `S${i}`, confidence: 50 + i }),
    );
    const result = comparator.compare(candidates, 'HIGHEST_CONFIDENCE', 5);
    expect(result.length).toBe(5);
  });
});

describe('RankingMetricsCollector', () => {
  let collector: RankingMetricsCollector;

  beforeEach(() => {
    collector = new RankingMetricsCollector();
  });

  it('should record candidates and compute metrics', () => {
    collector.recordCandidate(80, 1, 'A', 'BUY', null);
    collector.recordCandidate(65, 2, 'BBB', 'WATCH', -1);
    const metrics = collector.getMetrics(50, []);
    expect(metrics.totalRanked).toBe(2);
    expect(metrics.averageRankingScore).toBe(72.5);
    expect(metrics.gradeDistribution.A).toBe(1);
    expect(metrics.gradeDistribution.BBB).toBe(1);
    expect(metrics.recommendationDistribution.BUY).toBe(1);
    expect(metrics.rankChangeDistribution.new).toBe(1);
    expect(metrics.rankChangeDistribution.improved).toBe(1);
  });

  it('should reset metrics', () => {
    collector.recordCandidate(80, 1, 'A', 'BUY', null);
    collector.reset();
    const metrics = collector.getMetrics(0, []);
    expect(metrics.totalRanked).toBe(0);
    expect(metrics.averageRankingScore).toBe(0);
  });

  it('should handle zero candidates gracefully', () => {
    const metrics = collector.getMetrics(0, []);
    expect(metrics.totalRanked).toBe(0);
    expect(metrics.averageRankingScore).toBe(0);
  });
});
