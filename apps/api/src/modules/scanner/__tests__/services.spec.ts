import { FilterEngine } from '../services/filter-engine.service';
import { Ranker } from '../services/ranker.service';
import { SortEngine } from '../services/sort-engine.service';
import { Categorizer } from '../services/categorizer.service';
import { Grouper } from '../services/grouper.service';
import { DuplicateMerger } from '../services/duplicate-merger.service';
import { HistoryTracker } from '../services/history-tracker.service';
import { WatchlistManager } from '../services/watchlist-manager.service';
import { ScannerMetricsCollector } from '../services/scanner-metrics-collector.service';
import {
  DEFAULT_SCANNER_FILTERS,
  DEFAULT_SCANNER_RANKING,
  DEFAULT_CATEGORY_THRESHOLDS,
  DEFAULT_GROUP_CONFIG,
  DEFAULT_DUPLICATE_MERGE,
  DEFAULT_WATCHLISTS,
} from '../scanner.config';
import { buildOpportunityResult, buildScannerResult, buildStrongOpportunity, buildWeakOpportunity, buildOpportunityBatch } from './test-helpers';

describe('FilterEngine', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine(DEFAULT_SCANNER_FILTERS);
  });

  it('should pass opportunities that meet all filter criteria', () => {
    const opp = buildOpportunityResult({ opportunityScore: 70, confidence: 60, priority: 'HIGH' });
    const result = engine.evaluateFilter(opp);
    expect(result.passed).toBe(true);
    expect(result.rejectionReason).toBeNull();
  });

  it('should reject opportunities below minimum opportunity score', () => {
    const opp = buildOpportunityResult({ opportunityScore: 10 });
    const result = engine.evaluateFilter(opp);
    expect(result.passed).toBe(false);
    expect(result.rejectionReason).toContain('Score');
  });

  it('should reject opportunities below minimum confidence', () => {
    const opp = buildOpportunityResult({ opportunityScore: 50, confidence: 10 });
    const result = engine.evaluateFilter(opp);
    expect(result.passed).toBe(false);
    expect(result.rejectionReason).toContain('Confidence');
  });

  it('should reject IGNORE priority', () => {
    const opp = buildOpportunityResult({ opportunityScore: 50, confidence: 60, priority: 'IGNORE' });
    const result = engine.evaluateFilter(opp);
    expect(result.passed).toBe(false);
    expect(result.rejectionReason).toContain('Priority');
  });

  it('should reject expired age', () => {
    const opp = buildOpportunityResult({ opportunityScore: 50, confidence: 60, priority: 'HIGH', age: 'EXPIRED' });
    const result = engine.evaluateFilter(opp);
    expect(result.passed).toBe(false);
    expect(result.rejectionReason).toContain('Age');
  });

  it('should track filter statistics correctly', () => {
    const opps = [
      buildOpportunityResult({ opportunityScore: 5 }),
      buildOpportunityResult({ opportunityScore: 50, confidence: 10 }),
      buildOpportunityResult({ opportunityScore: 50, confidence: 60, priority: 'IGNORE' }),
      buildOpportunityResult({ opportunityScore: 80, confidence: 70, priority: 'HIGH' }),
    ];
    engine.filter(opps);
    const stats = engine.getStats();
    expect(stats.totalBefore).toBe(4);
    expect(stats.filteredByScore).toBe(1);
    expect(stats.filteredByConfidence).toBe(1);
    expect(stats.filteredByPriority).toBe(1);
    expect(stats.totalAfter).toBe(1);
  });

  it('should filter by allowed opportunity types', () => {
    const customEngine = new FilterEngine({
      ...DEFAULT_SCANNER_FILTERS,
      allowedOpportunityTypes: ['MOMENTUM_BREAKOUT'],
    });
    const opp1 = buildOpportunityResult({ opportunityScore: 80, confidence: 70, opportunityTypes: ['MOMENTUM_BREAKOUT'] });
    const opp2 = buildOpportunityResult({ opportunityScore: 80, confidence: 70, opportunityTypes: ['UNDERVALUATION'] });
    expect(customEngine.evaluateFilter(opp1).passed).toBe(true);
    expect(customEngine.evaluateFilter(opp2).passed).toBe(false);
  });

  it('should filter by confirmation level', () => {
    const customEngine = new FilterEngine({
      ...DEFAULT_SCANNER_FILTERS,
      allowedConfirmationLevels: ['DOUBLE', 'TRIPLE', 'MULTI'],
    });
    const opp1 = buildOpportunityResult({ opportunityScore: 80, confidence: 70, confirmationLevel: 'DOUBLE' });
    const opp2 = buildOpportunityResult({ opportunityScore: 80, confidence: 70, confirmationLevel: 'NONE' });
    expect(customEngine.evaluateFilter(opp1).passed).toBe(true);
    expect(customEngine.evaluateFilter(opp2).passed).toBe(false);
  });

  it('should reset stats between filter calls', () => {
    engine.filter([buildOpportunityResult({ opportunityScore: 5 })]);
    expect(engine.getStats().filteredByScore).toBe(1);
    engine.filter([buildOpportunityResult({ opportunityScore: 80, confidence: 70, priority: 'HIGH' })]);
    expect(engine.getStats().filteredByScore).toBe(0);
  });
});

