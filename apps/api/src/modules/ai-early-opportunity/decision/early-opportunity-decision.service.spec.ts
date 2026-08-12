import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EarlyOpportunityDecisionEngine } from './early-opportunity-decision.engine';
import { EarlyOpportunityDecisionService } from './early-opportunity-decision.service';
import {
  EarlyOpportunityDecision,
  EarlyOpportunityDecisionStatus,
} from './early-opportunity-decision.types';
import { EarlyOpportunityIntelligenceService } from '../early-opportunity.intelligence.service';
import { EarlyOpportunityIntelligenceResult } from '../early-opportunity.types';

const TICKER = 'THYAO';

function decision(overrides: Partial<EarlyOpportunityDecision> = {}): EarlyOpportunityDecision {
  return {
    ticker: TICKER,
    company: 'Türk Hava Yolları',
    decisionScore: 78,
    decisionStatus: 'EARLY_OPPORTUNITY' as EarlyOpportunityDecisionStatus,
    statusLabel: 'Erken Fırsat',
    statusEmoji: '🟢',
    opportunityType: 'EARLY',
    earlyOpportunity: true,
    confidence: 76,
    convergence: 82,
    coverage: 90,
    trendStage: 'Early',
    timeframeAgreement: 88,
    predictionConfidence: 81,
    smartMoneyStatus: 'very_strong',
    catalystStatus: 'strong',
    fundamentalStatus: 'PASS',
    financialDataQualityStatus: 'verified',
    signalSummary: { convergenceScore: 80, totalSignals: 4, strongSignalCount: 2, earlyCount: 3, confirmedCount: 1, categoryCoverage: 3 },
    verificationStatus: 'verified',
    riskSummary: { level: 'low', riskRewardRatio: 2.4, hasEntry: true, hasStop: true, hasTarget: true },
    entryZone: { min: 12.4, max: 12.8 },
    stop: 11.9,
    target1: 14.0,
    target2: 15.2,
    expectedReturn: 6.4,
    bestTimeframe: '1d',
    worstTimeframe: '6m',
    reasons: ['test'],
    positiveFactors: [],
    negativeFactors: [],
    warnings: [],
    dataFreshness: 'fresh',
    providerStatus: 'consistent',
    dimensions: [],
    gates: { invalidated: [], downgraded: [] },
    snapshot: {
      decisionTimestamp: '2024-01-01T00:00:00.000Z',
      symbol: TICKER,
      timeframeContext: ['1d'],
      decisionScore: 78,
      decisionStatus: 'EARLY_OPPORTUNITY',
      earlyOpportunity: true,
      entry: { min: 12.4, max: 12.8 },
      stop: 11.9,
      target1: 14.0,
      target2: 15.2,
      expectedReturn: 6.4,
      confidence: 76,
      evidence: {} as any,
      inputDigest: 'a'.repeat(64),
    },
    explanation: 'test explanation',
    generatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function intelResult(overrides: Partial<EarlyOpportunityIntelligenceResult> = {}): EarlyOpportunityIntelligenceResult {
  return {
    ticker: TICKER,
    company: 'Türk Hava Yolları',
    sector: 'Ulaştırma',
    marketCap: 185000000000,
    earlyOpportunityScore: 78,
    earlyOpportunityLevel: 'GÜÇLÜ_FIRSAT',
    eliteScore: 85,
    confidence: 81,
    bullishPercent: 84,
    risk: 'low',
    expectedReturn: 6.4,
    entryZone: { min: 12.4, max: 12.8 },
    stop: 11.9,
    target1: 14.0,
    target2: 15.2,
    riskRewardRatio: 2.4,
    holdingPeriod: { value: 4, unit: 'days' },
    catalyst: { score: 70, verified: true },
    smartMoney: { score: 78, accumulation: 'very_strong' },
    verificationStatus: 'verified',
    researchConsensus: null,
    momentum: 'bullish',
    trend: 'up',
    liquidityQuality: 'high',
    timeframeAgreement: 100,
    reasons: ['test'],
    fundamentals: null,
    multiTimeframe: null,
    financialDataQuality: null,
    signals: [],
    signalConvergenceScore: 0,
    earlySignalCount: 0,
    confirmedSignalCount: 0,
    topSignals: [],
    decision: null,
    evaluatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('EarlyOpportunityDecisionService', () => {
  it('evaluate() returns a decision for a known ticker (delegates to intelligence)', async () => {
    const intel = { getEarlyOpportunity: jest.fn().mockResolvedValue(intelResult()) };
    const engine = new EarlyOpportunityDecisionEngine();
    const service = new EarlyOpportunityDecisionService(intel as any, engine);

    const result = await service.evaluate(TICKER);

    expect(intel.getEarlyOpportunity).toHaveBeenCalledTimes(1);
    expect(intel.getEarlyOpportunity).toHaveBeenCalledWith(TICKER);
    expect(result.ticker).toBe(TICKER);
    expect(result.decisionScore).toBeGreaterThanOrEqual(0);
  });

  it('evaluate() throws NotFoundException when ticker has no intelligence', async () => {
    const intel = { getEarlyOpportunity: jest.fn().mockResolvedValue(null) };
    const engine = new EarlyOpportunityDecisionEngine();
    const service = new EarlyOpportunityDecisionService(intel as any, engine);

    await expect(service.evaluate(TICKER)).rejects.toThrow(NotFoundException);
  });

  it('evaluate() reuses an already-attached decision without recomputing', async () => {
    const pre = decision();
    const intel = { getEarlyOpportunity: jest.fn().mockResolvedValue({ ...intelResult(), decision: pre }) };
    const engine = { decide: jest.fn() };
    const service = new EarlyOpportunityDecisionService(intel as any, engine as any);

    const result = await service.evaluate(TICKER);

    expect(result).toBe(pre);
    expect(engine.decide).not.toHaveBeenCalled();
  });

  it('enrichWithDecisions() attaches a decision to each result', async () => {
    const results = [intelResult({ ticker: TICKER }), intelResult({ ticker: 'Garanti' })];
    const engine = new EarlyOpportunityDecisionEngine();
    const service = new EarlyOpportunityDecisionService(undefined as any, engine);

    await service.enrichWithDecisions(results);

    expect(results[0].decision).toBeDefined();
    expect(results[0].decision?.ticker).toBe(TICKER);
    expect(results[1].decision).toBeDefined();
    expect(results[1].decision?.ticker).toBe('Garanti');
  });

  it('decision engine is pure: no provider calls and deterministic output', () => {
    const engine = new EarlyOpportunityDecisionEngine();
    const input = intelResult();
    const a = engine.decide(input);
    const b = engine.decide(input);
    expect(a.decisionScore).toBe(b.decisionScore);
    expect(a.decisionStatus).toBe(b.decisionStatus);
    expect(a.snapshot.inputDigest).toBe(b.snapshot.inputDigest);
    expect(a.explanation).toBe(b.explanation);
  });

  it('decideFor() exposes the engine directly', async () => {
    const engine = new EarlyOpportunityDecisionEngine();
    const service = new EarlyOpportunityDecisionService(undefined as any, engine);
    const result = await service.decideFor(intelResult());
    expect(result).toBeDefined();
    expect(result.ticker).toBe(TICKER);
  });
});
