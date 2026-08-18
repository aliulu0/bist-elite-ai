import { MacroEliteScoreService } from '../macro-elite-score.service';
import { MacroScoreEngine } from '../engines/macro-score.engine';
import { MacroDataService } from '../macro-data.service';
import { TCMBDecisionStoreService } from '../tcmb-decision-store.service';
import { TCMBDecisionAnalyzer } from '../engines/tcmb-decision-analyzer';

function createMockOrchestrator(indicators?: any[]) {
  return {
    fetchMacroIndicators: jest.fn().mockResolvedValue(
      indicators ?? [
        {
          symbol: 'vix',
          value: 30,
          change: 2,
          changePercent: 7.1,
          timestamp: new Date().toISOString(),
          source: 'tcmb',
        },
        {
          symbol: 'dxy',
          value: 110,
          change: 1,
          changePercent: 0.9,
          timestamp: new Date().toISOString(),
          source: 'tcmb',
        },
        {
          symbol: 'us10y',
          value: 6.0,
          change: 0.1,
          changePercent: 1.7,
          timestamp: new Date().toISOString(),
          source: 'tcmb',
        },
        {
          symbol: 'us2y',
          value: 4.8,
          change: 0.05,
          changePercent: 1.0,
          timestamp: new Date().toISOString(),
          source: 'tcmb',
        },
        {
          symbol: 'gold',
          value: 2350,
          change: -10,
          changePercent: -0.4,
          timestamp: new Date().toISOString(),
          source: 'tcmb',
        },
        {
          symbol: 'brent',
          value: 82,
          change: -1.5,
          changePercent: -1.8,
          timestamp: new Date().toISOString(),
          source: 'tcmb',
        },
      ],
    ),
    getProviderStatus: jest.fn().mockResolvedValue([]),
  } as any;
}

const HAWKISH_TEXT =
  "Kurul politika faizini %45'den %50'ye yükseltti. Parasal sıkılaşma devam ediyor. Sıkı duruş korunuyor. Enflasyon riski yukarı yönlü.";
const DOVISH_TEXT =
  "Kurul politika faizini %50'den %45'e indirdi. Faiz indirimi kararı alındı. Dezenflasyon sürecinin güçlendiği değerlendiriliyor. Gevşeme eğilimi belirginleşti.";

function makeService(indicators?: any[]) {
  const orchestrator = createMockOrchestrator(indicators);
  const data = new MacroDataService(orchestrator);
  const store = new TCMBDecisionStoreService();
  const service = new MacroEliteScoreService(new MacroScoreEngine(), data, store, orchestrator);
  return { service, store, analyzer: new TCMBDecisionAnalyzer() };
}

function storeDecision(
  store: TCMBDecisionStoreService,
  analyzer: TCMBDecisionAnalyzer,
  meetingDate: string,
  text: string,
  policyRate: number,
  previousPolicyRate: number,
) {
  return store.save({
    meetingDate,
    policyRate,
    previousPolicyRate,
    analysis: analyzer.analyze(text),
    rawText: text,
  });
}

describe('MacroEliteScoreService', () => {
  describe('calculate', () => {
    it('should return an elite score within 0-100 with full result shape', async () => {
      const { service } = makeService();
      const result = await service.calculate();
      expect(result.eliteScore).toBeGreaterThanOrEqual(0);
      expect(result.eliteScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(['improving', 'stable', 'deteriorating']).toContain(result.trend);
      expect(result.risk).toHaveProperty('level');
      expect(result.recommendation).toHaveProperty('action');
      expect(result.components.length).toBeGreaterThan(0);
      expect(result.decision).toBeNull();
    });

    it('should include the tcmbDecision and yieldCurve components', async () => {
      const { service } = makeService();
      const result = await service.calculate();
      const names = result.components.map((c) => c.name);
      expect(names).toContain('tcmbDecision');
      expect(names).toContain('yieldCurve');
    });
  });

  describe('TCMB decision influence', () => {
    it('should reduce the elite score for a hawkish decision', async () => {
      const base = makeService();
      const baseResult = await base.service.calculate();

      const hawkish = makeService();
      storeDecision(hawkish.store, hawkish.analyzer, '2026-07-24', HAWKISH_TEXT, 50, 45);
      const hawkishResult = await hawkish.service.calculate();

      expect(hawkishResult.eliteScore!).toBeLessThan(baseResult.eliteScore!);
    });

    it('should increase the elite score for a dovish decision', async () => {
      const base = makeService();
      const baseResult = await base.service.calculate();

      const dovish = makeService();
      storeDecision(dovish.store, dovish.analyzer, '2026-07-24', DOVISH_TEXT, 45, 50);
      const dovishResult = await dovish.service.calculate();

      expect(dovishResult.eliteScore!).toBeGreaterThan(baseResult.eliteScore!);
    });
  });

  describe('yield curve adjustment', () => {
    it('should reduce the score when the yield curve is inverted', async () => {
      const normal = makeService();
      const normalResult = await normal.service.calculate();

      const inverted = makeService([
        { symbol: 'vix', value: 30, timestamp: new Date().toISOString(), source: 'tcmb' },
        { symbol: 'dxy', value: 110, timestamp: new Date().toISOString(), source: 'tcmb' },
        { symbol: 'us10y', value: 6.0, timestamp: new Date().toISOString(), source: 'tcmb' },
        { symbol: 'us2y', value: 6.5, timestamp: new Date().toISOString(), source: 'tcmb' },
        { symbol: 'gold', value: 2350, timestamp: new Date().toISOString(), source: 'tcmb' },
        { symbol: 'brent', value: 82, timestamp: new Date().toISOString(), source: 'tcmb' },
      ]);
      const invertedResult = await inverted.service.calculate();

      expect(invertedResult.eliteScore!).toBeLessThan(normalResult.eliteScore!);
    });
  });

  describe('getTrend', () => {
    it('should report zero change on first call and numeric change on second', async () => {
      const { service } = makeService();
      const first = await service.getTrend();
      expect(first.previousScore).toBeNull();
      expect(first.change).toBe(0);

      const second = await service.getTrend();
      expect(typeof second.change).toBe('number');
      expect(typeof second.previousScore).toBe('number');
    });
  });

  describe('getObservability', () => {
    it('should include provider status from the market data layer', async () => {
      const { service, store, analyzer } = makeService();
      storeDecision(store, analyzer, '2026-07-24', HAWKISH_TEXT, 50, 45);

      const result = await service.getObservability();
      expect(result.macroScore).toBeGreaterThanOrEqual(0);
      expect(result).toHaveProperty('macroConfidence');
      expect(result.decision).toHaveProperty('source');
      expect(result.decision.meetingDate).toBe('2026-07-24');
      expect(Array.isArray(result.providers)).toBe(true);
      expect(result).toHaveProperty('lastUpdate');
    });
  });
});