describe('Ranker', () => {
  let ranker: Ranker;

  beforeEach(() => {
    ranker = new Ranker(DEFAULT_SCANNER_RANKING);
  });

  it('should calculate scanner score from opportunity', () => {
    const opp = buildOpportunityResult({ opportunityScore: 80, confidence: 70 });
    const score = ranker.calculateScannerScore(opp, 75, [], 0);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should give higher scores to stronger opportunities', () => {
    const strong = buildOpportunityResult({ opportunityScore: 90, confidence: 85 });
    const weak = buildOpportunityResult({ opportunityScore: 40, confidence: 35 });
    const strongScore = ranker.calculateScannerScore(strong, 85, [], 0);
    const weakScore = ranker.calculateScannerScore(weak, 35, [], 0);
    expect(strongScore).toBeGreaterThan(weakScore);
  });

  it('should penalize for duplicates', () => {
    const opp = buildOpportunityResult({ opportunityScore: 70, confidence: 65 });
    const scoreNoDup = ranker.calculateScannerScore(opp, 65, [], 0);
    const scoreWithDup = ranker.calculateScannerScore(opp, 65, [], 5);
    expect(scoreWithDup).toBeLessThan(scoreNoDup);
  });

  it('should factor in history', () => {
    const opp = buildOpportunityResult({ opportunityScore: 70, confidence: 65 });
    const history = [{ timestamp: new Date().toISOString(), scannerScore: 60, opportunityScore: 60, priority: 'MEDIUM' as const, category: 'CUSTOM' as const, status: 'ACTIVE' as const, firstSeen: new Date().toISOString() }];
    const score = ranker.calculateScannerScore(opp, 65, history, 0);
    expect(score).toBeGreaterThan(0);
  });

  it('should calculate risk from risks and warnings', () => {
    const risk = ranker.calculateRisk(['risk1', 'risk2'], ['warn1']);
    expect(risk).toBe(40); // 2*15 + 1*10
  });

  it('should cap risk at 100', () => {
    const risks = Array.from({ length: 10 }, (_, i) => `risk${i}`);
    const warnings = Array.from({ length: 10 }, (_, i) => `warn${i}`);
    const risk = ranker.calculateRisk(risks, warnings);
    expect(risk).toBe(100);
  });
});

