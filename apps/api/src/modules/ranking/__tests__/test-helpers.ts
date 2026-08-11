import { ScannerResult, ScannerCategory, ScanStatus } from '../../scanner/scanner.types';
import { Priority, OpportunityLevel, OpportunityType, OpportunityAge, SupportingMetric } from '../../opportunity-detection/opportunity-detection.types';
import { RankedOpportunity, InvestmentGrade, RankingRecommendation, RankingFactor, RankingTrend, RankHistoryEntry } from '../ranking.types';

export function buildScannerResult(overrides?: Partial<ScannerResult>): ScannerResult {
  return {
    symbol: 'THYAO',
    scannerScore: 72,
    opportunityScore: 65,
    confidence: 70,
    risk: 15,
    priority: 'MEDIUM' as Priority,
    age: 'NEW' as OpportunityAge,
    opportunityLevel: 'EMERGING' as OpportunityLevel,
    opportunityTypes: ['MOMENTUM_BREAKOUT'] as OpportunityType[],
    category: 'CUSTOM' as ScannerCategory,
    recommendation: 'Monitor and investigate',
    reasons: ['Emerging opportunity'],
    strengths: ['Strong momentum'],
    weaknesses: [],
    risks: [],
    timestamp: new Date().toISOString(),
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    status: 'ACTIVE' as ScanStatus,
    metadata: {
      scanDurationMs: 5,
      filterPassed: true,
      filterRejectionReason: null,
      duplicateCount: 0,
      historyEntries: 1,
      scoreDelta: null,
      priorityDelta: null,
      categoryDelta: null,
      aggregationQuality: 85,
      providerConfidence: 70,
      supportingMetrics: [
        { name: 'trendStrength', value: 68, description: 'Trend', module: 'trendTransition' },
        { name: 'momentum', value: 75, description: 'Momentum', module: 'momentumShift' },
        { name: 'sectorStrength', value: 55, description: 'Sector', module: 'sectorStrength' },
        { name: 'liquidity', value: 60, description: 'Liquidity', module: 'liquidityImprovement' },
        { name: 'financialQuality', value: 72, description: 'Financial', module: 'financialQuality' },
        { name: 'growth', value: 65, description: 'Growth', module: 'growthAcceleration' },
        { name: 'valuation', value: 58, description: 'Valuation', module: 'valuationDiscount' },
      ],
      penalties: [],
      scanMode: 'FULL',
    },
    ...overrides,
  };
}

export function buildRankedOpportunity(overrides?: Partial<RankedOpportunity>): RankedOpportunity {
  return {
    symbol: 'THYAO',
    rank: 1,
    rankingScore: 75,
    scannerScore: 72,
    opportunityScore: 65,
    confidence: 70,
    priority: 'MEDIUM' as Priority,
    risk: 15,
    expectedReturnEstimate: 40.5,
    riskRewardRatio: 4.7,
    investmentGrade: 'BBB' as InvestmentGrade,
    recommendation: 'BUY' as RankingRecommendation,
    recommendationExplanation: 'Buy: ranking score 75 exceeds threshold',
    reasons: ['Ranking score: 75.0', 'Investment grade: BBB'],
    rankingFactors: [],
    timestamp: new Date().toISOString(),
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    metadata: {
      rankingDurationMs: 5,
      previousRank: null,
      rankChange: null,
      bestRank: 1,
      worstRank: 1,
      averageRank: 1,
      rankingTrend: 'NEW' as RankingTrend,
      historyEntries: 0,
      normalizedScore: 75,
      gradeDistribution: {} as any,
      recommendationDistribution: {} as any,
    },
    ...overrides,
  };
}

export function buildCandidateBatch(count: number): ScannerResult[] {
  const symbols = ['THYAO', 'GARAN', 'ASELS', 'KCHOL', 'BIMAS', 'EREGL', 'SAHOL', 'HALKB', 'YKBNK', 'TUPRS'];
  return Array.from({ length: count }, (_, i) =>
    buildScannerResult({
      symbol: symbols[i % symbols.length] + (i >= symbols.length ? `_${Math.floor(i / symbols.length)}` : ''),
      scannerScore: 40 + Math.floor(Math.random() * 50),
      confidence: 50 + Math.floor(Math.random() * 40),
      risk: 5 + Math.floor(Math.random() * 40),
    }),
  );
}

export function buildStrongCandidate(): ScannerResult {
  return buildScannerResult({
    symbol: 'ASELS',
    scannerScore: 92,
    opportunityScore: 88,
    confidence: 85,
    risk: 10,
    priority: 'CRITICAL',
    opportunityLevel: 'EXCEPTIONAL',
    opportunityTypes: ['MOMENTUM_BREAKOUT', 'VOLUME_EXPANSION', 'FUNDAMENTAL_IMPROVEMENT', 'MULTI_FACTOR'],
    strengths: ['Strong momentum', 'Volume expansion', 'Fundamental improvement'],
    weaknesses: [],
    risks: [],
  });
}

export function buildWeakCandidate(): ScannerResult {
  return buildScannerResult({
    symbol: 'WEAK',
    scannerScore: 25,
    opportunityScore: 20,
    confidence: 30,
    risk: 75,
    priority: 'LOW',
    opportunityLevel: 'WATCH',
    opportunityTypes: ['CUSTOM'],
    strengths: [],
    weaknesses: ['Low score'],
    risks: ['High risk'],
  });
}

export function buildHistoryEntry(overrides?: Partial<RankHistoryEntry>): RankHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    rank: 5,
    rankingScore: 65,
    grade: 'BBB' as InvestmentGrade,
    recommendation: 'BUY' as RankingRecommendation,
    ...overrides,
  };
}
