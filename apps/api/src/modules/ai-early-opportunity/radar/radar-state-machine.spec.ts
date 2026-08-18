import { deriveRadarState, detectFactorChanges } from './radar-state-machine';
import { RadarMetrics } from './radar.types';
import { getRadarConfig } from './radar.config';

function metrics(overrides: Partial<RadarMetrics> = {}): RadarMetrics {
  return {
    earlyOpportunityScore: 60,
    eliteScore: 70,
    signalConvergence: 60,
    confidence: 60,
    expectedReturn: 10,
    risk: 'medium',
    smartMoneyScore: 65,
    catalystScore: 70,
    fundamentalScore: 80,
    dataQualityScore: 90,
    predictionConfidence: 60,
    timeframeAgreement: 70,
    entryZone: { min: 100, max: 110 },
    decisionScore: 65,
    decisionStatus: 'EARLY_OPPORTUNITY',
    earlyOpportunity: true,
    dataTimestamp: '2026-08-12T15:00:00.000Z',
    ...overrides,
  };
}

const CONFIRM = ['STRONG_EARLY_OPPORTUNITY', 'EARLY_OPPORTUNITY', 'CONFIRMED_OPPORTUNITY'];
const cfg = getRadarConfig();

describe('radar-state-machine', () => {
  describe('detectFactorChanges', () => {
    it('reports delta for changed numeric factors only', () => {
      const changes = detectFactorChanges(
        metrics({ earlyOpportunityScore: 50 }),
        metrics({ earlyOpportunityScore: 60 }),
      );
      const score = changes.find((c) => c.factor === 'earlyOpportunityScore')!;
      expect(score.previous).toBe(50);
      expect(score.current).toBe(60);
      expect(score.delta).toBe(10);
    });

    it('returns null delta when a factor is missing on both sides', () => {
      const changes = detectFactorChanges(
        metrics({ smartMoneyScore: null }),
        metrics({ smartMoneyScore: null }),
      );
      const sm = changes.find((c) => c.factor === 'smartMoneyScore')!;
      expect(sm.delta).toBeNull();
    });
  });

  describe('NEW', () => {
    it('classifies a first-time active opportunity as NEW', () => {
      const r = deriveRadarState({
        previousState: null,
        previousMetrics: null,
        currentMetrics: metrics(),
        thresholds: cfg.thresholds,
        minRadarScore: cfg.minRadarScore,
        confirmDecisionStatuses: CONFIRM,
      });
      expect(r.state).toBe('NEW');
    });

    it('does not create an item for a non-active first symbol', () => {
      const r = deriveRadarState({
        previousState: null,
        previousMetrics: null,
        currentMetrics: metrics({ earlyOpportunityScore: 10, earlyOpportunity: false }),
        thresholds: cfg.thresholds,
        minRadarScore: cfg.minRadarScore,
        confirmDecisionStatuses: CONFIRM,
      });
      expect(r.state).toBe('UNCHANGED');
    });
  });

  describe('STRENGTHENING', () => {
    it('strengthens when score increases materially', () => {
      const r = deriveRadarState({
        previousState: 'NEW',
        previousMetrics: metrics({ earlyOpportunityScore: 60 }),
        currentMetrics: metrics({ earlyOpportunityScore: 72 }),
        thresholds: cfg.thresholds,
        minRadarScore: cfg.minRadarScore,
        confirmDecisionStatuses: CONFIRM,
      });
      expect(r.state).toBe('STRENGTHENING');
      expect(r.scoreChange).toBe(12);
    });
  });

  describe('WEAKENING', () => {
    it('weakens when score drops materially', () => {
      const r = deriveRadarState({
        previousState: 'CONFIRMED',
        previousMetrics: metrics({ earlyOpportunityScore: 75 }),
        currentMetrics: metrics({ earlyOpportunityScore: 66 }),
        thresholds: cfg.thresholds,
        minRadarScore: cfg.minRadarScore,
        confirmDecisionStatuses: CONFIRM,
      });
      expect(r.state).toBe('WEAKENING');
    });
  });

  describe('CONFIRMED', () => {
    it('confirms a stable high-scoring opportunity', () => {
      const r = deriveRadarState({
        previousState: 'NEW',
        previousMetrics: metrics({ earlyOpportunityScore: 80 }),
        currentMetrics: metrics({
          earlyOpportunityScore: 82,
          decisionStatus: 'STRONG_EARLY_OPPORTUNITY',
        }),
        thresholds: cfg.thresholds,
        minRadarScore: cfg.minRadarScore,
        confirmDecisionStatuses: CONFIRM,
      });
      expect(r.state).toBe('CONFIRMED');
    });
  });

  describe('INVALIDATED', () => {
    it('invalidates when no longer active', () => {
      const r = deriveRadarState({
        previousState: 'NEW',
        previousMetrics: metrics({ earlyOpportunityScore: 70 }),
        currentMetrics: metrics({
          earlyOpportunityScore: 30,
          earlyOpportunity: false,
          decisionStatus: 'INVALID_OPPORTUNITY',
        }),
        thresholds: cfg.thresholds,
        minRadarScore: cfg.minRadarScore,
        confirmDecisionStatuses: CONFIRM,
      });
      expect(r.state).toBe('INVALIDATED');
    });
  });

  describe('UNCHANGED', () => {
    it('keeps unchanged when deltas are immaterial', () => {
      const r = deriveRadarState({
        previousState: 'CONFIRMED',
        previousMetrics: metrics({ earlyOpportunityScore: 75 }),
        currentMetrics: metrics({ earlyOpportunityScore: 76 }),
        thresholds: cfg.thresholds,
        minRadarScore: cfg.minRadarScore,
        confirmDecisionStatuses: CONFIRM,
      });
      expect(r.state).toBe('UNCHANGED');
    });
  });

  describe('reasons', () => {
    it('produces Turkish factor rationale for material changes', () => {
      const r = deriveRadarState({
        previousState: 'NEW',
        previousMetrics: metrics({ earlyOpportunityScore: 60, signalConvergence: 60 }),
        currentMetrics: metrics({ earlyOpportunityScore: 72, signalConvergence: 74 }),
        thresholds: cfg.thresholds,
        minRadarScore: cfg.minRadarScore,
        confirmDecisionStatuses: CONFIRM,
      });
      expect(r.reasons.some((x) => x.includes('Signal Yakınsaması'))).toBe(true);
      expect(r.reasons.some((x) => x.includes('Güçleniyor'))).toBe(true);
    });
  });
});