describe('SortEngine', () => {
  let engine: SortEngine;

  beforeEach(() => {
    engine = new SortEngine();
  });

  it('should sort by score descending', () => {
    const results = [
      buildScannerResult({ symbol: 'A', scannerScore: 50 }),
      buildScannerResult({ symbol: 'B', scannerScore: 80 }),
      buildScannerResult({ symbol: 'C', scannerScore: 65 }),
    ];
    const sorted = engine.sort(results, 'SCORE_DESC');
    expect(sorted[0].symbol).toBe('B');
    expect(sorted[1].symbol).toBe('C');
    expect(sorted[2].symbol).toBe('A');
  });

  it('should sort by confidence descending', () => {
    const results = [
      buildScannerResult({ symbol: 'A', confidence: 60 }),
      buildScannerResult({ symbol: 'B', confidence: 90 }),
      buildScannerResult({ symbol: 'C', confidence: 75 }),
    ];
    const sorted = engine.sort(results, 'CONFIDENCE_DESC');
    expect(sorted[0].symbol).toBe('B');
    expect(sorted[1].symbol).toBe('C');
    expect(sorted[2].symbol).toBe('A');
  });

  it('should sort by risk ascending', () => {
    const results = [
      buildScannerResult({ symbol: 'A', risk: 50 }),
      buildScannerResult({ symbol: 'B', risk: 20 }),
      buildScannerResult({ symbol: 'C', risk: 70 }),
    ];
    const sorted = engine.sort(results, 'RISK_ASC');
    expect(sorted[0].symbol).toBe('B');
    expect(sorted[1].symbol).toBe('A');
    expect(sorted[2].symbol).toBe('C');
  });

  it('should sort alphabetically', () => {
    const results = [
      buildScannerResult({ symbol: 'Z' }),
      buildScannerResult({ symbol: 'A' }),
      buildScannerResult({ symbol: 'M' }),
    ];
    const sorted = engine.sort(results, 'ALPHABETICAL');
    expect(sorted.map((r) => r.symbol)).toEqual(['A', 'M', 'Z']);
  });

  it('should not mutate original array', () => {
    const results = [
      buildScannerResult({ symbol: 'A', scannerScore: 50 }),
      buildScannerResult({ symbol: 'B', scannerScore: 80 }),
    ];
    engine.sort(results, 'SCORE_DESC');
    expect(results[0].symbol).toBe('A');
  });
});

describe('Categorizer', () => {
  let categorizer: Categorizer;

  beforeEach(() => {
    categorizer = new Categorizer(DEFAULT_CATEGORY_THRESHOLDS);
  });

  it('should assign HOT for high score with critical priority', () => {
    const result = buildScannerResult({
      scannerScore: 90,
      priority: 'CRITICAL',
      opportunityTypes: ['MULTI_FACTOR'],
    });
    expect(categorizer.assign(result)).toBe('HOT');
  });

  it('should assign MOMENTUM for momentum type', () => {
    const result = buildScannerResult({
      scannerScore: 70,
      opportunityTypes: ['MOMENTUM_BREAKOUT'],
    });
    expect(categorizer.assign(result)).toBe('MOMENTUM');
  });

  it('should assign RECOVERY for trend reversal', () => {
    const result = buildScannerResult({
      scannerScore: 60,
      opportunityTypes: ['TREND_REVERSAL'],
    });
    expect(categorizer.assign(result)).toBe('RECOVERY');
  });

  it('should assign UNDERVALUED for undervaluation type', () => {
    const result = buildScannerResult({
      scannerScore: 55,
      opportunityTypes: ['UNDERVALUATION'],
    });
    expect(categorizer.assign(result)).toBe('UNDERVALUED');
  });

  it('should assign GROWTH for fundamental improvement', () => {
    const result = buildScannerResult({
      scannerScore: 65,
      opportunityTypes: ['FUNDAMENTAL_IMPROVEMENT'],
    });
    expect(categorizer.assign(result)).toBe('GROWTH');
  });

  it('should assign EMERGING for new opportunities', () => {
    const result = buildScannerResult({
      scannerScore: 65,
      age: 'NEW',
      opportunityTypes: ['CUSTOM'],
    });
    expect(categorizer.assign(result)).toBe('EMERGING');
  });

  it('should assign DEFENSIVE for low risk with minimal weaknesses', () => {
    const result = buildScannerResult({
      scannerScore: 40,
      risks: [],
      weaknesses: [],
      opportunityTypes: ['CUSTOM'],
    });
    expect(categorizer.assign(result)).toBe('DEFENSIVE');
  });

  it('should assign SPECULATIVE as fallback', () => {
    const result = buildScannerResult({
      scannerScore: 45,
      risks: ['r1', 'r2', 'r3'],
      weaknesses: ['w1', 'w2', 'w3'],
      opportunityTypes: ['CUSTOM'],
    });
    expect(categorizer.assign(result)).toBe('SPECULATIVE');
  });

  it('should categorize all results', () => {
    const results = [
      buildScannerResult({ scannerScore: 90, priority: 'CRITICAL', opportunityTypes: ['MULTI_FACTOR'] }),
      buildScannerResult({ scannerScore: 40, opportunityTypes: ['CUSTOM'] }),
    ];
    const categorized = categorizer.categorizeAll(results);
    expect(categorized[0].category).toBe('HOT');
    expect(categorized[1].category).toBeDefined();
  });
});

