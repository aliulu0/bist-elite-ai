import { IntelligencePanelService } from './intelligence-panel.service';
import { OpportunitySummary } from './types';

describe('IntelligencePanelService', () => {
  let service: IntelligencePanelService;

  beforeEach(() => {
    service = new IntelligencePanelService();
  });

  const createOpportunity = (overrides: Partial<OpportunitySummary> = {}): OpportunitySummary => ({
    id: 'opp-1',
    symbol: 'THYAO',
    stage: 'CONFIRMED',
    eliteScore: 75,
    confidence: 0.85,
    consensusScore: 80,
    healthScore: 70,
    detectedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    ageHours: 48,
    direction: 'BULLISH',
    trend: 'IMPROVING',
    sector: 'Ulastirma',
    strategy: 'momentum',
    ...overrides,
  });

  describe('getIntelligencePanel', () => {
    it('should return panel with correct structure', () => {
      const result = service.getIntelligencePanel({
        opportunities: [],
        marketRegime: 'SIDEWAYS',
        regimeConfidence: 75,
      });

      expect(result).toHaveProperty('topOpportunities');
      expect(result).toHaveProperty('highestEliteScores');
      expect(result).toHaveProperty('highestConfidence');
      expect(result).toHaveProperty('strongestConsensus');
      expect(result).toHaveProperty('emergingOpportunities');
      expect(result).toHaveProperty('weakeningOpportunities');
      expect(result).toHaveProperty('currentMarketRegime');
      expect(result).toHaveProperty('marketRegimeConfidence');
      expect(result).toHaveProperty('totalActiveOpportunities');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should set market regime correctly', () => {
      const result = service.getIntelligencePanel({
        opportunities: [],
        marketRegime: 'STRONG_BULL',
        regimeConfidence: 90,
      });

      expect(result.currentMarketRegime).toBe('STRONG_BULL');
      expect(result.marketRegimeConfidence).toBe(90);
    });

    it('should count active opportunities', () => {
      const result = service.getIntelligencePanel({
        opportunities: [createOpportunity(), createOpportunity({ id: 'opp-2', symbol: 'GARAN' })],
        marketRegime: 'BULL',
        regimeConfidence: 80,
      });

      expect(result.totalActiveOpportunities).toBe(2);
    });

    it('should sort topOpportunities by eliteScore descending', () => {
      const result = service.getIntelligencePanel({
        opportunities: [
          createOpportunity({ id: 'opp-1', symbol: 'THYAO', eliteScore: 60 }),
          createOpportunity({ id: 'opp-2', symbol: 'GARAN', eliteScore: 85 }),
          createOpportunity({ id: 'opp-3', symbol: 'ASELS', eliteScore: 70 }),
        ],
        marketRegime: 'BULL',
        regimeConfidence: 80,
      });

      expect(result.topOpportunities[0].symbol).toBe('GARAN');
      expect(result.topOpportunities[1].symbol).toBe('ASELS');
      expect(result.topOpportunities[2].symbol).toBe('THYAO');
    });

    it('should sort highestConfidence by confidence descending', () => {
      const result = service.getIntelligencePanel({
        opportunities: [
          createOpportunity({ id: 'opp-1', symbol: 'THYAO', confidence: 0.6 }),
          createOpportunity({ id: 'opp-2', symbol: 'GARAN', confidence: 0.95 }),
          createOpportunity({ id: 'opp-3', symbol: 'ASELS', confidence: 0.8 }),
        ],
        marketRegime: 'BULL',
        regimeConfidence: 80,
      });

      expect(result.highestConfidence[0].symbol).toBe('GARAN');
      expect(result.highestConfidence[1].symbol).toBe('ASELS');
    });

    it('should sort strongestConsensus by consensusScore descending', () => {
      const result = service.getIntelligencePanel({
        opportunities: [
          createOpportunity({ id: 'opp-1', symbol: 'THYAO', consensusScore: 50 }),
          createOpportunity({ id: 'opp-2', symbol: 'GARAN', consensusScore: 90 }),
        ],
        marketRegime: 'BULL',
        regimeConfidence: 80,
      });

      expect(result.strongestConsensus[0].symbol).toBe('GARAN');
    });

    it('should filter emerging opportunities (DETECTED or EMERGING)', () => {
      const result = service.getIntelligencePanel({
        opportunities: [
          createOpportunity({ id: 'opp-1', symbol: 'THYAO', stage: 'DETECTED' }),
          createOpportunity({ id: 'opp-2', symbol: 'GARAN', stage: 'EMERGING' }),
          createOpportunity({ id: 'opp-3', symbol: 'ASELS', stage: 'CONFIRMED' }),
        ],
        marketRegime: 'BULL',
        regimeConfidence: 80,
      });

      expect(result.emergingOpportunities).toHaveLength(2);
      expect(result.emergingOpportunities.map(o => o.symbol)).toContain('THYAO');
      expect(result.emergingOpportunities.map(o => o.symbol)).toContain('GARAN');
    });

    it('should filter weakening opportunities', () => {
      const result = service.getIntelligencePanel({
        opportunities: [
          createOpportunity({ id: 'opp-1', symbol: 'THYAO', stage: 'WEAKENING' }),
          createOpportunity({ id: 'opp-2', symbol: 'GARAN', stage: 'CONFIRMED' }),
        ],
        marketRegime: 'BULL',
        regimeConfidence: 80,
      });

      expect(result.weakeningOpportunities).toHaveLength(1);
      expect(result.weakeningOpportunities[0].symbol).toBe('THYAO');
    });

    it('should respect maxOpportunities limit', () => {
      const opps = Array.from({ length: 30 }, (_, i) =>
        createOpportunity({ id: `opp-${i}`, symbol: `SYM${i}`, eliteScore: i }),
      );

      const result = service.getIntelligencePanel({
        opportunities: opps,
        marketRegime: 'BULL',
        regimeConfidence: 80,
        maxOpportunities: 5,
      });

      expect(result.topOpportunities).toHaveLength(5);
      expect(result.highestEliteScores).toHaveLength(5);
    });

    it('should compute ageHours correctly', () => {
      const detectedAt = new Date(Date.now() - 72 * 3600000).toISOString();
      const result = service.getIntelligencePanel({
        opportunities: [createOpportunity({ detectedAt })],
        marketRegime: 'BULL',
        regimeConfidence: 80,
      });

      expect(result.topOpportunities[0].ageHours).toBeCloseTo(72, 0);
    });
  });

  describe('rankOpportunities', () => {
    it('should rank by composite score', () => {
      const opps: OpportunitySummary[] = [
        createOpportunity({ id: 'opp-1', symbol: 'A', eliteScore: 90, confidence: 0.5, healthScore: 60, ageHours: 100 }),
        createOpportunity({ id: 'opp-2', symbol: 'B', eliteScore: 50, confidence: 0.9, healthScore: 80, ageHours: 10 }),
      ];

      const ranked = service.rankOpportunities(opps);
      expect(ranked[0].symbol).toBe('B');
    });
  });

  describe('detectEmergingOpportunities', () => {
    it('should detect DETECTED and EMERGING stages', () => {
      const opps: OpportunitySummary[] = [
        createOpportunity({ stage: 'DETECTED' }),
        createOpportunity({ id: 'opp-2', stage: 'EMERGING' }),
        createOpportunity({ id: 'opp-3', stage: 'CONFIRMED' }),
      ];

      const result = service.detectEmergingOpportunities(opps);
      expect(result).toHaveLength(2);
    });
  });

  describe('detectWeakeningOpportunities', () => {
    it('should detect WEAKENING and EXPIRED stages', () => {
      const opps: OpportunitySummary[] = [
        createOpportunity({ stage: 'WEAKENING' }),
        createOpportunity({ id: 'opp-2', stage: 'EXPIRED' }),
        createOpportunity({ id: 'opp-3', stage: 'CONFIRMED' }),
      ];

      const result = service.detectWeakeningOpportunities(opps);
      expect(result).toHaveLength(2);
    });
  });

  describe('getOpportunityAgeDistribution', () => {
    it('should categorize by age', () => {
      const opps: OpportunitySummary[] = [
        createOpportunity({ ageHours: 10 }),
        createOpportunity({ id: 'opp-2', ageHours: 100 }),
        createOpportunity({ id: 'opp-3', ageHours: 500 }),
        createOpportunity({ id: 'opp-4', ageHours: 1000 }),
      ];

      const dist = service.getOpportunityAgeDistribution(opps);
      expect(dist.fresh).toBe(1);
      expect(dist.developing).toBe(1);
      expect(dist.mature).toBe(1);
      expect(dist.old).toBe(1);
    });
  });
});
