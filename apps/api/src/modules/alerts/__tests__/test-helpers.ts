import { RankedOpportunity, InvestmentGrade, RankingRecommendation, RankingTrend } from '../../ranking/ranking.types';
import { AlertEvent, AlertType, AlertPriority, AlertChannelType, AlertStatus, TriggerCondition } from '../alerts.types';

export function buildRankedOpportunity(overrides?: Partial<RankedOpportunity>): RankedOpportunity {
  return {
    symbol: 'THYAO',
    rank: 1,
    rankingScore: 75,
    scannerScore: 72,
    opportunityScore: 65,
    confidence: 70,
    priority: 'MEDIUM',
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

export function buildAlertEvent(overrides?: Partial<AlertEvent>): AlertEvent {
  const now = new Date().toISOString();
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    type: 'OPPORTUNITY' as AlertType,
    priority: 'HIGH' as AlertPriority,
    title: '[Opportunity] THYAO: BUY (Grade: BBB)',
    message: 'THYAO - Rank #1\nScore: 75 | Confidence: 70 | Risk: 15',
    symbol: 'THYAO',
    channels: ['TELEGRAM', 'WEBSOCKET', 'APPLICATION'] as AlertChannelType[],
    status: 'ACTIVE' as AlertStatus,
    triggerCondition: { type: 'OPPORTUNITY', minOpportunityScore: 75 } as TriggerCondition,
    source: {
      type: 'RANKING',
      engine: 'OPPORTUNITY',
      rankedOpportunity: buildRankedOpportunity(),
    },
    metadata: {
      alertDurationMs: 0,
      channelDeliveries: [],
      duplicateSuppressed: false,
      cooldownApplied: false,
      cooldownRemainingMs: null,
      previousAlertId: null,
      deliveryAttempts: 0,
      errorMessage: null,
    },
    createdAt: now,
    acknowledgedAt: null,
    dismissedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

export function buildCandidateBatch(count: number): RankedOpportunity[] {
  const symbols = ['THYAO', 'GARAN', 'ASELS', 'KCHOL', 'BIMAS', 'EREGL', 'SAHOL', 'HALKB', 'YKBNK', 'TUPRS'];
  return Array.from({ length: count }, (_, i) =>
    buildRankedOpportunity({
      symbol: symbols[i % symbols.length] + (i >= symbols.length ? `_${Math.floor(i / symbols.length)}` : ''),
      rank: i + 1,
      rankingScore: 40 + Math.floor(Math.random() * 50),
      confidence: 50 + Math.floor(Math.random() * 40),
      risk: 5 + Math.floor(Math.random() * 40),
    }),
  );
}

export function buildStrongBuyCandidate(): RankedOpportunity {
  return buildRankedOpportunity({
    symbol: 'ASELS',
    rank: 1,
    rankingScore: 95,
    opportunityScore: 92,
    confidence: 90,
    priority: 'CRITICAL',
    risk: 8,
    investmentGrade: 'AAA' as InvestmentGrade,
    recommendation: 'STRONG_BUY' as RankingRecommendation,
    recommendationExplanation: 'Strong Buy: exceptional metrics across all factors',
    metadata: {
      rankingDurationMs: 5,
      previousRank: 3,
      rankChange: 2,
      bestRank: 1,
      worstRank: 3,
      averageRank: 2,
      rankingTrend: 'IMPROVING' as RankingTrend,
      historyEntries: 5,
      normalizedScore: 95,
      gradeDistribution: {} as any,
      recommendationDistribution: {} as any,
    },
  });
}