describe('Grouper', () => {
  let grouper: Grouper;

  beforeEach(() => {
    grouper = new Grouper(DEFAULT_GROUP_CONFIG);
  });

  it('should return all results in single group when NONE', () => {
    const results = [
      buildScannerResult({ symbol: 'A' }),
      buildScannerResult({ symbol: 'B' }),
    ];
    const groups = grouper.group(results, 'NONE');
    expect(groups.size).toBe(1);
    expect(groups.get('ALL')?.length).toBe(2);
  });

  it('should group by priority', () => {
    const results = [
      buildScannerResult({ symbol: 'A', priority: 'HIGH' }),
      buildScannerResult({ symbol: 'B', priority: 'LOW' }),
      buildScannerResult({ symbol: 'C', priority: 'HIGH' }),
    ];
    const groups = grouper.group(results, 'PRIORITY');
    expect(groups.get('HIGH')?.length).toBe(2);
    expect(groups.get('LOW')?.length).toBe(1);
  });

  it('should group by age', () => {
    const results = [
      buildScannerResult({ symbol: 'A', age: 'NEW' }),
      buildScannerResult({ symbol: 'B', age: 'STABLE' }),
    ];
    const groups = grouper.group(results, 'AGE');
    expect(groups.get('NEW')?.length).toBe(1);
    expect(groups.get('STABLE')?.length).toBe(1);
  });

  it('should group by risk level', () => {
    const results = [
      buildScannerResult({ symbol: 'A', risk: 10 }),
      buildScannerResult({ symbol: 'B', risk: 40 }),
      buildScannerResult({ symbol: 'C', risk: 85 }),
    ];
    const groups = grouper.group(results, 'RISK');
    expect(groups.get('LOW_RISK')?.length).toBe(1);
    expect(groups.get('MEDIUM_RISK')?.length).toBe(1);
    expect(groups.get('VERY_HIGH_RISK')?.length).toBe(1);
  });

  it('should group by signal strength', () => {
    const results = [
      buildScannerResult({ symbol: 'A', scannerScore: 85 }),
      buildScannerResult({ symbol: 'B', scannerScore: 65 }),
      buildScannerResult({ symbol: 'C', scannerScore: 40 }),
    ];
    const groups = grouper.group(results, 'SIGNAL_STRENGTH');
    expect(groups.get('STRONG')?.length).toBe(1);
    expect(groups.get('MODERATE')?.length).toBe(1);
    expect(groups.get('WEAK')?.length).toBe(1);
  });

  it('should group by opportunity type', () => {
    const results = [
      buildScannerResult({ symbol: 'A', opportunityTypes: ['MOMENTUM_BREAKOUT'] }),
      buildScannerResult({ symbol: 'B', opportunityTypes: ['UNDERVALUATION'] }),
    ];
    const groups = grouper.group(results, 'OPPORTUNITY_TYPE');
    expect(groups.get('MOMENTUM_BREAKOUT')?.length).toBe(1);
    expect(groups.get('UNDERVALUATION')?.length).toBe(1);
  });

  it('should sort within groups by score', () => {
    const results = [
      buildScannerResult({ symbol: 'A', priority: 'HIGH', scannerScore: 60 }),
      buildScannerResult({ symbol: 'B', priority: 'HIGH', scannerScore: 80 }),
    ];
    const groups = grouper.group(results, 'PRIORITY');
    const highGroup = groups.get('HIGH')!;
    expect(highGroup[0].symbol).toBe('B');
    expect(highGroup[1].symbol).toBe('A');
  });
});

