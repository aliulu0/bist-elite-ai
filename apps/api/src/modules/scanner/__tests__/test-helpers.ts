import { OpportunityResult, OpportunityLevel, OpportunityType, Priority, OpportunityAge, ConfirmationLevel } from '../../opportunity-detection/opportunity-detection.types';
import { ScannerResult, ScannerCategory, ScannerSortMode, ScanStatus } from '../scanner.types';

export function buildOpportunityResult(overrides?: Partial<OpportunityResult>): OpportunityResult {
  return {
    symbol: 'THYAO',
    opportunityScore: 65,
    confidence: 70,
    opportunityLevel: 'EMERGING' as OpportunityLevel,
    opportunityType: 'MOMENTUM_BREAKOUT' as OpportunityType,
    priority: 'MEDIUM' as Priority,
    recommendation: 'Monitor and investigate when convenient',
    age: 'NEW' as OpportunityAge,
    confirmationLevel: 'DOUBLE' as ConfirmationLevel,
    confirmationCount: 4,
    reasons: ['Opportunity level: EMERGING', 'Types: MOMENTUM_BREAKOUT'],
    strengths: ['Strong momentum', 'Volume expanding'],
    weaknesses: ['Sector weakness'],
    risks: ['Market volatility'],
    warnings: ['Low liquidity'],
    explanation: 'Emerging opportunity with momentum breakout',
    supportingMetrics: [
      { name: 'opportunityScore', value: 65, description: 'Opportunity score', module: 'opportunity' },
      { name: 'financialQuality', value: 72, description: 'Financial quality', module: 'financialQuality' },
      { name: 'trendStrength', value: 68, description: 'Trend strength', module: 'trendTransition' },
      { name: 'momentum', value: 75, description: 'Momentum', module: 'momentumShift' },
      { name: 'liquidity', value: 60, description: 'Liquidity', module: 'liquidityImprovement' },
      { name: 'sectorStrength', value: 55, description: 'Sector strength', module: 'sectorStrength' },
      { name: 'valuation', value: 58, description: 'Valuation', module: 'valuationDiscount' },
    ],
    detectionModuleResults: [],
    opportunityTypes: ['MOMENTUM_BREAKOUT'] as OpportunityType[],
    penalties: [],
    metadata: {
      detectionDurationMs: 10,
      moduleCount: 20,
      enabledModuleCount: 20,
      failedModuleCount: 0,
      confirmationLevel: 'DOUBLE' as ConfirmationLevel,
      confirmationCount: 4,
      ageStatus: 'NEW' as OpportunityAge,
      previousScore: null,
      scoreDelta: null,
      duplicateCount: 0,
      aggregationQuality: 85,
      providerConfidence: 70,
      metrics: {},
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    ...overrides,
  };
}

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
      supportingMetrics: [],
      penalties: [],
      scanMode: 'FULL',
    },
    ...overrides,
  };
}

export function buildOpportunityBatch(count: number): OpportunityResult[] {
  const symbols = ['THYAO', 'GARAN', 'ASELS', 'KCHOL', 'BIMAS', 'EREGL', 'SAHOL', 'HALKB', 'YKBNK', 'TUPRS'];
  return Array.from({ length: count }, (_, i) =>
    buildOpportunityResult({
      symbol: symbols[i % symbols.length] + (i >= symbols.length ? `_${Math.floor(i / symbols.length)}` : ''),
      opportunityScore: 30 + Math.floor(Math.random() * 60),
      confidence: 40 + Math.floor(Math.random() * 50),
    }),
  );
}

export function buildStrongOpportunity(): OpportunityResult {
  return buildOpportunityResult({
    symbol: 'ASELS',
    opportunityScore: 92,
    confidence: 88,
    opportunityLevel: 'EXCEPTIONAL',
    opportunityType: 'MULTI_FACTOR',
    priority: 'CRITICAL',
    opportunityTypes: ['MOMENTUM_BREAKOUT', 'VOLUME_EXPANSION', 'FUNDAMENTAL_IMPROVEMENT', 'MULTI_FACTOR'],
    strengths: ['Strong momentum', 'Volume expansion', 'Fundamental improvement'],
    weaknesses: [],
    risks: [],
    warnings: [],
    penalties: [],
    confirmationCount: 8,
    confirmationLevel: 'MULTI',
  });
}

export function buildWeakOpportunity(): OpportunityResult {
  return buildOpportunityResult({
    symbol: 'WEAK',
    opportunityScore: 18,
    confidence: 35,
    opportunityLevel: 'NONE',
    opportunityType: 'CUSTOM',
    priority: 'IGNORE',
    opportunityTypes: ['CUSTOM'],
    strengths: [],
    weaknesses: ['Low score', 'Weak signals'],
    risks: ['High risk', 'Low confidence'],
    warnings: ['Unstable'],
    penalties: [{ type: 'LOW_AGGREGATION_QUALITY', amount: 8, reason: 'Low quality', module: 'aggregation' }],
    confirmationCount: 0,
    confirmationLevel: 'NONE',
  });
}
