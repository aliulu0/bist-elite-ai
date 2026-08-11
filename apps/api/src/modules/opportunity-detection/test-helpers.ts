import { AnalysisResult, ModuleResult, SupportingMetric } from '../ai-analysis/ai-analysis.types';
import { AggregationMetadata } from '../market-data/aggregation/aggregation.types';
import { OpportunityHistoryEntry } from './opportunity-detection.types';

function baseMetadata(): AggregationMetadata {
  return {
    providersQueried: ['fintables', 'finnhub'],
    providersUsed: ['fintables', 'finnhub'],
    providersFailed: [],
    providerConfidence: { fintables: 90, finnhub: 70 },
    qualityScore: 85,
    lastUpdated: new Date().toISOString(),
    cacheStatus: 'miss',
    aggregationDurationMs: 100,
    validationWarnings: [],
    conflictCount: 0,
    conflicts: [],
  };
}

export function buildModuleResult(overrides?: Partial<ModuleResult>): ModuleResult {
  return {
    module: 'test',
    score: 60,
    confidence: 70,
    signals: [],
    strengths: [],
    weaknesses: [],
    risks: [],
    warnings: [],
    metrics: {},
    explanation: 'Test module.',
    metadata: {},
    ...overrides,
  };
}

export function buildAnalysisResult(overrides?: Partial<AnalysisResult>): AnalysisResult {
  return {
    symbol: 'THYAO',
    overallScore: 65,
    confidenceScore: 70,
    signal: 'BUY',
    recommendation: 'BUY',
    strengths: ['Strong technical position'],
    weaknesses: [],
    risks: [],
    warnings: [],
    explanation: 'Good opportunity.',
    supportingMetrics: [
      { name: 'marketCap', value: 5_000_000_000, description: 'Market cap', module: 'technical' },
    ],
    providerMetadata: baseMetadata(),
    moduleResults: [
      buildModuleResult({ module: 'technical', score: 72, strengths: ['Strong technical'] }),
      buildModuleResult({ module: 'fundamental', score: 68, strengths: ['Good fundamentals'] }),
      buildModuleResult({ module: 'financialHealth', score: 65 }),
      buildModuleResult({ module: 'growth', score: 62, strengths: ['Growth improving'] }),
      buildModuleResult({ module: 'momentum', score: 70, strengths: ['Momentum strong'] }),
      buildModuleResult({ module: 'risk', score: 65, strengths: ['Low risk'] }),
      buildModuleResult({ module: 'liquidity', score: 60 }),
      buildModuleResult({ module: 'volatility', score: 55 }),
      buildModuleResult({ module: 'trend', score: 68, strengths: ['Uptrend'] }),
      buildModuleResult({ module: 'valuation', score: 66 }),
    ],
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    ...overrides,
  };
}

export function buildStrongAnalysis(): AnalysisResult {
  return buildAnalysisResult({
    overallScore: 82,
    confidenceScore: 85,
    signal: 'STRONG_BUY',
    strengths: ['Strong technical', 'Volume expansion', 'Sector strength improving', 'Cash flow positive', 'Debt decreasing'],
    moduleResults: [
      buildModuleResult({ module: 'technical', score: 85, confidence: 90, strengths: ['Strong technical'] }),
      buildModuleResult({ module: 'fundamental', score: 80, confidence: 85, strengths: ['Strong fundamentals'] }),
      buildModuleResult({ module: 'financialHealth', score: 78, confidence: 80, strengths: ['Good health'] }),
      buildModuleResult({ module: 'growth', score: 75, confidence: 80, strengths: ['Growth accelerating'] }),
      buildModuleResult({ module: 'momentum', score: 82, confidence: 85, strengths: ['Momentum strong'] }),
      buildModuleResult({ module: 'risk', score: 78, confidence: 80, strengths: ['Low risk'] }),
      buildModuleResult({ module: 'liquidity', score: 75, confidence: 75, strengths: ['Good liquidity'] }),
      buildModuleResult({ module: 'volatility', score: 70, confidence: 70 }),
      buildModuleResult({ module: 'trend', score: 80, confidence: 80, strengths: ['Strong uptrend'] }),
      buildModuleResult({ module: 'valuation', score: 76, confidence: 80, strengths: ['Undervalued'] }),
    ],
  });
}

export function buildWeakAnalysis(): AnalysisResult {
  return buildAnalysisResult({
    overallScore: 25,
    confidenceScore: 35,
    signal: 'SELL',
    strengths: [],
    weaknesses: ['Weak position'],
    risks: ['High risk'],
    moduleResults: [
      buildModuleResult({ module: 'technical', score: 20, confidence: 40 }),
      buildModuleResult({ module: 'fundamental', score: 25, confidence: 45 }),
      buildModuleResult({ module: 'financialHealth', score: 30, confidence: 40 }),
      buildModuleResult({ module: 'growth', score: 22, confidence: 35 }),
      buildModuleResult({ module: 'momentum', score: 18, confidence: 30 }),
      buildModuleResult({ module: 'risk', score: 20, confidence: 35 }),
      buildModuleResult({ module: 'liquidity', score: 30, confidence: 40 }),
      buildModuleResult({ module: 'volatility', score: 25, confidence: 35 }),
      buildModuleResult({ module: 'trend', score: 20, confidence: 30 }),
      buildModuleResult({ module: 'valuation', score: 28, confidence: 40 }),
    ],
  });
}

export function buildHistory(count: number = 3, scoreStart: number = 60): OpportunityHistoryEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
    score: scoreStart + i * 2,
    level: 'EMERGING' as const,
    priority: 'MEDIUM' as const,
  }));
}