describe('DuplicateMerger', () => {
  let merger: DuplicateMerger;

  beforeEach(() => {
    merger = new DuplicateMerger(DEFAULT_DUPLICATE_MERGE);
  });

  it('should return unique opportunities without duplicates', () => {
    const opps = [
      buildOpportunityResult({ symbol: 'A' }),
      buildOpportunityResult({ symbol: 'B' }),
    ];
    const results = merger.merge(opps);
    expect(results.length).toBe(2);
    expect(results[0].duplicateCount).toBe(0);
    expect(results[1].duplicateCount).toBe(0);
  });

  it('should merge duplicate opportunities', () => {
    const opps = [
      buildOpportunityResult({ symbol: 'A', opportunityScore: 70 }),
      buildOpportunityResult({ symbol: 'A', opportunityScore: 80 }),
    ];
    const results = merger.merge(opps);
    expect(results.length).toBe(1);
    expect(results[0].duplicateCount).toBe(1);
    expect(results[0].opportunity.opportunityScore).toBe(80); // HIGHEST strategy
  });

  it('should track history across merges', () => {
    merger.merge([buildOpportunityResult({ symbol: 'A' })]);
    merger.merge([buildOpportunityResult({ symbol: 'A' })]);
    const history = merger.getHistory('A');
    expect(history.length).toBe(2);
  });

  it('should clear history', () => {
    merger.merge([buildOpportunityResult({ symbol: 'A' })]);
    merger.clearHistory();
    expect(merger.getHistory('A').length).toBe(0);
  });

  it('should handle average merge strategy', () => {
    const avgMerger = new DuplicateMerger({ ...DEFAULT_DUPLICATE_MERGE, mergeStrategy: 'AVERAGE' });
    const opps = [
      buildOpportunityResult({ symbol: 'A', opportunityScore: 60, confidence: 50 }),
      buildOpportunityResult({ symbol: 'A', opportunityScore: 80, confidence: 70 }),
    ];
    const results = avgMerger.merge(opps);
    expect(results[0].opportunity.opportunityScore).toBe(70);
    expect(results[0].opportunity.confidence).toBe(60);
  });

  it('should handle most recent merge strategy', () => {
    const recentMerger = new DuplicateMerger({ ...DEFAULT_DUPLICATE_MERGE, mergeStrategy: 'MOST_RECENT' });
    const opps = [
      buildOpportunityResult({ symbol: 'A', opportunityScore: 60 }),
      buildOpportunityResult({ symbol: 'A', opportunityScore: 80 }),
    ];
    const results = recentMerger.merge(opps);
    expect(results[0].opportunity.opportunityScore).toBe(80); // returns incoming
  });

  it('should return empty array for no input', () => {
    const results = merger.merge([]);
    expect(results.length).toBe(0);
  });
});

describe('HistoryTracker', () => {
  let tracker: HistoryTracker;

  beforeEach(() => {
    tracker = new HistoryTracker();
  });

  it('should track first scan as NEW', () => {
    const result = buildScannerResult({ symbol: 'A' });
    tracker.track(result);
    const history = tracker.getHistory('A');
    expect(history.length).toBe(1);
    expect(history[0].status).toBe('NEW');
  });

  it('should track score changes', () => {
    tracker.track(buildScannerResult({ symbol: 'A', scannerScore: 50 }));
    tracker.track(buildScannerResult({ symbol: 'A', scannerScore: 70 }));
    const delta = tracker.getScoreDelta('A');
    expect(delta).toBe(20);
  });

  it('should return null for single entry history', () => {
    tracker.track(buildScannerResult({ symbol: 'A' }));
    expect(tracker.getScoreDelta('A')).toBeNull();
    expect(tracker.getPriorityDelta('A')).toBeNull();
    expect(tracker.getCategoryDelta('A')).toBeNull();
  });

  it('should get first seen and last seen', () => {
    const t1 = '2025-01-01T00:00:00Z';
    const t2 = '2025-01-02T00:00:00Z';
    tracker.track(buildScannerResult({ symbol: 'A', timestamp: t1 }));
    tracker.track(buildScannerResult({ symbol: 'A', timestamp: t2 }));
    expect(tracker.getFirstSeen('A')).toBe(t1);
    expect(tracker.getLastSeen('A')).toBe(t2);
  });

  it('should return null for unknown symbol', () => {
    expect(tracker.getHistory('UNKNOWN')).toEqual([]);
    expect(tracker.getFirstSeen('UNKNOWN')).toBeNull();
    expect(tracker.getLastSeen('UNKNOWN')).toBeNull();
  });

  it('should track all results', () => {
    tracker.trackAll([
      buildScannerResult({ symbol: 'A' }),
      buildScannerResult({ symbol: 'B' }),
    ]);
    expect(tracker.getHistory('A').length).toBe(1);
    expect(tracker.getHistory('B').length).toBe(1);
  });

  it('should clear history', () => {
    tracker.track(buildScannerResult({ symbol: 'A' }));
    tracker.clearHistory();
    expect(tracker.getHistory('A').length).toBe(0);
  });
});

describe('WatchlistManager', () => {
  let manager: WatchlistManager;

  beforeEach(() => {
    manager = new WatchlistManager();
  });

  it('should add item to watchlist', () => {
    const result = buildScannerResult({ symbol: 'A' });
    manager.addToWatchlist('ALL', result);
    expect(manager.getWatchlist('ALL').length).toBe(1);
  });

  it('should not duplicate items in watchlist', () => {
    const result = buildScannerResult({ symbol: 'A' });
    manager.addToWatchlist('ALL', result);
    manager.addToWatchlist('ALL', result);
    expect(manager.getWatchlist('ALL').length).toBe(1);
  });

  it('should respect max items limit', () => {
    const smallManager = new WatchlistManager([
      { name: 'ALL', filters: {}, sortMode: 'SCORE_DESC', maxItems: 2, autoRefresh: true, refreshIntervalMs: 60000 },
    ]);
    smallManager.addToWatchlist('ALL', buildScannerResult({ symbol: 'A' }));
    smallManager.addToWatchlist('ALL', buildScannerResult({ symbol: 'B' }));
    smallManager.addToWatchlist('ALL', buildScannerResult({ symbol: 'C' }));
    expect(smallManager.getWatchlist('ALL').length).toBe(2);
  });

  it('should remove item from watchlist', () => {
    manager.addToWatchlist('ALL', buildScannerResult({ symbol: 'A' }));
    manager.removeFromWatchlist('ALL', 'A');
    expect(manager.getWatchlist('ALL').length).toBe(0);
  });

  it('should populate all watchlists with filtered data', () => {
    const candidates = [
      buildScannerResult({ symbol: 'A', opportunityScore: 80, confidence: 75, risk: 20, priority: 'HIGH', opportunityTypes: ['MOMENTUM_BREAKOUT'] }),
      buildScannerResult({ symbol: 'B', opportunityScore: 40, confidence: 30, risk: 60, priority: 'LOW', opportunityTypes: ['CUSTOM'] }),
    ];
    manager.populateAll(candidates);
    const all = manager.getWatchlist('ALL');
    expect(all.length).toBe(2);
    const topOpps = manager.getWatchlist('TOP_OPPORTUNITIES');
    expect(topOpps.length).toBe(1); // only A meets minScore=70, priority HIGH
  });

  it('should add custom watchlist', () => {
    manager.addCustomWatchlist({
      name: 'CUSTOM',
      filters: { minOpportunityScore: 50 },
      sortMode: 'SCORE_DESC',
      maxItems: 10,
      autoRefresh: false,
      refreshIntervalMs: 0,
    });
    manager.addToWatchlist('CUSTOM' as any, buildScannerResult({ symbol: 'A', opportunityScore: 60 }));
    expect(manager.getWatchlist('CUSTOM' as any).length).toBe(1);
  });

  it('should return all watchlists', () => {
    manager.addToWatchlist('ALL', buildScannerResult({ symbol: 'A' }));
    const all = manager.getAllWatchlists();
    expect(all.size).toBeGreaterThan(0);
  });

  it('should get watchlist config', () => {
    const config = manager.getWatchlistConfig('ALL');
    expect(config).toBeDefined();
    expect(config?.name).toBe('ALL');
  });
});

describe('ScannerMetricsCollector', () => {
  let collector: ScannerMetricsCollector;

  beforeEach(() => {
    collector = new ScannerMetricsCollector();
  });

  it('should record candidates and compute metrics', () => {
    collector.recordCandidate(80, 70, 20, 'HOT', 'STRONG', 'HIGH', 0);
    collector.recordCandidate(60, 50, 40, 'MOMENTUM', 'EMERGING', 'MEDIUM', 1);
    const metrics = collector.getMetrics(100, 10, {
      totalBefore: 10, totalAfter: 2, filteredByScore: 3, filteredByConfidence: 2,
      filteredByRisk: 1, filteredByType: 0, filteredBySector: 0, filteredByLiquidity: 0,
      filteredByMarketCap: 0, filteredByVolatility: 0, filteredByQuality: 0,
      filteredByPriority: 0, filteredByAge: 1, filteredByConfirmation: 0, totalFiltered: 8,
    }, 'FULL');
    expect(metrics.candidatesFound).toBe(2);
    expect(metrics.totalScanned).toBe(10);
    expect(metrics.averageScore).toBe(70);
    expect(metrics.categoryDistribution.HOT).toBe(1);
    expect(metrics.categoryDistribution.MOMENTUM).toBe(1);
    expect(metrics.levelDistribution.STRONG).toBe(1);
    expect(metrics.priorityDistribution.HIGH).toBe(1);
  });

  it('should record rejections', () => {
    collector.recordRejection();
    collector.recordRejection();
    const metrics = collector.getMetrics(50, 5, {
      totalBefore: 5, totalAfter: 0, filteredByScore: 0, filteredByConfidence: 0,
      filteredByRisk: 0, filteredByType: 0, filteredBySector: 0, filteredByLiquidity: 0,
      filteredByMarketCap: 0, filteredByVolatility: 0, filteredByQuality: 0,
      filteredByPriority: 0, filteredByAge: 0, filteredByConfirmation: 0, totalFiltered: 5,
    }, 'FULL');
    expect(metrics.rejectedCount).toBe(2);
  });

  it('should reset metrics', () => {
    collector.recordCandidate(80, 70, 20, 'HOT', 'STRONG', 'HIGH', 0);
    collector.reset();
    const metrics = collector.getMetrics(50, 1, {
      totalBefore: 1, totalAfter: 0, filteredByScore: 0, filteredByConfidence: 0,
      filteredByRisk: 0, filteredByType: 0, filteredBySector: 0, filteredByLiquidity: 0,
      filteredByMarketCap: 0, filteredByVolatility: 0, filteredByQuality: 0,
      filteredByPriority: 0, filteredByAge: 0, filteredByConfirmation: 0, totalFiltered: 1,
    }, 'FULL');
    expect(metrics.candidatesFound).toBe(0);
    expect(metrics.averageScore).toBe(0);
  });

  it('should track duplicates', () => {
    collector.recordCandidate(80, 70, 20, 'HOT', 'STRONG', 'HIGH', 3);
    const metrics = collector.getMetrics(50, 1, {
      totalBefore: 1, totalAfter: 0, filteredByScore: 0, filteredByConfidence: 0,
      filteredByRisk: 0, filteredByType: 0, filteredBySector: 0, filteredByLiquidity: 0,
      filteredByMarketCap: 0, filteredByVolatility: 0, filteredByQuality: 0,
      filteredByPriority: 0, filteredByAge: 0, filteredByConfirmation: 0, totalFiltered: 1,
    }, 'FULL');
    expect(metrics.duplicateCount).toBe(3);
  });

  it('should handle zero candidates gracefully', () => {
    const metrics = collector.getMetrics(0, 0, {
      totalBefore: 0, totalAfter: 0, filteredByScore: 0, filteredByConfidence: 0,
      filteredByRisk: 0, filteredByType: 0, filteredBySector: 0, filteredByLiquidity: 0,
      filteredByMarketCap: 0, filteredByVolatility: 0, filteredByQuality: 0,
      filteredByPriority: 0, filteredByAge: 0, filteredByConfirmation: 0, totalFiltered: 0,
    }, 'FULL');
    expect(metrics.averageScore).toBe(0);
    expect(metrics.averageConfidence).toBe(0);
    expect(metrics.averageRisk).toBe(0);
  });
});
